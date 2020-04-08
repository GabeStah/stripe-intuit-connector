import { HttpService, Inject, Injectable } from '@nestjs/common';
import { Client, ClientRedis } from '@nestjs/microservices';
import configuration from 'src/config/configuration';
import { ConfigService } from '@nestjs/config';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';
import { MailService } from 'src/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { Logger } from 'winston';
import { Transport } from '@nestjs/common/enums/transport.enum';
import config from 'src/config/config';

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
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly intuitAuthService: IntuitAuthorizationService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    @Inject('winston') private readonly logger: Logger
  ) {}
}
