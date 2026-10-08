import type { PagesFunction } from '@cloudflare/workers-types';
import type Stripe from 'stripe';
import { createStripeClient } from '../_shared/stripe-client';
import { createAdminClient } from '../_shared/supabase-admin';
import {
  sendAsyncPaymentFailed,
  sendDepositConfirmation,
  sendFounderAlert,
  sendFounderKickoff,
} from '../_shared/email';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import { PAID_ORDER_STATUSES, scopingUrl } from '../_shared/order-flow';
import type { Env } from '../_shared/env';
import { assertStripeKey, assertLiveObject, ensureInstallments } from '../_shared/stripe-payments';

const TIER_LABELS: Record<string, string> = {
  landing: 'Landing',
  business: 'Business',
  store: 'Store',
  webapp: 'Web App',
  custom: 'Custom',
};

interface OrderRow {
  id: string;
  tier: string;
  total_price_cents: number;
  deposit_amount_cents: number;
  customer_email: string;
  customer_name: string | null;
  customer_address: Record<string, unknown> | null;
  status: string;
  questionnaire_data: Record<string, unknown> | null;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  checkout_token: string | null;
  contract_status: string;
  deposit_confirmation_sent_at: string | null;
  founder_kickoff_sent_at: string | null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rateLimit = await checkRateLimit({
    identifier: getClientIdentifier(request),
    endpoint: 'stripe-webhook',
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter ?? 60);
  }

  try { assertStripeKey(env); } catch { return new Response('Production payment configuration unavailable', { status: 503 }); }
  const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
  const supabase = createAdminClient(env);

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // Log internally but do not echo validation details to the caller —
    // returning the underlying message would help an attacker probe the secret.
    const message = err instanceof Error ? err.message : 'unknown';
    console.warn('[stripe-webhook] signature verification failed', { message, timestamp: Date.now() });
    return new Response('Invalid signature', { status: 400 });
  }

  try { assertLiveObject(env, event); } catch { return new Response('Test events refused in production', { status: 400 }); }
  console.log('[stripe-webhook] signature verified', { eventType: event.type, eventId: event.id, timestamp: Date.now() });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutPaid(session, env, supabase);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleAsyncPaymentFailed(session, env, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        await handleInstallmentInvoice(event.data.object as Stripe.Invoice, env, supabase);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const orderId = invoice.parent?.subscription_details?.metadata?.order_id;
        if (orderId) await sendFounderAlert(env.RESEND_API_KEY, env.FOUNDER_EMAIL, 'Installment needs attention', `<p>Order ${orderId}. Please review the failed installment in Stripe and its automatic retry schedule.</p>`);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge, env, supabase);
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(dispute, env, supabase);
        break;
      }

      default:
        // Acknowledge events we don't subscribe to (Stripe still requires a 200).
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    // Return 500 so Stripe retries. Idempotency guards ensure safe retries.
    return new Response('Payment processing temporarily unavailable', { status: 500 });
  }

  return Response.json({ received: true });
};

