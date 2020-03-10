import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from 'src/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.setGlobalPrefix(configuration().routes.prefix);
  await app.listen(configuration().port);
}
bootstrap();
