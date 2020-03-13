import { InjectQueue } from '@nestjs/bull';
import { Controller, Inject, Post, Req } from '@nestjs/common';
import { Queue } from 'bull';
import { IsStripeEvent } from '../queue/stripe/stripe-webhook.constants';
import { Request } from 'express';
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
  async webhook(@Req() request: Request) {
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
        await this.queue.add(event.type, event, {
          jobId: uniqid(),
          attempts: 5
        });
      }
    } catch (err) {
      this.logger.error(err);
    }
  }
}
