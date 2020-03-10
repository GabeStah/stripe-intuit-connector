import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiService {
  getTest(): string {
    return `test`;
  }
}
