import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { TIER_BASE_EUR, TIER_NAMES } from '../../src/config/pricing';
import { priceBreakdown, type ServiceLevel, type PaymentPlan } from '../../src/config/payment-plans';
import { OFFER_DETAILS } from '../_shared/contract-offer';
import { issueAgreement } from '../_shared/issue-agreement';
import { sendQuoteRequest } from '../_shared/quote-request-email';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import { validateEmail, validateEnum, validateString, validateUuid } from '../_shared/validation';
import type { Env } from '../_shared/env';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const limit = await checkRateLimit({ identifier: getClientIdentifier(request), endpoint: 'create-docuseal-contract', maxRequests: 5, windowSeconds: 60 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter ?? 60);
  try {
    const body = await request.json() as Record<string, unknown>;
    const sessionId = validateUuid(body.sessionId);
    const email = validateEmail(body.customerEmail);
    const name = validateString(body.customerName, 200);
    const customerType = validateEnum(body.customerType, ['b2b', 'b2c'] as const);
    const tier = validateEnum(body.tier, ['landing', 'business', 'store', 'webapp', 'custom'] as const);
    const level = validateEnum(body.serviceLevel, ['lux', 'deluxe'] as const);
    const plan = validateEnum(body.paymentPlan, ['full', 'split', 'monthly4'] as const);
    const goals = typeof body.projectDetails === 'string' ? body.projectDetails.trim() : '';
    if (!sessionId || !email || !name || !customerType || !tier || !level || !plan || goals.length > 2000) return new Response('Invalid order details', { status: 400 });
    const admin = createAdminClient(env);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([sessionId, tier, level, plan, email, name, customerType, goals])));
    const requestKey = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
    const { data: existing, error: lookupError } = await admin.from('orders').select('*').eq('order_request_key', requestKey).maybeSingle();
    if (lookupError) throw new Error('Could not check existing request');
    let order = existing;
    if (!order) {
      const reviewedQuote = level === 'deluxe' || tier === 'custom';
      const price = reviewedQuote ? null : priceBreakdown(TIER_BASE_EUR[tier as keyof typeof TIER_BASE_EUR] * 100, plan);
      const details = tier === 'custom' ? null : OFFER_DETAILS[tier];
      const { data, error } = await admin.from('orders').insert({
        tier, service_level: level as ServiceLevel, payment_plan: plan as PaymentPlan,
        total_price_cents: price?.grossCents ?? 0, deposit_amount_cents: price?.firstPaymentCents ?? 0,
        net_amount_cents: price?.netCents ?? null, vat_amount_cents: price?.vatCents ?? null, payment_schedule: price?.payments ?? null,
        customer_email: email, customer_name: name, checkout_token: crypto.randomUUID(), quote_review_token: crypto.randomUUID(),
        offer_issued_at: price ? new Date().toISOString() : null,
        order_request_key: requestKey, status: reviewedQuote ? 'quote_requested' : 'created',
        questionnaire_data: { tier, service_level: level, payment_plan: plan, payment_flow: 'signed_offer_then_stripe',
          client: { name, email }, customer_type: customerType, project_details: goals,
          offer_scope: details ? [...details.deliverables, 'Zwei gebündelte Korrekturrunden', '30 Tage Startbegleitung im vereinbarten Umfang'] : [],
          offer_timeline: details?.timeline ?? 'Nach gesonderter Vereinbarung',
        },
      }).select('*').single();
      if (error || !data) return new Response('Order request is being prepared. Please retry in a moment.', { status: 409 });
      order = data;
    }
    if (['cancelled', 'refunded'].includes(order.status)) return new Response('This order is no longer active', { status: 409 });
    const { error: questionnaireError } = await admin.from('questionnaires').upsert({ session_id: sessionId, tier, current_step: 2, answers: order.questionnaire_data, completed: true, converted_to_order_id: order.id });
    if (questionnaireError) throw new Error('Could not save order details');
    if (order.status === 'quote_requested') {
      await sendQuoteRequest(env, order);
      return Response.json({ quoteRequested: true, customerEmail: email });
    }
    if (order.contract_request_started_at && Date.now() - Date.parse(order.contract_request_started_at) < 120000) return new Response('Agreement is being prepared. Please retry shortly.', { status: 409 });
    const result = await issueAgreement(env, order);
    return Response.json({ ...result, customerEmail: email });
  } catch (error) {
    console.error('[contract]', error);
    return new Response('Could not prepare your offer. Your details are saved; please retry or contact hello@trendivalux.com.', { status: 503 });
  }
};
