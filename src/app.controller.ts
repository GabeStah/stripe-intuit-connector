import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  @Get('healthcheck')
  async healthcheck(@Req() request: Request, @Res() response: Response) {
    return response.json({ statusCode: 200, message: 'success' });
  }
}
