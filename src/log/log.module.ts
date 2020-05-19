import { Global, Module } from '@nestjs/common';
import WinstonModule from 'src/log/winston.module';
import { LogService } from 'src/log/log.service';

@Global()
@Module({
  imports: [WinstonModule],
  providers: [LogService],
  exports: [LogService]
})
export class LogModule {}
