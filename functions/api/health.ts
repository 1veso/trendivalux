import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { createStripeClient } from '../_shared/stripe-client';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import type { Env } from '../_shared/env';
import { assertStripeKey } from '../_shared/stripe-payments';

// Read-only commissioning check. Never returns credentials, customer data,
// template IDs, or signed URLs; never creates submissions or payments.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const limit = await checkRateLimit({ identifier: getClientIdentifier(request), endpoint: 'health', maxRequests: 5, windowSeconds: 60 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter ?? 60);
  const checks = await Promise.allSettled([
    (async () => { const { error } = await createAdminClient(env).from('orders').select('checkout_token, deposit_confirmation_sent_at, founder_kickoff_sent_at', { head: true }).limit(1); if (error) throw error; })(),
    (async () => { const response = await fetch(`${env.DOCUSEAL_API_URL.replace(/\/$/, '')}/templates?limit=1`, { headers: { 'X-Auth-Token': env.DOCUSEAL_API_KEY } }); if (!response.ok) throw new Error('Agreement API unavailable'); })(),
    (async () => { assertStripeKey(env); const stripe = createStripeClient(env.STRIPE_SECRET_KEY); const [account, balance] = await Promise.all([stripe.accounts.retrieve(null), stripe.balance.retrieve()]); return { live: balance.livemode, chargesEnabled: account.charges_enabled, verified: true }; })(),
  ]);
  const stripe = { keyMode: /^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY) ? 'live' : /^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY) ? 'test' : env.STRIPE_SECRET_KEY ? 'unknown' : 'missing', ...(checks[2].status === 'fulfilled' ? checks[2].value : { live: null, chargesEnabled: false, verified: false }) };
  const ready = checks.every(check => check.status === 'fulfilled') && stripe?.live && stripe?.chargesEnabled && !!env.RESEND_API_KEY && !!env.DOCUSEAL_WEBHOOK_SECRET && !!env.STRIPE_WEBHOOK_SECRET;
  return Response.json({ ready: !!ready, database: checks[0].status === 'fulfilled', agreementApiConnected: checks[1].status === 'fulfilled', stripe, emailConfigured: !!env.RESEND_API_KEY, webhooksConfigured: !!env.DOCUSEAL_WEBHOOK_SECRET && !!env.STRIPE_WEBHOOK_SECRET, pdfSubmissionRequiresDocuSealPro: true }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
};
