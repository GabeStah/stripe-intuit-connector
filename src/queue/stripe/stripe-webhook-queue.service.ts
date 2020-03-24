import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import configuration from 'src/config/configuration';
import { IntuitEntityType } from 'src/intuit/intuit.service';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/stripe-intuit/customer/stripe-customer-to-intuit-customer';
import { StripeWebhookEventTypes } from 'src/queue/stripe/stripe-webhook-queue.constants';
import { BaseQueueService } from 'src/queue/base-queue.service';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';
import { StripeProductToIntuitItem } from 'src/adapters/stripe-intuit/product/stripe-product-to-intuit-item';

@Processor(configuration().queue.stripe.name)
export class StripeWebhookQueueService extends BaseQueueService {
  constructor(
    @Inject('winston') protected readonly logger: Logger,
    protected readonly customerAdapter: StripeCustomerToIntuitCustomer,
    protected readonly productAdapter: StripeProductToIntuitItem,
    protected readonly stripeIntuitAdapter: StripeIntuitAdapterService
  ) {
    super(logger);
  }

  @Process(StripeWebhookEventTypes.customer.created)
  async customerCreated(job: Job) {
    const stripeObject = job.data.data.object;
    return this.stripeIntuitAdapter.create({
      data: this.customerAdapter.from(stripeObject),
      type: IntuitEntityType.Customer
    });
  }

  @Process(StripeWebhookEventTypes.customer.deleted)
  async customerDeleted(job: Job) {
    const stripeObject = job.data.data.object;
    return this.stripeIntuitAdapter.delete({
      id: stripeObject.id,
      type: IntuitEntityType.Customer
    });
  }

  @Process(StripeWebhookEventTypes.customer.updated)
  async customerUpdated(job: Job) {
    const stripeObject = job.data.data.object;
    return this.stripeIntuitAdapter.update({
      data: this.customerAdapter.from(stripeObject),
      id: stripeObject.id,
      type: IntuitEntityType.Customer
    });
  }

  @Process(StripeWebhookEventTypes.payment_intent.created)
  async paymentIntentCreated(job: Job) {
    return {};
  }

  @Process(StripeWebhookEventTypes.payment_intent.succeeded)
  async paymentIntentSucceeded(job: Job) {
    return {};
  }

  @Process(StripeWebhookEventTypes.product.created)
  async productCreated(job: Job) {
    const stripeObject = job.data.data.object;
    return this.stripeIntuitAdapter.create({
      data: this.productAdapter.from(stripeObject),
      type: IntuitEntityType.Item
    });
  }

  @Process(StripeWebhookEventTypes.product.deleted)
  async productDeleted(job: Job) {
    const stripeObject = job.data.data.object;
    return this.stripeIntuitAdapter.delete({
      id: stripeObject.id,
      type: IntuitEntityType.Item
    });
  }

  @Process(StripeWebhookEventTypes.product.updated)
  async productUpdated(job: Job) {
    const stripeObject = job.data.data.object;
    return this.stripeIntuitAdapter.update({
      data: this.productAdapter.from(stripeObject),
      id: stripeObject.id,
      type: IntuitEntityType.Item
    });
  }
}
