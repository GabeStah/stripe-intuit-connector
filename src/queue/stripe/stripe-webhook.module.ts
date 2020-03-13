import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { StripeController } from 'src/stripe/stripe.controller';
import configuration from 'src/config/configuration';
import { PaymentIntentSucceededProcessor } from 'src/queue/stripe/processors/payment_intent.succeeded';
import { PaymentIntentCreatedProcessor } from 'src/queue/stripe/processors/payment_intent.created';
import { CustomerCreatedProcessor } from 'src/queue/stripe/processors/customer.created';
import { IntuitModule } from 'src/intuit/intuit.module';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/intuit-stripe/stripe-customer-to-intuit-customer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: configuration().queue.stripe.name,
      redis: {
        host: configuration().db.redis.host,
        port: configuration().db.redis.port,
        name: configuration().queue.stripe.db.name
      }
    }),
    IntuitModule
  ],
  controllers: [StripeController],
  providers: [
    CustomerCreatedProcessor,
    PaymentIntentSucceededProcessor,
    PaymentIntentCreatedProcessor,
    StripeCustomerToIntuitCustomer
  ],
  exports: [IntuitModule]
})
export class StripeWebhookModule {}
