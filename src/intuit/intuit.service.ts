import { HttpService, Inject, Injectable, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AxiosResponse } from 'axios';
import { Logger } from 'winston';
import { Client, ClientRedis } from '@nestjs/microservices';
import configuration from 'src/config/configuration';
import { MailService } from 'src/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';

@Injectable()
export class IntuitService {
  @Client(configuration().db.redis.options)
  private clientRedis: ClientRedis;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly intuitAuthService: IntuitAuthorizationService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    @Inject('winston') private readonly logger: Logger
  ) {}

  /**
   * Build Intuit API URL with variable extra suffix.
   *
   * @param extra
   */
  buildUrl(extra: string): string {
    return `${this.getBaseUrl()}/${extra}?minorversion=${this.configService.get<
      string
    >('services.intuit.api.version')}`;
  }

  /**
   * Create new Customer record.
   *
   * @param request
   */
  async createCustomer(
    @Req() request: Request
  ): Promise<AxiosResponse<string>> {
    const url = this.buildUrl(`customer`);

    try {
      const axiosResponse = await this.httpService
        .post(url, request, {
          headers: await this.intuitAuthService.getAuthorizationHeaders()
        })
        .toPromise();
      return axiosResponse.data;
    } catch (err) {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(err.response.data);
        return err;
        // return err.response;
      } else if (err.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        this.logger.error(err.request);
        return err.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error(err.message);
        return err.message;
      }
    }
  }

  /**
   * Get base Intuit API URL.
   */
  getBaseUrl(): string {
    return `https://${this.configService.get<string>(
      'services.intuit.api.url'
    )}/v3/company/${this.configService.get<string>('services.intuit.company')}`;
  }

  /**
   * Get Company info.
   */
  async getCompanyInfo(): Promise<AxiosResponse<string>> {
    const url = this.buildUrl(
      `companyinfo/${this.configService.get<string>('services.intuit.company')}`
    );

    return this.httpService
      .get(url, {
        headers: await this.intuitAuthService.getAuthorizationHeaders()
      })
      .toPromise();
  }

  async redis() {
    // Send data to all redis_test listeners
    return await this.clientRedis
      .send({ type: 'redis_test' }, { id: 1, name: 'new test name' })
      .toPromise();
  }
}
