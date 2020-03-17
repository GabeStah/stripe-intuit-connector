import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';

@Module({
  controllers: [RedisController],
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule {}
