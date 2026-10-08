import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { validateUuid } from '../_shared/validation';
import type { Env } from '../_shared/env';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url), id = validateUuid(url.searchParams.get('order_id')), token = validateUuid(url.searchParams.get('token'));
  const path = url.searchParams.get('path');
  if (!id || !token || !path || !path.startsWith(`orders/${id}/`) || path.includes('..')) return new Response('Invalid file link', { status: 400 });
  const admin = createAdminClient(env);
  const { data: order } = await admin.from('orders').select('checkout_token, quote_review_token').eq('id', id).single();
  if (!order || (token !== order.checkout_token && token !== order.quote_review_token)) return new Response('File unavailable', { status: 404 });
  const { data, error } = await admin.storage.from('client-assets').createSignedUrl(path, 300);
  if (error || !data?.signedUrl) return new Response('File unavailable', { status: 404 });
  return new Response(null, { status: 302, headers: { Location: data.signedUrl, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' } });
};
