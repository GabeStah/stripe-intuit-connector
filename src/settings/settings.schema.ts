import * as mongoose from 'mongoose';

export const SettingsSchema = new mongoose.Schema({
  services: {
    intuit: {
      accessToken: String,
      accessTokenExpiration: Number,
      refreshToken: String,
      refreshTokenExpiration: Number
    }
  }
});
