import { Module } from '@nestjs/common';
import { StripeIntuitAdapterService } from './stripe-intuit-adapter.service';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/stripe-intuit/customer/stripe-customer-to-intuit-customer';
import { IntuitModule } from 'src/intuit/intuit.module';
import { StripeProductToIntuitItem } from 'src/adapters/stripe-intuit/product/stripe-product-to-intuit-item';
import { StripePlanToIntuitItem } from 'src/adapters/stripe-intuit/plan/stripe-plan-to-intuit-item';
import { StripeInvoiceToIntuitInvoice } from 'src/adapters/stripe-intuit/invoice/stripe-invoice-to-intuit-invoice';
import { StripeInvoiceToIntuitPayment } from 'src/adapters/stripe-intuit/payment/stripe-invoice-to-intuit-payment';

@Module({
  imports: [IntuitModule],
  providers: [
    StripeIntuitAdapterService,
    StripeCustomerToIntuitCustomer,
    StripeInvoiceToIntuitInvoice,
    StripeInvoiceToIntuitPayment,
    StripePlanToIntuitItem,
    StripeProductToIntuitItem
  ],
  exports: [
    StripeIntuitAdapterService,
    StripeCustomerToIntuitCustomer,
    StripeInvoiceToIntuitInvoice,
    StripeInvoiceToIntuitPayment,
    StripePlanToIntuitItem,
    StripeProductToIntuitItem
  ]
})
export class StripeIntuitAdapterModule {}
