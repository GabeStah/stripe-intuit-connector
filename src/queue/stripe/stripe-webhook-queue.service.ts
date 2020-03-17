import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import configuration from 'src/config/configuration';
import { IntuitService } from 'src/intuit/intuit.service';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/intuit-stripe/stripe-customer-to-intuit-customer';
import { StripeWebhookEventsEnum } from 'src/queue/stripe/stripe-webhook-queue.constants';
import { BaseQueueService } from 'src/queue/base-queue.service';

@Processor(configuration().queue.stripe.name)
export class StripeWebhookQueueService extends BaseQueueService {
  constructor(
    @Inject('winston') protected readonly logger: Logger,
    protected readonly intuitService: IntuitService,
    protected readonly customerAdapter: StripeCustomerToIntuitCustomer
  ) {
    super(logger);
  }

  @Process(StripeWebhookEventsEnum['customer.created'])
  async customerCreated(job: Job) {
    const intuitCustomer = this.customerAdapter.from(job.data.data.object);
    return this.intuitService.createCustomer(intuitCustomer);
  }

  @Process(StripeWebhookEventsEnum['payment_intent.created'])
  async paymentIntentCreated(job: Job) {
    return {};
  }

  @Process(StripeWebhookEventsEnum['payment_intent.succeeded'])
  async paymentIntentSucceeded(job: Job) {
    return {};
  }
}
