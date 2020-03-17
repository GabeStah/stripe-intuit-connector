import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { IntuitService } from 'src/intuit/intuit.service';
import { Logger } from 'winston';
import { MessagePattern } from '@nestjs/microservices';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';

@Controller('intuit')
export class IntuitController {
  constructor(
    private readonly service: IntuitService,
    private readonly authService: IntuitAuthorizationService,
    @Inject('winston') private readonly logger: Logger
  ) {}

  @Get('authorize')
  authorize(@Req() request: Request, @Res() response: Response): void {
    response.redirect(this.authService.authUri());
  }

  @Get('createCustomer')
  async createCustomer(@Req() request: Request): Promise<string> {
    try {
      const response = await this.service.createCustomer(request);
      return response.data;
    } catch (err) {
      this.logger.error(err);
    }
  }

  @Get('getCompanyInfo')
  async getCompanyInfo(): Promise<string> {
    try {
      const response = await this.service.getCompanyInfo();
      return response.data;
    } catch (err) {
      this.logger.error(err);
    }
  }

  /**
   * Callback URI invoked by Intuit API OAuth2 user consent form.
   *
   * @param request
   */
  @Get('callback')
  async callback(@Req() request: Request): Promise<string> {
    return this.authService.callback(request);
  }

  @Get('redis')
  redis(): any {
    return this.service.redis();
  }

  @MessagePattern({ type: 'redis_test' })
  redisMessage(data: any): string {
    console.log(data);
    return data;
  }
}
