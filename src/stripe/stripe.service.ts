import { HttpService, Injectable } from '@nestjs/common';
import { Client, ClientRedis } from '@nestjs/microservices';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';
import { MailService } from 'src/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { Transport } from '@nestjs/common/enums/transport.enum';
import config from 'src/config';
import { LogService } from 'src/log/log.service';

@Injectable()
export class StripeService {
  @Client({
    transport: Transport.REDIS,
    options: {
      url: `redis://${config.get('db.redis.host')}:${config.get(
        'db.redis.port'
      )}`
    }
  })
  private clientRedis: ClientRedis;

  constructor(
    private readonly httpService: HttpService,
    private readonly intuitAuthService: IntuitAuthorizationService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly log: LogService
  ) {}
}
