import { useEffect, useState } from 'react';
import SEO from '../components/SEO';

// Operator diagnostics contain connection flags only, never credentials or orders.
export default function SiteStatusPage() {
  const [status, setStatus] = useState<any>(null); const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!result.stripe) throw new Error('The readiness check is unavailable.'); setStatus(result);
    }).catch(() => { if (!controller.signal.aborted) setError('The readiness check is unavailable. Check the production provider configuration.'); });
    return () => controller.abort();
  }, []);
  return <main className="min-h-screen px-6 py-16" style={{ background: 'var(--bg)', color: 'var(--text)' }}><SEO title="Site Readiness" pathname="/commissioning" noIndex />
    <div className="max-w-2xl mx-auto"><p className="font-mono text-xs accent">TRENDIVA LUX · OPERATOR STATUS</p><h1 className="font-display text-4xl font-bold mt-4">Production readiness.</h1>
      {!status && !error && <p className="mt-6">Checking provider connections…</p>}
      {status && <><dl className="grid grid-cols-2 gap-4 mt-8 text-sm">
        <dt>Stripe key mode</dt><dd>{status.stripe.keyMode}</dd>
        <dt>Stripe account verified live</dt><dd>{status.stripe.verified && status.stripe.live ? 'Yes' : 'Not verified'}</dd>
        <dt>Stripe charges enabled</dt><dd>{status.stripe.chargesEnabled ? 'Yes' : 'Unavailable'}</dd>
        <dt>Database connected</dt><dd>{status.database ? 'Yes' : 'Unavailable'}</dd>
        <dt>DocuSeal API connected</dt><dd>{status.agreementApiConnected ? 'Yes' : 'Unavailable'}</dd>
        <dt>Email key configured</dt><dd>{status.emailConfigured ? 'Yes' : 'Missing'}</dd>
        <dt>Webhook secrets configured</dt><dd>{status.webhooksConfigured ? 'Yes' : 'Missing'}</dd>
      </dl><p className="mt-8 text-2">This read-only check does not send an offer or create a payment. DocuSeal Pro PDF entitlement, delivery of an agreement email and provider webhook subscriptions must also be commissioned before accepting orders.</p></>}
      {error && <p role="alert" className="mt-6 accent-2">{error}</p>}<a href="/" className="block mt-8 underline">Back to home</a>
    </div></main>;
}
