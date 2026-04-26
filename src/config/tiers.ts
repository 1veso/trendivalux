export type TierId = 'landing' | 'business' | 'store' | 'webapp' | 'custom';

export interface TierConfig {
  id: TierId;
  name: string;
  totalPriceEur: number;
  depositEur: number;
  stripePriceId: string | null;
  timelineDays: string;
  ctaText: string;
}

export const TIERS: Record<TierId, TierConfig> = {
  landing: {
    id: 'landing',
    name: 'Landing',
    totalPriceEur: 1990,
    depositEur: 995,
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_LANDING || '',
    timelineDays: '7 days',
    ctaText: 'Start Project — €995 Deposit',
  },
  business: {
    id: 'business',
    name: 'Business',
    totalPriceEur: 3990,
    depositEur: 1995,
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_BUSINESS || '',
    timelineDays: '14 days',
    ctaText: 'Start Project — €1,995 Deposit',
  },
  store: {
    id: 'store',
    name: 'Store',
    totalPriceEur: 6990,
    depositEur: 3495,
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_STORE || '',
    timelineDays: '21 days',
    ctaText: 'Start Project — €3,495 Deposit',
  },
  webapp: {
    id: 'webapp',
    name: 'Web App',
    totalPriceEur: 12990,
    depositEur: 6495,
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_WEBAPP || '',
    timelineDays: '4 to 6 weeks',
    ctaText: 'Start Project — €6,495 Deposit',
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    totalPriceEur: 20000,
    depositEur: 10000,
    stripePriceId: null,
    timelineDays: 'Custom timeline',
    ctaText: 'Book Strategy Call →',
  },
};
