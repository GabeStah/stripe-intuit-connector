import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Module({
  // controllers: [RedisController],
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule {}
