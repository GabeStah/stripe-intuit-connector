import { InjectQueue } from '@nestjs/bull';
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Queue } from 'bull';
import { isStripeEvent } from '../queue/stripe/stripe-webhook-queue.constants';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import uniqid from 'uniqid';
import config from 'src/config';
import { LogService } from 'src/log/log.service';

@Controller('stripe')
export class StripeController {
  private stripe: Stripe;

  constructor(
    private readonly log: LogService,
    @InjectQueue(config.get('queue.stripe.name'))
    private readonly queue: Queue
  ) {
    this.stripe = new Stripe(config.get('services.stripe.secret'), {
      apiVersion: '2020-03-02'
    });
  }

  @Post('webhook')
  async webhook(@Req() request: Request, @Res() response: Response) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        request.body,
        request.headers['stripe-signature'],
        config.get('services.stripe.webhook.secret')
      );

      if (isStripeEvent(event.type)) {
        const job = await this.queue.add(event, {
          jobId: uniqid(),
          attempts: 5
        });

        return response.json({ message: `Job (${job.id}) queued.` });
      }
    } catch (err) {
      this.log.error(err);
    }
  }
}
