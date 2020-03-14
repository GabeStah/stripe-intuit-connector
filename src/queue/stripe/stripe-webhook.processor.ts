import {
  OnQueueActive,
  OnQueueStalled,
  Process,
  Processor
} from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import configuration from 'src/config/configuration';
import { IntuitService } from 'src/intuit/intuit.service';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/intuit-stripe/stripe-customer-to-intuit-customer';
import { StripeWebhookEventsEnum } from 'src/queue/stripe/stripe-webhook.constants';

@Injectable()
@Processor(configuration().queue.stripe.name)
export class StripeWebhookProcessor {
  constructor(
    @Inject('winston') protected readonly logger: Logger,
    protected readonly intuitService: IntuitService,
    protected readonly customerAdapter: StripeCustomerToIntuitCustomer
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug({
      event: 'active',
      event_id: job.data.id,
      job_id: job.id,
      level: 'queue',
      name: job.name,
      processor: this.constructor.name,
      timestamp: new Date().getTime()
    });
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.debug({
      event: 'stalled',
      event_id: job.data.id,
      job_id: job.id,
      level: 'queue',
      name: job.name,
      processor: this.constructor.name,
      timestamp: new Date().getTime()
    });
  }

  @Process(StripeWebhookEventsEnum['customer.created'])
  async customerCreated(job: Job) {
    const intuitCustomer = this.customerAdapter.from(job.data.data.object);
    return this.intuitService.createCustomer(intuitCustomer);
  }

  // @Process(StripeWebhookEventsEnum['payment_intent.created'])
  // paymentIntentCreated(job: Job) {}
  //
  // @Process(StripeWebhookEventsEnum['payment_intent.succeeded'])
  // paymentIntentSucceeded(job: Job) {}
}
