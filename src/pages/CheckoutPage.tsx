import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';

export default function CheckoutPage() {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token');
  const stage = params.get('stage');
  const cancelled = params.get('cancelled') === 'true';
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(!cancelled);

  useEffect(() => {
    if (cancelled && retry === 0) { setOpening(false); return; }
    if (!orderId || !token) { setError('This checkout link is incomplete. Please use the link from your signed agreement.'); setOpening(false); return; }
    let disposed = false;
    let timer: number | undefined;
    let attempts = 0;
    const controller = new AbortController();
    setError(''); setOpening(true);
    async function openCheckout() {
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, token, stage }), signal: controller.signal,
        });
        if (disposed) return;
        if (response.status === 409) {
          const data = await response.json().catch(() => ({}));
          if (data.pendingSignature && ++attempts < 30) { timer = window.setTimeout(openCheckout, 2000); return; }
          throw new Error('Your signature is still being confirmed. Please retry in a moment.');
        }
        if (!response.ok) throw new Error('We could not open checkout. Please retry or email hello@trendivalux.com.');
        const data = await response.json() as { checkoutUrl?: string; successUrl?: string };
        if (disposed) return;
        const target = data.checkoutUrl || data.successUrl;
        if (!target) throw new Error('Checkout is temporarily unavailable. Please retry.');
        window.location.assign(target);
      } catch (err) {
        if (disposed) return;
        setError(err instanceof Error ? err.message : 'Connection interrupted. Please retry.');
        setOpening(false);
      }
    }
    void openCheckout();
    return () => { disposed = true; controller.abort(); window.clearTimeout(timer); };
  }, [orderId, token, stage, cancelled, retry]);

  return (
    <main className="min-h-screen grid place-items-center px-4 sm:px-6 py-10" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SEO title="Secure Checkout" pathname="/checkout" noIndex />
      <div className="max-w-2xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] accent">// SIGNED AGREEMENT → STRIPE</p>
        <h1 className="font-display font-bold text-3xl sm:text-5xl tracking-tight mt-4">{opening ? 'Opening secure checkout.' : cancelled ? 'Your agreement is saved.' : 'Continue to payment.'}</h1>
        <p className="text-2 text-base sm:text-xl mt-6 leading-relaxed">{opening ? 'We are confirming your signature and preparing the payment from your tailored agreement. Your project brief comes after payment.' : 'Complete your payment through Stripe when you are ready. You do not need to sign again.'}</p>
        {error && <p role="alert" className="text-sm mt-6 accent-2">{error}</p>}
        {!opening && token && <button onClick={() => setRetry(n => n + 1)} className="mt-8 px-6 py-3 rounded-full font-mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ background: 'var(--gold)', color: '#000' }}>Continue to Stripe</button>}
        <a href="/" className="block mt-6 text-2 text-sm underline">Back to home</a>
      </div>
    </main>
  );
}
