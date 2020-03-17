import { BullModule } from '@nestjs/bull';
import { HttpModule, Module } from '@nestjs/common';
import configuration from 'src/config/configuration';
import { IntuitQueueService } from 'src/queue/intuit/intuit-queue.service';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';
import { MailModule } from 'src/mail/mail.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: configuration().queue.intuit.name,
      redis: {
        host: configuration().db.redis.host,
        port: configuration().db.redis.port,
        name: configuration().queue.intuit.db.name
      }
    }),
    HttpModule,
    MailModule,
    RedisModule
  ],
  providers: [IntuitQueueService, IntuitAuthorizationService]
})
export class IntuitQueueModule {}
