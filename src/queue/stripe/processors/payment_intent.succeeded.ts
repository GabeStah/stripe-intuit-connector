import { Process } from '@nestjs/bull';
import { Job } from 'bull';
import { StripeWebhookEventsEnum } from 'src/queue/stripe/stripe-webhook.constants';
import { StripeWebhookProcessor } from 'src/queue/stripe/stripe-webhook.processor';

export class PaymentIntentSucceededProcessor extends StripeWebhookProcessor {
  @Process(StripeWebhookEventsEnum['payment_intent.succeeded'])
  handle(job: Job) {
    super.handle(job);
  }
}
