import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StripeModule } from 'src/stripe/stripe.module';
import { ConfigModule } from '@nestjs/config';
import { SetBodyParser } from 'src/middleware/set-body-parser.middleware';
import configuration from 'src/config/configuration';
import { IntuitModule } from 'src/intuit/intuit.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    IntuitModule,
    SettingsModule,
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
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetBodyParser).forRoutes('*');
  }
}
