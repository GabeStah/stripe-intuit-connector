import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { StripeController } from 'src/stripe/stripe.controller';
import configuration from 'src/config/configuration';
import { IntuitModule } from 'src/intuit/intuit.module';
import { StripeWebhookQueueService } from 'src/queue/stripe/stripe-webhook-queue.service';
import { StripeIntuitAdapterModule } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.module';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';

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
    IntuitModule,
    StripeIntuitAdapterModule
  ],
  controllers: [StripeController],
  providers: [StripeIntuitAdapterService, StripeWebhookQueueService],
  exports: [IntuitModule]
})
export class StripeWebhookQueueModule {}
