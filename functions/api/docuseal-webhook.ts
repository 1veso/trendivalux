import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { sendCheckoutInvite } from '../_shared/email';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import { checkoutReturnUrl, PAID_ORDER_STATUSES } from '../_shared/order-flow';
import type { Env } from '../_shared/env';

// DocuSeal webhook. Receives submission lifecycle events. On form.completed /
// submission.completed we record the signature and invite the customer to Stripe.
// Only a verified Stripe payment event can unlock project onboarding.
//
// Auth: DocuSeal HMAC-SHA256 over timestamp.rawBody, with a five-minute
// replay window. See https://www.docuseal.com/resources/use-webhooks.
// The order UUID is set as external_id on the submitter when the submission is
// created in create-docuseal-contract.ts.

const TIER_LABELS: Record<string, string> = {
  landing: 'Landing',
  business: 'Business',
  store: 'Store',
  webapp: 'Web App',
  custom: 'Custom',
};

const COMPLETED_EVENTS = new Set(['form.completed', 'submission.completed']);

interface DocuSealFormCompletedData {
  id?: number;
  submission_id?: number;
  external_id?: string;
  completed_at?: string;
}

interface DocuSealSubmissionCompletedData {
  id?: number;
  completed_at?: string;
  submitters?: Array<{ external_id?: string; completed_at?: string }>;
}

interface DocuSealWebhookBody {
  event_type?: string;
  timestamp?: string;
  data?: DocuSealFormCompletedData | DocuSealSubmissionCompletedData;
}

interface OrderRow {
  id: string;
  tier: string;
  total_price_cents: number;
  deposit_amount_cents: number;
  customer_email: string;
  customer_name: string | null;
  status: string;
  checkout_token: string | null;
  checkout_invite_sent_at: string | null;
  contract_docuseal_id: string | null;
  questionnaire_data: Record<string, unknown> | null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rateLimit = await checkRateLimit({
    identifier: getClientIdentifier(request),
    endpoint: 'docuseal-webhook',
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter ?? 60);
  }

  const rawBody = await request.text();

  const signature = request.headers.get('X-Docuseal-Signature');
  const valid = await verifyDocuSealWebhook(rawBody, signature, env.DOCUSEAL_WEBHOOK_SECRET);
  if (!valid) {
    console.warn('[docuseal-webhook] signature verification failed', { timestamp: Date.now() });
    return new Response('Invalid signature', { status: 401 });
  }

  console.log('[docuseal-webhook] signature verified', { timestamp: Date.now() });

  let body: DocuSealWebhookBody;
  try {
    body = JSON.parse(rawBody) as DocuSealWebhookBody;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventType = body.event_type;

  if (!eventType || !COMPLETED_EVENTS.has(eventType)) {
    // Not a completion event — acknowledge and move on.
    return Response.json({ received: true });
  }

  // Extract the order UUID we set as external_id when creating the submission.
  let orderId: string | undefined;
  let completedAt: string | undefined;

  if (eventType === 'form.completed') {
    const data = body.data as DocuSealFormCompletedData | undefined;
    orderId = data?.external_id;
    completedAt = data?.completed_at;
  } else {
    // submission.completed: external_id lives on the submitter object.
    const data = body.data as DocuSealSubmissionCompletedData | undefined;
    orderId = data?.submitters?.[0]?.external_id;
    completedAt = data?.submitters?.[0]?.completed_at ?? data?.completed_at;
  }

  if (!orderId) {
    console.warn('[docuseal-webhook] no external_id found in event', { eventType });
    return Response.json({ received: true });
  }

  const supabase = createAdminClient(env);

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, tier, total_price_cents, deposit_amount_cents, customer_email, customer_name, status, checkout_token, questionnaire_data, checkout_invite_sent_at, contract_docuseal_id')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    console.error('[docuseal-webhook] order not found:', orderId, fetchError?.message);
    // Return 200 so DocuSeal does not retry for non-existent orders.
    return Response.json({ received: true });
  }

  const orderRow = order as OrderRow;

  const eventSubmissionId = eventType === 'form.completed' ? (body.data as DocuSealFormCompletedData)?.submission_id : body.data?.id;
  if (!eventSubmissionId || String(eventSubmissionId) !== orderRow.contract_docuseal_id) return new Response('Agreement does not match order', { status: 400 });

  // A digital signature is never proof that money has cleared.
  if (PAID_ORDER_STATUSES.has(orderRow.status) || ['cancelled', 'refunded'].includes(orderRow.status)) {
    return Response.json({ received: true });
  }
  const { error: updateError } = await supabase.from('orders').update({
    status: 'contract_signed', contract_status: 'signed',
    contract_signed_at: completedAt ?? new Date().toISOString(),
  }).eq('id', orderId).in('status', ['created', 'contract_sent']);
  if (updateError) return new Response('Could not record signature', { status: 500 });

  if (orderRow.checkout_token && !orderRow.checkout_invite_sent_at) {
    try {
    await sendCheckoutInvite(env.RESEND_API_KEY, {
      to: orderRow.customer_email, customerName: orderRow.customer_name,
      tier: TIER_LABELS[orderRow.tier] || orderRow.tier,
      checkoutUrl: checkoutReturnUrl(env, { id: orderRow.id, checkout_token: orderRow.checkout_token }),
      orderId: orderRow.id,
    });
    const { error: deliveryError } = await supabase.from('orders').update({ checkout_invite_sent_at: new Date().toISOString() }).eq('id', orderId);
    if (deliveryError) throw new Error('Could not save delivery receipt');
    } catch (error) {
      console.error('[docuseal-webhook] checkout invitation failed', error);
      return new Response('Checkout invitation unavailable', { status: 500 });
    }
  }

  return Response.json({ received: true });
};

// Verify a DocuSeal webhook callback. DocuSeal signs the raw request body
// with HMAC-SHA256 using the webhook secret and sends the hex-encoded digest
// in the X-Docuseal-Signature header.
async function verifyDocuSealWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.trim().split('.');
  if (parts.length !== 2) return false;
  const [timestamp, digest] = parts;
  if (!/^\d+$/.test(timestamp) || !/^[a-f0-9]{64}$/.test(digest)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`));
  const expectedHex = bytesToHex(new Uint8Array(signatureBytes));

  return timingSafeEqualHex(expectedHex, digest);
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
