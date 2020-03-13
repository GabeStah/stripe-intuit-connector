import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { StripeController } from 'src/stripe/stripe.controller';
import configuration from 'src/config/configuration';
import { IntuitModule } from 'src/intuit/intuit.module';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/intuit-stripe/stripe-customer-to-intuit-customer';
import { StripeWebhookProcessor } from 'src/queue/stripe/stripe-webhook.processor';

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
  providers: [StripeWebhookProcessor, StripeCustomerToIntuitCustomer],
  exports: [IntuitModule]
})
export class StripeWebhookModule {}
