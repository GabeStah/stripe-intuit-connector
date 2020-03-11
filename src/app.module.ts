import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StripeModule } from 'src/stripe/stripe.module';
import { ConfigModule } from '@nestjs/config';
import { SetBodyParser } from 'src/middleware/set-body-parser.middleware';
import configuration from 'src/config/configuration';
import { IntuitModule } from 'src/intuit/intuit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from 'src/settings/settings.module';
import { UsersModule } from 'src/users/users.module';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    IntuitModule,
    SettingsModule,
    StripeModule,
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
        debug: 7,
        webhook: 8
      },
      transports: [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error'
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.File({
          filename: `logs/webhook/webhook-${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}.log`,
          level: 'webhook'
        })
      ]
    })
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [IntuitModule, StripeModule]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetBodyParser).forRoutes('*');
  }
}
