import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import type { Env } from '../_shared/env';

// DocuSeal webhook. Receives submission lifecycle events. On submission.completed
// (a.k.a. form.completed) we mark the order as fully active and stamp the signed
// timestamp. Auth: shared-secret header named in DOCUSEAL_WEBHOOK_SECRET_HEADER_KEY
// (defaults to X-Webhook-Secret) compared against DOCUSEAL_WEBHOOK_SECRET.

interface DocusealWebhookBody {
  event_type?: string;
  data?: {
    submission_id?: number;
    status?: string;
    completed_at?: string;
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // DocuSeal sends a shared-secret header (configurable via DOCUSEAL_WEBHOOK_SECRET_HEADER_KEY).
  // Upgrade to HMAC verification when DocuSeal exposes a signature scheme.
  const headerKey = env.DOCUSEAL_WEBHOOK_SECRET_HEADER_KEY || 'X-Webhook-Secret';
  const provided = request.headers.get(headerKey);
  const expected = env.DOCUSEAL_WEBHOOK_SECRET;

  if (!expected || !provided || provided !== expected) {
    return new Response('Invalid signature', { status: 401 });
  }

  const body = (await request.json()) as DocusealWebhookBody;

  if (
    (body.event_type === 'submission.completed' || body.event_type === 'form.completed') &&
    body.data?.submission_id !== undefined
  ) {
    const supabase = createAdminClient(env);
    const submissionId = String(body.data.submission_id);

    await supabase
      .from('orders')
      .update({
        contract_status: 'signed',
        contract_signed_at: body.data.completed_at || new Date().toISOString(),
        status: 'active',
      })
      .eq('contract_docuseal_id', submissionId);
  }

  return Response.json({ received: true });
};
