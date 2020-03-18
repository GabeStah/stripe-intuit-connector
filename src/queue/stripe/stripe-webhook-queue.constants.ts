// Stripe event types we can listen for.
import flat from 'flat';

export const StripeWebhookEventTypes = {
  customer: {
    created: 'customer.created',
    updated: 'customer.updated',
    deleted: 'customer.deleted'
  },
  payment_intent: {
    created: 'payment_intent.created',
    succeeded: 'payment_intent.succeeded'
  }
};

export const IsStripeEvent = (event: string): boolean => {
  return Object.keys(
    flat.flatten<object, string[]>(StripeWebhookEventTypes)
  ).includes(event);
};
