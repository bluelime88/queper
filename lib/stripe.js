import Stripe from 'stripe';

// Server-only Stripe client. Falls back to a dummy key so builds don't fail
// before Stripe env vars are set; real API calls need STRIPE_SECRET_KEY.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
};

// Map a Stripe price id back to our plan name.
export function planForPrice(priceId) {
  if (priceId === PRICE_IDS.annual) return 'annual';
  if (priceId === PRICE_IDS.monthly) return 'monthly';
  return 'monthly';
}
