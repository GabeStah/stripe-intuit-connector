## Description

Headless API for connecting Stripe :: QuickBooks Online.

Based on [Nest](https://github.com/nestjs/nest) TypeScript framework.

## Installation

```bash
$ npm install
```

## Running Connector

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Development

### Connect to MongoDB

Open an SSH tunnel connect to `wcasg-audit-mongo-a` Mongo server.

- `yarn run dev:db:mongo:ssh-tunnel` to SSH as `root`.

### Connect to Redis

If Docker installed run Redis in Docker container:

- Attached: `yarn run dev:db:redis`
- Dettached: `yarn run dev:db:redis:detached`

### Stripe Webhooks

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Run `stripe login` to authenticate.
3. Run `stripe listen --forward-to http://localhost:4321/v1/stripe/webhook` to point Stripe webhooks to Connector API endpoint.
4. Open a new terminal.
5. Run `stripe trigger <event>`, e.g. `stripe trigger payment_intent.created`.
6. Stripe will generate a new trigger an event and webhook of specified type, which Connector will pickup at `@Post` method associated with endpoint.

### Postman

[Postman](https://www.postman.com/) import JSON can be found here: https://www.postman.com/collections/b2cab534466822feadeb

### Debugging

Run `./node_modules/@nestjs/cli/bin/nest.js start --watch` targeting `src/main.ts` file in whatever IDE/dev environment you use.

### Queue / Job Monitoring

1. Launch both Redis and Connector.
2. Visit [http://localhost:4321/v1/admin/queue](http://localhost:4321/v1/admin/queue).

## Deployment

### Staging

- Base URL: `http://wcasg-connector.pngpub.com:4321/`
- Intuit Reauth URL: `http://wcasg-connector.pngpub.com:4321/v1/intuit/authorize`
- Stripe Webhook Endpoint: `http://wcasg-connector.pngpub.com:4321/v1/stripe/webhook`

---

- App: AWS EC2
  - Name: `wcasg-connector`
  - Type: `t2.small`
  - Public / Elastic IP: `100.21.12.193`
- Redis: AWS 
  - Name: `wcasg-connector-redis`
  - Nodes: `1`
  - NodeType: `cache.t2.small`
  - Endpoint: `wcasg-connector-redis.btdm1a.0001.usw2.cache.amazonaws.com`
  - Port: `6379`
- VPC
  - ID: `vpc-0b54e9694c2377fc2`
  - Name: `vpc-wcasg`
  - Security Groups
    - `sec-wcasg-web` - Opens ports 80 and 443
    - `sec-wcasg-ssh` - Opens port 22
    - `sec-wcasg-connector-4321` - Opens port 4321 to outside traffic
    - `sg-065c0296ab1569aa8` - Opens incoming port 6379 between Redis and EC2

## Testing

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Intuit Authentication & Authorization

The Intuit API requires [OAuth 2.0 authorization](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization) for all connecting apps. This **requires** a manual user consent interaction every 101 days, at most, due to the expiration time of the `rememberToken` Intuit API assigns.

The following is the current implementation of Connector to handle Intuit API auth:

1. For a fresh install with no existing database record a request to Intuit API will fail due to bad auth.
2. A user must manually authorize the Connector app (specifically, the `callback` endpoint it defines).
3. At present, this is accomplished by sending a `GET` request to `/v1/intuit/authorize`. This creates an authorization URL with proper scope in the [intuit.controller@authorize()](src/intuit/intuit.controller.ts#L42) and redirects to the user to that authorization URL (on the Intuit site).
4. The user then elects to consent for the Connector app to be given authorization to the specified account.
5. The user is redirects to the `callback` endpoint which invokes the [intuit.controller@callback()](src/intuit/intuit.controller.ts#L63) method. This method generates an async `accessToken` and `refreshToken`, which is added to (or updated) in the database for future requests.
6. An `accessToken` expires after only 60 minutes, while a `refreshToken` (which can be used to programmatically generate a new `acessToken`) lasts 101 days.
7. Thus, all future requests while a valid `refreshToken` exists will use that to generate `accessTokens` without the need for user consent.
8. Eventually, the app will have no valid `refreshToken` and must be manually consented by the user.

## Relationship Logic

| Stripe Webhook Event      | Intuit Effect                                                |
| ------------------------- | ------------------------------------------------------------ |
| customer.created          | Creates `Customer`.                                          |
| customer.deleted          | Marks `Customer` as inactive.                                |
| customer.updated          | Updates existing `Customer`.                                 |
| invoice.created           | Creates `Invoice`, associated with `Item(s)`.                |
| invoice.payment_succeeded | Creates `Payment`, associated with `Invoice`.                |
| plan.created              | Creates `Item`, associated with parent `Item Category`.      |
| plan.deleted              | Marks `Item` as inactive.                                    |
| plan.updated              | Updates existing `Item`.                                     |
| product.created           | Creates `Item Category`, for later association with `Items`. |
| product.updated           | Updates existing `Item Category`.                            |

### Stripe Product :: Intuit Item Category

- Stripe Event: `product.create`
- Stripe Object (`Product`) and Payload:

```json
{
  "object": {
    "id": "prod_Gyfg0Kn11IPz89",
    "object": "product",
    "active": true,
    "attributes": [],
    "created": 1585177735,
    "description": null,
    "images": [],
    "livemode": false,
    "metadata": {},
    "name": "Widget",
    "statement_descriptor": "Widget",
    "type": "service",
    "unit_label": "site",
    "updated": 1585177735
  }
}
```

- `Item Category` are parents to child Stripe `Plans` that are related to parent Stripe `Product`.
- Intuit Entity (`Item Category`):

```js
{
  Name: 'Widget [prod_Gyfg0Kn11IPz89]',
  Type: 'Category'
}
```

### Stripe Plan :: Intuit Item

- Stripe Event: `plan.created`
- Stripe Object (`Product`) and Payload:

```json
{
  "object": {
    "id": "plan_Gyfoobt3nSL5Sa",
    "object": "plan",
    "active": true,
    "aggregate_usage": null,
    "amount": 2500,
    "amount_decimal": "2500",
    "billing_scheme": "per_unit",
    "created": 1585178185,
    "currency": "usd",
    "interval": "month",
    "interval_count": 1,
    "livemode": false,
    "metadata": {},
    "nickname": "5 Sites",
    "product": "prod_Gyfg0Kn11IPz89",
    "tiers": null,
    "tiers_mode": null,
    "transform_usage": {
      "divide_by": 5,
      "round": "up"
    },
    "trial_period_days": null,
    "usage_type": "licensed"
  }
}
```

- `Item` is categorized under parent `Product` category and represents a subscribed Plan from Stripe.
- Intuit Entity (`Item`):

```js
{
  Active: true,
  Description: this.get('description'),
  IncomeAccountRef: {
    name: config.get(
      'services.intuit.settings.account.default.name'
    ),
    value: config.get(
      'services.intuit.settings.account.default.id'
    )
  },
  Name: `Widget [5 Sites]`,
  Sku: `prod_Gyfg0Kn11IPz89.plan_Gyfoobt3nSL5Sa`,
  Type: 'Service'
}
```

### Stripe Customer :: Intuit Customer

- Stripe Event: `customer.created`
- Stripe Object (`Customer`) and Payload:

```json
{
  "object": {
    "id": "cus_GyfzwZFBet54oO",
    "object": "customer",
    "address": {
      "city": "Washougal",
      "country": "US",
      "line1": "1234 5th St",
      "line2": "",
      "postal_code": "98671",
      "state": "WA"
    },
    "balance": 0,
    "created": 1585178844,
    "currency": null,
    "default_source": null,
    "delinquent": false,
    "description": null,
    "discount": null,
    "email": "jane@example.com",
    "invoice_prefix": "0E4A63E7",
    "invoice_settings": {
      "custom_fields": null,
      "default_payment_method": null,
      "footer": null
    },
    "livemode": false,
    "metadata": {},
    "name": "Jane Doe",
    "next_invoice_sequence": 1,
    "phone": "+15551234567",
    "preferred_locales": [],
    "shipping": {
      "address": {
        "city": "Washougal",
        "country": "US",
        "line1": "1234 5th St",
        "line2": "",
        "postal_code": "98671",
        "state": "WA"
      },
      "name": "Jane Doe",
      "phone": "+15551234567"
    },
    "sources": {
      "object": "list",
      "data": [],
      "has_more": false,
      "total_count": 0,
      "url": "/v1/customers/cus_GyfzwZFBet54oO/sources"
    },
    "subscriptions": {
      "object": "list",
      "data": [],
      "has_more": false,
      "total_count": 0,
      "url": "/v1/customers/cus_GyfzwZFBet54oO/subscriptions"
    },
    "tax_exempt": "none",
    "tax_ids": {
      "object": "list",
      "data": [],
      "has_more": false,
      "total_count": 0,
      "url": "/v1/customers/cus_GyfzwZFBet54oO/tax_ids"
    }
  }
}
```

- Intuit `Customer` must have a unique `DisplayName`, so field is used to store partial Stripe `Customer.id` for lookup.
- Intuit Entity (`Customer`):

```js
{
  PrimaryEmailAddr: {
    Address: this.get('email')
  },
  DisplayName: 'Jane Doe [cus_GyfzwZFBet54oO]',
  GivenName: 'Jane Doe',
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
    City: this.get('address.city'),
    Line1: this.get('address.line1'),
    Line2: this.get('address.line2'),
    PostalCode: this.get('address.postal_code'),
    Country: this.get('address.country'),
    CountrySubDivisionCode: this.get('address.state')
  }
}
```

### Stripe Invoice :: Intuit Invoice

- Stripe Event: `invoice.created`
- Stripe Object (`Invoice`) and Payload:

```json
{
  "object": {
    "id": "in_1GQihTAIFSjPGiCSBDeQazAK",
    "object": "invoice",
    "account_country": "US",
    "account_name": "SOL DEV",
    "amount_due": 2500,
    "amount_paid": 2500,
    "amount_remaining": 0,
    "application_fee_amount": null,
    "attempt_count": 1,
    "attempted": true,
    "auto_advance": false,
    "billing_reason": "subscription_create",
    "charge": "ch_1GQihTAIFSjPGiCSy2sXQxgf",
    "collection_method": "charge_automatically",
    "created": 1585179115,
    "currency": "usd",
    "custom_fields": null,
    "customer": "cus_GyfzwZFBet54oO",
    "customer_address": {
      "city": "Washougal",
      "country": "US",
      "line1": "1234 5th St",
      "line2": "",
      "postal_code": "98671",
      "state": "WA"
    },
    "customer_email": "jane@example.com",
    "customer_name": "Jane Doe",
    "customer_phone": "+15551234567",
    "customer_shipping": {
      "address": {
        "city": "Washougal",
        "country": "US",
        "line1": "1234 5th St",
        "line2": "",
        "postal_code": "98671",
        "state": "WA"
      },
      "name": "Jane Doe",
      "phone": "+15551234567"
    },
    "customer_tax_exempt": "none",
    "customer_tax_ids": [],
    "default_payment_method": null,
    "default_source": null,
    "default_tax_rates": [],
    "description": null,
    "discount": null,
    "due_date": null,
    "ending_balance": 0,
    "footer": null,
    "hosted_invoice_url": "https://pay.stripe.com/invoice/acct_1GJlkuAIFSjPGiCS/invst_Gyg3yBcRDp3VfT95bMZIzpxOqysDet0",
    "invoice_pdf": "https://pay.stripe.com/invoice/acct_1GJlkuAIFSjPGiCS/invst_Gyg3yBcRDp3VfT95bMZIzpxOqysDet0/pdf",
    "lines": {
      "object": "list",
      "data": [
        {
          "id": "il_1GQihTAIFSjPGiCSADw1d2zt",
          "object": "line_item",
          "amount": 2500,
          "currency": "usd",
          "description": "1 site × Widget (at $25.00 per 5 site / month)",
          "discountable": true,
          "livemode": false,
          "metadata": {},
          "period": {
            "end": 1587857515,
            "start": 1585179115
          },
          "plan": {
            "id": "plan_Gyfoobt3nSL5Sa",
            "object": "plan",
            "active": true,
            "aggregate_usage": null,
            "amount": 2500,
            "amount_decimal": "2500",
            "billing_scheme": "per_unit",
            "created": 1585178185,
            "currency": "usd",
            "interval": "month",
            "interval_count": 1,
            "livemode": false,
            "metadata": {},
            "nickname": "5 Sites",
            "product": "prod_Gyfg0Kn11IPz89",
            "tiers": null,
            "tiers_mode": null,
            "transform_usage": {
              "divide_by": 5,
              "round": "up"
            },
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "proration": false,
          "quantity": 1,
          "subscription": "sub_Gyg3gCwDNwR5Y5",
          "subscription_item": "si_Gyg3seY9CRUhu7",
          "tax_amounts": [],
          "tax_rates": [],
          "type": "subscription"
        }
      ],
      "has_more": false,
      "total_count": 1,
      "url": "/v1/invoices/in_1GQihTAIFSjPGiCSBDeQazAK/lines"
    },
    "livemode": false,
    "metadata": {},
    "next_payment_attempt": null,
    "number": "0E4A63E7-0001",
    "paid": true,
    "payment_intent": "pi_1GQihTAIFSjPGiCS1ImA21Ox",
    "period_end": 1585179115,
    "period_start": 1585179115,
    "post_payment_credit_notes_amount": 0,
    "pre_payment_credit_notes_amount": 0,
    "receipt_number": null,
    "starting_balance": 0,
    "statement_descriptor": null,
    "status": "paid",
    "status_transitions": {
      "finalized_at": 1585179115,
      "marked_uncollectible_at": null,
      "paid_at": 1585179116,
      "voided_at": null
    },
    "subscription": "sub_Gyg3gCwDNwR5Y5",
    "subtotal": 2500,
    "tax": null,
    "tax_percent": null,
    "total": 2500,
    "total_tax_amounts": [],
    "webhooks_delivered_at": null
  }
}
```

- Intuit `Invoice.DocNumber` is used to store Stripe `Invoice` Id for lookup.
- Intuit `Invoice` is associated with Intuit `Customer`.
- Each line item is referenced to parent Intuit `Item` above (based on the imported Stripe `Product + Plan`).
- Intuit Entity (`Invoice`):

```js
{
  DocNumber: 'in_1GQikqAIFSjPGiCS5',
  CustomerRef: {
    value: intuitCustomer.Id
  },
  Line: [
    {
      DetailType: 'SalesItemLineDetail',
      Description: '1 site × Widget (at $25.00 per 5 site / month)',
      Amount: '25.00',
      SalesItemLineDetail: {
        ItemRef: {
          value: intuitItem.Id
        },
        Qty: 1,
        UnitPrice: '25.00'
      }
    }
  ]
}
```

### Stripe Payment Intent :: Intuit Payment

- Stripe Event: `invoice.payment_succeeded`
- Stripe Object (`Invoice` w/ `PaymentIntent`) and Payload:

```json
{
  "object": {
    "id": "in_1GQikqAIFSjPGiCS5Fmqzuav",
    "object": "invoice",
    "account_country": "US",
    "account_name": "SOL DEV",
    "amount_due": 2500,
    "amount_paid": 2500,
    "amount_remaining": 0,
    "application_fee_amount": null,
    "attempt_count": 1,
    "attempted": true,
    "auto_advance": false,
    "billing_reason": "subscription_create",
    "charge": "ch_1GQikqAIFSjPGiCS63xgcM8T",
    "collection_method": "charge_automatically",
    "created": 1585179324,
    "currency": "usd",
    "custom_fields": null,
    "customer": "cus_GyfzwZFBet54oO",
    "customer_address": {
      "city": "Washougal",
      "country": "US",
      "line1": "1234 5th St",
      "line2": "",
      "postal_code": "98671",
      "state": "WA"
    },
    "customer_email": "jane@example.com",
    "customer_name": "Jane Doe",
    "customer_phone": "+15551234567",
    "customer_shipping": {
      "address": {
        "city": "Washougal",
        "country": "US",
        "line1": "1234 5th St",
        "line2": "",
        "postal_code": "98671",
        "state": "WA"
      },
      "name": "Jane Doe",
      "phone": "+15551234567"
    },
    "customer_tax_exempt": "none",
    "customer_tax_ids": [],
    "default_payment_method": null,
    "default_source": null,
    "default_tax_rates": [],
    "description": null,
    "discount": null,
    "due_date": null,
    "ending_balance": 0,
    "footer": null,
    "hosted_invoice_url": "https://pay.stripe.com/invoice/acct_1GJlkuAIFSjPGiCS/invst_Gyg7YmnR41Z2pgXPhX5uK9KVcOFsPzA",
    "invoice_pdf": "https://pay.stripe.com/invoice/acct_1GJlkuAIFSjPGiCS/invst_Gyg7YmnR41Z2pgXPhX5uK9KVcOFsPzA/pdf",
    "lines": {
      "object": "list",
      "data": [
        {
          "id": "il_1GQikqAIFSjPGiCSuC6EMtcu",
          "object": "line_item",
          "amount": 2500,
          "currency": "usd",
          "description": "1 site × Widget (at $25.00 per 5 site / month)",
          "discountable": true,
          "livemode": false,
          "metadata": {},
          "period": {
            "end": 1587857724,
            "start": 1585179324
          },
          "plan": {
            "id": "plan_Gyfoobt3nSL5Sa",
            "object": "plan",
            "active": true,
            "aggregate_usage": null,
            "amount": 2500,
            "amount_decimal": "2500",
            "billing_scheme": "per_unit",
            "created": 1585178185,
            "currency": "usd",
            "interval": "month",
            "interval_count": 1,
            "livemode": false,
            "metadata": {},
            "nickname": "5 Sites",
            "product": "prod_Gyfg0Kn11IPz89",
            "tiers": null,
            "tiers_mode": null,
            "transform_usage": {
              "divide_by": 5,
              "round": "up"
            },
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "proration": false,
          "quantity": 1,
          "subscription": "sub_Gyg7dm5xRmOnrA",
          "subscription_item": "si_Gyg7XzlZrkWlo0",
          "tax_amounts": [],
          "tax_rates": [],
          "type": "subscription"
        }
      ],
      "has_more": false,
      "total_count": 1,
      "url": "/v1/invoices/in_1GQikqAIFSjPGiCS5Fmqzuav/lines"
    },
    "livemode": false,
    "metadata": {},
    "next_payment_attempt": null,
    "number": "0E4A63E7-0002",
    "paid": true,
    "payment_intent": "pi_1GQikqAIFSjPGiCSiNwCRnUj",
    "period_end": 1585179324,
    "period_start": 1585179324,
    "post_payment_credit_notes_amount": 0,
    "pre_payment_credit_notes_amount": 0,
    "receipt_number": null,
    "starting_balance": 0,
    "statement_descriptor": null,
    "status": "paid",
    "status_transitions": {
      "finalized_at": 1585179324,
      "marked_uncollectible_at": null,
      "paid_at": 1585179325,
      "voided_at": null
    },
    "subscription": "sub_Gyg7dm5xRmOnrA",
    "subtotal": 2500,
    "tax": null,
    "tax_percent": null,
    "total": 2500,
    "total_tax_amounts": [],
    "webhooks_delivered_at": null
  }
}
```

- Intuit `Payment.PaymentRefNum` stores the Stripe `PaymentIntent` Id for lookup.
- Intuit `Payment` is associated with Intuit `Customer`.
- Intuit `Payment` is associated with the Intuit `Invoice` for which the payment is applied. If the full `Invoice` is paid via `Payment` objects such as this, the `Invoice` is marked as `Paid` status.
- Intuit Entity (`Payment`):

```js
{
  PaymentRefNum: 'pi_1GQikqAIFSjPGiCSi',
  CustomerRef: {
    value: intuitCustomer.Id
  },
  TotalAmt: '25.00',
  Line: [
    {
      Amount: '25.00',
      LinkedTxn: [
        {
          TxnId: intuitInvoice.Id,
          TxnType: 'Invoice'
        }
      ]
    }
  ],
  PrivateNote: JSON.stringify({
    invoice_id: this.get('id'),
    charge: this.get('charge'),
    created: this.get('created'),
    customer_email: this.get('customer_email'),
    customer_name: this.get('customer_name')
  })
}
```
