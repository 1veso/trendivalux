import type { PagesFunction } from '@cloudflare/workers-types';
import { createStripeClient } from '../_shared/stripe-client';
import { createAdminClient } from '../_shared/supabase-admin';
import { checkoutReturnUrl, PAID_ORDER_STATUSES } from '../_shared/order-flow';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import { validateUuid } from '../_shared/validation';
import type { Env } from '../_shared/env';
import { assertStripeKey, assertLiveObject, inclusiveVat } from '../_shared/stripe-payments';
import { euro } from '../../src/config/payment-plans';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const limit = await checkRateLimit({ identifier: getClientIdentifier(request), endpoint: 'create-checkout-session', maxRequests: 35, windowSeconds: 60 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter ?? 60);
  try {
    const body = await request.json() as Record<string, unknown>;
    const orderId = validateUuid(body.orderId);
    const token = validateUuid(body.token);
    if (!orderId || !token) return new Response('Invalid checkout link', { status: 400 });
    const supabase = createAdminClient(env);
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).eq('checkout_token', token).single();
    if (error || !order) return new Response('Order not found', { status: 404 });
    const balance = body.stage === 'balance';
    if (balance && (order.payment_plan !== 'split' || !PAID_ORDER_STATUSES.has(order.status))) return new Response('Balance not payable', { status: 409 });
    const amount = balance ? order.total_price_cents - order.paid_amount_cents : order.deposit_amount_cents;
    if ((PAID_ORDER_STATUSES.has(order.status) && !balance) || (balance && amount === 0)) {
      return Response.json({ successUrl: `${env.SITE_URL.replace(/\/$/, '')}/success?order_id=${order.id}&token=${token}${balance ? '&stage=balance' : ''}` });
    }
    if (['cancelled', 'refunded'].includes(order.status)) return new Response('This order is no longer payable', { status: 409 });

    // The redirect can arrive before the signing webhook. Verify against the
    // authenticated DocuSeal API instead of trusting the browser or blocking a
    // signed customer indefinitely if webhook delivery is delayed.
    if (order.contract_status !== 'signed') {
      if (!order.contract_docuseal_id) return new Response('Agreement not ready', { status: 409 });
      const response = await fetch(`${env.DOCUSEAL_API_URL.replace(/\/$/, '')}/submissions/${encodeURIComponent(order.contract_docuseal_id)}`, {
        headers: { 'X-Auth-Token': env.DOCUSEAL_API_KEY, Accept: 'application/json' },
      });
      if (!response.ok) return new Response('Could not verify signature', { status: 503 });
      const submission = await response.json() as { submitters?: Array<{ external_id?: string; status?: string; completed_at?: string }> };
      const signer = submission.submitters?.find(s => s.external_id === order.id);
      if (signer?.status !== 'completed') return Response.json({ pendingSignature: true }, { status: 409 });
      const { error: signedError } = await supabase.from('orders').update({
        status: 'contract_signed', contract_status: 'signed', contract_signed_at: signer.completed_at || new Date().toISOString(),
      }).eq('id', order.id).in('status', ['created', 'contract_sent', 'contract_signed']);
      if (signedError) throw new Error('Could not record signature');
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Invalid signed payment');
    assertStripeKey(env);
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    const previousSession = (balance ? order.stripe_balance_session_id : order.stripe_session_id) as string | null;
    if (previousSession) {
      const existing = await stripe.checkout.sessions.retrieve(previousSession);
      assertLiveObject(env, existing);
      if (existing.status === 'open' && existing.url) return Response.json({ checkoutUrl: existing.url });
      if (existing.status === 'complete' && order.status !== 'payment_failed') {
        return Response.json({ successUrl: `${env.SITE_URL.replace(/\/$/, '')}/success?order_id=${order.id}&token=${token}${balance ? '&stage=balance' : ''}` });
      }
    }
    const monthly = order.payment_plan === 'monthly4';
    const tax = await inclusiveVat(stripe);
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment', payment_method_types: monthly ? ['card'] : ['card', 'sepa_debit'], customer_creation: 'always',
      line_items: [{ quantity: 1, price_data: {
        currency: 'eur', unit_amount: amount, tax_behavior: 'inclusive',
        product_data: { name: `Trendiva Lux ${order.tier} ${order.service_level?.toUpperCase() || ''} — ${balance ? 'final balance' : monthly ? 'payment 1 of 4' : order.payment_plan === 'full' ? 'full payment' : '50% advance'}`, description: `Signed agreement ${order.id.slice(0, 8)}. Includes 19% VAT.` },
      }, tax_rates: [tax] }],
      customer_email: order.customer_email,
      client_reference_id: order.id,
      success_url: `${env.SITE_URL.replace(/\/$/, '')}/success?order_id=${order.id}&token=${token}${balance ? '&stage=balance' : ''}`,
      cancel_url: `${checkoutReturnUrl(env, order)}${balance ? '&stage=balance' : ''}&cancelled=true`,
      metadata: { order_id: order.id, tier: order.tier, stage: balance ? 'balance' : 'initial' },
      invoice_creation: { enabled: true, invoice_data: { metadata: { order_id: order.id, stage: balance ? 'balance' : 'initial' } } },
      payment_intent_data: { metadata: { order_id: order.id, tier: order.tier }, ...(monthly ? { setup_future_usage: 'off_session' as const } : {}) },
      ...(monthly ? { custom_text: { submit: { message: `Four payments total: ${order.payment_schedule.map((value: number) => euro(value)).join(', ')} including VAT. The next three payments are collected monthly using this card. The plan ends automatically.` } } } : {}),
      locale: 'de', submit_type: 'pay', billing_address_collection: 'required',
    }, { idempotencyKey: `signed-order-${order.id}-${balance ? 'balance' : 'initial'}-${previousSession || 'new'}` });
    assertLiveObject(env, checkout);
    if (!checkout.url) throw new Error('Stripe returned no URL');
    const { error: linkError } = await supabase.from('orders').update(balance ? { stripe_balance_session_id: checkout.id } : { stripe_session_id: checkout.id }).eq('id', order.id);
    if (linkError) throw new Error('Could not link payment');
    return Response.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error('[checkout]', error);
    return new Response('Could not open Stripe checkout. Please retry or contact hello@trendivalux.com.', { status: 500 });
  }
};
