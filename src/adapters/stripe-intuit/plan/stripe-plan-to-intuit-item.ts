import { Injectable } from '@nestjs/common';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';
import config from 'src/config';

/**
 * Adapter to convert from Stripe Plan to Intuit Item object.
 *
 * Stripe - Plan
 * API: https://stripe.com/docs/api/plans/object
 *
 * Intuit - Item
 * API: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/item
 *
 */
@Injectable()
export class StripePlanToIntuitItem extends StripeIntuitAdapterService {
  /**
   * Convert Stripe Product source object to Intuit Item object.
   *
   * @see http://gitlab.solarixdigital.com/solarix/wcasg/connector/issues/2
   *
   * @param source
   * @param method
   */
  from(source: any, method?: 'create' | 'delete' | 'update'): any {
    this.source = source;
    try {
      this.log.event(this.constructor.name, {
        method,
        source
      });

      const result = {
        Active: !!this.get('active'),
        Description: this.get('description'),
        IncomeAccountRef: {
          name: config.get('services.intuit.settings.account.name'),
          value: config.get('services.intuit.settings.account.id')
        },
        Name: `${this.get('product.name')} [${this.get(
          'product.id'
        )}]:${this.get('product.name')} [${this.get('nickname')}]`,
        Sku: `${this.get('product.id')}.${this.get('id')}`,
        Type: 'Service'
      };
      if (method && method === 'update') {
        // Override Name because update API doesn't like categorization colon separator
        result.Name = `${this.get('product.name')} [${this.get('nickname')}]`;
      }

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
