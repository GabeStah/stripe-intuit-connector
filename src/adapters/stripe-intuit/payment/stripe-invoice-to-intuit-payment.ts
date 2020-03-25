import { Injectable } from '@nestjs/common';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';
import { IntuitEntityType } from '../../../intuit/intuit.service';

/**
 * Adapter to convert from Stripe Invoice to Intuit Payment object.
 *
 * Stripe - Invoice
 * API: https://stripe.com/docs/api/invoices/object
 *
 * Intuit - Payment
 * API: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/payment
 *
 */
@Injectable()
export class StripeInvoiceToIntuitPayment extends StripeIntuitAdapterService {
  /**
   * Convert Stripe Invoice source object to Intuit Payment object.
   *
   * @see http://gitlab.solarixdigital.com/solarix/wcasg/connector/issues/2
   *
   * @param source
   */
  async from(source: any) {
    this.source = source;
    try {
      const intuitCustomer = await this.intuit.read({
        type: IntuitEntityType.Customer,
        id: this.get('customer')
      });
      const lineData = this.get('lines.data');
      const lines = [];
      for (const line of lineData) {
        const intuitItem = await this.intuit.read({
          type: IntuitEntityType.Item,
          id: line.plan?.id
        });
        if (!intuitItem) {
          throw new Error(
            `Could not create Intuit invoice (no matching Item found matching Stripe Plan).`
          );
        }
        lines.push({
          DetailType: 'SalesItemLineDetail',
          Description: line.nickname ?? '',
          Amount: (line.amount / 100).toFixed(2),
          SalesItemLineDetail: {
            ItemRef: {
              value: intuitItem.Id
            },
            Qty: 1,
            UnitPrice: (line.amount / 100).toFixed(2)
          }
        });
      }
      const obj = {
        // Maximum 20 characters
        DocNumber: this.get('id').substring(0, 19),
        CustomerRef: {
          // Intuit Customer Id
          value: intuitCustomer.Id
        },
        Line: lines
      };
      return obj;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
