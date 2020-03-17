import { InjectQueue } from '@nestjs/bull';
import { Controller, Inject, Post, Req, Res } from '@nestjs/common';
import { Queue } from 'bull';
import { IsStripeEvent } from '../queue/stripe/stripe-webhook-queue.constants';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import configuration from 'src/config/configuration';
import uniqid from 'uniqid';

@Controller('stripe')
export class StripeController {
  constructor(
    @Inject('winston') private readonly logger: Logger,
    @InjectQueue(configuration().queue.stripe.name)
    private readonly queue: Queue,
    private readonly configService: ConfigService
  ) {}

  @Post('webhook')
  async webhook(@Req() request: Request, @Res() response: Response) {
    try {
      const stripe = new Stripe(
        this.configService.get<string>('services.stripe.secret'),
        {
          apiVersion: '2020-03-02'
        }
      );

      const event = stripe.webhooks.constructEvent(
        request.body,
        request.headers['stripe-signature'],
        this.configService.get<string>('services.stripe.webhook.secret')
      );

      if (IsStripeEvent(event.type)) {
        const job = await this.queue.add(event.type, event, {
          jobId: uniqid(),
          attempts: 5
        });

        return response.json({ message: `Job (${job.id}) queued.` });
      }
    } catch (err) {
      this.logger.error(err);
    }
  }
}
