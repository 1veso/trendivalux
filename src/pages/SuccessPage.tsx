import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PAID_STATUSES = new Set(['paid', 'contract_sent', 'active', 'completed']);

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [pollExhausted, setPollExhausted] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30; // ~60s

    const poll = async () => {
      attempts += 1;
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (cancelled) return;
      if (data && PAID_STATUSES.has(data.status as string)) {
        setOrderConfirmed(true);
        return;
      }
      if (attempts >= maxAttempts) {
        setPollExhausted(true);
        return;
      }
      window.setTimeout(poll, 2000);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="min-h-screen grid place-items-center p-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-2xl text-center">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.28em] mb-4"
          style={{ color: orderConfirmed ? 'var(--accent)' : 'var(--accent-2)' }}
        >
          // {orderConfirmed ? 'ORDER CONFIRMED' : pollExhausted ? 'AWAITING CONFIRMATION' : 'CONFIRMING PAYMENT'}
        </div>
        <h1 className="font-display font-bold text-5xl md:text-6xl tracking-tight">
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
        <p className="text-xl text-2 mt-6 leading-relaxed">
          Your deposit is in. The service agreement is on its way to your inbox along with the discovery call link. Work begins within 24 hours.
        </p>

        {orderId && (
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut mt-8">
            Reference: <span style={{ color: 'var(--accent)' }}>{orderId.slice(0, 8)}</span>
          </p>
        )}

        {pollExhausted && !orderConfirmed && (
          <p className="text-2 text-sm mt-6 max-w-md mx-auto">
            We're still confirming your payment with Stripe. If you don't receive an email within five minutes, reply to the receipt or contact{' '}
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
