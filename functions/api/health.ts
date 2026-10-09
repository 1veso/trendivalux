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
    (async () => {
      if (!env.DOCUSEAL_API_URL || !env.DOCUSEAL_API_KEY) return 'missing_configuration';
      try {
        const response = await fetch(`${env.DOCUSEAL_API_URL.replace(/\/$/, '')}/templates?limit=1`, { headers: { 'X-Auth-Token': env.DOCUSEAL_API_KEY }, signal: AbortSignal.timeout(8000) });
        if (response.ok) return 'connected';
        if ([401, 403].includes(response.status)) return 'authentication_or_permission_error';
        return 'provider_error';
      } catch { return 'unreachable_or_timeout'; }
    })(),
    (async () => { assertStripeKey(env); const stripe = createStripeClient(env.STRIPE_SECRET_KEY); const [account, balance] = await Promise.all([stripe.accounts.retrieve(null), stripe.balance.retrieve()]); return { live: balance.livemode, chargesEnabled: account.charges_enabled, verified: true }; })(),
  ]);
  const stripe = { keyMode: /^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY) ? 'live' : /^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY) ? 'test' : env.STRIPE_SECRET_KEY ? 'unknown' : 'missing', ...(checks[2].status === 'fulfilled' ? checks[2].value : { live: null, chargesEnabled: false, verified: false }) };
  const agreementStatus = checks[1].status === 'fulfilled' ? checks[1].value : 'unreachable_or_timeout';
  const agreementApiConnected = agreementStatus === 'connected';
  const webhooks = { stripeConfigured: !!env.STRIPE_WEBHOOK_SECRET, docusealConfigured: !!env.DOCUSEAL_WEBHOOK_SECRET };
  const ready = checks[0].status === 'fulfilled' && agreementApiConnected && stripe?.live && stripe?.chargesEnabled && !!env.RESEND_API_KEY && webhooks.stripeConfigured && webhooks.docusealConfigured;
  return Response.json({ ready: !!ready, database: checks[0].status === 'fulfilled', agreementApiConnected,
    agreement: { apiUrlConfigured: !!env.DOCUSEAL_API_URL, keyConfigured: !!env.DOCUSEAL_API_KEY, status: agreementStatus },
    stripe, emailConfigured: !!env.RESEND_API_KEY, webhooks, webhooksConfigured: webhooks.stripeConfigured && webhooks.docusealConfigured,
    pdfSubmissionRequiresDocuSealPro: true }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
};
