import { Controller, Get, Post, Req } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { Request } from 'express';
import Stripe from 'stripe';

@Controller(process.env.API_ENDPOINT)
export class ApiController {
  constructor(private readonly service: ApiService) {}

  @Get()
  getTest(@Req() request: Request): string {
    return this.service.getTest();
  }

  @Post(process.env.STRIPE_WEBHOOK_ENDPOINT)
  postTest(@Req() request: Request): string {
    const stripe = new Stripe(process.env.STRIPE_SECRET, {
      apiVersion: '2020-03-02'
    });

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        request.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return `Webhook Error: ${err.message}`;
    }

    return JSON.stringify(event.data.object);
    //
    // return this.service.getTest();
  }
}
