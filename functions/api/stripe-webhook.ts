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
import { createSignWellSubmission } from '../_shared/signwell';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import type { Env } from '../_shared/env';

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
    const message = err instanceof Error ? err.message : 'unknown';
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

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
    const message = err instanceof Error ? err.message : 'unknown';
    return new Response(`Handler error: ${message}`, { status: 500 });
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

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, tier, total_price_cents, deposit_amount_cents, customer_email, customer_name, customer_address, status, questionnaire_data, stripe_payment_intent_id')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    throw new Error(`Order not found for stripe order_id=${orderId}: ${fetchError?.message}`);
  }

  const orderRow = order as OrderRow;

  // Idempotency: if we already processed this order, do nothing.
  if (['paid', 'contract_sent', 'active', 'completed'].includes(orderRow.status)) {
    console.log(`Order ${orderId} already in status=${orderRow.status}; skipping duplicate webhook`);
    return;
  }

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;

  await supabase
    .from('orders')
    .update({
      status: 'paid',
      customer_name: session.customer_details?.name ?? orderRow.customer_name,
      customer_address:
        (session.customer_details?.address as unknown as Record<string, unknown> | null) ??
        orderRow.customer_address,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    })
    .eq('id', orderId);

  const tierName = TIER_LABELS[orderRow.tier] || orderRow.tier;
  const totalPriceFormatted = formatEur(orderRow.total_price_cents);
  const depositFormatted = formatEur(orderRow.deposit_amount_cents);
  const finalPaymentFormatted = formatEur(orderRow.total_price_cents - orderRow.deposit_amount_cents);

  const customerName = session.customer_details?.name ?? orderRow.customer_name ?? '';
  const customerAddress =
    (session.customer_details?.address as unknown as Record<string, unknown> | null) ??
    orderRow.customer_address ??
    null;

  // Create the SignWell document. Failure should not block email delivery —
  // we still send the deposit confirmation and the founder gets a follow-up alert
  // so we can manually replay the contract step.
  let contractSigningUrl = `${env.SITE_URL}/contract/${orderRow.id}`;
  try {
    if (!env.SIGNWELL_TEMPLATE_ID) {
      throw new Error('SIGNWELL_TEMPLATE_ID is not set');
    }
    const signwellResult = await createSignWellSubmission({
      apiKey: env.SIGNWELL_API_KEY,
      templateId: env.SIGNWELL_TEMPLATE_ID,
      customerEmail: orderRow.customer_email,
      customerName,
      testMode: env.STRIPE_SECRET_KEY.startsWith('sk_test_'),
      mergeFields: {
        customer_name: customerName,
        customer_address: formatAddress(customerAddress),
        tier_name: tierName,
        total_price_eur: totalPriceFormatted,
        deposit_paid_eur: depositFormatted,
        final_payment_eur: finalPaymentFormatted,
        delivery_timeline: tierTimeline(orderRow.tier),
        deliverables_list: tierDeliverables(orderRow.tier),
        order_id: orderRow.id,
        contract_date: new Date().toISOString().split('T')[0],
      },
    });

    await supabase
      .from('orders')
      .update({
        contract_status: 'sent',
        contract_docuseal_id: signwellResult.submissionId,
        contract_signing_url: signwellResult.signingUrl,
        status: 'contract_sent',
      })
      .eq('id', orderId);

    // We email the /contract/[order_id] page URL so the customer can return any
    // time. That page renders the SignWell embedded signing iframe from
    // contract_signing_url.
  } catch (err) {
    console.error('SignWell submission failed:', err);
    await sendFounderAlert(
      env.RESEND_API_KEY,
      env.FOUNDER_EMAIL,
      `⚠️ SignWell submission failed for order ${orderRow.id.slice(0, 8)}`,
      `<p>Stripe payment cleared but SignWell document creation failed. Customer received the deposit confirmation but the contract link will 404 until you manually create the document.</p><p><strong>Order:</strong> <code>${orderRow.id}</code></p><p><strong>Customer:</strong> ${orderRow.customer_email}</p><p><strong>Error:</strong> <code>${err instanceof Error ? err.message : 'unknown'}</code></p>`,
    ).catch(() => {});
  }

  await Promise.allSettled([
    sendDepositConfirmation(env.RESEND_API_KEY, {
      to: orderRow.customer_email,
      customerName,
      tier: tierName,
      depositAmount: depositFormatted,
      finalPaymentAmount: finalPaymentFormatted,
      contractSigningUrl,
      calcomBookingUrl: env.CALCOM_BOOKING_URL,
      orderId: orderRow.id,
    }),
    sendFounderKickoff(env.RESEND_API_KEY, {
      to: env.FOUNDER_EMAIL,
      orderId: orderRow.id,
      tier: tierName,
      customerEmail: orderRow.customer_email,
      customerName,
      totalPrice: totalPriceFormatted,
      depositPrice: depositFormatted,
      questionnaireAnswers: orderRow.questionnaire_data ?? {},
    }),
  ]).then((results) => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`Email send ${i === 0 ? 'deposit' : 'kickoff'} failed:`, r.reason);
      }
    });
  });
}

function tierTimeline(tier: string): string {
  switch (tier) {
    case 'landing': return '7 days';
    case 'business': return '14 days';
    case 'store': return '21 days';
    case 'webapp': return '4 to 6 weeks';
    default: return 'as agreed';
  }
}

function tierDeliverables(tier: string): string {
  switch (tier) {
    case 'landing': return 'Single-page landing site, mobile responsive, GA4 + analytics, 1 round of revisions';
    case 'business': return 'Multi-page business site (up to 7 pages), CMS, contact forms, GA4 + SEO foundation, 2 rounds of revisions';
    case 'store': return 'E-commerce store, product catalog, Stripe checkout, customer accounts, GA4, 2 rounds of revisions';
    case 'webapp': return 'Custom web application: auth, dashboard, billing, admin, docs. Scope refined in discovery';
    default: return 'Per project specification';
  }
}

function formatAddress(addr: Record<string, unknown> | null | undefined): string {
  if (!addr || typeof addr !== 'object') return '';
  const line1 = (addr.line1 as string) || '';
  const line2 = (addr.line2 as string) || '';
  const postal = (addr.postal_code as string) || '';
  const city = (addr.city as string) || '';
  const state = (addr.state as string) || '';
  const country = (addr.country as string) || '';
  return [line1, line2, [postal, city].filter(Boolean).join(' '), state, country].filter(Boolean).join(', ');
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
    .select('id, tier, customer_email, customer_name, status')
    .eq('id', orderId)
    .single();

  if (!order) return;
  // Idempotency: don't reverse already-paid or already-cancelled orders.
  if (['paid', 'contract_sent', 'active', 'completed', 'cancelled', 'refunded'].includes(order.status as string)) {
    return;
  }

  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);

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
    .select('id, tier, customer_email, status, total_price_cents')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (!order) {
    console.warn(`charge.refunded: no order found for payment_intent=${paymentIntentId}`);
    return;
  }
  if (order.status === 'refunded') return;

  await supabase.from('orders').update({ status: 'refunded' }).eq('id', order.id);

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
