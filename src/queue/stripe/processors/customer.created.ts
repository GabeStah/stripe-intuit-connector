import { Process } from '@nestjs/bull';
import { Job } from 'bull';
import { StripeWebhookEventsEnum } from 'src/queue/stripe/stripe-webhook.constants';
import { StripeWebhookProcessor } from 'src/queue/stripe/stripe-webhook.processor';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/intuit-stripe/stripe-customer-to-intuit-customer';
import { Inject, Logger } from '@nestjs/common';
import { IntuitService } from 'src/intuit/intuit.service';

export class CustomerCreatedProcessor extends StripeWebhookProcessor {
  constructor(
    @Inject('winston') protected readonly logger: Logger,
    protected readonly intuitService: IntuitService,
    protected readonly customerAdapter: StripeCustomerToIntuitCustomer
  ) {
    super(logger);
  }
  @Process(StripeWebhookEventsEnum['customer.created'])
  async handle(job: Job) {
    super.handle(job);

    const intuitCustomer = this.customerAdapter.from(job.data.data.object);
    return await this.intuitService.createCustomer(intuitCustomer);
  }
}
