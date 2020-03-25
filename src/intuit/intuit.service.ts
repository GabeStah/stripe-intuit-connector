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
import QueryString from 'query-string';

enum HttpMethod {
  GET,
  POST
}

export enum IntuitEntityType {
  Account = 'Account',
  Bill = 'Bill',
  CompanyInfo = 'CompanyInfo',
  Customer = 'Customer',
  Employee = 'Employee',
  Estimate = 'Estimate',
  Invoice = 'Invoice',
  Item = 'Item',
  Payment = 'Payment',
  Preferences = 'Preferences',
  ProfitAndLoss = 'ProfitAndLoss',
  TaxAgency = 'TaxAgency',
  Vendor = 'Vendor'
}

interface IntuitRequestParams {
  data?: any;
  method: HttpMethod;
  url: string;
}

interface ActionParams {
  data?: any;
  type: IntuitEntityType;
}

interface ReadParams {
  column?: string;
  id: number | string;
  type: IntuitEntityType;
}

interface QueryParams {
  id: number | string;
  type: IntuitEntityType;
}

interface FindParams {
  column?: string;
  id: string;
  type: IntuitEntityType;
}

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
   * @param uri
   * @param params
   */
  buildUrl(uri: string, params?: any): string {
    return QueryString.stringifyUrl({
      url: `${this.getBaseUrl()}/${uri}`,
      query: {
        minorversion: this.configService.get<string>(
          'services.intuit.api.version'
        ),
        ...params
      }
    });
  }

  /**
   * Create an entity
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/customer#create-a-customer
   *
   * @param entityType
   * @param data
   */
  async create({ type, data }: ActionParams) {
    const url = this.buildUrl(type.toLowerCase());
    return this.request({ method: HttpMethod.POST, url: url, data: data });
  }

  /**
   * Deletes an entity.
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/payment#delete-a-payment
   *
   * @param entityType
   * @param data
   */
  async delete({ type, data }: ActionParams) {
    const url = this.buildUrl(type.toLowerCase(), {
      operation: 'delete'
    });
    return this.request({ method: HttpMethod.POST, url: url, data: data });
  }

  /**
   * Finds an Intuit Entity instance by type and id.
   *
   * @param type
   * @param id - Typically Stripe Id as stored in search column.
   * @param column? - Explicitly overrides lookup column.
   */
  protected async find({ type, id, column }: FindParams) {
    if (!column) {
      switch (type) {
        case IntuitEntityType.Customer:
          column = 'DisplayName';
          break;
        case IntuitEntityType.Invoice:
          column = 'DocNumber';
          break;
        case IntuitEntityType.Item:
          column = 'Sku';
          break;
        case IntuitEntityType.Payment:
          column = 'PaymentRefNum';
          break;
        default:
          return {};
      }
    }
    const url = this.buildUrl(`query`, {
      query: `SELECT * FROM ${type} WHERE ${column} LIKE '%${id}%'`
    });
    const result = await this.request({ method: HttpMethod.GET, url: url });
    if (
      result.hasOwnProperty('QueryResponse') &&
      result.QueryResponse.hasOwnProperty(type) &&
      result.QueryResponse[type].length >= 1
    ) {
      // Return first result, actual object
      return result.QueryResponse[type][0];
    } else {
      // No result, error out
      this.logger.error({
        message: 'Could not retrieve Intuit record.',
        data: { type, id }
      });
      throw new Error(
        `Could not retrieve Intuit record: Type: ${type}, Id: ${id}.`
      );
    }
  }

  /**
   * TODO: Add query
   *
   * @param type
   * @param id
   */
  async query({ type, id }: QueryParams) {
    const url = this.buildUrl(`query`, {
      query: `SELECT * FROM ${type} WHERE DisplayName LIKE '%${id}%'`
    });
    return this.request({ method: HttpMethod.GET, url: url });
  }

  /**
   * Read an an existing entity by Intuit or Stripe Id.
   *
   * Stripe Id syntax:
   * Customer: cus_GxteL51Kw52Dp3
   * Product: prod_Gx1oYjobOgnKFT
   * Invoice: in_1GJmVIAIFSjPGiCSIpd2rF8d
   * Invoice Line Item: il_tmp1GKXIMAIFSjPGiCSBI8gglZi
   * Plan: plan_Gx1opOsXxJHqUx
   * Product: prod_Gx1oYjobOgnKFT
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/customer#read-a-customer
   *
   * @param type
   * @param id
   * @param column
   */
  async read({ type, id, column }: ReadParams) {
    if (typeof id === 'number') {
      const url = this.buildUrl(`${type.toLowerCase()}/${id}`);
      return this.request({ method: HttpMethod.GET, url: url });
    } else if (typeof id === 'string') {
      // Get Stripe Id
      const underscoreIndex = id.indexOf('_');
      if (underscoreIndex !== -1) {
        // Use up to 20 characters of id.
        return this.find({
          type,
          id: id.substring(underscoreIndex + 1, underscoreIndex + 1 + 20),
          column
        });
      } else {
        // Assume non-Stripe id, but in string form.
        const url = this.buildUrl(`${type.toLowerCase()}/${id}`);
        return this.request({ method: HttpMethod.GET, url: url });
      }
    }
  }

  /**
   * Perform an Intuit API request.
   * All specific CRUD methods should invoke this base request method.
   *
   * @param method
   * @param url
   * @param data
   */
  async request({ method, url, data }: IntuitRequestParams) {
    try {
      let response;
      switch (method) {
        case HttpMethod.GET:
          response = await this.httpService
            .get(url, {
              headers: await this.intuitAuthService.getAuthorizationHeaders()
            })
            .toPromise();
          break;
        case HttpMethod.POST:
          response = await this.httpService
            .post(url, data, {
              headers: await this.intuitAuthService.getAuthorizationHeaders()
            })
            .toPromise();
          break;
      }
      return response.data;
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
   * Updates an entity.
   * Uses 'sparse' option to allow for partial object update.  All other attributes remain as before.
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/customer#sparse-update-a-customer
   *
   * @param type
   * @param data
   */
  async update({ type, data }: ActionParams) {
    const url = this.buildUrl(type.toLowerCase(), {
      operation: 'update'
    });
    // Make sparse update
    data.sparse = true;
    return this.request({ method: HttpMethod.POST, url: url, data: data });
  }

  /**
   * Voids an entity.
   *
   * @see https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/payment#void-a-payment
   *
   * @param type
   * @param data
   */
  async void({ type, data }: ActionParams) {
    const url = this.buildUrl(type.toLowerCase(), {
      operation: 'update',
      include: 'void'
    });
    // Make sparse update
    data.sparse = true;
    return this.request({ method: HttpMethod.POST, url: url, data: data });
  }

  /**
   * Get base Intuit API URL.
   */
  getBaseUrl(): string {
    return `https://${this.configService.get<string>(
      'services.intuit.api.url'
    )}/v3/company/${this.configService.get<string>('services.intuit.company')}`;
  }

  async redis() {
    // Send data to all redis_test listeners
    return await this.clientRedis
      .send({ type: 'redis_test' }, { id: 1, name: 'new test name' })
      .toPromise();
  }
}