async function handleCheckoutPaid(
  session: Stripe.Checkout.Session,
  env: Env,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.warn('Stripe session missing order_id in metadata; skipping');
    return;
  }

  // For SEPA and other delayed methods, checkout.session.completed fires before
  // funds clear. Only proceed when payment_status === 'paid'. The async_payment
  // events will trigger the next state transition.
  if (session.payment_status !== 'paid') {
    console.log(`Session ${session.id} completed but payment_status=${session.payment_status}; awaiting async event`);
    return;
  }

  const { data: order, error: fetchError } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (fetchError || !order) throw new Error('Order not found');
  const orderRow = order as OrderRow & Record<string, any>;
  if (['cancelled', 'refunded'].includes(orderRow.status)) return;
  const balance = session.metadata?.stage === 'balance';
  const expected = balance ? orderRow.payment_schedule?.[1] : orderRow.deposit_amount_cents;
  const linkedSession = balance ? orderRow.stripe_balance_session_id : orderRow.stripe_session_id;
  if (linkedSession !== session.id || session.currency !== 'eur' || session.amount_total !== expected) throw new Error('Payment does not match signed order');
  if (orderRow.checkout_token && orderRow.contract_status !== 'signed') throw new Error('Agreement not signed');
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  const { error: linkError } = await supabase.from('orders').update({
    customer_name: session.customer_details?.name ?? orderRow.customer_name,
    customer_address: session.customer_details?.address ?? orderRow.customer_address,
    ...(balance ? {} : { stripe_payment_intent_id: paymentIntentId, stripe_customer_id: customerId }),
  }).eq('id', orderId);
  if (linkError) throw new Error('Could not link payment details');
  if (!balance) await ensureInstallments(createStripeClient(env.STRIPE_SECRET_KEY), supabase, orderRow, session);
  const reference = typeof session.invoice === 'string' ? session.invoice : session.invoice?.id;
  const { error: paymentError } = await supabase.rpc('record_order_payment', { p_order_id: orderId, p_reference: reference ? `invoice:${reference}` : `checkout:${session.id}`, p_amount: session.amount_total });
  if (paymentError) throw new Error('Could not record confirmed payment');
  if (balance) return;

  const tierName = TIER_LABELS[orderRow.tier] || orderRow.tier;
  const totalPriceFormatted = formatEur(orderRow.total_price_cents);
  const depositFormatted = formatEur(orderRow.deposit_amount_cents);
  const customerName = session.customer_details?.name ?? orderRow.customer_name ?? '';

  if (!orderRow.deposit_confirmation_sent_at) {
    await sendDepositConfirmation(env.RESEND_API_KEY, {
      to: orderRow.customer_email, customerName, tier: tierName,
      depositAmount: depositFormatted,
      finalPaymentAmount: formatEur(orderRow.total_price_cents - orderRow.deposit_amount_cents),
      paymentPlan: orderRow.payment_plan || 'split',
      remainingPayments: (orderRow.payment_schedule || []).slice(1).map(formatEur),
      scopingUrl: scopingUrl(env, orderRow), orderId: orderRow.id,
    });
    const { error } = await supabase.from('orders').update({ deposit_confirmation_sent_at: new Date().toISOString() }).eq('id', orderId);
    if (error) throw new Error('Could not save customer email receipt');
  }
  if (!orderRow.founder_kickoff_sent_at) {
    await sendFounderKickoff(env.RESEND_API_KEY, {
      to: env.FOUNDER_EMAIL,
      orderId: orderRow.id,
      tier: tierName,
      customerEmail: orderRow.customer_email,
      customerName,
      totalPrice: totalPriceFormatted,
      depositPrice: depositFormatted,
      questionnaireAnswers: orderRow.questionnaire_data ?? {},
      reviewUrl: orderRow.quote_review_token ? `${env.SITE_URL.replace(/\/$/, '')}/offer-review/${orderId}?token=${orderRow.quote_review_token}` : undefined,
    });
    const { error } = await supabase.from('orders').update({ founder_kickoff_sent_at: new Date().toISOString() }).eq('id', orderId);
    if (error) throw new Error('Could not save founder email receipt');
  }
}

async function handleInstallmentInvoice(invoice: Stripe.Invoice, env: Env, supabase: ReturnType<typeof createAdminClient>) {
  const orderId = invoice.parent?.subscription_details?.metadata?.order_id;
  if (!orderId || invoice.status !== 'paid' || invoice.currency !== 'eur') return;
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order || ['cancelled', 'refunded'].includes(order.status)) return;
  const customer = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (order.payment_plan !== 'monthly4' || order.contract_status !== 'signed' || customer !== order.stripe_customer_id || !order.payment_schedule.slice(1).includes(invoice.amount_paid)) throw new Error('Invoice does not match signed installments');
  const { error } = await supabase.rpc('record_order_payment', { p_order_id: orderId, p_reference: `invoice:${invoice.id}`, p_amount: invoice.amount_paid });
  if (error) throw new Error('Could not record installment');
}

