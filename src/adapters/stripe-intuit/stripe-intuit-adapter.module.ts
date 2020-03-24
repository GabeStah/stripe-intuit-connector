import { Module } from '@nestjs/common';
import { StripeIntuitAdapterService } from './stripe-intuit-adapter.service';
import { StripePaymentIntentToIntuitPayment } from 'src/adapters/stripe-intuit/payment/stripe-payment-intent-to-intuit-payment';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/stripe-intuit/customer/stripe-customer-to-intuit-customer';
import { IntuitModule } from 'src/intuit/intuit.module';
import { StripeProductToIntuitItem } from 'src/adapters/stripe-intuit/product/stripe-product-to-intuit-item';

@Module({
  imports: [IntuitModule],
  providers: [
    StripeIntuitAdapterService,
    StripeCustomerToIntuitCustomer,
    StripePaymentIntentToIntuitPayment,
    StripeProductToIntuitItem
  ],
  exports: [
    StripeIntuitAdapterService,
    StripeCustomerToIntuitCustomer,
    StripePaymentIntentToIntuitPayment,
    StripeProductToIntuitItem
  ]
})
export class StripeIntuitAdapterModule {}
