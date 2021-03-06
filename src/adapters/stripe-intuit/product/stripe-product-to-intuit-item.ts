import { Injectable } from '@nestjs/common';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';

/**
 * Adapter to convert from Stripe Product to Intuit Item object.
 *
 * Stripe - Product
 * API: https://stripe.com/docs/api/products/object
 *
 * Intuit - Item
 * API: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/item
 *
 */
@Injectable()
export class StripeProductToIntuitItem extends StripeIntuitAdapterService {
  /**
   * Convert Stripe Product source object to Intuit Item object.
   *
   * @see http://gitlab.solarixdigital.com/solarix/wcasg/connector/issues/2
   *
   * @param source
   */
  from(source: any): any {
    this.source = source;
    try {
      this.log.event(this.constructor.name, {
        source
      });

      // Product is used as a Category and related to child Plan Items.
      const result = {
        Name: `${this.get('name')} [${this.get('id')}]`,
        Type: 'Category'
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
