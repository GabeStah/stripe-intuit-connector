import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import config from 'src/config/config';

@Injectable()
export class SetBodyParser implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    if (request.baseUrl.includes(config.get('routes.stripe.webhook'))) {
      // Stripe Webhook requires raw body as Buffer.
      bodyParser.raw({ type: 'application/json' })(request, response, next);
    } else {
      // Use JSON for all other requests.
      bodyParser.json()(request, response, next);
    }
  }
}
