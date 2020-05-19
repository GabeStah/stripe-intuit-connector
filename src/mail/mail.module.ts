import { Module } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { MailController } from 'src/mail/mail.controller';
import { BullModule } from '@nestjs/bull';
import config from 'src/config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: config.get('queue.mail.name'),
      redis: {
        host: config.get('db.redis.host'),
        port: config.get('db.redis.port'),
        name: config.get('queue.mail.db.name')
      }
    })
  ],
  controllers: [MailController],
  providers: [MailService],
  // Export so mail service is available to other module importers.
  exports: [MailService]
})
export class MailModule {}
