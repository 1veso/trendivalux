import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clearSessionId } from '../lib/order-modal';
import SEO from '../components/SEO';


export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const token = searchParams.get('token');
  const stage = searchParams.get('stage');
  const [scopingUrl, setScopingUrl] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [pollExhausted, setPollExhausted] = useState(false);

  useEffect(() => {
    setOrderConfirmed(false); setPollExhausted(false); setScopingUrl(null);
    if (!orderId || !token) { setPollExhausted(true); return; }
    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;
    const controller = new AbortController();
    async function poll() {
      attempts += 1;
      try {
        const response = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderId!)}&token=${encodeURIComponent(token!)}&stage=${encodeURIComponent(stage || '')}`, { signal: controller.signal });
        const data = response.ok ? await response.json() : null;
        if (cancelled) return;
        if (data?.confirmed && data.scopingUrl) {
          setOrderConfirmed(true); setScopingUrl(data.scopingUrl); clearSessionId(); return;
        }
        if (data?.stopped || response.status === 400 || response.status === 404) { setPollExhausted(true); return; }
      } catch { if (cancelled) return; }
      if (attempts >= 30) { setPollExhausted(true); return; }
      timer = window.setTimeout(poll, 2000);
    }
    void poll();
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timer); };
  }, [orderId, token, stage]);

  return (
    <div className="min-h-screen grid place-items-center px-4 sm:px-6 py-10 sm:p-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SEO title="Order Confirmed" pathname="/success" noIndex />
      <div className="max-w-2xl text-center">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.28em] mb-4"
          style={{ color: orderConfirmed ? 'var(--accent)' : 'var(--accent-2)' }}
        >
          // {orderConfirmed ? 'ORDER CONFIRMED' : pollExhausted ? 'AWAITING CONFIRMATION' : 'CONFIRMING PAYMENT'}
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl tracking-tight leading-tight">
          <span
            style={{
              backgroundImage: 'linear-gradient(90deg, var(--accent-2), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome to TrendivaLux.
          </span>
        </h1>
        <p className="text-base sm:text-xl text-2 mt-5 sm:mt-6 leading-relaxed">
          {orderConfirmed
            ? 'Your payment is confirmed and your signed agreement is saved. Complete your project brief to get your build started.'
            : 'We are waiting for Stripe to confirm your payment. Bank payments can take longer to clear. Your project brief opens once payment is confirmed.'}
        </p>

        {orderConfirmed && scopingUrl && (
          <a href={scopingUrl} className="inline-flex mt-8 px-6 py-3 rounded-full font-mono text-[11px] font-bold uppercase tracking-[0.2em]" style={{ background: 'var(--gold)', color: '#000' }}>
            Complete Your Project Brief →
          </a>
        )}
        <a href="/" className="block mt-6 text-sm text-2 underline">Back to home</a>

        {orderId && (
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut mt-8">
            Reference: <span style={{ color: 'var(--accent)' }}>{orderId.slice(0, 8)}</span>
          </p>
        )}

        {pollExhausted && !orderConfirmed && (
          <p className="text-2 text-sm mt-6 max-w-md mx-auto">
            We're still confirming your payment with Stripe. You can refresh this page to check again, or contact{' '}
            <a href="mailto:hello@trendivalux.com" style={{ color: 'var(--accent)' }} className="underline">
              hello@trendivalux.com
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
