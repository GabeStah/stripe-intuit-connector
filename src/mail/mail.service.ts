import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import {
  InjectQueue,
  OnQueueActive,
  OnQueueCompleted,
  Process,
  Processor
} from '@nestjs/bull';
import config from 'src/config';
import { Job, Queue } from 'bull';
import uniqid from 'uniqid';
import { LogService } from 'src/log/log.service';

@Injectable()
@Processor(config.get('queue.mail.name'))
export class MailService {
  private readonly transporter: Mail;

  constructor(
    private readonly log: LogService,
    @InjectQueue(config.get('queue.mail.name')) private readonly queue: Queue
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
    this.log.debug({
      data: job.data,
      event: 'started',
      id: job.id,
      name: job.name,
      processor: this.constructor.name
    });
  }

  /**
   * Log on send mail job completion.
   *
   * @param job
   */
  @OnQueueCompleted()
  private onCompleted(job: Job) {
    this.log.debug({
      data: job.data,
      event: 'completed',
      id: job.id,
      name: job.name,
      processor: this.constructor.name
    });
  }

  /**
   * Process 'send' mail job.
   *
   * @param job
   * @return Promise<any> - Success promise callback indicates job success, marking as completed in queue.
   */
  @Process(config.get('queue.mail.types.send'))
  private async handleSend(job: Job) {
    const options = this.mergeOptions(job.data);

    if (!this.validateOptions(options)) {
      return this.log.error({
        message: 'Mail options could not be validated',
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
        message: 'Mail options could not be validated',
        data: options
      };
      this.log.error(errorObject);
      return errorObject;
    }

    const job = await this.queue.add(
      config.get('queue.mail.types.send'),
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
      { to: config.get('mail.adminAlertAddress') },
      options
    );

    if (!this.validateOptions(options)) {
      const errorObject = {
        message: 'Mail options could not be validated.',
        data: options
      };
      this.log.error(errorObject);
      return errorObject;
    }

    const job = await this.queue.add(
      config.get('queue.mail.types.send'),
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
        from: `"${config.get('mail.from.name')}" <${config.get(
          'mail.from.address'
        )}>`,
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
      host: config.get('mail.host'),
      port: config.get('mail.port'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.get('mail.username'),
        pass: config.get('mail.password')
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
      this.log.error({
        message: `Mail send failed: No 'to' address provided`
      });
      return false;
    }

    if (!options.from) {
      this.log.error({
        message: `Mail send failed: No 'from' address provided`
      });
      return false;
    }

    return true;
  }
}
