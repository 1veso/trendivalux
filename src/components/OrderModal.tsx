import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import {
  bookStrategyCall,
  getOrCreateSessionId,
  saveQuestionnaireStep,
  startContractFlow,
  type ServerTier,
} from '../lib/order-modal';
import {
  TIER_BASE_EUR,
  TIER_NAMES,
} from '../config/pricing';
import { trackEvent } from '../lib/analytics';

// Display-shape constants for the OrderModal. Prices come from src/config/pricing.ts
// (single source of truth shared with the server). Local fields like timeline/days
// stay here because they're modal-only UI concerns.
export const TIER_PRICING: Record<string, any> = {
  landing:  { id: 'landing',  name: TIER_NAMES.landing,  base: TIER_BASE_EUR.landing,  timeline: '3 days',    days: 3 },
  business: { id: 'business', name: TIER_NAMES.business, base: TIER_BASE_EUR.business, timeline: '14 days',   days: 14 },
  store:    { id: 'store',    name: TIER_NAMES.store,    base: TIER_BASE_EUR.store,    timeline: '21 days',   days: 21 },
  webapp:   { id: 'webapp',   name: TIER_NAMES.webapp,   base: TIER_BASE_EUR.webapp,   timeline: '4–6 weeks', days: 35 },
  custom:   { id: 'custom',   name: TIER_NAMES.custom,   base: 20000,                  timeline: 'Custom',    days: 60, isCustom: true },
};

export const STEPS = [
  { id: 'tier', title: 'Choose your build', sub: 'You can switch this anytime — pricing updates live.' },
  { id: 'contact', title: 'Your details', sub: 'Name and email to generate your contract. Sign & pay 50% next.' },
];

const FieldLabel = ({ children, optional }: { children: any; optional?: boolean }) => (
  <label className="block font-mono text-[10px] uppercase tracking-[0.22em] text-mut mb-2">
    {children} {optional && <span className="ml-1 normal-case opacity-60">/ optional</span>}
  </label>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  max?: number;
}) => {
  const Tag: any = multiline ? 'textarea' : 'input';
  return (
    <Tag
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={max}
      className="w-full px-4 py-3 rounded-lg border bd font-sans text-base focus:outline-none focus:ring-1 transition"
      style={{ background: 'var(--surface-2)', color: 'var(--text)', borderColor: 'var(--border)', boxShadow: 'inset 0 0 0 0 transparent' }}
      onFocus={(e: any) => {
        e.target.style.boxShadow = `inset 0 0 0 1px var(--accent)`;
        e.target.style.borderColor = 'var(--accent)';
      }}
      onBlur={(e: any) => {
        e.target.style.boxShadow = 'none';
        e.target.style.borderColor = 'var(--border)';
      }}
    />
  );
};

const TierCardMini = ({ t, active, onClick }: { t: any; active: boolean; onClick: (id: string) => void }) => (
  <button
    type="button"
    onClick={() => onClick(t.id)}
    className="relative text-left p-4 rounded-xl border transition group"
    style={{
      background: active ? 'color-mix(in oklab, var(--accent) 12%, transparent)' : 'var(--surface-2)',
      borderColor: active ? 'var(--accent)' : 'var(--border)',
      boxShadow: active ? '0 0 0 1px var(--accent) inset, 0 12px 30px -12px color-mix(in oklab, var(--accent) 35%, transparent)' : 'none',
    }}
  >
    <div className="font-marquee text-[14px] uppercase tracking-[0.05em] text-1">{t.name}</div>
    <div className="mt-1 font-display text-2xl font-bold text-1">
      €{t.base.toLocaleString()}
      {t.isCustom && '+'}
    </div>
    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mut mt-1">{t.timeline}</div>
    {active && (
      <span className="absolute top-3 right-3 grid place-items-center w-5 h-5 rounded-full" style={{ background: 'var(--accent)' }}>
        <Icon.Check className="w-3 h-3" style={{ color: '#000' }} />
      </span>
    )}
  </button>
);

export function deriveTotals({ tierId }: { tierId: string }) {
  const tier = TIER_PRICING[tierId] || TIER_PRICING.landing;
  if (tier.isCustom) return { tier, base: tier.base as number, deposit: 0, balance: 0 };
  const base: number = tier.base;
  const deposit = Math.round(base / 2);
  const balance = base - deposit;
  return { tier, base, deposit, balance };
}

