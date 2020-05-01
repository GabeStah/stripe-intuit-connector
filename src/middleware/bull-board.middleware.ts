import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { setQueues, UI } from 'bull-board';
import Bull from 'bull';
import config from 'src/config/config';

@Injectable()
export class BullBoardMiddleware implements NestMiddleware {
  constructor() {
    setQueues([
      new Bull(config.get('queue.intuit.name')),
      new Bull(config.get('queue.mail.name')),
      new Bull(config.get('queue.stripe.name'))
    ]);
  }
  use(request: Request, response: Response, next: NextFunction) {
    UI(request, response, next);
  }
}
