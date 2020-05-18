import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { RedisService } from 'src/redis/redis.service';
import { LogService } from 'src/log/log.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly service: RedisService) {}

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
