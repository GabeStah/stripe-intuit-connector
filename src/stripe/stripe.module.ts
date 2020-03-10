import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { IntuitModule } from 'src/intuit/intuit.module';

@Module({
  imports: [IntuitModule],
  controllers: [StripeController],
  providers: [StripeService]
})
export class StripeModule {}
