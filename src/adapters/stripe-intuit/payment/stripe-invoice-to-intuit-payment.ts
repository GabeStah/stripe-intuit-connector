import { Injectable } from '@nestjs/common';
import { StripeIntuitAdapterService } from 'src/adapters/stripe-intuit/stripe-intuit-adapter.service';
import { IntuitEntityType } from 'src/intuit/intuit.service';
import { toStripeId } from 'src/queue/stripe/stripe-webhook-queue.constants';

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
      this.log.event(this.constructor.name, {
        source
      });

      const intuitCustomer = await this.intuit.read({
        type: IntuitEntityType.Customer,
        id: this.get('customer')
      });

      this.log.event(this.constructor.name, {
        intuitCustomer
      });

      const lines = [];
      const intuitInvoice = await this.intuit.read({
        type: IntuitEntityType.Invoice,
        id: this.get('id')
      });

      this.log.event(this.constructor.name, {
        intuitInvoice
      });

      if (!intuitInvoice) {
        throw new Error(
          `Could not create Intuit Payment (no matching Item found matching Stripe Plan).`
        );
      }
      lines.push({
        Amount: (this.get('amount_paid') / 100).toFixed(2),
        LinkedTxn: [
          {
            TxnId: intuitInvoice.Id,
            TxnType: 'Invoice'
          }
        ]
      });

      const result = {
        // Invoices with no charge (i.e. free) have no payment_intent, so use invoice number instead
        PaymentRefNum: this.get('payment_intent')
          ? toStripeId(this.get('payment_intent'))
          : this.get('number'),
        CustomerRef: {
          // Intuit Customer Id
          value: intuitCustomer.Id
        },
        // Indicates the total amount of the transaction. This includes the total of all the charges, allowances, and taxes.
        TotalAmt: (this.get('amount_paid') / 100).toFixed(2),
        Line: lines,
        PrivateNote: JSON.stringify({
          invoice_id: this.get('id'),
          charge: this.get('charge'),
          created: this.get('created'),
          customer_email: this.get('customer_email'),
          customer_name: this.get('customer_name')
        })
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
