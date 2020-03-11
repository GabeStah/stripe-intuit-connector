import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { IntuitModule } from 'src/intuit/intuit.module';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/intuit-stripe/stripe-customer-to-intuit-customer';

@Module({
  imports: [IntuitModule],
  controllers: [StripeController],
  providers: [StripeService, StripeCustomerToIntuitCustomer]
})
export class StripeModule {}
