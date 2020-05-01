import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bull';
import config from 'src/config/config';
import { BaseQueueService } from 'src/queue/base-queue.service';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';

@Injectable()
@Processor(config.get('queue.intuit.name'))
export class IntuitQueueService extends BaseQueueService
  implements OnModuleInit {
  constructor(
    @Inject('winston') protected readonly logger: Logger,
    @InjectQueue(config.get('queue.intuit.name'))
    private readonly queue: Queue,
    protected readonly intuitAuthService: IntuitAuthorizationService
  ) {
    super(logger);
  }

  async onModuleInit(): Promise<any> {
    // Schedule auto refresh job.
    // Won't add new job if one with same name exists.
    const job = await this.queue.add(
      config.get('queue.intuit.types.refresh'),
      {},
      {
        attempts: 5,
        repeat: {
          cron: config.get('services.intuit.auth.autoRefreshCronSchedule')
        }
      }
    );
  }

  @Process(config.get('queue.intuit.types.refresh'))
  async refreshAuth(job: Job) {
    await this.intuitAuthService.refresh({ shouldSendAlerts: false });
  }
}
