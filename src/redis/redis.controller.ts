import { Controller, Get, Inject, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { RedisService } from 'src/redis/redis.service';

@Controller('redis')
export class RedisController {
  constructor(
    private readonly service: RedisService,
    @Inject('winston') private readonly logger: Logger
  ) {}

  @Post('get')
  async get(@Req() request: Request, @Res() response: Response) {
    return response.json(await this.service.get(request.body.key));
  }

  @Post('set')
  async set(@Req() request: Request, @Res() response: Response) {
    return response.json(
      await this.service.set(request.body.key, request.body.data)
    );
  }
}
