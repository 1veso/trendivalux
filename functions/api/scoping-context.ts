import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import { validateUuid } from '../_shared/validation';
import type { Env } from '../_shared/env';

// GET /api/scoping-context?order_id=<uuid>
//
// Returns whether the order is ready for the post-payment scoping form.
// Uses service-role client only — no order data is leaked to the caller beyond
// { ready, tier, alreadySubmitted }.

const ALLOWED_STATUSES = new Set(['paid', 'contract_signed_deposit_paid', 'active', 'completed']);

interface OrderRow {
  id: string;
  tier: string;
  status: string;
  checkout_token: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const rateLimit = await checkRateLimit({
    identifier: getClientIdentifier(request),
    endpoint: 'scoping-context',
    maxRequests: 30,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter ?? 60);

  const url = new URL(request.url);
  const orderId = validateUuid(url.searchParams.get('order_id'));
  if (!orderId) {
    return Response.json({ ready: false }, { status: 400 });
  }

  try {
    const supabase = createAdminClient(env);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, tier, status, checkout_token')
      .eq('id', orderId)
      .single();

    if (orderError || !order || !ALLOWED_STATUSES.has((order as OrderRow).status)) {
      return Response.json({ ready: false }, { status: 404 });
    }

    const orderRow = order as OrderRow;
    if (orderRow.checkout_token && orderRow.checkout_token !== validateUuid(url.searchParams.get('token'))) {
      return Response.json({ ready: false }, { status: 404 });
    }

    // Check whether the linked questionnaire already has scoping answers.
    // Resolved via converted_to_order_id — works cross-device.
    const { data: questionnaire } = await supabase
      .from('questionnaires')
      .select('answers')
      .eq('converted_to_order_id', orderId)
      .single();

    const answers = (questionnaire?.answers as Record<string, unknown>) ?? {};
    const alreadySubmitted = typeof answers.scoping === 'object' && answers.scoping !== null;

    return Response.json({ ready: true, tier: orderRow.tier, alreadySubmitted }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[scoping-context] error:', err);
    return new Response('Internal error', { status: 500 });
  }
};
