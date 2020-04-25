import { Injectable } from '@nestjs/common';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';
import { IntuitEntityType } from '../../../intuit/intuit.service';
import { toStripeId } from 'src/queue/stripe/stripe-webhook-queue.constants';

/**
 * Adapter to convert from Stripe Invoice to Intuit Invoice object.
 *
 * Stripe - Invoice
 * API: https://stripe.com/docs/api/invoices/object
 *
 * Intuit - Invoice
 * API: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/invoice
 *
 */
@Injectable()
export class StripeInvoiceToIntuitInvoice extends StripeIntuitAdapterService {
  /**
   * Convert Stripe Invoice source object to Intuit Invoice object.
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
          Description: line.description ?? line.plan?.nickname ?? '',
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

      // Check for discount
      if (this.get('discount')) {
        const coupon = this.get('discount.coupon');
        // Ensure coupon is valid
        if (coupon && coupon.valid) {
          // Check if percent-based
          if (coupon.percent_off) {
            // Add description
            lines.push({
              DetailType: 'DescriptionOnly',
              Description: `Coupon: ${coupon.name} [${coupon.id}]`
            });

            // Add applicable percentage discount
            lines.push({
              DetailType: 'DiscountLineDetail',
              DiscountLineDetail: {
                PercentBased: true,
                DiscountPercent: coupon.percent_off
              }
            });
          }
        }
      }

      const obj = {
        DocNumber: toStripeId(this.get('id')),
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
