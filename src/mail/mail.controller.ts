import { Controller, Get, Inject, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { MailService } from 'src/mail/mail.service';
import { InjectQueue } from '@nestjs/bull';
import configuration from 'src/config/configuration';
import { Queue } from 'bull';

@Controller('mail')
export class MailController {
  constructor(
    private readonly service: MailService,
    @InjectQueue(configuration().queue.mail.name)
    private readonly queue: Queue,
    @Inject('winston') private readonly logger: Logger
  ) {}

  @Post('send')
  async send(@Req() request: Request, @Res() response: Response): Promise<any> {
    return response.json(await this.service.send(request.body));
  }

  @Post('send/special')
  async special(
    @Req() request: Request,
    @Res() response: Response
  ): Promise<any> {
    return response.json(await this.service.send(request.body));
  }
}
