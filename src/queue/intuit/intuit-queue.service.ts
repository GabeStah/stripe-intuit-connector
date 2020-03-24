import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bull';
import configuration from 'src/config/configuration';
import { BaseQueueService } from 'src/queue/base-queue.service';
import { ConfigService } from '@nestjs/config';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';

@Injectable()
@Processor(configuration().queue.intuit.name)
export class IntuitQueueService extends BaseQueueService
  implements OnModuleInit {
  constructor(
    @Inject('winston') protected readonly logger: Logger,
    @InjectQueue(configuration().queue.intuit.name)
    private readonly queue: Queue,
    private readonly configService: ConfigService,
    protected readonly intuitAuthService: IntuitAuthorizationService
  ) {
    super(logger);
  }

  async onModuleInit(): Promise<any> {
    // Schedule auto refresh job.
    // Won't add new job if one with same name exists.
    const job = await this.queue.add(
      configuration().queue.intuit.types['refresh-auth'],
      {},
      {
        attempts: 5,
        repeat: {
          cron: this.configService.get<string>(
            'services.intuit.auth.autoRefreshCronSchedule'
          )
        }
      }
    );
  }

  @Process(configuration().queue.intuit.types['refresh-auth'])
  async refreshAuth(job: Job) {
    await this.intuitAuthService.refresh({ shouldSendAlerts: false });
  }
}
