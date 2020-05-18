import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SetBodyParser } from 'src/middleware/set-body-parser.middleware';
import { StripeWebhookQueueModule } from 'src/queue/stripe/stripe-webhook-queue.module';
import { MailModule } from 'src/mail/mail.module';
import { RedisModule } from 'src/redis/redis.module';
import { IntuitQueueModule } from 'src/queue/intuit/intuit-queue.module';
import { BullBoardMiddleware } from 'src/middleware/bull-board.middleware';
import { LogModule } from 'src/log/log.module';

// const typeOrmModule = TypeOrmModule.forRoot({
//   type: 'mongodb',
//   host: '127.0.0.1',
//   port: 4433,
//   database: 'connector',
//   // entities: [User],
//   // Loads all entities imported via TypeOrmModule.forFeature.
//   autoLoadEntities: true,
//   synchronize: true,
//   useUnifiedTopology: true
// });

@Module({
  imports: [
    MailModule,
    IntuitQueueModule,
    StripeWebhookQueueModule,
    RedisModule,
    // typeOrmModule,
    LogModule
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
