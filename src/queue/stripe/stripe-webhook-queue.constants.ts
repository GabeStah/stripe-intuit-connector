// Stripe event types we can listen for.
export enum StripeWebhookEventsEnum {
  'customer.created' = 'customer.created',
  'payment_intent.created' = 'payment_intent.created',
  'payment_intent.succeeded' = 'payment_intent.succeeded'
}

export const IsStripeEvent = (
  event: string
): event is StripeWebhookEventsEnum =>
  event && event in StripeWebhookEventsEnum;
