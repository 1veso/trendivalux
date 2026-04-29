import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { verifySignWellWebhook } from '../_shared/signwell';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import type { Env } from '../_shared/env';

// SignWell webhook. Receives document lifecycle events. On document_completed
// we mark the order as fully active and stamp the signed timestamp.
//
// Auth: HMAC-SHA256 of the raw request body using SIGNWELL_WEBHOOK_SECRET.
// SignWell sends the hex digest in the X-Signwell-Webhook-Signature header
// (X-SignWell-Signature is also accepted as an alias).

interface SignWellWebhookBody {
  event?: {
    type?: string;
    time?: string;
  };
  data?: {
    object?: {
      id?: string;
      status?: string;
      completed_at?: string;
    };
  };
}

const COMPLETED_EVENTS = new Set(['document_completed', 'document_signed', 'completed']);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rateLimit = await checkRateLimit({
    identifier: getClientIdentifier(request),
    endpoint: 'signwell-webhook',
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter ?? 60);
  }

  const rawBody = await request.text();

  const signature =
    request.headers.get('X-Signwell-Webhook-Signature') ??
    request.headers.get('X-SignWell-Signature') ??
    request.headers.get('x-signwell-signature');

  const valid = await verifySignWellWebhook(rawBody, signature, env.SIGNWELL_WEBHOOK_SECRET);
  if (!valid) {
    console.warn('[signwell-webhook] signature verification failed', { timestamp: Date.now() });
    return new Response('Invalid signature', { status: 401 });
  }

  console.log('[signwell-webhook] signature verified', { timestamp: Date.now() });

  let body: SignWellWebhookBody;
  try {
    body = JSON.parse(rawBody) as SignWellWebhookBody;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventType = body.event?.type;
  const documentId = body.data?.object?.id;

  if (eventType && COMPLETED_EVENTS.has(eventType) && documentId) {
    const supabase = createAdminClient(env);
    const completedAt =
      body.data?.object?.completed_at || body.event?.time || new Date().toISOString();

    await supabase
      .from('orders')
      .update({
        contract_status: 'signed',
        contract_signed_at: completedAt,
        status: 'active',
      })
      .eq('contract_docuseal_id', documentId);
  }

  return Response.json({ received: true });
};
