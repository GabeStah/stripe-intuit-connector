import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SetBodyParser implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}
  use(request: Request, response: Response, next: NextFunction) {
    if (
      request.baseUrl.includes(
        this.configService.get<string>('routes.stripe.webhook')
      )
    ) {
      // Stripe Webhook requires raw body as Buffer.
      bodyParser.raw({ type: 'application/json' })(request, response, next);
    } else {
      // Use JSON for all other requests.
      bodyParser.json()(request, response, next);
    }
  }
}
