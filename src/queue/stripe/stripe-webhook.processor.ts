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

  log(job: Job) {
    this.logger.log({
      event_id: job.data.id,
      level: 'queue',
      message: job.data,
      processor: this.constructor.name,
      timestamp: new Date().getTime()
    });
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug({
      job_id: job.id,
      timestamp: new Date().getTime(),
      name: job.name,
      event: 'active'
    });
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.debug({
      job_id: job.id,
      timestamp: new Date().getTime(),
      name: job.name,
      event: 'stalled'
    });
  }

  @Process(StripeWebhookEventsEnum['customer.created'])
  async customerCreated(job: Job) {
    this.log(job);
    const intuitCustomer = this.customerAdapter.from(job.data.data.object);
    return await this.intuitService.createCustomer(intuitCustomer);
  }

  @Process(StripeWebhookEventsEnum['payment_intent.created'])
  paymentIntentCreated(job: Job) {
    this.log(job);
  }

  @Process(StripeWebhookEventsEnum['payment_intent.succeeded'])
  paymentIntentSucceeded(job: Job) {
    this.log(job);
  }
}
