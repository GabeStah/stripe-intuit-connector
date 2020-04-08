import { BullModule } from '@nestjs/bull';
import { HttpModule, Module } from '@nestjs/common';
import { IntuitQueueService } from 'src/queue/intuit/intuit-queue.service';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';
import { MailModule } from 'src/mail/mail.module';
import { RedisModule } from 'src/redis/redis.module';
import config from 'src/config/config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: config.get('queue.intuit.name'),
      redis: {
        host: config.get('db.redis.host'),
        port: config.get('db.redis.port'),
        name: config.get('queue.intuit.db.name')
      }
    }),
    HttpModule,
    MailModule,
    RedisModule
  ],
  providers: [IntuitQueueService, IntuitAuthorizationService]
})
export class IntuitQueueModule {}
