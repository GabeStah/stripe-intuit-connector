import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from 'src/config/configuration';
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

  console.log(config.get('env'));

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    httpsOptions
  });

  app.setGlobalPrefix(configuration().routes.prefix);

  // Add Redis microservice
  app.connectMicroservice(configuration().db.redis.options);

  // Start microservices
  await app.startAllMicroservicesAsync();

  // Start app
  await app.listen(configuration().port);
}
bootstrap();
