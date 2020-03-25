import flat from 'flat';

// Stripe event types we can listen for.
export const StripeWebhookEventTypes = {
  customer: {
    created: 'customer.created',
    deleted: 'customer.deleted',
    updated: 'customer.updated'
  },
  invoice: {
    created: 'invoice.created',
    payment_succeeded: 'invoice.payment_succeeded'
  },
  plan: {
    created: 'plan.created',
    deleted: 'plan.deleted',
    updated: 'plan.updated'
  },
  product: {
    created: 'product.created',
    // Intuit API doesn't support deletion for Item
    // deleted: 'product.deleted',
    updated: 'product.updated'
  }
};

export const IsStripeEvent = (event: string): boolean => {
  return Object.keys(
    flat.flatten<object, string[]>(StripeWebhookEventTypes)
  ).includes(event);
};
