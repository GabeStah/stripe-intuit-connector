import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bull';
import config from 'src/config';
import { BaseQueueService } from 'src/queue/base-queue.service';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';
import { IntuitService } from 'src/intuit/intuit.service';
import { LogService } from 'src/log/log.service';

@Injectable()
@Processor(config.get('queue.intuit.name'))
export class IntuitQueueService extends BaseQueueService
  implements OnModuleInit {
  constructor(
    @InjectQueue(config.get('queue.intuit.name'))
    private readonly queue: Queue,
    protected readonly intuitAuthService: IntuitAuthorizationService,
    protected readonly intuitService: IntuitService,
    protected readonly log: LogService
  ) {
    super(log);
  }

  async onModuleInit(): Promise<any> {
    this.log.log('Hello world');

    // Schedule auto refresh job.
    // Won't add new job if one with same name exists.
    await this.queue.add(
      config.get('queue.intuit.types.refresh'),
      {},
      {
        repeat: {
          cron: config.get('services.intuit.auth.autoRefreshCronSchedule')
        }
      }
    );

    // Healthcheck
    await this.queue.add(
      config.get('queue.intuit.types.healthcheck'),
      {},
      {
        repeat: {
          cron: config.get('services.intuit.auth.autoHealthcheckCronSchedule')
        }
      }
    );
  }

  @Process(config.get('queue.intuit.types.healthcheck'))
  async healthcheck() {
    return this.intuitService.healthcheck();
  }

  @Process(config.get('queue.intuit.types.refresh'))
  async refreshAuth(job: Job) {
    await this.intuitAuthService.refresh({ shouldSendAlerts: false });
  }
}
