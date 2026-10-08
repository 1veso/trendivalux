import type Stripe from 'stripe';
import type { Env } from './env';

export function requiresLiveStripe(env: Env) {
  return ['trendivalux.com', 'www.trendivalux.com'].includes(new URL(env.SITE_URL).hostname);
}
export function assertStripeKey(env: Env) {
  if (requiresLiveStripe(env) && !/^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY)) throw new Error('Production requires live Stripe credentials');
}
export function assertLiveObject(env: Env, object: { livemode?: boolean }) {
  if (requiresLiveStripe(env) && object.livemode !== true) throw new Error('Production refuses test Stripe objects');
}
export async function inclusiveVat(stripe: Stripe) {
  const rate = await stripe.taxRates.create({ display_name: 'Umsatzsteuer', percentage: 19, inclusive: true, country: 'DE', description: '19% German VAT' }, { idempotencyKey: 'trendiva-inclusive-vat-19-v1' });
  return rate.id;
}
export function nextMonth(timestamp: number) {
  const date = new Date(timestamp * 1000), day = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return Math.floor(date.getTime() / 1000);
}
export async function ensureInstallments(stripe: Stripe, admin: any, order: any, session: Stripe.Checkout.Session) {
  if (order.payment_plan !== 'monthly4' || order.stripe_schedule_id) return;
  const amounts = order.payment_schedule as number[];
  if (!Array.isArray(amounts) || amounts.length !== 4 || amounts.reduce((a, b) => a + b, 0) !== order.total_price_cents) throw new Error('Invalid installment agreement');
  const customer = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const intentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!customer || !intentId) throw new Error('Installment payment method missing');
  const intent = await stripe.paymentIntents.retrieve(intentId);
  const method = typeof intent.payment_method === 'string' ? intent.payment_method : intent.payment_method?.id;
  if (!method) throw new Error('Installment payment method not saved');
  const existing = await stripe.subscriptionSchedules.list({ customer, limit: 100 });
  const recovered = existing.data.find(schedule => schedule.metadata.order_id === order.id && !['canceled', 'released'].includes(schedule.status));
  if (recovered) {
    const { error } = await admin.from('orders').update({ stripe_schedule_id: recovered.id }).eq('id', order.id);
    if (error) throw new Error('Could not recover installment schedule');
    return;
  }
  const product = await stripe.products.create({ name: `Trendiva Lux ${order.tier} ${order.service_level?.toUpperCase() || ''} — agreed installments`, metadata: { order_id: order.id } }, { idempotencyKey: `installment-product-${order.id}` });
  const tax = await inclusiveVat(stripe);
  const schedule = await stripe.subscriptionSchedules.create({
    customer, start_date: nextMonth(session.created), end_behavior: 'cancel',
    default_settings: { default_payment_method: method, collection_method: 'charge_automatically' },
    metadata: { order_id: order.id },
    phases: [
      { duration: { interval: 'month', interval_count: 2 }, items: [{ price_data: { product: product.id, currency: 'eur', unit_amount: amounts[1], recurring: { interval: 'month' }, tax_behavior: 'inclusive' }, quantity: 1 }], default_tax_rates: [tax], metadata: { order_id: order.id }, proration_behavior: 'none' },
      { duration: { interval: 'month', interval_count: 1 }, items: [{ price_data: { product: product.id, currency: 'eur', unit_amount: amounts[3], recurring: { interval: 'month' }, tax_behavior: 'inclusive' }, quantity: 1 }], default_tax_rates: [tax], metadata: { order_id: order.id }, proration_behavior: 'none' },
    ],
  }, { idempotencyKey: `installment-schedule-${order.id}` });
  const { error } = await admin.from('orders').update({ stripe_schedule_id: schedule.id }).eq('id', order.id);
  if (error) throw new Error('Could not link installment schedule');
}
