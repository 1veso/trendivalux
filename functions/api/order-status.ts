import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { PAID_ORDER_STATUSES, scopingUrl } from '../_shared/order-flow';
import { validateUuid } from '../_shared/validation';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import type { Env } from '../_shared/env';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const limit = await checkRateLimit({ identifier: getClientIdentifier(request), endpoint: 'order-status', maxRequests: 35, windowSeconds: 60 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter ?? 60);
  const url = new URL(request.url);
  const id = validateUuid(url.searchParams.get('order_id'));
  const token = validateUuid(url.searchParams.get('token'));
  if (!id || !token) return new Response('Invalid confirmation link', { status: 400 });
  try {
    const { data: order, error } = await createAdminClient(env).from('orders')
      .select('id, status, checkout_token, paid_amount_cents, total_price_cents').eq('id', id).eq('checkout_token', token).single();
    if (error || !order) return new Response('Order not found', { status: 404 });
    const confirmed = PAID_ORDER_STATUSES.has(order.status) && (url.searchParams.get('stage') !== 'balance' || order.paid_amount_cents === order.total_price_cents);
    return Response.json({ confirmed, stopped: ['cancelled', 'refunded'].includes(order.status), scopingUrl: confirmed ? scopingUrl(env, order) : null }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[order-status]', error);
    return new Response('Could not confirm order', { status: 500 });
  }
};
