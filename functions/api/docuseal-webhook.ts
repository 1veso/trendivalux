import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { sendFounderKickoff, sendScopingInvite } from '../_shared/email';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import type { Env } from '../_shared/env';

// DocuSeal webhook. Receives submission lifecycle events. On form.completed /
// submission.completed we mark the order as contract_signed_deposit_paid,
// then send the founder kickoff email and a scoping-call invite to the customer.
//
// Auth: HMAC-SHA256 of the raw request body using DOCUSEAL_WEBHOOK_SECRET.
// DocuSeal sends the hex digest in the X-Docuseal-Signature header.
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
    .select('id, tier, total_price_cents, deposit_amount_cents, customer_email, customer_name, status, questionnaire_data')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    console.error('[docuseal-webhook] order not found:', orderId, fetchError?.message);
    // Return 200 so DocuSeal does not retry for non-existent orders.
    return Response.json({ received: true });
  }

  const orderRow = order as OrderRow;

  // Idempotency: only advance if not already in a terminal/later status.
  if (['contract_signed_deposit_paid', 'active', 'completed', 'cancelled', 'refunded'].includes(orderRow.status)) {
    console.log(`[docuseal-webhook] order ${orderId} already in status=${orderRow.status}; skipping`);
    return Response.json({ received: true });
  }

  await supabase
    .from('orders')
    .update({
      status: 'contract_signed_deposit_paid',
      contract_status: 'signed',
      contract_signed_at: completedAt ?? new Date().toISOString(),
    })
    .eq('id', orderId);

  const tierName = TIER_LABELS[orderRow.tier] || orderRow.tier;
  const totalPriceFormatted = formatEur(orderRow.total_price_cents);
  const depositFormatted = formatEur(orderRow.deposit_amount_cents);

  await Promise.allSettled([
    sendFounderKickoff(env.RESEND_API_KEY, {
      to: env.FOUNDER_EMAIL,
      orderId: orderRow.id,
      tier: tierName,
      customerEmail: orderRow.customer_email,
      customerName: orderRow.customer_name ?? undefined,
      totalPrice: totalPriceFormatted,
      depositPrice: depositFormatted,
      questionnaireAnswers: orderRow.questionnaire_data ?? {},
    }),
    sendScopingInvite(env.RESEND_API_KEY, {
      to: orderRow.customer_email,
      customerName: orderRow.customer_name,
      tier: tierName,
      scopingUrl: `${env.SITE_URL}/scoping/${orderRow.id}`,
      orderId: orderRow.id,
    }),
  ]).then((results) => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[docuseal-webhook] email ${i === 0 ? 'kickoff' : 'scoping'} failed:`, r.reason);
      }
    });
  });

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

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expectedHex = bytesToHex(new Uint8Array(signatureBytes));

  return timingSafeEqualHex(expectedHex, signatureHeader.trim());
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

function formatEur(cents: number): string {
  return `€${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
