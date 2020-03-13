import { Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import configuration from 'src/config/configuration';

@Processor(configuration().queue.stripe.name)
export class StripeWebhookProcessor {
  constructor(@Inject('winston') protected readonly logger: Logger) {}

  handle(job: Job) {
    this.logger.log({
      event_id: job.data.id,
      level: 'queue',
      message: job.data,
      processor: this.constructor.name,
      timestamp: new Date().getTime()
    });
  }
}
