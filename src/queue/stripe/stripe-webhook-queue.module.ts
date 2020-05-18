import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { StripeController } from 'src/stripe/stripe.controller';
import { IntuitModule } from 'src/intuit/intuit.module';
import { StripeWebhookQueueService } from 'src/queue/stripe/stripe-webhook-queue.service';
import { StripeIntuitAdapterModule } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.module';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';
import config from 'src/config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: config.get('queue.stripe.name'),
      redis: {
        host: config.get('db.redis.host'),
        port: config.get('db.redis.port'),
        name: config.get('queue.stripe.db.name')
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
