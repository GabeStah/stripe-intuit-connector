import { Controller, Get, Inject, Post, Req, Res } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { IntuitService } from 'src/intuit/intuit.service';
import { Logger } from 'winston';
import { StripeCustomerToIntuitCustomer } from 'src/adapters/intuit-stripe/stripe-customer-to-intuit-customer';
import { AxiosResponse } from 'axios';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly intuitService: IntuitService,
    @Inject('winston') private readonly logger: Logger,
    private readonly service: StripeService,
    private readonly configService: ConfigService,
    private readonly customerAdapter: StripeCustomerToIntuitCustomer
  ) {}

  @Post('webhook')
  async webhook(
    @Req() request: Request,
    @Res() response: Response
  ): Promise<AxiosResponse<string> | string> {
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

      this.logger.log({ level: 'webhook', message: event });

      switch (event.type) {
        case 'customer.updated':
          // TODO: http://gitlab.solarixdigital.com/solarix/wcasg/connector/snippets/5
          break;
        case 'payment_intent.created':
          break;
        case 'customer.created':
          const intuitCustomer = this.customerAdapter.from(event.data.object);
          const createdCustomer = this.intuitService.createCustomer(
            intuitCustomer
          );
          return createdCustomer;
        default:
      }
    } catch (err) {
      this.logger.error(err);
      return `Webhook Error: ${err}`;
    }
  }
}
