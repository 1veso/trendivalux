export type PaymentPlan = 'full' | 'split' | 'monthly4';
export type ServiceLevel = 'lux' | 'deluxe';
export const VAT_PERCENT = 19;
export const PAYMENT_PLAN_LABELS: Record<PaymentPlan, string> = {
  full: 'In full', split: '50% now · 50% before handover', monthly4: '4 monthly payments',
};

export function priceBreakdown(netCents: number, plan: PaymentPlan) {
  if (!Number.isSafeInteger(netCents) || netCents <= 0) throw new Error('Invalid net price');
  const vatCents = Math.round(netCents * VAT_PERCENT / 100);
  const grossCents = netCents + vatCents;
  const first = plan === 'full' ? grossCents : plan === 'split' ? Math.round(grossCents / 2) : Math.round(grossCents / 4);
  const payments = plan === 'full' ? [grossCents] : plan === 'split' ? [first, grossCents - first] : [first, first, first, grossCents - 3 * first];
  return { netCents, vatCents, grossCents, firstPaymentCents: payments[0], payments };
}

export const euro = (cents: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