async function handleAsyncPaymentFailed(
  session: Stripe.Checkout.Session,
  env: Env,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const { data: order } = await supabase
    .from('orders')
    .select('id, tier, customer_email, customer_name, status, checkout_token, stripe_session_id')
    .eq('id', orderId)
    .single();

  if (!order) return;
  if (order.stripe_session_id !== session.id) return;
  // Idempotency: don't reverse already-paid or already-cancelled orders.
  if (['paid', 'contract_signed_deposit_paid', 'active', 'completed', 'cancelled', 'refunded'].includes(order.status as string)) {
    return;
  }

  const { error: updateError } = await supabase.from('orders').update({ status: order.checkout_token ? 'payment_failed' : 'cancelled' }).eq('id', orderId);
  if (updateError) throw new Error('Could not record failed payment');

  const tierName = TIER_LABELS[order.tier as string] || (order.tier as string);

  await Promise.allSettled([
    sendAsyncPaymentFailed(env.RESEND_API_KEY, {
      to: order.customer_email as string,
      customerName: (order.customer_name as string | null) ?? '',
      tier: tierName,
    }),
    sendFounderAlert(
      env.RESEND_API_KEY,
      env.FOUNDER_EMAIL,
      `Async payment failed — order ${(order.id as string).slice(0, 8)} (${tierName})`,
      `<p>The deposit for order <code>${order.id}</code> (${order.customer_email}) failed to clear. The customer has been notified.</p>`,
    ),
  ]);
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  env: Env,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const { data: order } = await supabase
    .from('orders')
    .select('id, tier, customer_email, status, total_price_cents, stripe_schedule_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (!order) {
    console.warn(`charge.refunded: no order found for payment_intent=${paymentIntentId}`);
    return;
  }
  if (order.status === 'refunded') return;

  if (charge.refunded) {
    if (order.stripe_schedule_id) await createStripeClient(env.STRIPE_SECRET_KEY).subscriptionSchedules.cancel(order.stripe_schedule_id);
    const { error } = await supabase.from('orders').update({ status: 'refunded' }).eq('id', order.id);
    if (error) throw new Error('Could not record refund');
  }

  const refundedCents = charge.amount_refunded ?? 0;
  await sendFounderAlert(
    env.RESEND_API_KEY,
    env.FOUNDER_EMAIL,
    `Refund processed — order ${(order.id as string).slice(0, 8)}`,
    `<p>A refund of <strong>${formatEur(refundedCents)}</strong> was processed for order <code>${order.id}</code> (${order.customer_email}).</p><p>Charge: <code>${charge.id}</code></p>`,
  );
}

async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  env: Env,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const paymentIntentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id;

  let orderInfo = '';
  if (paymentIntentId) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, customer_email, tier')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();
    if (order) {
      orderInfo = `<p><strong>Order:</strong> <code>${order.id}</code> (${order.tier}, ${order.customer_email})</p>`;
    }
  }

  // We do NOT auto-update order status — disputes need human handling. The
  // orders.status enum has no 'disputed' value, so we rely on Stripe Dashboard
  // as the source of truth for dispute lifecycle.
  await sendFounderAlert(
    env.RESEND_API_KEY,
    env.FOUNDER_EMAIL,
    `🚨 Stripe dispute opened — ${formatEur(dispute.amount)} (${dispute.reason})`,
    `<p>A new dispute was opened.</p>${orderInfo}<p><strong>Reason:</strong> ${dispute.reason}</p><p><strong>Amount:</strong> ${formatEur(dispute.amount)}</p><p><strong>Dispute ID:</strong> <code>${dispute.id}</code></p><p>Respond in the <a href="https://dashboard.stripe.com/disputes/${dispute.id}">Stripe Dashboard</a>.</p>`,
  );
}

function formatEur(cents: number): string {
  return `€${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
