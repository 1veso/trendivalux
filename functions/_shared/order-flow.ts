import type { Env } from './env';

export const PAID_ORDER_STATUSES = new Set(['paid', 'contract_signed_deposit_paid', 'active', 'completed']);

export function checkoutReturnUrl(env: Env, order: { id: string; checkout_token: string }): string {
  return `${env.SITE_URL.replace(/\/$/, '')}/checkout/${order.id}?token=${order.checkout_token}`;
}

export function scopingUrl(env: Env, order: { id: string; checkout_token?: string | null }): string {
  const base = `${env.SITE_URL.replace(/\/$/, '')}/scoping/${order.id}`;
  return order.checkout_token ? `${base}?token=${order.checkout_token}` : base;
}
