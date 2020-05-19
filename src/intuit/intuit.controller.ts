import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { IntuitService } from 'src/intuit/intuit.service';
import { MessagePattern } from '@nestjs/microservices';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';
import { LogService } from 'src/log/log.service';

@Controller('intuit')
export class IntuitController {
  constructor(
    private readonly service: IntuitService,
    private readonly authService: IntuitAuthorizationService,
    private readonly log: LogService
  ) {}

  @Get('authorize')
  authorize(@Req() request: Request, @Res() response: Response): void {
    response.redirect(this.authService.authUri());
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

  /**
   * Check Intuit connectivity.
   */
  @Get('healthcheck')
  async healthcheck(): Promise<object> {
    return this.service.healthcheck();
  }

  // @Get('redis')
  // redis(): any {
  //   return this.service.redis();
  // }

  @MessagePattern({ type: 'redis_test' })
  redisMessage(data: any): string {
    return data;
  }
}
