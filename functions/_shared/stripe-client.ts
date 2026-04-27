import Stripe from 'stripe';

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    // Pinned to the SDK's bundled API version. When upgrading stripe-node, change
    // this to match what the new types expect.
    apiVersion: '2026-04-22.dahlia',
    httpClient: Stripe.createFetchHttpClient(),
  });
}