export const OrderModal = ({ open, onClose, initialTier = 'landing' }: { open: boolean; onClose: () => void; initialTier?: string }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');
  // Session ID is set once on mount via lazy initializer and never regenerated.
  // getOrCreateSessionId() now persists to localStorage so reopening the modal
  // reuses the same questionnaire row rather than orphaning a new one.
  const [sessionId] = useState<string>(() => getOrCreateSessionId());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dataRef = useRef<any>(null);

  const [data, setData] = useState<any>({
    tier: initialTier,
    name: '',
    email: '',
    customer_type: null as 'b2b' | 'b2c' | null,
  });

  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: typeof v === 'function' ? v(d[k]) : v }));

  // Track customer type selection for analytics.
  useEffect(() => {
    if (data.customer_type) {
      trackEvent('Customer Type Selected', { type: data.customer_type });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.customer_type]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setSubmitted(false);
      setSubmitError(null);
      setSubmitting(false);
    } else {
      trackEvent('OrderModal Opened', { tier: data.tier });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced save-on-blur: persist the questionnaire ~700ms after any field change.
  // We track data via a ref to avoid effect churn on the entire object reference.
  dataRef.current = data;
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      saveQuestionnaireStep(sessionId, data.tier, step + 1, dataRef.current).catch(() => {});
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [data, step, sessionId, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const totals = deriveTotals({ tierId: data.tier });
  const isCustom = totals.tier.isCustom;

  const validateStep = () => {
    switch (STEPS[step].id) {
      case 'tier': return !!data.tier;
      case 'contact': {
        return !!(
          data.name.trim() &&
          /\S+@\S+\.\S+/.test(data.email) &&
          data.customer_type
        );
      }
      default: return true;
    }
  };

  const next = () => {
    if (!validateStep()) return;
    trackEvent('OrderModal Step Completed', { step: STEPS[step].id, tier: data.tier });
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitError(null);

    const answers = {
      tier: data.tier,
      client: { name: data.name, email: data.email },
      customer_type: data.customer_type,
    };

    if (data.tier === 'custom') {
      // Custom tier does not flow through contract signing. Capture the brief and
      // hand off to a strategy call.
      try {
        await saveQuestionnaireStep(sessionId, data.tier, STEPS.length, answers);
      } catch {
        // Best-effort save; continue to booking either way.
      }
      bookStrategyCall();
      setOrderId('CUSTOM-PENDING');
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    const result = await startContractFlow({
      sessionId,
      tier: data.tier as ServerTier,
      answers,
      customerEmail: data.email,
      customerName: data.name,
      customerType: data.customer_type as 'b2b' | 'b2c',
    });

    if ('error' in result) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    trackEvent('Contract Initiated', { tier: data.tier });
    window.location.href = result.signingUrl;
  };

  if (!open) return null;
  const stepDef = STEPS[step];
  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 backdrop-blur-md transition-opacity"
        style={{ background: 'color-mix(in oklab, var(--bg) 78%, transparent)' }}
        onClick={onClose}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--accent-2) 18%, transparent), transparent 60%)', filter: 'blur(60px)' }}
        />
      </div>

      <div className="relative h-full flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-8">
        <div
          className="relative w-full sm:max-w-[920px] rounded-t-2xl sm:rounded-2xl border bd overflow-hidden flex flex-col max-h-[100svh] sm:max-h-[92vh] h-[100svh] sm:h-auto"
          style={{
            background: 'var(--surface)',
            boxShadow:
              '0 50px 120px -30px color-mix(in oklab, var(--accent-2) 28%, transparent), 0 0 0 1px color-mix(in oklab, var(--accent) 12%, transparent) inset',
            animation: submitted ? 'none' : 'modal-in 480ms cubic-bezier(.2,.7,.1,1) both',
            overscrollBehavior: 'contain',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <style>{`
            @keyframes modal-in { from { transform: translateY(24px) scale(0.97); opacity:0 } to { transform: translateY(0) scale(1); opacity:1 } }
            @keyframes step-in-r { from { transform: translateX(28px); opacity:0 } to { transform: translateX(0); opacity:1 } }
            @keyframes step-in-l { from { transform: translateX(-28px); opacity:0 } to { transform: translateX(0); opacity:1 } }
          `}</style>

          {/* Header */}
          <div className="shrink-0 px-5 sm:px-6 md:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b bd backdrop-blur-md" style={{ background: 'color-mix(in oklab, var(--surface) 85%, transparent)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.28em] accent">
                  // STEP {String(step + 1).padStart(2, '0')} / {STEPS.length}
                </div>
                <h3 className="font-display font-bold text-xl sm:text-2xl md:text-[28px] tracking-tight mt-1.5 text-1">{stepDef.title}</h3>
                <p className="text-2 text-xs sm:text-sm mt-1">{stepDef.sub}</p>
              </div>
              <button onClick={onClose} className="shrink-0 grid place-items-center w-11 h-11 rounded-full border bd hover:opacity-70 transition" aria-label="Close">
                <Icon.Close className="w-4 h-4 text-2" />
              </button>
            </div>
            <div className="mt-3 sm:mt-4 h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full transition-[width] duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                  boxShadow: '0 0 12px color-mix(in oklab, var(--accent-2) 60%, transparent)',
                }}
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>

          {!submitted && (
            <div key={step} className="px-5 sm:px-6 md:px-8 py-6 sm:py-7" style={{ animation: `step-in-${direction === 1 ? 'r' : 'l'} 360ms cubic-bezier(.2,.7,.1,1) both` }}>
              {stepDef.id === 'tier' && (
                <div>
                  <FieldLabel>Tier</FieldLabel>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                    {Object.values(TIER_PRICING).map((t: any) => (
                      <TierCardMini key={t.id} t={t} active={data.tier === t.id} onClick={(id) => set('tier', id)} />
                    ))}
                  </div>
                </div>
              )}

              {stepDef.id === 'contact' && (
                <div className="grid gap-5">
                  {/* Customer type selector */}
                  <div>
                    <FieldLabel>Customer type / Kundentyp</FieldLabel>
                    <div className="grid md:grid-cols-2 gap-3">
                      {([
                        {
                          id: 'b2b' as const,
                          title: 'Unternehmen / Business',
                          sub: 'Ich bestelle als Unternehmen / I am ordering as a business',
                        },
                        {
                          id: 'b2c' as const,
                          title: 'Privatperson / Consumer',
                          sub: 'Ich bestelle als Privatperson / I am ordering as a consumer',
                        },
                      ]).map((o) => {
                        const active = data.customer_type === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => set('customer_type', o.id)}
                            className="text-left p-4 rounded-xl border transition"
                            style={{
                              background: active
                                ? 'color-mix(in oklab, var(--accent) 12%, transparent)'
                                : 'var(--surface-2)',
                              borderColor: active ? 'var(--accent)' : 'var(--border)',
                              boxShadow: active ? '0 0 0 1px var(--accent) inset' : 'none',
                            }}
                          >
                            <div className="font-display font-semibold text-1">{o.title}</div>
                            <div className="text-2 text-sm mt-1">{o.sub}</div>
                          </button>
                        );
                      })}
                    </div>
                    {!data.customer_type && (
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut mt-2">
                        Bitte wählen Sie einen Kundentyp / Please select a customer type to continue.
                      </p>
                    )}
                  </div>

                  {/* Name + Email */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Your name</FieldLabel>
                      <TextInput value={data.name} onChange={(v) => set('name', v)} placeholder="Jane Doe" />
                    </div>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <TextInput value={data.email} onChange={(v) => set('email', v)} placeholder="jane@business.com" />
                    </div>
                  </div>

                  {/* Deposit summary — read-only informational line */}
                  <div className="font-mono text-[11px] text-mut">
                    {isCustom
                      ? 'Custom — quoted after call'
                      : `Today: €${totals.deposit.toLocaleString()} (50% deposit) · Balance €${totals.balance.toLocaleString()} on delivery`}
                  </div>
                </div>
              )}
            </div>
          )}

          {submitted && (
            <div className="px-5 sm:px-6 md:px-8 py-10 sm:py-12 text-center">
              <div
                className="inline-grid place-items-center w-16 h-16 rounded-full mb-5"
                style={{
                  background: 'color-mix(in oklab, var(--accent) 14%, transparent)',
                  boxShadow: '0 0 0 1px var(--accent) inset, 0 0 40px color-mix(in oklab, var(--accent) 50%, transparent)',
                }}
              >
                <Icon.Check className="w-7 h-7 accent" />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] accent">// STRATEGY CALL OPENING</div>
              <h3 className="font-display font-bold text-3xl tracking-tight mt-2 text-1">Pick a time that works.</h3>
              <p className="text-2 mt-3 max-w-md mx-auto">
                Your custom build needs a 30-minute discovery call to scope properly. We've opened the booking page in a new tab — pick a slot and we'll send a tailored quote within 24 hours.
              </p>
              <div className="mt-7 inline-flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-mut">
                <span>NEXT: BOOK CALL → CUSTOM QUOTE → CONTRACT</span>
              </div>
              <button
                onClick={onClose}
                className="mt-7 px-6 py-3 rounded-full font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                Close
              </button>
            </div>
          )}
          </div>

          {/* Footer nav */}
          {!submitted && (
            <div
              className="shrink-0 px-5 sm:px-6 md:px-8 py-3 sm:py-4 border-t bd backdrop-blur-md flex items-center justify-between gap-3"
              style={{ background: 'color-mix(in oklab, var(--surface) 88%, transparent)' }}
            >
              <button
                onClick={back}
                disabled={step === 0}
                className="inline-flex items-center justify-center min-h-[44px] px-3 sm:px-4 rounded-full font-mono text-[11px] uppercase tracking-[0.22em] text-2 hover:text-1 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Back
              </button>

              <div className="hidden md:flex items-center gap-1">
                {STEPS.map((s, i) => (
                  <span
                    key={s.id}
                    className="w-1.5 h-1.5 rounded-full transition"
                    style={{ background: i <= step ? (i === step ? 'var(--accent-2)' : 'var(--accent)') : 'var(--border)' }}
                  />
                ))}
              </div>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  disabled={!validateStep()}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 sm:px-5 py-2.5 sm:py-3 rounded-full font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  Continue <Icon.ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <button
                    onClick={submit}
                    disabled={!validateStep() || submitting}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-full font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em] transition disabled:opacity-40 disabled:cursor-not-allowed gold-pulse"
                    style={{ background: 'var(--gold)', color: '#000' }}
                  >
                    {submitting
                      ? 'Preparing your contract…'
                      : isCustom
                      ? <>Book Strategy Call <Icon.ArrowRight className="w-3.5 h-3.5" /></>
                      : <>Sign &amp; Pay 50% <Icon.ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                  {submitError && (
                    <span className="font-mono text-[10px] text-red-400 max-w-[260px] text-right">
                      {submitError}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
