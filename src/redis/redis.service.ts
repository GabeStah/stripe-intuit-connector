import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import IORedis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import flat from 'flat';

@Injectable()
export class RedisService {
  protected redis: IORedis.Redis;
  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('db.redis.host'),
      port: this.configService.get<number>('db.redis.port')
    });
  }

  async get<TResult>(key) {
    const flattened = await this.redis.hgetall(key);
    return flat.unflatten<Record<string, string>, TResult>(flattened);
  }

  async set(key: string, data: object) {
    return this.redis.hmset(key, flat.flatten<object, object>(data));
  }
}
