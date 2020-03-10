import { Document } from 'mongoose';

export interface IntuitSetting {
  readonly accessToken: string;
  readonly accessTokenExpiration: number;
  readonly refreshToken: string;
  readonly refreshTokenExpiration: number;
}

export interface Setting extends Document {
  readonly services: {
    intuit: IntuitSetting;
  };
}
