import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import config from 'src/config';
import { IntuitEntityType } from 'src/intuit/intuit.service';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/stripe-intuit/customer/stripe-customer-to-intuit-customer';
import {
  isStripeEvent,
  StripeWebhookEventTypes
} from 'src/queue/stripe/stripe-webhook-queue.constants';
import { BaseQueueService } from 'src/queue/base-queue.service';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';
import { StripeProductToIntuitItem } from 'src/adapters/stripe-intuit/product/stripe-product-to-intuit-item';
import { StripePlanToIntuitItem } from 'src/adapters/stripe-intuit/plan/stripe-plan-to-intuit-item';
import Stripe from 'stripe';
import { StripeInvoiceToIntuitInvoice } from 'src/adapters/stripe-intuit/invoice/stripe-invoice-to-intuit-invoice';
import { StripeInvoiceToIntuitPayment } from 'src/adapters/stripe-intuit/payment/stripe-invoice-to-intuit-payment';
import { LogService } from 'src/log/log.service';

@Processor(config.get('queue.stripe.name'))
export class StripeWebhookQueueService extends BaseQueueService {
  private stripe: Stripe;
  constructor(
    protected readonly customerAdapter: StripeCustomerToIntuitCustomer,
    protected readonly log: LogService,
    protected readonly invoiceAdapter: StripeInvoiceToIntuitInvoice,
    protected readonly invoicePaymentAdapter: StripeInvoiceToIntuitPayment,
    protected readonly planAdapter: StripePlanToIntuitItem,
    protected readonly productAdapter: StripeProductToIntuitItem,
    protected readonly stripeIntuitAdapter: StripeIntuitAdapterService
  ) {
    super(log);

    this.stripe = new Stripe(config.get('services.stripe.secret'), {
      apiVersion: '2020-03-02'
    });
  }

  /**
   * Process Stripe webhook queued jobs.
   *
   * @param job
   */
  @Process()
  async process(job: Job) {
    if (isStripeEvent(job.data.type)) {
      let product;
      let stripeObject;
      switch (job.data.type) {
        case StripeWebhookEventTypes.customer.created:
          stripeObject = job.data.data.object;
          return this.stripeIntuitAdapter.create({
            data: this.customerAdapter.from(stripeObject),
            type: IntuitEntityType.Customer
          });
        case StripeWebhookEventTypes.customer.deleted:
          stripeObject = job.data.data.object;
          // Intuit doesn't support deletion, so instead set to inactive.
          return this.stripeIntuitAdapter.update({
            data: { Active: false },
            id: stripeObject.id,
            type: IntuitEntityType.Customer
          });
        case StripeWebhookEventTypes.customer.updated:
          stripeObject = job.data.data.object;
          return this.stripeIntuitAdapter.update({
            data: this.customerAdapter.from(stripeObject),
            id: stripeObject.id,
            type: IntuitEntityType.Customer
          });
        case StripeWebhookEventTypes.invoice.created:
          stripeObject = job.data.data.object;
          return this.stripeIntuitAdapter.create({
            data: await this.invoiceAdapter.from(stripeObject),
            type: IntuitEntityType.Invoice
          });
        case StripeWebhookEventTypes.invoice.payment_succeeded:
          stripeObject = job.data.data.object;
          return this.stripeIntuitAdapter.create({
            data: await this.invoicePaymentAdapter.from(stripeObject),
            type: IntuitEntityType.Payment
          });
        case StripeWebhookEventTypes.plan.created:
          stripeObject = job.data.data.object;
          // Find existing product
          product = await this.stripe.products.retrieve(stripeObject.product);

          if (product) {
            stripeObject.product = product;
          } else {
            throw new Error(
              `Could not find Stripe Product for Plan: ${stripeObject.id}.`
            );
          }

          return this.stripeIntuitAdapter.create({
            data: this.planAdapter.from(stripeObject),
            type: IntuitEntityType.Item
          });
        case StripeWebhookEventTypes.plan.deleted:
          stripeObject = job.data.data.object;
          // Intuit doesn't support deletion, so instead set to inactive.
          return this.stripeIntuitAdapter.update({
            data: { Active: false },
            id: stripeObject.id,
            type: IntuitEntityType.Item
          });
        case StripeWebhookEventTypes.plan.updated:
          stripeObject = job.data.data.object;
          // Find existing product
          product = await this.stripe.products.retrieve(stripeObject.product);

          if (product) {
            stripeObject.product = product;
          } else {
            throw new Error(
              `Could not find Stripe Product for Plan: ${stripeObject.id}.`
            );
          }

          return this.stripeIntuitAdapter.update({
            data: this.planAdapter.from(stripeObject, 'update'),
            id: stripeObject.id,
            type: IntuitEntityType.Item
          });
        case StripeWebhookEventTypes.product.created:
          stripeObject = job.data.data.object;
          return this.stripeIntuitAdapter.create({
            data: this.productAdapter.from(stripeObject),
            type: IntuitEntityType.Item
          });
        case StripeWebhookEventTypes.product.updated:
          stripeObject = job.data.data.object;
          return this.stripeIntuitAdapter.update({
            // Lookup existing category by prod_ id in Name column.
            column: 'Name',
            data: this.productAdapter.from(stripeObject),
            id: stripeObject.id,
            type: IntuitEntityType.Item
          });
        default:
          return {};
      }
    }
  }
}
