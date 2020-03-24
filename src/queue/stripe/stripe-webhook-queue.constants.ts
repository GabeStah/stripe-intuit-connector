import flat from 'flat';

// Stripe event types we can listen for.
export const StripeWebhookEventTypes = {
  customer: {
    created: 'customer.created',
    deleted: 'customer.deleted',
    updated: 'customer.updated'
  },
  payment_intent: {
    created: 'payment_intent.created',
    succeeded: 'payment_intent.succeeded'
  },
  product: {
    created: 'product.created',
    deleted: 'product.deleted',
    updated: 'product.updated'
  }
};

export const IsStripeEvent = (event: string): boolean => {
  return Object.keys(
    flat.flatten<object, string[]>(StripeWebhookEventTypes)
  ).includes(event);
};
