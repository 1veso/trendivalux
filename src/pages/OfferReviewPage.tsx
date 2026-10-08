import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { euro, PAYMENT_PLAN_LABELS, priceBreakdown, type PaymentPlan } from '../config/payment-plans';

export default function OfferReviewPage() {
  const { orderId } = useParams(); const [params] = useSearchParams(); const token = params.get('token');
  const [order, setOrder] = useState<any>(null); const [net, setNet] = useState('');
  const [scope, setScope] = useState(''); const [timeline, setTimeline] = useState('');
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!orderId || !token) { setError('Use the private review link from your order email.'); return; }
    const controller = new AbortController();
    fetch(`/api/review-offer?${new URLSearchParams({ order_id: orderId, token })}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('This review link is unavailable.');
      const data = await response.json(); setOrder(data); setNet(data.net_amount_cents ? (data.net_amount_cents / 100).toFixed(2) : '');
      setScope((data.questionnaire_data?.offer_scope || []).join('\n')); setTimeline(data.questionnaire_data?.offer_timeline || '');
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [orderId, token]);
  const cents = Math.round(Number(net.replace(',', '.')) * 100);
  const price = Number.isSafeInteger(cents) && cents > 0 && order ? priceBreakdown(cents, order.payment_plan as PaymentPlan) : null;
  const editable = order && order.status === 'quote_requested';
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/review-offer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, token, netCents: cents, scope: scope.split('\n').map(line => line.trim()).filter(Boolean), timeline }) });
      if (!response.ok) throw new Error(await response.text());
      setNotice('The tailored PDF agreement has been emailed to the customer. Signing automatically leads to Stripe.'); setOrder({ ...order, status: 'contract_sent', agreement_email_sent_at: true });
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not issue offer.'); }
    finally { setBusy(false); }
  }
  async function requestBalance() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/request-balance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, token }) });
      if (!response.ok) throw new Error(await response.text()); setNotice('The final balance link has been emailed. Complete handover only after the full balance is confirmed.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not request balance.'); }
    finally { setBusy(false); }
  }
  const input = 'w-full rounded-xl border border-white/20 bg-white/5 p-3 text-white';
  return <main className="min-h-screen px-6 py-16 bg-bg text-text"><SEO title="Private Offer Review" pathname="/offer-review" noIndex />
    <div className="max-w-3xl mx-auto"><p className="font-mono text-xs accent">PRIVATE · OFFER REVIEW</p><h1 className="font-display text-4xl font-bold mt-4">Review the tailored offer.</h1>
      {order && <><p className="mt-6">{order.customer_name} · {order.customer_email}</p><p className="text-2 mt-2">{order.tier} {order.service_level.toUpperCase()} · {PAYMENT_PLAN_LABELS[order.payment_plan as PaymentPlan]}</p><p className="mt-4 whitespace-pre-wrap">{order.questionnaire_data?.project_details}</p>
      <form onSubmit={submit} className="space-y-6 mt-8"><label className="block">Net price (€)<input required disabled={!editable} value={net} onChange={e => setNet(e.target.value)} inputMode="decimal" className={input} /></label>
      <label className="block">Agreed scope (one item per line, up to 10)<textarea required disabled={!editable} value={scope} onChange={e => setScope(e.target.value)} rows={10} className={input} /></label>
      <label className="block">Delivery timeline<input required disabled={!editable} maxLength={120} value={timeline} onChange={e => setTimeline(e.target.value)} className={input} /></label>
      {price && <p>{euro(price.netCents)} net + {euro(price.vatCents)} VAT = {euro(price.grossCents)} total. Payments: {price.payments.map(euro).join(' · ')}</p>}
      {(editable || order.status === 'quote_ready' || (order.status === 'contract_sent' && !order.agreement_email_sent_at)) && <button disabled={busy || !price} className="rounded-full px-6 py-3 bg-gold text-black font-bold">{busy ? 'Preparing…' : editable ? 'Issue and email this offer' : 'Retry frozen offer email'}</button>}
      </form>
      {!editable && <p className="mt-6">Status: {order.status}. The issued agreement is locked.</p>}
      {['paid', 'contract_signed_deposit_paid', 'active', 'completed'].includes(order.status) && <div className="mt-8"><p>Confirmed payments: {euro(order.paid_amount_cents || 0)} / {euro(order.total_price_cents)}.</p>
      {order.payment_plan === 'split' && order.paid_amount_cents < order.total_price_cents && <button disabled={busy} onClick={requestBalance} className="rounded-full px-6 py-3 mt-4 bg-gold text-black font-bold">Email final balance before handover</button>}</div>}</>}
      {notice && <p role="status" className="mt-6 accent">{notice}</p>}{error && <p role="alert" className="mt-6 accent-2">{error}</p>}<a href="/" className="block mt-8 underline">Back to home</a>
    </div></main>;
}
