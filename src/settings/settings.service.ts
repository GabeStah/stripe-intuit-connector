import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from './settings.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettingsService {
  protected settings: Settings;
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>
  ) {}

  async create(settings: Partial<Settings>): Promise<Settings> {
    this.settings = await this.settingsRepository.save(settings);

    return this.settings;
  }

  intuitSettingFromTokenObject(tokenObject: any) {
    return {
      accessToken: tokenObject.access_token,
      accessTokenExpiration:
        new Date().getTime() + tokenObject.expires_in * 1000,
      refreshTokenExpiration:
        new Date().getTime() + tokenObject['x_refresh_token_expires_in'] * 1000,
      refreshToken: tokenObject.refresh_token
    };
  }

  async update(settings: Partial<Settings>): Promise<Settings> {
    const match = await this.settingsRepository.findOne();
    this.settings = await this.settingsRepository.save(
      Object.assign(match, settings)
    );

    return this.settings;
  }

  async find(): Promise<Settings> {
    const foundSettings = await this.settingsRepository.findOne();
    if (foundSettings) {
      this.settings = foundSettings;
    }
    return foundSettings;
  }

  getSettings(): Settings {
    return this.settings;
  }
}
