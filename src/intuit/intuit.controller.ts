import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { IntuitService } from 'src/intuit/intuit.service';
import { Logger } from 'winston';

@Controller('intuit')
export class IntuitController {
  constructor(
    private readonly service: IntuitService,
    @Inject('winston') private readonly logger: Logger
  ) {}

  @Get('authorize')
  authorize(@Req() req: Request, @Res() res: Response): void {
    res.redirect(this.service.authUri());
  }

  @Get('createCustomer')
  async createCustomer(@Req() req: Request): Promise<string> {
    try {
      const response = await this.service.createCustomer(req);
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
   * @param req
   */
  @Get('callback')
  async callback(@Req() req: Request): Promise<string> {
    return this.service.callback(req);
  }
}
