import { HttpModule, Module } from '@nestjs/common';
import { IntuitService } from './intuit.service';
import { IntuitController } from './intuit.controller';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [HttpModule, MailModule],
  controllers: [IntuitController],
  providers: [IntuitService],
  exports: [IntuitService]
})
export class IntuitModule {}
