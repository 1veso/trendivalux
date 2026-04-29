import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../../_shared/supabase-admin';
import { sendFounderAlert } from '../../_shared/email';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../../_shared/rate-limit';
import { validateEmail, validateEnum, validateString } from '../../_shared/validation';
import type { Env } from '../../_shared/env';

// GDPR Articles 15 (access) and 17 (erasure) endpoint. Records a request and
// pages the founder. Fulfilment is manual — the founder reviews and within 30
// days either exports the requester's data or deletes it across the connected
// services (Supabase, Stripe, SignWell, Resend).

interface DataRightsRequestBody {
  email?: unknown;
  type?: unknown;
  reason?: unknown;
  // Honeypot — if present, this is a bot submission. We accept silently to
  // avoid tipping the bot off and skip downstream side effects.
  website?: unknown;
}

const REQUEST_TYPES = ['access', 'deletion'] as const;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rateLimit = await checkRateLimit({
    identifier: getClientIdentifier(request),
    endpoint: 'data-rights-request',
    maxRequests: 3,
    windowSeconds: 300,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter ?? 60);
  }

  let body: DataRightsRequestBody;
  try {
    body = (await request.json()) as DataRightsRequestBody;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Honeypot: bot submitted a hidden field. Pretend success.
  if (typeof body.website === 'string' && body.website.length > 0) {
    console.log('[data-rights] honeypot triggered, dropping submission');
    return Response.json({
      success: true,
      message: 'Your request has been received. We will respond within 30 days as required by GDPR.',
    });
  }

  const email = validateEmail(body.email);
  if (!email) {
    return new Response('Valid email required', { status: 400 });
  }

  const type = validateEnum(body.type, REQUEST_TYPES);
  if (!type) {
    return new Response('Type must be access or deletion', { status: 400 });
  }

  let reason: string | null = null;
  if (body.reason !== undefined && body.reason !== null && body.reason !== '') {
    reason = validateString(body.reason, 1000);
    if (!reason) {
      return new Response('Invalid reason', { status: 400 });
    }
  }

  try {
    const supabase = createAdminClient(env);
    const { error } = await supabase.from('data_rights_requests').insert({
      email,
      request_type: type,
      reason,
      status: 'pending',
    });

    if (error) {
      console.error('[data-rights] insert failed', error);
      return new Response('Internal error', { status: 500 });
    }

    // Notify founder so they can fulfil within 30 days.
    await sendFounderAlert(
      env.RESEND_API_KEY,
      env.FOUNDER_EMAIL,
      `[GDPR] ${type === 'access' ? 'Data Access' : 'Data Deletion'} request — ${email}`,
      `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` +
        `<p><strong>Type:</strong> ${escapeHtml(type)}</p>` +
        `<p><strong>Reason:</strong> ${reason ? escapeHtml(reason) : '<em>not provided</em>'}</p>` +
        `<p>Fulfil within 30 days per GDPR Art. 12(3).</p>`,
    ).catch((err) => {
      console.error('[data-rights] founder alert failed', err);
    });

    return Response.json({
      success: true,
      message: 'Your request has been received. We will respond within 30 days as required by GDPR.',
    });
  } catch (err) {
    console.error('[data-rights] handler error', err);
    return new Response('Internal error', { status: 500 });
  }
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
