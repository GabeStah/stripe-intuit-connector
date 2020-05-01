import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import config from 'src/config/config';
import * as fs from 'fs';

async function bootstrap() {
  let httpsOptions = null;
  if (config.get('security.ssl.enabled')) {
    httpsOptions = {
      key: fs.readFileSync(config.get('security.ssl.key')),
      cert: fs.readFileSync(config.get('security.ssl.certificate'))
    };
  }

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    httpsOptions
  });

  app.setGlobalPrefix(config.get('routes.prefix'));

  // Add Redis microservice
  app.connectMicroservice(config.get('db.redis.options'));

  // Start microservices
  await app.startAllMicroservicesAsync();

  // Start app
  await app.listen(config.get('port'));
}
bootstrap();
