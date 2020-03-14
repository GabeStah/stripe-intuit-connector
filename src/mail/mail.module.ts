import { Module } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { MailController } from 'src/mail/mail.controller';
import { BullModule } from '@nestjs/bull';
import configuration from 'src/config/configuration';

@Module({
  imports: [
    BullModule.registerQueue({
      name: configuration().queue.mail.name,
      redis: {
        host: configuration().db.redis.host,
        port: configuration().db.redis.port,
        name: configuration().queue.mail.db.name
      }
    })
  ],
  controllers: [MailController],
  providers: [MailService],
  // Export so mail service is available to other module importers.
  exports: [MailService]
})
export class MailModule {}
