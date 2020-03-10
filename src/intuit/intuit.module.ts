import { Module } from '@nestjs/common';
import { IntuitService } from './intuit.service';
import { IntuitController } from './intuit.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingSchema } from 'src/setting/setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Setting', schema: SettingSchema }])
  ],
  controllers: [IntuitController],
  providers: [IntuitService],
  exports: [IntuitService]
})
export class IntuitModule {}
