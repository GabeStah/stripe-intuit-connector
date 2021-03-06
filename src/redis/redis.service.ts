import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import IORedis from 'ioredis';
import flat from 'flat';
import config from 'src/config';

@Injectable()
export class RedisService {
  protected redis: IORedis.Redis;
  constructor() {
    console.log(
      `Connecting to Redis: ${config.get('db.redis.host')}:${config.get(
        'db.redis.port'
      )}`
    );
    this.redis = new Redis({
      host: config.get('db.redis.host'),
      port: config.get('db.redis.port')
    });
  }

  async del(key) {
    return await this.redis.del(key);
  }

  async get<TResult>(key) {
    const flattened = await this.redis.hgetall(key);
    return flat.unflatten<Record<string, string>, TResult>(flattened);
  }

  async getKeyCount() {
    const keys = await this.redis.keys('*');
    return keys.length;
  }

  async flushAll() {
    return await this.redis.flushall();
  }

  async set(key: string, data: object) {
    return this.redis.hmset(key, flat.flatten<object, object>(data));
  }
}
