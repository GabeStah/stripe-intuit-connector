import { OnQueueActive, OnQueueStalled, Processor } from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';

@Injectable()
@Processor()
export abstract class BaseQueueService {
  protected constructor(@Inject('winston') protected readonly logger: Logger) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug({
      event: 'active',
      event_id: job.data.id,
      job_id: job.id,
      level: 'queue',
      name: job.name,
      processor: this.constructor.name,
      time: new Date().getTime(),
      timeISO: new Date().toISOString()
    });
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.debug({
      event: 'stalled',
      event_id: job.data.id,
      job_id: job.id,
      level: 'queue',
      name: job.name,
      processor: this.constructor.name,
      time: new Date().getTime(),
      timeISO: new Date().toISOString()
    });
  }
}
