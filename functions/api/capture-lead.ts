import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { validateEmail, validateEnum } from '../_shared/validation';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import type { Env } from '../_shared/env';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const limit = await checkRateLimit({ identifier: getClientIdentifier(request), endpoint: 'capture-lead', maxRequests: 5, windowSeconds: 60 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter ?? 60);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return new Response('Invalid request', { status: 400 }); }
  const email = validateEmail(body.email);
  const kind = validateEnum(body.kind, ['waitlist', 'audit'] as const);
  if (!email || !kind) return new Response('Invalid lead', { status: 400 });
  try {
    const { error } = await createAdminClient(env).from(kind === 'waitlist' ? 'waitlist' : 'site_audit_leads')
      .insert({ email, source: kind === 'waitlist' ? 'final_cta' : 'exit_intent' });
    if (error && error.code !== '23505') throw new Error('Could not capture lead');
    return Response.json({ saved: true });
  } catch { return new Response('Could not save email', { status: 503 }); }
};
