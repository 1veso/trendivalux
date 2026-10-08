import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { validateUuid, validateString } from '../_shared/validation';
import { priceBreakdown } from '../../src/config/payment-plans';
import { issueAgreement } from '../_shared/issue-agreement';
import type { Env } from '../_shared/env';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = validateUuid(url.searchParams.get('order_id')); const token = validateUuid(url.searchParams.get('token'));
  if (!id || !token) return new Response('Invalid review link', { status: 400 });
  const { data: order, error } = await createAdminClient(env).from('orders').select('id, tier, service_level, payment_plan, customer_name, customer_email, questionnaire_data, status, net_amount_cents, total_price_cents, paid_amount_cents, agreement_email_sent_at').eq('id', id).eq('quote_review_token', token).single();
  if (error || !order) return new Response('Offer not found', { status: 404 });
  return Response.json(order, { headers: { 'Cache-Control': 'no-store' } });
};
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = validateUuid(body.orderId); const token = validateUuid(body.token);
    const netCents = body.netCents;
    const timeline = validateString(body.timeline, 120);
    const scope = Array.isArray(body.scope) ? body.scope.map(item => validateString(item, 180)) : [];
    if (!id || !token || !Number.isSafeInteger(netCents) || (netCents as number) < 10000 || (netCents as number) > 100000000 || !timeline || scope.length < 1 || scope.length > 10 || scope.some(item => !item)) return new Response('Invalid offer', { status: 400 });
    const admin = createAdminClient(env);
    const { data: order } = await admin.from('orders').select('*').eq('id', id).eq('quote_review_token', token).single();
    if (!order) return new Response('Offer not found', { status: 404 });
    if (order.status === 'contract_sent' && !order.agreement_email_sent_at) { await issueAgreement(env, order); return Response.json({ sent: true }); }
    if (!['quote_requested', 'quote_ready'].includes(order.status)) return new Response('This offer has already been issued', { status: 409 });
    if (order.contract_request_started_at && Date.now() - Date.parse(order.contract_request_started_at) < 120000) return new Response('Offer is being prepared', { status: 409 });
    if (order.status === 'quote_ready') { await issueAgreement(env, order); return Response.json({ sent: true }); }
    const price = priceBreakdown(netCents as number, order.payment_plan);
    const snapshot = { ...order.questionnaire_data, offer_scope: scope, offer_timeline: timeline };
    const { data: updated, error } = await admin.from('orders').update({
      net_amount_cents: price.netCents, vat_amount_cents: price.vatCents,
      total_price_cents: price.grossCents, deposit_amount_cents: price.firstPaymentCents,
      payment_schedule: price.payments, questionnaire_data: snapshot, status: 'quote_ready',
      offer_pdf_path: null, offer_issued_at: new Date().toISOString(),
    }).eq('id', id).in('status', ['quote_requested', 'quote_ready']).select('*').single();
    if (error || !updated) throw new Error('Could not freeze reviewed quote');
    await issueAgreement(env, updated);
    return Response.json({ sent: true });
  } catch (error) { console.error('[review-offer]', error); return new Response('Could not issue offer. Retry using the same link.', { status: 503 }); }
};
