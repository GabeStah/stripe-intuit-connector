import { Inject, Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import {
  InjectQueue,
  OnQueueActive,
  OnQueueCompleted,
  Process,
  Processor
} from '@nestjs/bull';
import configuration from 'src/config/configuration';
import { Job, Queue } from 'bull';
import uniqid from 'uniqid';

@Injectable()
@Processor(configuration().queue.mail.name)
export class MailService {
  private readonly transporter: Mail;

  constructor(
    private readonly configService: ConfigService,
    @Inject('winston') private readonly logger: Logger,
    @InjectQueue(configuration().queue.mail.name) private readonly queue: Queue
  ) {
    if (!this.transporter) {
      this.transporter = this.getTransporter();
    }
  }

  /**
   * Log on send mail job started.
   *
   * @param job
   */
  @OnQueueActive()
  private onActive(job: Job) {
    this.logger.debug({
      data: job.data,
      event: 'started',
      job_id: job.id,
      level: 'queue',
      name: job.name,
      processor: this.constructor.name,
      timestamp: new Date().getTime()
    });
  }

  /**
   * Log on send mail job completion.
   *
   * @param job
   */
  @OnQueueCompleted()
  private onCompleted(job: Job) {
    this.logger.debug({
      data: job.data,
      event: 'completed',
      job_id: job.id,
      level: 'queue',
      name: job.name,
      processor: this.constructor.name,
      timestamp: new Date().getTime()
    });
  }

  /**
   * Process 'send' mail job.
   *
   * @param job
   * @return Promise<any> - Success promise callback indicates job success, marking as completed in queue.
   */
  @Process(configuration().queue.mail.types.send)
  private async handleSend(job: Job) {
    const options = this.mergeOptions(job.data);

    if (!this.validateOptions(options)) {
      return this.logger.error({
        message: 'Mail options could not be validated.',
        data: options
      });
    }

    return this.transporter.sendMail(options);
  }

  /**
   * Send an email via queued background job.
   *
   * @param options
   */
  async send(options?: Mail.Options) {
    options = this.mergeOptions(options);

    if (!this.validateOptions(options)) {
      const errorObject = {
        message: 'Mail options could not be validated.',
        data: options
      };
      this.logger.error(errorObject);
      return errorObject;
    }

    const job = await this.queue.add(
      configuration().queue.mail.types.send,
      options,
      {
        jobId: uniqid(),
        attempts: 5
      }
    );

    return { message: `Job (${job.id}) queued.` };
  }

  /**
   * Send an an admin alert email.
   *
   * @param options
   */
  async sendAdminAlert(options?: Mail.Options) {
    options = this.mergeOptions(
      { to: this.configService.get<string>('mail.adminAlertAddress') },
      options
    );

    if (!this.validateOptions(options)) {
      const errorObject = {
        message: 'Mail options could not be validated.',
        data: options
      };
      this.logger.error(errorObject);
      return errorObject;
    }

    const job = await this.queue.add(
      configuration().queue.mail.types.send,
      options,
      {
        jobId: uniqid(),
        attempts: 5
      }
    );

    return { message: `Job (${job.id}) queued.` };
  }

  /**
   * Merge full mail options from passed options arg plus defaults.
   *
   * @param options
   */
  private mergeOptions(...options: Mail.Options[]): Mail.Options {
    return Object.assign(
      {
        from: `"${this.configService.get<string>(
          'mail.from.name'
        )}" <${this.configService.get<string>('mail.from.address')}>`,
        subject: 'Message from WCASG Connector',
        text: 'Hello world' // plain text body
        // html: '<b>Hello world</b>' // html body
      },
      ...options
    );
  }

  /**
   * Get nodemailer transport instance.
   *
   * @return Mail
   */
  private getTransporter() {
    return nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('mail.username'),
        pass: this.configService.get<string>('mail.password')
      }
    });
  }

  /**
   * Perform mail options validation.
   *
   * @param options
   */
  private validateOptions(options: Mail.Options): boolean {
    if (!options.to) {
      this.logger.error({
        message: `Mail send failed: No 'to' address provided.`
      });
      return false;
    }

    if (!options.from) {
      this.logger.error({
        message: `Mail send failed: No 'from' address provided.`
      });
      return false;
    }

    return true;
  }
}
