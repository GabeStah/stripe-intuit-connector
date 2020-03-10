import { Injectable } from '@nestjs/common';

@Injectable()
export class StripeService {
  getTest(): string {
    return `test`;
  }
}
