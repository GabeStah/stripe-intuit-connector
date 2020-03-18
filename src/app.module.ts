import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SetBodyParser } from 'src/middleware/set-body-parser.middleware';
import configuration from 'src/config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import WinstonDailyRotateFile from 'winston-daily-rotate-file';
import { StripeWebhookQueueModule } from 'src/queue/stripe/stripe-webhook-queue.module';
import { MailModule } from 'src/mail/mail.module';
import { RedisModule } from 'src/redis/redis.module';
import { IntuitQueueModule } from 'src/queue/intuit/intuit-queue.module';
import { BullBoardMiddleware } from 'src/middleware/bull-board.middleware';

const winstonModule = WinstonModule.forRoot({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'connector' },
  levels: {
    emerg: 0,
    alert: 1,
    crit: 2,
    error: 3,
    warning: 4,
    notice: 5,
    info: 6,
    queue: 7,
    debug: 8
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new WinstonDailyRotateFile({
      dirname: 'logs/debug',
      filename: 'debug-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      json: true,
      maxSize: '50m',
      maxFiles: '14d',
      utc: true,
      level: 'debug'
    }),
    new WinstonDailyRotateFile({
      dirname: 'logs/queue',
      filename: 'queue-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      json: true,
      maxSize: '50m',
      maxFiles: '14d',
      utc: true,
      level: 'queue'
    })
  ]
});

const typeOrmModule = TypeOrmModule.forRoot({
  type: 'mongodb',
  host: '127.0.0.1',
  port: 4433,
  database: 'connector',
  // entities: [User],
  // Loads all entities imported via TypeOrmModule.forFeature.
  autoLoadEntities: true,
  synchronize: true,
  useUnifiedTopology: true
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MailModule,
    IntuitQueueModule,
    StripeWebhookQueueModule,
    UsersModule,
    RedisModule,
    typeOrmModule,
    winstonModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BullBoardMiddleware).forRoutes('admin/queue');
    consumer.apply(SetBodyParser).forRoutes('*');
  }
}
