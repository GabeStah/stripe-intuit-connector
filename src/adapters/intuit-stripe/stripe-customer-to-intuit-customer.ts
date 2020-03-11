import { Injectable } from '@nestjs/common';
import { Adapter } from 'src/adapters/adapter.service';

/**
 * Adapter to convert between Stripe Customer and Intuit Customer objects.
 *
 * Stripe - Customer
 * API: https://stripe.com/docs/api/customers/object
 * Example: https://dashboard.stripe.com/test/events/evt_1GLLzlAIFSjPGiCSK0fA4gwV
 *
 * Intuit - Customer
 * API: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/customer#the-customer-object
 *
 */
@Injectable()
export class StripeCustomerToIntuitCustomer extends Adapter {
  /**
   * Convert Stripe Customer source object to Intuit Customer object.
   *
   * @param source
   */
  from(source: any): any {
    this.source = source;
    return {
      // REQUIRED_FOR_UPDATE
      // Id: '2',
      // REQUIRED_FOR_UPDATE
      // SyncToken: '0',
      PrimaryEmailAddr: {
        Address: this.get('email')
      },
      DisplayName: this.get('name'),
      Notes: JSON.stringify({
        stripe: {
          id: this.get('id'),
          username: this.get('metadata.username')
        }
      }),
      PrimaryPhone: {
        FreeFormNumber: this.get('phone')
      },
      CompanyName: this.get('metadata.company_name'),
      BillAddr: {
        // REQUIRED_FOR_UPDATE
        // Id: '3',
        City: this.get('address.city'),
        Line1: this.get('address.line1'),
        Line2: this.get('address.line2'),
        PostalCode: this.get('address.postal_code'),
        Country: this.get('address.country'),
        CountrySubDivisionCode: this.get('address.state')
      }
    };
  }

  /**
   * TODO: Make dynamic.
   *
   * @param target
   */
  to(target: any): any {
    this.target = target;
    return {
      id: 'cus_Gt8GsAIFLPrtBv',
      object: 'customer',
      address: {
        city: 'East Christy',
        country: 'SLB',
        line1: '4636 Drew Loaf Apt. 445',
        line2: 'Apt. 174',
        postal_code: '22806-4864',
        state: 'New Mexico'
      },
      balance: 0,
      created: 1583900197,
      currency: null,
      default_source: null,
      delinquent: false,
      description: null,
      discount: null,
      email: 'ortiz.jerrold@example.net',
      invoice_prefix: 'B794CDD1',
      invoice_settings: {
        custom_fields: null,
        default_payment_method: null,
        footer: null
      },
      livemode: false,
      metadata: {
        username: 'oceane67',
        company_name: 'Morissette, Haley and Mayer'
      },
      name: 'Anya Cassin',
      next_invoice_sequence: 1,
      phone: '(964) 441-6042',
      preferred_locales: [],
      shipping: null,
      sources: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
        url: '/v1/customers/cus_Gt8GsAIFLPrtBv/sources'
      },
      subscriptions: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
        url: '/v1/customers/cus_Gt8GsAIFLPrtBv/subscriptions'
      },
      tax_exempt: 'none',
      tax_ids: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
        url: '/v1/customers/cus_Gt8GsAIFLPrtBv/tax_ids'
      }
    };
  }
}
