import { Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {}

  @Post()
  create(@Req() request: Request): Promise<User> {
    return this.usersService.create(request.body);
  }

  @Get(':id')
  findOne(@Req() request: Request): Promise<User> {
    return this.usersService.findOne(request.params.id);
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
