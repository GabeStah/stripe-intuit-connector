## Description

Headless API for connecting Stripe :: QuickBooks Online.

Based on [Nest](https://github.com/nestjs/nest) TypeScript framework.

## Installation

```bash
$ npm install
```

## Development

Make sure Connector app is [running](#running).

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Run `stripe login` to authenticate.
3. Run `stripe listen --forward-to http://localhost:4321/api/stripe/webhook` to point Stripe webhooks to Connector API endpoint.
4. Open a new terminal.
5. Run `stripe trigger <event>`, e.g. `stripe trigger payment_intent.created`.
6. Stripe will generate a new trigger an event and webhook of specified type, which Connector will pickup at `@Post` method associated with endpoint.

### Debugging

Run `./node_modules/@nestjs/cli/bin/nest.js start --watch` targeting `src/main.ts` file in whatever IDE/dev environment you use.

## Running

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Testing

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
