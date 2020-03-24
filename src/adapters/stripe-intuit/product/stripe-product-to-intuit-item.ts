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
    const obj = {
      Active: !!this.get('active'),
      Description: this.get('description'),
      IncomeAccountRef: {
        name: this.config.get<string>(
          'services.intuit.settings.account.default.name'
        ),
        value: this.config.get<number>(
          'services.intuit.settings.account.default.id'
        )
      },
      Name: `${this.get('name')} [${this.get('id')}]`,
      Sku: this.get('id'),
      Type: 'Service'
    };
    return obj;
  }
}
