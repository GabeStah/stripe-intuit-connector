import { Injectable } from '@nestjs/common';
import { Adapter, ConversionType } from 'src/adapters/adapter.service';

/**
 * Stripe - PaymentIntent
 * API: https://stripe.com/docs/api/payment_intents/object
 * Example: https://dashboard.stripe.com/test/events/evt_1GLLznAIFSjPGiCSYjJxcAEW
 *
 * Intuit - Payment
 * API: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/payment#the-payment-object
 *
 */
@Injectable()
export class StripePaymentIntentToIntuitPayment extends Adapter {
  from(source: any): any {
    this.source = source;
    return {
      // Use Stripe pi_ id as ref string
      PaymentRefNum: this.get('id'),
      // REQUIRED_FOR_UPDATE
      // SyncToken: '0',
      // Ignored
      // DepositToAccountRef: {
      //   value: '4'
      // },
      // Ignored
      // UnappliedAmt: 10.0,
      TxnDate: new Date(this.get('created')),
      TotalAmt: this.get('amount', ConversionType.CurrencyIntegerToDecimal),
      // Ignored
      // ProcessPayment: false,
      // sparse: false,
      CustomerRef: {
        // TODO: Should be existing Customer.DisplayName
        name: 'Red Rock Diner',
        // TODO: Should be existing Customer.Id
        value: '20'
      },
      // Auto-generated
      // Id: '163',
      MetaData: {
        CreateTime: new Date(this.get('created')),
        LastUpdatedTime: new Date(this.get('created'))
      },
      Line: [
        {
          Amount: 55.0,
          LineEx: {
            any: [
              {
                name: '{http://schema.intuit.com/finance/v3}NameValue',
                nil: false,
                value: {
                  Name: 'txnId',
                  Value: '70'
                },
                declaredType: 'com.intuit.schema.finance.v3.NameValue',
                scope: 'javax.xml.bind.JAXBElement$GlobalScope',
                globalScope: true,
                typeSubstituted: false
              },
              {
                name: '{http://schema.intuit.com/finance/v3}NameValue',
                nil: false,
                value: {
                  Name: 'txnOpenBalance',
                  Value: '71.00'
                },
                declaredType: 'com.intuit.schema.finance.v3.NameValue',
                scope: 'javax.xml.bind.JAXBElement$GlobalScope',
                globalScope: true,
                typeSubstituted: false
              },
              {
                name: '{http://schema.intuit.com/finance/v3}NameValue',
                nil: false,
                value: {
                  Name: 'txnReferenceNumber',
                  Value: '1024'
                },
                declaredType: 'com.intuit.schema.finance.v3.NameValue',
                scope: 'javax.xml.bind.JAXBElement$GlobalScope',
                globalScope: true,
                typeSubstituted: false
              }
            ]
          },
          LinkedTxn: [
            {
              TxnId: '70',
              TxnType: 'Invoice'
            }
          ]
        }
      ]
    };
  }

  to(source: any): any {
    return {
      id: 'pi_1GLLzmAIFSjPGiCSMdiDJhek',
      object: 'payment_intent',
      amount: 50,
      amount_capturable: 0,
      amount_received: 50,
      application: null,
      application_fee_amount: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'automatic',
      charges: {
        object: 'list',
        data: [
          {
            id: 'ch_1GLLzmAIFSjPGiCSLGtjzNf9',
            object: 'charge',
            amount: 50,
            amount_refunded: 0,
            application: null,
            application_fee: null,
            application_fee_amount: null,
            balance_transaction: 'txn_1GLLzmAIFSjPGiCSPD2JhnnH',
            billing_details: {
              address: {
                city: null,
                country: null,
                line1: null,
                line2: null,
                postal_code: null,
                state: null
              },
              email: null,
              name: null,
              phone: null
            },
            captured: true,
            created: 1583900198,
            currency: 'usd',
            customer: 'cus_Gt8GsAIFLPrtBv',
            description: 'Subscription creation',
            destination: null,
            dispute: null,
            disputed: false,
            failure_code: null,
            failure_message: null,
            fraud_details: {},
            invoice: 'in_1GLLzmAIFSjPGiCSHpUYgNRS',
            livemode: false,
            metadata: {},
            on_behalf_of: null,
            order: null,
            outcome: {
              network_status: 'approved_by_network',
              reason: null,
              risk_level: 'normal',
              risk_score: 7,
              seller_message: 'Payment complete.',
              type: 'authorized'
            },
            paid: true,
            payment_intent: 'pi_1GLLzmAIFSjPGiCSMdiDJhek',
            payment_method: 'pm_1GLLzkAIFSjPGiCSOPd4VvfH',
            payment_method_details: {
              card: {
                brand: 'diners',
                checks: {
                  address_line1_check: null,
                  address_postal_code_check: null,
                  cvc_check: 'pass'
                },
                country: 'US',
                exp_month: 4,
                exp_year: 2025,
                fingerprint: 'QzrN8PLtCIZvoSRf',
                funding: 'credit',
                installments: null,
                last4: '0004',
                network: 'diners',
                three_d_secure: null,
                wallet: null
              },
              type: 'card'
            },
            receipt_email: null,
            receipt_number: null,
            receipt_url:
              'https://pay.stripe.com/receipts/acct_1GJlkuAIFSjPGiCS/ch_1GLLzmAIFSjPGiCSLGtjzNf9/rcpt_Gt8GjJrXen9tzEBAEGo8zrgbMhcZ2gH',
            refunded: false,
            refunds: {
              object: 'list',
              data: [],
              has_more: false,
              total_count: 0,
              url: '/v1/charges/ch_1GLLzmAIFSjPGiCSLGtjzNf9/refunds'
            },
            review: null,
            shipping: null,
            source: null,
            source_transfer: null,
            statement_descriptor: null,
            statement_descriptor_suffix: null,
            status: 'succeeded',
            transfer_data: null,
            transfer_group: null
          }
        ],
        has_more: false,
        total_count: 1,
        url: '/v1/charges?payment_intent=pi_1GLLzmAIFSjPGiCSMdiDJhek'
      },
      client_secret:
        'pi_1GLLzmAIFSjPGiCSMdiDJhek_secret_yI6FdETcwIfwwy26LqmiTrkMu',
      confirmation_method: 'automatic',
      created: 1583900198,
      currency: 'usd',
      customer: 'cus_Gt8GsAIFLPrtBv',
      description: 'Subscription creation',
      invoice: 'in_1GLLzmAIFSjPGiCSHpUYgNRS',
      last_payment_error: null,
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: 'pm_1GLLzkAIFSjPGiCSOPd4VvfH',
      payment_method_options: {
        card: {
          installments: null,
          request_three_d_secure: 'automatic'
        }
      },
      payment_method_types: ['card'],
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: null,
      statement_descriptor_suffix: null,
      status: 'succeeded',
      transfer_data: null,
      transfer_group: null
    };
  }
}
