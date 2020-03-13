// Stripe event types we can listen for.
type StripeWebhookEvents = 'customer.created' | 'payment_intent.succeeded';

export enum StripeWebhookEventsEnum {
  'customer.created' = 'customer.created',
  'payment_intent.succeeded' = 'payment_intent.succeeded'
}

export const StripeEvent = (event: StripeWebhookEvents): string => event;
export const IsStripeEvent = (
  event: string
): event is StripeWebhookEventsEnum =>
  event && event in StripeWebhookEventsEnum;
