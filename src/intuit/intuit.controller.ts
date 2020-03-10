import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { IntuitService } from 'src/intuit/intuit.service';
import OAuthClient from 'intuit-oauth';
import { IntuitSetting } from 'src/settings/settings.interface';
import { SettingsService } from 'src/settings/settings.service';

@Controller('intuit')
export class IntuitController {
  private oauthClient: any;
  constructor(
    private readonly service: IntuitService,
    private readonly configService: ConfigService,
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

  /**
   * Authorization endpoint to authorize Intuit API via OAuth2.
   * Directs user to user consent form before returning to callback endpoint / method.
   * Should only be manually invoked by Admin user when refreshToken has expired.
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
   *
   * @param req
   * @param res
   */
  @Get('authorize')
  authorize(@Req() req: Request, @Res() res: Response): void {
    // AuthorizationUri
    const authUri = this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.Payment],
      state: 'testState'
    });

    // Redirect the authUri
    res.redirect(authUri);
  }

  /**
   * Callback URI invoked by Intuit API OAuth2 user consent form.
   * Attempts to update existing Intuit settings object in database, otherwise creates new entry.
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
   *
   * @param req
   * @param res
   */
  @Get('callback')
  async callback(@Req() req: Request): Promise<string> {
    // Exchange the auth code retrieved from the **req.url** on the redirectUri
    const response = await this.oauthClient.createToken(req.url);

    const result = response.getJson();

    const intuitSetting: IntuitSetting = {
      accessToken: result.access_token,
      accessTokenExpiration: new Date().getTime() + result.expires_in * 1000,
      refreshTokenExpiration:
        new Date().getTime() + result['x_refresh_token_expires_in'] * 1000,
      refreshToken: result.refresh_token
    };

    const updated = await this.settingsService.updateSettings({
      services: { intuit: intuitSetting }
    });

    if (updated) {
      return 'Intuit authorization settings updated in database.';
    } else {
      const created = await this.settingsService.createSettings({
        services: { intuit: intuitSetting }
      });

      if (created) {
        return 'Intuit authorization settings created and saved to database.';
      } else {
        return 'Could not update or create Intuit authorization settings.';
      }
    }
  }
}
