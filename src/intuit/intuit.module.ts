import { HttpModule, Module } from '@nestjs/common';
import { IntuitService } from './intuit.service';
import { IntuitController } from './intuit.controller';
import { MailModule } from 'src/mail/mail.module';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [HttpModule, MailModule, RedisModule],
  controllers: [IntuitController],
  providers: [IntuitAuthorizationService, IntuitService],
  exports: [IntuitService]
})
export class IntuitModule {}
