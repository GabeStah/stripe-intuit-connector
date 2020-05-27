import { HttpService, Injectable } from '@nestjs/common';
import { Client, ClientRedis } from '@nestjs/microservices';
import { MailService } from 'src/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { IntuitAuthorizationService } from 'src/intuit/intuit-authorization.service';
import QueryString from 'query-string';
import { toStripeId } from 'src/queue/stripe/stripe-webhook-queue.constants';
import { Transport } from '@nestjs/common/enums/transport.enum';
import config from 'src/config';
import { LogService } from 'src/log/log.service';

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
  column?: string;
  id?: number | string;
  type: IntuitEntityType;
}

interface FindParams {
  column?: string;
  id: string;
  type: IntuitEntityType;
}

@Injectable()
export class IntuitService {
  @Client({
    transport: Transport.REDIS,
    options: {
      url: `redis://${config.get('db.redis.host')}:${config.get(
        'db.redis.port'
      )}`
    }
  })
  private clientRedis: ClientRedis;

  constructor(
    private readonly httpService: HttpService,
    private readonly intuitAuthService: IntuitAuthorizationService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly log: LogService
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
        minorversion: config.get('services.intuit.api.version'),
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
  async find({ type, id, column }: FindParams) {
    const result = await this.query({ type, id, column });
    if (!result) {
      // No result, error out
      this.log.error({
        message: 'Could not retrieve Intuit record',
        data: { type, id }
      });
      throw new Error(
        `Could not retrieve Intuit record: Type: ${type}, Id: ${id}.`
      );
    }
    return Promise.resolve(result);
  }

  /**
   * Check Intuit connectivity.
   */
  async healthcheck() {
    const result = await this.query({
      type: IntuitEntityType.CompanyInfo
    });

    const response = {
      event: 'healthcheck',
      message: 'Success'
    };

    if (result.name && result.name === 'Error') {
      this.log.error(result.message);
      return Promise.reject(result.message);
    } else {
      this.log.event('healthcheck', '✅ Success');
    }
    return Promise.resolve(response);
  }

  /**
   * Query for specific entity type, with optional column + id where clause.
   *
   * @param type
   * @param id
   * @param column
   */
  async query({ type, id, column }: QueryParams) {
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
      }
    }

    // Get every record of type
    let url = this.buildUrl(`query`, {
      query: `SELECT * FROM ${type}`
    });

    if (column && id) {
      // Perform more explicit query
      url = this.buildUrl(`query`, {
        query: `SELECT * FROM ${type} WHERE ${column} LIKE '%${id}%'`
      });
    }

    const result = await this.request({ method: HttpMethod.GET, url: url });
    if (
      result.hasOwnProperty('QueryResponse') &&
      result.QueryResponse.hasOwnProperty(type) &&
      result.QueryResponse[type].length >= 1
    ) {
      // Return first result, actual object
      return Promise.resolve(result.QueryResponse[type][0]);
    } else {
      this.log.error(result);
      return Promise.resolve(result);
    }
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
      // Check for Stripe Id
      const underscoreIndex = id.indexOf('_');
      if (underscoreIndex !== -1) {
        return this.find({
          type,
          id: toStripeId(id),
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
          // Log event
          this.log.event('intuit.request.get', {
            url
          });
          response = await this.httpService
            .get(url, {
              headers: await this.intuitAuthService.getAuthorizationHeaders()
            })
            .toPromise();
          break;
        case HttpMethod.POST:
          // Log event
          this.log.event('intuit.request.post', {
            data,
            url
          });
          response = await this.httpService
            .post(url, data, {
              headers: await this.intuitAuthService.getAuthorizationHeaders()
            })
            .toPromise();
          break;
      }
      return Promise.resolve(response.data);
    } catch (err) {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.log.error(err.response.data);
        return Promise.reject(err);
        // return err.response;
      } else if (err.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        this.log.error(err.request);
        return Promise.reject(err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        this.log.error(err.message);
        return Promise.reject(err.message);
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
    return `https://${config.get(
      'services.intuit.api.url'
    )}/v3/company/${config.get('services.intuit.company')}`;
  }

  async redis() {
    // Send data to all redis_test listeners
    return await this.clientRedis
      .send({ type: 'redis_test' }, { id: 1, name: 'new test name' })
      .toPromise();
  }
}
