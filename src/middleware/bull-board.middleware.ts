import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { setQueues, UI } from 'bull-board';
import Bull from 'bull';
import configuration from 'src/config/configuration';

@Injectable()
export class BullBoardMiddleware implements NestMiddleware {
  constructor() {
    setQueues([
      new Bull(configuration().queue.intuit.name),
      new Bull(configuration().queue.mail.name),
      new Bull(configuration().queue.stripe.name)
    ]);
  }
  use(request: Request, response: Response, next: NextFunction) {
    UI(request, response, next);
  }
}
