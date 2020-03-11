import { HttpModule, Module } from '@nestjs/common';
import { IntuitService } from './intuit.service';
import { IntuitController } from './intuit.controller';

@Module({
  imports: [HttpModule],
  controllers: [IntuitController],
  providers: [IntuitService],
  exports: [IntuitService]
})
export class IntuitModule {}
