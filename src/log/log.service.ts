import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';

type LogData = string | number | object;

interface LogParams {
  data: LogData;
  level?: string;
  status?: number;
}

@Injectable()
export class LogService {
  constructor(@Inject('winston') private readonly logger: Logger) {}

  private static getOutputObject({ data, status = 200 }: LogParams) {
    const now = new Date();
    return {
      data: data,
      status: status,
      timestamp: now.getTime(),
      timestampISO: now.toISOString()
    };
  }

  public log(data, status = 200, level = 'debug') {
    const outputObject = LogService.getOutputObject({
      data: data,
      status: status
    });
    switch (level) {
      case 'debug':
        this.logger.debug(outputObject);
        break;
      case 'error':
        this.logger.error(outputObject);
        break;
      case 'queue':
        this.logger.notice(outputObject);
        break;
      default:
        this.logger.debug(outputObject);
        break;
    }
  }

  public debug(data: LogData, status = 200) {
    return this.log(data, status, 'debug');
  }

  public error(data: LogData, status = 403) {
    return this.log(data, status, 'error');
  }

  public queue(data: LogData, status = 200) {
    return this.log(data, status, 'queue');
  }
}
