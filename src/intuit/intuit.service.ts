import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Setting } from 'src/setting/setting.interface';
import { SettingDto } from 'src/setting/setting.dto';

@Injectable()
export class IntuitService {
  constructor(
    @InjectModel('Setting') private readonly settingModel: Model<Setting>
  ) {}

  queryCustomer(query: string): any {
    return query;
  }

  async createSettings(setting: SettingDto): Promise<Setting> {
    const createdSetting = new this.settingModel(setting);
    return createdSetting.save();
  }

  async updateSettings(setting: SettingDto): Promise<Setting> {
    return await this.settingModel.findOneAndUpdate(null, setting).exec();
  }

  async getSettings(): Promise<Setting> {
    return this.settingModel.findOne().exec();
  }
}
