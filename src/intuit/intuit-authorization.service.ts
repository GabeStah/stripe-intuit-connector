import { HttpService, Injectable, OnModuleInit, Req } from '@nestjs/common';
import OAuthClient from 'intuit-oauth';
import { Request } from 'express';
import { Client, ClientRedis } from '@nestjs/microservices';
import { MailService } from 'src/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { Transport } from '@nestjs/common/enums/transport.enum';
import config from 'src/config';
import { LogService } from 'src/log/log.service';

export interface IntuitAuthorizationTokens {
  readonly accessToken: string;
  readonly accessTokenExpiration: number;
  readonly refreshToken: string;
  readonly refreshTokenExpiration: number;
}

@Injectable()
export class IntuitAuthorizationService implements OnModuleInit {
  private oauthClient: OAuthClient;
  private authTokens?: IntuitAuthorizationTokens;

  @Client({
    transport: Transport.REDIS,
    options: {
      url: `redis://${config.get('db.redis.host')}:${config.get(
        'db.redis.port'
      )}`
    }
  })
  private clientRedis: ClientRedis;

  constructor(
    private readonly httpService: HttpService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly log: LogService
  ) {}

  async onModuleInit() {
    // Connect your client to the redis server on startup.
    await this.clientRedis.connect();

    // Instance of client
    this.oauthClient = new OAuthClient({
      clientId: config.get('services.intuit.auth.clientId'),
      clientSecret: config.get('services.intuit.auth.clientSecret'),
      environment: config.get('services.intuit.environment'),
      redirectUri:
        config.get('routes.root') +
        config.get('routes.prefix') +
        config.get('routes.intuit.callback')
    });

    // Clear tokens on init
    // await this.redisService.del('IntuitAuthorizationTokens');

    // Update auth tokens from db
    await this.updateTokensFromDb();

    // Refresh auth tokens from Intuit
    await this.refresh({});
  }

  /**
   * Get tokens from database.
   */
  async getTokensFromDb(): Promise<IntuitAuthorizationTokens> {
    return this.redisService.get<IntuitAuthorizationTokens>(
      'IntuitAuthorizationTokens'
    );
  }

  /**
   * Update local tokens from database.
   */
  async updateTokensFromDb() {
    this.authTokens = await this.getTokensFromDb();
  }

  /**
   * Update tokens in database.
   *
   * @param tokens
   */
  async updateTokensInDb(tokens: Partial<IntuitAuthorizationTokens>) {
    // Get current
    const current = await this.getTokensFromDb();
    const updated = Object.assign(current, tokens);
    // Merge with arg settings and set.
    const response = await this.redisService.set(
      'IntuitAuthorizationTokens',
      updated
    );
    if (response) {
      this.authTokens = updated;
      this.log.event('tokens.updated', this.authTokens);
    } else {
      this.log.error({
        message: 'tokens.updated.failed',
        tokens: this.authTokens
      });
    }
    return this.authTokens;
  }

  /**
   * Return the full, manual Intuit authorize URL.
   * // TODO: Add randomized token for verification.
   */
  get authorizeUrl(): string {
    return (
      config.get('routes.root') +
      config.get('routes.prefix') +
      config.get('routes.intuit.authorize')
    );
  }

  /**
   * Authorization endpoint to authorize Intuit API via OAuth2.
   * Directs user to user consent form before returning to callback endpoint / method.
   * Should only be manually invoked by Admin user when refreshToken has expired.
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
   *
   */
  authUri(): string {
    return this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.Payment],
      state: 'testState'
    });
  }

  /**
   * Get Intuit Authorization Bearer token object.
   */
  async getAuthorizationHeaders(): Promise<any> {
    // Update from tokens cache.
    await this.updateTokensFromDb();

    if (this.areTokensValid()) {
      return {
        Authorization: `Bearer ${this.authTokens.accessToken}`
      };
    } else {
      const error = `Cannot obtain valid Intuit authorization; manual authorization required.`;
      // Error
      this.log.error(error);
    }
  }

  /**
   * Processes invalid authorization.
   *
   * Log error.
   * Create job to send out admin alert email.
   */
  handleInvalidAuthorization({
    shouldSendAlerts = true
  }: {
    shouldSendAlerts?: boolean;
  }) {
    this.log.error(
      `Cannot obtain valid Intuit authorization; manual authorization required.`
    );

    if (shouldSendAlerts) {
      // Send email
      return this.mailService.sendAdminAlert({
        subject: 'WCASG Connector Intuit API Authorization',
        html: `<h2>ALERT</h2><p>WCASG Connector requires a manual refresh of the Intuit API authorization.</p><p><a href="${this.authorizeUrl}">Click here to manually authorize.</a></p>`
      });
    }
  }

  /**
   * Callback URI invoked by Intuit API OAuth2 user consent form.
   * Attempts to update existing Intuit settings object in database, otherwise creates new entry.
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
   *
   * @param request
   */
  async callback(@Req() request: Request): Promise<string> {
    const response = await this.oauthClient.createToken(request.url);

    const result = response.getJson();

    const tokens = this.buildTokensFromIntuitObject(result);

    await this.updateTokensInDb(tokens);

    return 'Intuit authorization settings updated in database.';
  }

  /**
   * Determine if local auth tokens are valid.
   */
  areTokensValid(): boolean {
    // Must have refreshToken
    if (
      !this.authTokens ||
      Object.keys(this.authTokens).length === 0 ||
      !this.authTokens.refreshToken
    ) {
      return false;
    }

    // Access token still valid.
    if (new Date(this.authTokens.accessTokenExpiration) > new Date()) {
      return true;
    }

    // Refresh token expired.
    if (new Date(this.authTokens.refreshTokenExpiration) < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Generate auth tokens object from Intuit API response object.
   *
   * @param tokenObject
   */
  buildTokensFromIntuitObject(tokenObject: any) {
    return {
      accessToken: tokenObject.access_token,
      accessTokenExpiration:
        new Date().getTime() + tokenObject.expires_in * 1000,
      refreshTokenExpiration:
        new Date().getTime() + tokenObject['x_refresh_token_expires_in'] * 1000,
      refreshToken: tokenObject.refresh_token
    };
  }

  /**
   * Attempt to refresh OAuth2 access_token.
   * Updates local settings if response contains valid access_token.
   */
  async refresh({
    shouldSendAlerts = true
  }: {
    shouldSendAlerts?: boolean;
  }): Promise<IntuitAuthorizationTokens | null> {
    if (!this.areTokensValid()) {
      // Fail out and report to admin.
      await this.handleInvalidAuthorization({
        shouldSendAlerts: shouldSendAlerts
      });
      return null;
    }
    let response;
    // Get refresh object from Intuit API.
    if (this.authTokens.refreshToken) {
      response = await this.oauthClient.refreshUsingToken(
        this.authTokens.refreshToken
      );
    } else {
      response = await this.oauthClient.refresh();
    }
    if (response && response.token) {
      // Update tokens from response.
      return await this.updateTokensInDb(
        this.buildTokensFromIntuitObject(response.token)
      );
    } else {
      this.log.error(
        `Cannot obtain valid Intuit authorization; manual authorization required.`
      );
    }
  }

  async redis() {
    // Send data to all redis_test listeners
    return await this.clientRedis
      .send({ type: 'redis_test' }, { id: 1, name: 'new test name' })
      .toPromise();
  }
}
