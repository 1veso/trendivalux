import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { PAID_ORDER_STATUSES } from '../_shared/order-flow';
import type { Env } from '../_shared/env';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const start = new Date();
    start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
    const { count, error } = await createAdminClient(env).from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', [...PAID_ORDER_STATUSES]).gte('created_at', start.toISOString());
    if (error || count === null) throw new Error('Availability unavailable');
    return Response.json({ remaining: Math.max(0, 4 - count) }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch { return Response.json({ remaining: null }, { status: 503 }); }
};
