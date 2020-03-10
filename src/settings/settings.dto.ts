export class SettingsDto {
  readonly services: {
    readonly intuit: {
      readonly accessToken: string;
      readonly accessTokenExpiration: number;
      readonly refreshToken: string;
      readonly refreshTokenExpiration: number;
    };
  };
}
