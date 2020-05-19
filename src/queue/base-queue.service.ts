import { OnQueueActive, OnQueueStalled, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { LogService } from 'src/log/log.service';

@Injectable()
@Processor()
export abstract class BaseQueueService {
  protected constructor(protected readonly log: LogService) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.log.event('queue.active', {
      event_id: job.data.id,
      job_id: job.id,
      name: job.name,
      processor: this.constructor.name
    });
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.log.event('queue.stalled', {
      event_id: job.data.id,
      job_id: job.id,
      name: job.name,
      processor: this.constructor.name
    });
  }
}
