import { Injectable } from '@nestjs/common';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';
import { toStripeId } from 'src/queue/stripe/stripe-webhook-queue.constants';

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
export class StripeCustomerToIntuitCustomer extends StripeIntuitAdapterService {
  /**
   * Convert Stripe Customer source object to Intuit Customer object.
   *
   * @param source
   */
  from(source: any): any {
    this.source = source;
    try {
      this.log.event(this.constructor.name, {
        source
      });

      const result = {
        PrimaryEmailAddr: {
          Address: this.get('email')
        },
        DisplayName: `${this.get('name')} [${toStripeId(this.get('id'))}]`,
        GivenName: this.get('name'),
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

      this.log.event(this.constructor.name, {
        result
      });

      return result;
    } catch (e) {
      this.log.error({
        event: this.constructor.name,
        error: e
      });
    }
  }
}
