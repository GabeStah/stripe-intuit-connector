import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import configuration from 'src/config/configuration';
import { IntuitService } from 'src/intuit/intuit.service';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/intuit-stripe/stripe-customer-to-intuit-customer';
import { StripeWebhookEventTypes } from 'src/queue/stripe/stripe-webhook-queue.constants';
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

  @Process(StripeWebhookEventTypes.customer.created)
  async customerCreated(job: Job) {
    const data = job.data.data.object;
    const intuitCustomer = this.customerAdapter.from(data);
    return this.intuitService.createCustomer(intuitCustomer);
  }

  @Process(StripeWebhookEventTypes.customer.updated)
  async customerUpdated(job: Job) {
    const data = job.data.data.object;
    // Check if customer exists
    const existingCustomer = await this.intuitService.findCustomer(data.id);
    const updatedCustomer = this.customerAdapter.from(data);
    const mergedCustomer = Object.assign(existingCustomer, updatedCustomer);
    return this.intuitService.updateCustomer(mergedCustomer);
  }

  @Process(StripeWebhookEventTypes.customer.deleted)
  async customerDeleted(job: Job) {
    const data = job.data.data.object;
    // Check if customer exists
    // const existingCustomer = await this.intuitService.findCustomer(data.id);
    // const intuitCustomer = this.customerAdapter.from(data);
    // return this.intuitService.deleteCustomer(intuitCustomer);
    const existingCustomer = await this.intuitService.findCustomer(data.id);
    if (existingCustomer) {
      // existingCustomer.Active = false;
    }
  }

  @Process(StripeWebhookEventTypes.payment_intent.created)
  async paymentIntentCreated(job: Job) {
    return {};
  }

  @Process(StripeWebhookEventTypes.payment_intent.succeeded)
  async paymentIntentSucceeded(job: Job) {
    return {};
  }
}
