import {
  HttpService,
  Inject,
  Injectable,
  OnModuleInit,
  Req
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from 'src/settings/settings.service';
import OAuthClient from 'intuit-oauth';
import { Request } from 'express';
import { AxiosResponse } from 'axios';
import { Logger } from 'winston';
import { Settings } from 'src/settings/settings.entity';
import { Client, ClientRedis } from '@nestjs/microservices';
import configuration from 'src/config/configuration';

@Injectable()
export class IntuitService implements OnModuleInit {
  private oauthClient: any;

  @Client(configuration().db.redis.options)
  private clientRedis: ClientRedis;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject('winston') private readonly logger: Logger,
    private readonly settingsService: SettingsService
  ) {
    // Instance of client
    this.oauthClient = new OAuthClient({
      clientId: this.configService.get<string>('services.intuit.auth.clientId'),
      clientSecret: this.configService.get<string>(
        'services.intuit.auth.clientSecret'
      ),
      environment: this.configService.get<string>(
        'services.intuit.environment'
      ),
      redirectUri:
        this.configService.get<string>('routes.root') +
        this.configService.get<string>('routes.prefix') +
        this.configService.get<string>('routes.intuit.callback')
    });
  }

  async onModuleInit() {
    // Connect your client to the redis server on startup.
    await this.clientRedis.connect();
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
   * Build Intuit API URL with variable extra suffix.
   *
   * @param extra
   */
  buildUrl(extra: string): string {
    return `${this.getBaseUrl()}/${extra}?minorversion=${this.configService.get<
      string
    >('services.intuit.api.version')}`;
  }

  /**
   * Get Intuit Authorization Bearer token object.
   * Checks in-memory settings first, else pulls in-database settings.
   * If accessToken is expired uses valid refreshToken to refresh access.
   * If refreshToken is expired, log error indicating required user consent.
   */
  async getAuthorizationHeaders(): Promise<any> {
    let settings = this.settingsService.getSettings();
    if (!settings) {
      settings = await this.settingsService.find();
    }
    if (!settings) {
      // Cannot proceed, throw error
      this.logger.error(
        `Cannot obtain valid Intuit authorization; manual authorization required.`
      );
    } else {
      const accessTokenExpired =
        new Date(settings.services.intuit.accessTokenExpiration) < new Date();
      if (!accessTokenExpired) {
        // Access token still valid, return it.
        return {
          Authorization: `Bearer ${settings.services.intuit.accessToken}`
        };
      } else {
        // Access Token expired, check if refreshToken valid
        const refreshTokenExpired =
          new Date(settings.services.intuit.refreshTokenExpiration) <
          new Date();
        if (!refreshTokenExpired) {
          // Refresh token still valid, refresh it and get updated settings.
          settings = await this.refresh();
          // Update settings
          return {
            Authorization: `Bearer ${settings.services.intuit.accessToken}`
          };
        } else {
          // Invalid refresh token requires user consent.
          this.logger.error(
            `Cannot obtain valid Intuit authorization; manual authorization required.`
          );
        }
      }
    }
  }

  /**
   * Get base Intuit API URL.
   */
  getBaseUrl(): string {
    return `https://${this.configService.get<string>(
      'services.intuit.api.url'
    )}/v3/company/${this.configService.get<string>('services.intuit.company')}`;
  }

  /**
   * Create new Customer record.
   *
   * @param req
   */
  async createCustomer(@Req() req: Request): Promise<AxiosResponse<string>> {
    const url = this.buildUrl(`customer`);

    try {
      const axiosResponse = await this.httpService
        .post(url, req, { headers: await this.getAuthorizationHeaders() })
        .toPromise();
      return axiosResponse.data;
    } catch (err) {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(err.response.data);
        return err;
        // return err.response;
      } else if (err.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        this.logger.error(err.request);
        return err.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error(err.message);
        return err.message;
      }
    }
  }

  /**
   * Get Company info.
   */
  async getCompanyInfo(): Promise<AxiosResponse<string>> {
    const url = this.buildUrl(
      `companyinfo/${this.configService.get<string>('services.intuit.company')}`
    );

    return this.httpService
      .get(url, { headers: await this.getAuthorizationHeaders() })
      .toPromise();
  }

  /**
   * Callback URI invoked by Intuit API OAuth2 user consent form.
   * Attempts to update existing Intuit settings object in database, otherwise creates new entry.
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
   *
   * @param req
   */
  async callback(@Req() req: Request): Promise<string> {
    const response = await this.oauthClient.createToken(req.url);

    const result = response.getJson();

    const intuitSetting = this.settingsService.intuitSettingFromTokenObject(
      result
    );

    const settings = await this.settingsService.find();

    if (settings) {
      await this.settingsService.update({
        services: { intuit: intuitSetting }
      });

      return 'Intuit authorization settings updated in database.';
    } else {
      const created = await this.settingsService.create({
        services: { intuit: intuitSetting }
      });

      if (created) {
        return 'Intuit authorization settings created and saved to database.';
      } else {
        return 'Could not update or create Intuit authorization settings.';
      }
    }
  }

  async refresh(): Promise<Settings> {
    const response = await this.oauthClient.refresh();
    if (response && response.token) {
      // Update settings from response.
      return await this.settingsService.update({
        services: {
          intuit: this.settingsService.intuitSettingFromTokenObject(
            response.token
          )
        }
      });
    } else {
      this.logger.error(
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
