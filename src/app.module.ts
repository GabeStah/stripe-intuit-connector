import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from 'src/api/api.module';
import { SetBodyParser } from 'src/middleware/set-body-parser.middleware';

@Module({
  imports: [ApiModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetBodyParser).forRoutes(process.env.API_ENDPOINT);
  }
}
