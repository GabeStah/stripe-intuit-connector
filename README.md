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
3. Run `stripe listen --forward-to http://localhost:4321/v1/stripe/webhook` to point Stripe webhooks to Connector API endpoint.
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

## Intuit Authentication & Authorization

The Intuit API requires [OAuth 2.0 authorization](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization) for all connecting apps.  This **requires** a manual user consent interaction every 101 days, at most, due to the expiration time of the `rememberToken` Intuit API assigns.

The following is the current implementation of Connector to handle Intuit API auth:

1. For a fresh install with no existing database record a request to Intuit API will fail due to bad auth.
2. A user must manually authorize the Connector app (specifically, the `callback` endpoint it defines).
3. At present, this is accomplished by sending a `GET` request to `/v1/intuit/authorize`.  This creates an authorization URL with proper scope in the [intuit.controller@authorize()](src/intuit/intuit.controller.ts#L42) and redirects to the user to that authorization URL (on the Intuit site).
4. The user then elects to consent for the Connector app to be given authorization to the specified account.
5. The user is redirects to the `callback` endpoint which invokes the [intuit.controller@callback()](src/intuit/intuit.controller.ts#L63) method.  This method generates an async `accessToken` and `refreshToken`, which is added to (or updated) in the database for future requests.
6. An `accessToken` expires after only 60 minutes, while a `refreshToken` (which can be used to programmatically generate a new `acessToken`) lasts 101 days.
7. Thus, all future requests while a valid `refreshToken` exists will use that to generate `accessTokens` without the need for user consent.
8. Eventually, the app will have no valid `refreshToken` and must be manually consented by the user.

### TODO

- [ ] Come up with a private method for an Admin to manually authorize that isn't a public API endpoint (i.e. '/v1/intuit/authorize').
- [ ] Add backend monitor that will immediately alert Admin(s) when Intuit auth tokens have expired.
