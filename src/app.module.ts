import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SetBodyParser } from 'src/middleware/set-body-parser.middleware';
import configuration from 'src/config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from 'src/settings/settings.module';
import { UsersModule } from 'src/users/users.module';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import WinstonDailyRotateFile from 'winston-daily-rotate-file';
import { StripeWebhookModule } from 'src/queue/stripe/stripe-webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    SettingsModule,
    StripeWebhookModule,
    UsersModule,
    TypeOrmModule.forRoot({
      type: 'mongodb',
      host: '127.0.0.1',
      port: 4433,
      database: 'connector',
      // entities: [User],
      // Loads all entities imported via TypeOrmModule.forFeature.
      autoLoadEntities: true,
      synchronize: true,
      useUnifiedTopology: true
    }),
    WinstonModule.forRoot({
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
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetBodyParser).forRoutes('*');
  }
}
