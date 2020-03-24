import { HttpService, Inject, Injectable } from '@nestjs/common';
import { Client, ClientRedis } from '@nestjs/microservices';
import configuration from 'src/config/configuration';
import { ConfigService } from '@nestjs/config';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';
import { MailService } from 'src/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { Logger } from 'winston';

@Injectable()
export class StripeService {
  @Client(configuration().db.redis.options)
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
