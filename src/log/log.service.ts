import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';

type LogData = string | number | object;

interface LogParams {
  data: LogData;
  level?: string;
  status?: number;
  event?: string;
}

@Injectable()
export class LogService {
  constructor(@Inject('winston') private readonly logger: Logger) {}

  private static getOutputObject({ data, event, status = 200 }: LogParams) {
    const now = new Date();
    const obj: any = {
      data: data,
      status: status,
      timestamp: now.getTime()
    };
    if (event) {
      obj.event = event;
    }
    return obj;
  }

  public log({ data, status = 200, event, level = 'debug' }: LogParams) {
    const outputObject = LogService.getOutputObject({
      data,
      event,
      status
    });
    switch (level) {
      case 'debug':
        this.logger.debug(outputObject);
        break;
      case 'error':
        this.logger.error(outputObject);
        break;
      case 'event':
        this.logger.info(outputObject);
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
    return this.log({ data: data, status: status, level: 'debug' });
  }

  public error(data: LogData, status = 403) {
    return this.log({ data: data, status: status, level: 'error' });
  }

  public event(name: string, data: LogData, status = 200) {
    return this.log({
      data: data,
      event: name,
      status: status,
      level: 'event'
    });
  }

  public queue(data: LogData, status = 200) {
    return this.log({ data: data, status: status, level: 'queue' });
  }
}
