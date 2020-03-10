import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StripeModule } from 'src/stripe/stripe.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SetBodyParser } from 'src/middleware/set-body-parser.middleware';
import configuration from 'src/config/configuration';
import { IntuitModule } from 'src/intuit/intuit.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    IntuitModule,
    StripeModule,
    MongooseModule.forRoot(configuration().db.mongo.uri, {
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [IntuitModule, StripeModule]
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetBodyParser).forRoutes('*');
  }
}
