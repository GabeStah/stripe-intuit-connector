import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { IntuitService } from 'src/intuit/intuit.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly intuitService: IntuitService,
    private readonly service: StripeService,
    private readonly configService: ConfigService
  ) {}

  @Post('webhook')
  webhook(@Req() request: Request, @Res() response: Response): string {
    const stripe = new Stripe(
      this.configService.get<string>('services.stripe.secret'),
      {
        apiVersion: '2020-03-02'
      }
    );

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        request.headers['stripe-signature'],
        this.configService.get<string>('services.stripe.webhook.secret')
      );
    } catch (err) {
      return `Webhook Error: ${err.message}`;
    }

    switch (event.type) {
      case 'payment_intent.created':
        break;
      case 'customer.created':
        return event;
      default:
    }

    return JSON.stringify(event);
  }
}
