import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsSchema } from './settings.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Setting', schema: SettingsSchema }])
  ],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
