import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

interface Order {
  id: string;
  tier: string;
  total_price_cents: number;
  deposit_amount_cents: number;
  customer_email: string;
  customer_name: string | null;
  contract_docuseal_id: string | null;
  contract_signing_url: string | null;
  contract_status: string;
  contract_signed_at: string | null;
}

const TIER_LABELS: Record<string, string> = {
  landing: 'Landing',
  business: 'Business',
  store: 'Store',
  webapp: 'Web App',
  custom: 'Custom',
};

export default function ContractPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Missing order id.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchOrder = async () => {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(
          'id, tier, total_price_cents, deposit_amount_cents, customer_email, customer_name, contract_docuseal_id, contract_signing_url, contract_status, contract_signed_at',
        )
        .eq('id', orderId)
        .single();

      if (cancelled) return;
      if (fetchError || !data) {
        setError('We could not find your order. Check the link from your confirmation email or reply to it for help.');
      } else {
        setOrder(data as Order);
      }
      setLoading(false);
    };

    fetchOrder();
    // Re-poll every 4s while we wait for the SignWell document to land. Stops
    // once contract_signing_url is set (or after the order is signed).
    const interval = window.setInterval(() => {
      if (order?.contract_signing_url || order?.contract_status === 'signed') {
        window.clearInterval(interval);
        return;
      }
      fetchOrder();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center p-8 text-2" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <SEO title="Service Agreement" pathname="/contract" noIndex />
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-mut">Loading your contract…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen grid place-items-center p-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="max-w-md text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-mut mb-3">// CONTRACT NOT FOUND</div>
          <h1 className="font-display font-bold text-3xl mb-3">We couldn't load this contract</h1>
          <p className="text-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const tierLabel = TIER_LABELS[order.tier] || order.tier;

  if (order.contract_status === 'signed') {
    return (
      <div className="min-h-screen grid place-items-center p-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="max-w-2xl text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--accent)' }}>// CONTRACT SIGNED</div>
          <h1 className="font-display font-bold text-4xl tracking-tight mb-3">You're all set.</h1>
          <p className="text-lg text-2 leading-relaxed">
            Your service agreement has been signed. Watch your inbox for the discovery call confirmation — work begins within 24 hours.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut mt-6">
            Order #{order.id.slice(0, 8)} :: {tierLabel}
          </p>
        </div>
      </div>
    );
  }

  if (!order.contract_signing_url) {
    return (
      <div className="min-h-screen grid place-items-center p-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="max-w-md text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-mut mb-3">// PREPARING YOUR CONTRACT</div>
          <h1 className="font-display font-bold text-3xl mb-3">Almost ready</h1>
          <p className="text-2 text-sm">
            Your service agreement is being generated. This page will refresh automatically. If it takes more than a minute, reply to your confirmation email and we'll send the contract directly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SEO title="Service Agreement" pathname="/contract" noIndex />
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-mut">// SERVICE AGREEMENT</div>
          <h1 className="font-display font-bold text-3xl tracking-tight mt-1">Sign to begin work</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut mt-2">
            Order #{order.id.slice(0, 8)} :: {tierLabel} :: {order.customer_email}
          </p>
        </header>
        <div
          className="rounded-2xl border bd overflow-hidden"
          style={{
            background: 'var(--surface)',
            boxShadow: '0 30px 80px -20px color-mix(in oklab, var(--accent-2) 22%, transparent), 0 0 0 1px color-mix(in oklab, var(--accent) 12%, transparent) inset',
            height: '80vh',
          }}
        >
          <iframe
            src={order.contract_signing_url}
            className="w-full h-full border-0"
            title="Service Agreement Signing"
            allow="camera; microphone; clipboard-write"
          />
        </div>
        <p className="font-mono text-[10px] text-mut mt-3">
          Trouble loading?{' '}
          <a
            href={order.contract_signing_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)' }}
            className="underline"
          >
            Open in a new window
          </a>
        </p>
      </div>
    </div>
  );
}
