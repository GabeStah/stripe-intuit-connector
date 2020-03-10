import { Model } from 'mongoose';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Settings } from 'src/settings/settings.interface';
import { SettingsDto } from 'src/settings/settings.dto';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class SettingsService implements OnModuleInit {
  // private model: Service;
  constructor(
    @InjectModel('Setting') private readonly settingModel: Model<Settings> // private readonly moduleRef: ModuleRef
  ) {}

  queryCustomer(query: string): any {
    return query;
  }

  async createSettings(setting: SettingsDto): Promise<Settings> {
    const createdSetting = new this.settingModel(setting);
    return createdSetting.save();
  }

  async updateSettings(setting: SettingsDto): Promise<Settings> {
    return await this.settingModel.findOneAndUpdate(null, setting).exec();
  }

  async getSettings(): Promise<Settings> {
    return this.settingModel.findOne().exec();
  }

  onModuleInit() {
    // this.model = this.moduleRef.get(Service);
  }
}
