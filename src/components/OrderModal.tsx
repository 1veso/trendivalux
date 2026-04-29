import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import {
  bookStrategyCall,
  getOrCreateSessionId,
  saveQuestionnaireStep,
  submitQuestionnaire,
  type ServerTier,
} from '../lib/order-modal';
import {
  ADDON_FLAT_EUR,
  ADDON_MONTHLY_EUR,
  ADDON_NAMES,
  RUSH_PERCENT,
  TIER_BASE_EUR,
  TIER_NAMES,
} from '../config/pricing';
import { trackEvent } from '../lib/analytics';

const ContractPreviewModal = lazy(() => import('./ContractPreviewModal'));

// Display-shape constants for the OrderModal. Prices come from src/config/pricing.ts
// (single source of truth shared with the server). Local fields like timeline/days
// and blurb stay here because they're modal-only UI concerns.
export const TIER_PRICING: Record<string, any> = {
  landing:  { id: 'landing',  name: TIER_NAMES.landing,  base: TIER_BASE_EUR.landing,  timeline: '3 days',    days: 3 },
  business: { id: 'business', name: TIER_NAMES.business, base: TIER_BASE_EUR.business, timeline: '14 days',   days: 14 },
  store:    { id: 'store',    name: TIER_NAMES.store,    base: TIER_BASE_EUR.store,    timeline: '21 days',   days: 21 },
  webapp:   { id: 'webapp',   name: TIER_NAMES.webapp,   base: TIER_BASE_EUR.webapp,   timeline: '4–6 weeks', days: 35 },
  custom:   { id: 'custom',   name: TIER_NAMES.custom,   base: 20000,                  timeline: 'Custom',    days: 60, isCustom: true },
};

export const ADDON_PRICING: Record<string, any> = {
  motion:      { id: 'motion',      name: ADDON_NAMES.motion,      price: ADDON_FLAT_EUR.motion,           blurb: 'GSAP scroll choreography + Framer Motion micro-interactions on every section. The signature TrendivaLux feel.' },
  copywriting: { id: 'copywriting', name: ADDON_NAMES.copywriting, price: ADDON_FLAT_EUR.copywriting,      blurb: 'We write every headline, CTA and section. Tested copy structure. You approve, we publish.' },
  seo:         { id: 'seo',         name: ADDON_NAMES.seo,         price: ADDON_FLAT_EUR.seo,              blurb: 'Schema markup, meta optimization, sitemap, GA4 + Search Console. First 3 keywords ranked.' },
  maintenance: { id: 'maintenance', name: ADDON_NAMES.maintenance, price: ADDON_MONTHLY_EUR.maintenance,   blurb: 'Per month. Security patches, content updates, analytics review. First month free.', monthly: true },
  rush:        { id: 'rush',        name: ADDON_NAMES.rush,        price: null,                            percent: RUSH_PERCENT, blurb: 'We compress the timeline by 30%. Adds 25% to base price.' },
};

export const STEPS = [
  { id: 'tier', title: 'Choose your build', sub: 'You can switch this anytime — pricing updates live.' },
  { id: 'business', title: 'Tell us about the business', sub: 'One sentence works. We read between lines.' },
  { id: 'audience', title: 'Who is this for?', sub: 'Your customer in plain words. No personas needed.' },
  { id: 'vibe', title: 'Pick a visual direction', sub: 'Mood board, not a design lock. We refine in Figma.' },
  { id: 'pages', title: 'Pages required', sub: 'Pre-filled for your tier. Add or remove freely.' },
  { id: 'integrations', title: 'What plugs in?', sub: 'Stripe, Supabase, calendar — anything the site talks to.' },
  { id: 'content', title: 'Copy & content', sub: 'Tell us where you stand. We unlock helpers if needed.' },
  { id: 'languages', title: 'Languages', sub: 'Single or bilingual. We handle DE & EN natively.' },
  { id: 'brand', title: 'Brand assets', sub: 'Skip if you have none — we art-direct from scratch.' },
  { id: 'references', title: '3 sites you love', sub: "Paste URLs. We extract what works, ignore what doesn't." },
  { id: 'deadline', title: 'Timeline', sub: 'Standard or rush. Rush is +25%, no fluff.' },
  { id: 'contact', title: 'Reserve & pay 50%', sub: 'Work begins the moment your deposit lands.' },
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

const ChipGroup = ({
  options,
  value,
  onChange,
  multi = true,
}: {
  options: { id: string; label: string }[];
  value: any;
  onChange: (v: any) => void;
  multi?: boolean;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => {
      const active = multi ? value.includes(o.id) : value === o.id;
      return (
        <button
          key={o.id}
          type="button"
          onClick={() => {
            if (multi) onChange(active ? value.filter((v: string) => v !== o.id) : [...value, o.id]);
            else onChange(o.id);
          }}
          className="px-3.5 py-2 rounded-full font-mono text-[11px] uppercase tracking-[0.18em] transition border"
          style={{
            background: active ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'var(--surface-2)',
            borderColor: active ? 'var(--accent)' : 'var(--border)',
            color: active ? 'var(--accent)' : 'var(--text-2)',
            boxShadow: active ? '0 0 0 1px var(--accent) inset, 0 0 18px color-mix(in oklab, var(--accent) 30%, transparent)' : 'none',
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

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

const VibeCard = ({
  id,
  title,
  swatch,
  active,
  onClick,
}: {
  id: string;
  title: string;
  swatch: string;
  active: boolean;
  onClick: (id: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className="relative text-left rounded-xl border overflow-hidden transition group"
    style={{
      borderColor: active ? 'var(--accent)' : 'var(--border)',
      boxShadow: active ? '0 0 0 1px var(--accent) inset, 0 16px 36px -14px color-mix(in oklab, var(--accent) 35%, transparent)' : 'none',
    }}
  >
    <div className="aspect-[5/3]" style={{ background: swatch }} />
    <div className="p-3 bg-surface-2">
      <div className="font-display font-semibold text-sm text-1">{title}</div>
    </div>
    {active && (
      <span className="absolute top-2 right-2 grid place-items-center w-5 h-5 rounded-full" style={{ background: 'var(--accent)' }}>
        <Icon.Check className="w-3 h-3" style={{ color: '#000' }} />
      </span>
    )}
  </button>
);

const PAGES_BY_TIER: Record<string, string[]> = {
  landing: ['Hero', 'Features', 'Pricing', 'Contact'],
  business: ['Home', 'About', 'Services', 'Portfolio', 'Blog', 'Contact', 'Legal'],
  store: ['Home', 'Shop', 'Product', 'Cart', 'Checkout', 'Account', 'Blog', 'Contact', 'Legal'],
  webapp: ['Landing', 'Auth', 'Dashboard', 'Settings', 'Billing', 'Admin', 'Docs', 'Contact'],
  custom: ['Discovery defines this'],
};

const ALL_PAGE_OPTIONS = [
  'Home', 'About', 'Services', 'Portfolio', 'Shop', 'Product', 'Cart', 'Checkout', 'Account', 'Blog',
  'Pricing', 'Contact', 'Dashboard', 'Auth', 'Settings', 'Billing', 'Admin', 'Docs', 'Legal', 'Custom Page',
].map((l) => ({ id: l.toLowerCase().replace(/\s+/g, '-'), label: l }));

export function deriveTotals({ tierId, addons, rush }: { tierId: string; addons: string[]; rush: boolean }) {
  const tier = TIER_PRICING[tierId] || TIER_PRICING.landing;
  let base = tier.base;
  let addonTotal = 0;
  const addonsExpanded: any[] = [];
  addons.forEach((a) => {
    const meta = ADDON_PRICING[a];
    if (!meta) return;
    if (meta.monthly) {
      addonsExpanded.push({ ...meta, charged_now: 0, recurring: meta.price });
    } else if (meta.percent) {
      // rush handled below
    } else {
      addonTotal += meta.price;
      addonsExpanded.push({ ...meta, charged_now: meta.price });
    }
  });
  if (rush && !tier.isCustom) {
    const rushFee = Math.round(base * ADDON_PRICING.rush.percent);
    addonTotal += rushFee;
    addonsExpanded.push({ id: 'rush', name: 'Rush Delivery (+25%)', price: rushFee, charged_now: rushFee });
  }
  const subtotal = base + addonTotal;
  const deposit = Math.round(subtotal / 2);
  const balance = subtotal - deposit;
  return { tier, base, addonTotal, addonsExpanded, subtotal, deposit, balance };
}

const UpsellOverlay = ({
  tag,
  title,
  body,
  ctaLabel,
  skipLabel,
  onAccept,
  onSkip,
  accent,
}: {
  tag: string;
  title: string;
  body: string;
  ctaLabel: string;
  skipLabel: string;
  onAccept: () => void;
  onSkip: () => void;
  accent: string;
}) => (
  <div
    className="absolute inset-0 z-[5] grid place-items-center p-4"
    style={{
      background: 'color-mix(in oklab, var(--bg) 85%, transparent)',
      backdropFilter: 'blur(8px)',
      animation: 'modal-in 320ms cubic-bezier(.2,.7,.1,1) both',
    }}
  >
    <div
      className="relative w-full max-w-[480px] rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderColor: accent,
        boxShadow: `0 30px 80px -20px ${accent}55, 0 0 0 1px ${accent}33 inset`,
      }}
    >
      <div className="absolute top-0 inset-x-0 h-1" style={{ background: accent }} />
      <div className="p-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: accent }}>
          {tag}
        </div>
        <h3 className="font-display font-bold text-2xl tracking-tight mt-2 text-1">{title}</h3>
        <p className="text-2 text-sm mt-3 leading-relaxed">{body}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onAccept}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ background: accent, color: '#000' }}
          >
            {ctaLabel} <Icon.ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={onSkip} className="w-full text-center font-mono text-[10px] uppercase tracking-[0.22em] text-mut hover:text-2 transition py-1">
            {skipLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const OrderModal = ({ open, onClose, initialTier = 'landing' }: { open: boolean; onClose: () => void; initialTier?: string }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dataRef = useRef<any>(null);

  const [data, setData] = useState<any>({
    tier: initialTier,
    business_name: '',
    business_url: '',
    pitch: '',
    audience: [],
    audience_other: '',
    vibe: 'cinematic_dark',
    pages: PAGES_BY_TIER[initialTier] || [],
    integrations: [],
    content_status: 'have_some',
    languages: ['de_en'],
    brand_logo_name: '',
    brand_colors: '',
    brand_fonts: '',
    references: '',
    deadline: 'standard',
    deadline_date: '',
    addons: [],
    name: '',
    email: '',
    phone: '',
    company: '',
    accept_terms: false,
    accept_50: false,
    customer_type: null as 'b2b' | 'b2c' | null,
    accept_widerruf_waiver: false,
  });

  const [showMotionUpsell, setShowMotionUpsell] = useState(false);
  const [showMaintenanceUpsell, setShowMaintenanceUpsell] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);

  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: typeof v === 'function' ? v(d[k]) : v }));

  useEffect(() => {
    set('pages', PAGES_BY_TIER[data.tier] || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.tier]);

  // When customer type changes, reset all confirmation checkboxes so a B2B-checked
  // customer cannot bypass the B2C waiver by toggling the selector at the end.
  useEffect(() => {
    setData((d: any) => ({
      ...d,
      accept_50: false,
      accept_terms: false,
      accept_widerruf_waiver: false,
    }));
    if (data.customer_type) {
      trackEvent('Customer Type Selected', { type: data.customer_type });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.customer_type]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setSubmitted(false);
      setShowMotionUpsell(false);
      setShowMaintenanceUpsell(false);
      setShowContractPreview(false);
      setSubmitError(null);
      setSubmitting(false);
    } else {
      // Fresh draft on each open. Closes orphan any prior unfinished draft (kept in DB).
      setSessionId(getOrCreateSessionId());
      // Force re-acknowledgment of the contract on every fresh open so users can't
      // bypass review by closing and reopening.
      setData((d: any) => ({
        ...d,
        accept_terms: false,
        accept_50: false,
        customer_type: null,
        accept_widerruf_waiver: false,
      }));
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

  const totals = deriveTotals({
    tierId: data.tier,
    addons: data.addons,
    rush: data.deadline === 'rush',
  });
  const isCustom = totals.tier.isCustom;

  const validateStep = () => {
    switch (STEPS[step].id) {
      case 'tier': return !!data.tier;
      case 'business': return data.pitch.trim().length >= 6;
      case 'audience': return data.audience.length > 0 || data.audience_other.trim().length > 2;
      case 'vibe': return !!data.vibe;
      case 'pages': return isCustom || data.pages.length > 0;
      case 'integrations': return true;
      case 'content': return !!data.content_status;
      case 'languages': return data.languages.length > 0;
      case 'brand': return true;
      case 'references': return true;
      case 'deadline': return !!data.deadline && (data.deadline !== 'specific' || !!data.deadline_date);
      case 'contact': {
        const baseValid =
          data.name.trim() &&
          /\S+@\S+\.\S+/.test(data.email) &&
          !!data.customer_type &&
          data.accept_50 &&
          data.accept_terms;
        if (!baseValid) return false;
        if (data.customer_type === 'b2c' && !data.accept_widerruf_waiver) return false;
        return true;
      }
      default: return true;
    }
  };

  const next = () => {
    if (!validateStep()) return;
    if (STEPS[step].id === 'vibe' && !data.addons.includes('motion') && !showMotionUpsell) {
      setShowMotionUpsell(true);
      return;
    }
    if (STEPS[step].id === 'integrations' && !data.addons.includes('maintenance') && !showMaintenanceUpsell) {
      setShowMaintenanceUpsell(true);
      return;
    }
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
      brief: {
        business: { name: data.business_name, url: data.business_url, pitch: data.pitch },
        audience: { tags: data.audience, freeform: data.audience_other },
        vibe: data.vibe,
        pages: data.pages,
        integrations: data.integrations,
        content_status: data.content_status,
        languages: data.languages,
        brand: { logo: data.brand_logo_name, colors: data.brand_colors, fonts: data.brand_fonts },
        references: data.references.split('\n').map((s: string) => s.trim()).filter(Boolean),
        deadline: { mode: data.deadline, date: data.deadline_date || null },
      },
      addons: data.addons,
      pricing: {
        base_eur: totals.base,
        addons_total_eur: totals.addonTotal,
        subtotal_eur: totals.subtotal,
        deposit_eur: totals.deposit,
        balance_eur: totals.balance,
        currency: 'EUR',
      },
      client: { name: data.name, email: data.email, phone: data.phone, company: data.company },
      customer_type: data.customer_type,
      widerruf_waiver_accepted: data.customer_type === 'b2c' ? !!data.accept_widerruf_waiver : false,
    };

    if (data.tier === 'custom') {
      // Custom tier does not flow through Stripe checkout. Capture the brief and
      // hand off to a strategy call.
      try {
        await saveQuestionnaireStep(sessionId, data.tier, STEPS.length, answers);
      } catch (err) {
        // Best-effort save; continue to booking either way.
      }
      bookStrategyCall();
      setOrderId('CUSTOM-PENDING');
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    const result = await submitQuestionnaire({
      sessionId,
      tier: data.tier as ServerTier,
      answers,
      customerEmail: data.email,
      customerName: data.name,
      customerType: data.customer_type as 'b2b' | 'b2c',
      acceptedWidereufWaiver: data.customer_type === 'b2c' ? !!data.accept_widerruf_waiver : false,
    });

    if ('error' in result) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    trackEvent('Checkout Initiated', { tier: data.tier });
    // Hand the user off to Stripe-hosted Checkout.
    window.location.href = result.checkoutUrl;
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

              {stepDef.id === 'business' && (
                <div className="grid gap-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Business name</FieldLabel>
                      <TextInput value={data.business_name} onChange={(v) => set('business_name', v)} placeholder="Aurion Peptides" />
                    </div>
                    <div>
                      <FieldLabel optional>Existing website</FieldLabel>
                      <TextInput value={data.business_url} onChange={(v) => set('business_url', v)} placeholder="aurionpeptides.com" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>What you sell, in one sentence</FieldLabel>
                    <TextInput
                      multiline
                      rows={3}
                      max={240}
                      value={data.pitch}
                      onChange={(v) => set('pitch', v)}
                      placeholder="We sell research-grade peptides to labs in DACH, with COA on every product and a 24h compound chatbot."
                    />
                    <div className="font-mono text-[10px] text-mut mt-1.5">{data.pitch.length} / 240</div>
                  </div>
                </div>
              )}

              {stepDef.id === 'audience' && (
                <div>
                  <FieldLabel>Pick all that apply</FieldLabel>
                  <ChipGroup
                    multi
                    value={data.audience}
                    onChange={(v) => set('audience', v)}
                    options={[
                      { id: 'b2b', label: 'B2B' },
                      { id: 'b2c', label: 'B2C' },
                      { id: 'local', label: 'Local DE' },
                      { id: 'eu', label: 'EU-wide' },
                      { id: 'global', label: 'Global' },
                      { id: 'creator', label: 'Creator / Indie' },
                      { id: 'enterprise', label: 'Enterprise' },
                      { id: 'gov', label: 'Government' },
                    ]}
                  />
                  <div className="mt-5">
                    <FieldLabel optional>Add detail</FieldLabel>
                    <TextInput value={data.audience_other} onChange={(v) => set('audience_other', v)} placeholder="Lab buyers, EU only, mostly German-speaking" />
                  </div>
                </div>
              )}

              {stepDef.id === 'vibe' && (
                <div>
                  <FieldLabel>Visual direction (you can refine later)</FieldLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <VibeCard id="cinematic_dark" title="Cinematic Dark" swatch="linear-gradient(135deg, #050308, #1A1A26 60%, #FF0080 130%)" active={data.vibe === 'cinematic_dark'} onClick={(v) => set('vibe', v)} />
                    <VibeCard id="sunrise_warm" title="Sunrise Warm" swatch="linear-gradient(135deg, #FFF5F2, #FFB088 60%, #C8147E 130%)" active={data.vibe === 'sunrise_warm'} onClick={(v) => set('vibe', v)} />
                    <VibeCard id="editorial_minimal" title="Editorial Minimal" swatch="linear-gradient(135deg, #FAFAFA, #E5E5E5 60%, #1A1A1A 130%)" active={data.vibe === 'editorial_minimal'} onClick={(v) => set('vibe', v)} />
                    <VibeCard id="brutalist_mono" title="Brutalist Mono" swatch="linear-gradient(135deg, #FFFFFF, #FFFFFF 60%, #000000 60%)" active={data.vibe === 'brutalist_mono'} onClick={(v) => set('vibe', v)} />
                    <VibeCard id="lux_gold" title="Lux Gold" swatch="linear-gradient(135deg, #0A0A0A, #2A1F0A 50%, #FFD700 130%)" active={data.vibe === 'lux_gold'} onClick={(v) => set('vibe', v)} />
                    <VibeCard id="custom" title="Surprise me" swatch="conic-gradient(from 90deg, #00E5D4, #FF0080, #FFD700, #FB5607, #00E5D4)" active={data.vibe === 'custom'} onClick={(v) => set('vibe', v)} />
                  </div>
                </div>
              )}

              {stepDef.id === 'pages' && (
                <div>
                  <FieldLabel>Pages your site will need</FieldLabel>
                  {isCustom ? (
                    <div className="rounded-lg border bd p-4 text-2 text-sm" style={{ background: 'var(--surface-2)' }}>
                      Custom tier pages are scoped during the discovery call. Skip ahead.
                    </div>
                  ) : (
                    <ChipGroup multi value={data.pages} onChange={(v) => set('pages', v)} options={ALL_PAGE_OPTIONS} />
                  )}
                  {!isCustom && (
                    <div className="mt-4 text-mut font-mono text-[10px] uppercase tracking-[0.22em]">
                      Suggested for {totals.tier.name}: {(PAGES_BY_TIER[data.tier] || []).join(' · ')}
                    </div>
                  )}
                </div>
              )}

              {stepDef.id === 'integrations' && (
                <div>
                  <FieldLabel>What does the site need to connect to?</FieldLabel>
                  <ChipGroup
                    multi
                    value={data.integrations}
                    onChange={(v) => set('integrations', v)}
                    options={[
                      { id: 'stripe', label: 'Stripe' },
                      { id: 'paypal', label: 'PayPal' },
                      { id: 'supabase', label: 'Supabase / DB' },
                      { id: 'auth', label: 'User Auth' },
                      { id: 'cal', label: 'Cal.com / Calendly' },
                      { id: 'email', label: 'Email Capture' },
                      { id: 'crm', label: 'CRM (HubSpot/Pipedrive)' },
                      { id: 'ai', label: 'AI Chatbot' },
                      { id: 'n8n', label: 'n8n Workflows' },
                      { id: 'analytics', label: 'Analytics' },
                      { id: 'shipping', label: 'Shipping API' },
                      { id: 'crypto', label: 'Crypto Checkout' },
                      { id: 'custom', label: 'Custom API' },
                    ]}
                  />
                </div>
              )}

              {stepDef.id === 'content' && (
                <div>
                  <FieldLabel>Where do you stand on copy?</FieldLabel>
                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      { id: 'have_all', title: 'I have all copy ready', sub: 'Final headlines, sections, CTAs.' },
                      { id: 'have_some', title: 'I have some, need help', sub: 'Bullet points exist. Polish needed.' },
                      { id: 'need_all', title: 'I need copywriting', sub: 'Start from scratch. We write it.' },
                    ].map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => set('content_status', o.id)}
                        className="text-left p-4 rounded-xl border transition"
                        style={{
                          background: data.content_status === o.id ? 'color-mix(in oklab, var(--accent) 12%, transparent)' : 'var(--surface-2)',
                          borderColor: data.content_status === o.id ? 'var(--accent)' : 'var(--border)',
                        }}
                      >
                        <div className="font-display font-semibold text-1">{o.title}</div>
                        <div className="text-2 text-sm mt-1">{o.sub}</div>
                        {o.id === 'need_all' && <div className="font-mono text-[10px] uppercase tracking-[0.22em] accent-2 mt-2">+ Copywriting €690</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stepDef.id === 'languages' && (
                <div>
                  <FieldLabel>Site languages</FieldLabel>
                  <ChipGroup
                    multi
                    value={data.languages}
                    onChange={(v) => set('languages', v)}
                    options={[
                      { id: 'de', label: 'Deutsch' },
                      { id: 'en', label: 'English' },
                      { id: 'de_en', label: 'DE + EN (bilingual)' },
                      { id: 'fr', label: 'Français' },
                      { id: 'es', label: 'Español' },
                      { id: 'other', label: 'Other' },
                    ]}
                  />
                </div>
              )}

              {stepDef.id === 'brand' && (
                <div className="grid gap-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel optional>Logo file name (or paste URL)</FieldLabel>
                      <TextInput value={data.brand_logo_name} onChange={(v) => set('brand_logo_name', v)} placeholder="logo.svg or https://..." />
                    </div>
                    <div>
                      <FieldLabel optional>Brand colors (hex codes)</FieldLabel>
                      <TextInput value={data.brand_colors} onChange={(v) => set('brand_colors', v)} placeholder="#0A0A12, #FF0080, #FFD700" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel optional>Preferred fonts</FieldLabel>
                    <TextInput value={data.brand_fonts} onChange={(v) => set('brand_fonts', v)} placeholder="Syne, Familjen Grotesk — or 'surprise me'" />
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut">Skip if you have nothing — we art-direct from scratch as part of the build.</div>
                </div>
              )}

              {stepDef.id === 'references' && (
                <div>
                  <FieldLabel optional>3 sites you love (one per line)</FieldLabel>
                  <TextInput multiline rows={5} value={data.references} onChange={(v) => set('references', v)} placeholder={'linear.app\nstripe.com\nyour-favorite-site.com'} />
                  <div className="font-mono text-[10px] text-mut mt-1.5">We extract what works, ignore what doesn't. No copying — direction only.</div>
                </div>
              )}

              {stepDef.id === 'deadline' && (
                <div className="grid gap-5">
                  <div>
                    <FieldLabel>When do you need this live?</FieldLabel>
                    <div className="grid md:grid-cols-3 gap-3">
                      {[
                        { id: 'standard', title: 'Standard', sub: `Delivered in ${totals.tier.timeline}` },
                        { id: 'rush', title: 'Rush (+25%)', sub: '30% faster — same quality bar' },
                        { id: 'specific', title: 'Specific date', sub: 'Pick the day' },
                      ].map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => set('deadline', o.id)}
                          className="text-left p-4 rounded-xl border transition"
                          style={{
                            background: data.deadline === o.id ? 'color-mix(in oklab, var(--accent) 12%, transparent)' : 'var(--surface-2)',
                            borderColor: data.deadline === o.id ? 'var(--accent)' : 'var(--border)',
                          }}
                        >
                          <div className="font-display font-semibold text-1">{o.title}</div>
                          <div className="text-2 text-sm mt-1">{o.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {data.deadline === 'specific' && (
                    <div>
                      <FieldLabel>Target launch date</FieldLabel>
                      <input
                        type="date"
                        value={data.deadline_date}
                        onChange={(e) => set('deadline_date', e.target.value)}
                        className="px-4 py-3 rounded-lg border bd font-mono text-sm focus:outline-none"
                        style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {stepDef.id === 'contact' && (
                <div className="grid gap-5">
                  <div>
                    <FieldLabel>Customer type / Kundentyp</FieldLabel>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
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
                      ].map((o) => {
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Your name</FieldLabel>
                      <TextInput value={data.name} onChange={(v) => set('name', v)} placeholder="Jane Doe" />
                    </div>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <TextInput value={data.email} onChange={(v) => set('email', v)} placeholder="jane@business.com" />
                    </div>
                    <div>
                      <FieldLabel optional>Phone</FieldLabel>
                      <TextInput value={data.phone} onChange={(v) => set('phone', v)} placeholder="+49 ..." />
                    </div>
                    <div>
                      <FieldLabel optional>Company</FieldLabel>
                      <TextInput value={data.company} onChange={(v) => set('company', v)} placeholder="" />
                    </div>
                  </div>

                  <div
                    className="rounded-xl border bd p-5"
                    style={{
                      background: 'color-mix(in oklab, var(--surface-2) 70%, transparent)',
                      boxShadow: '0 0 0 1px color-mix(in oklab, var(--accent) 16%, transparent) inset',
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] accent-2">// ORDER SUMMARY</div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-1">
                        <span className="text-2">{totals.tier.name} build (base)</span>
                        <span>€{totals.base.toLocaleString()}</span>
                      </div>
                      {totals.addonsExpanded.map((a: any) => (
                        <div key={a.id} className="flex justify-between text-1">
                          <span className="text-2">
                            {a.name}
                            {a.monthly && <span className="text-mut"> /mo</span>}
                          </span>
                          <span>{a.monthly ? <span className="text-mut">€{a.recurring}/mo</span> : `€${a.charged_now}`}</span>
                        </div>
                      ))}
                      <div className="border-t bd pt-2 mt-2 flex justify-between font-display font-bold text-1">
                        <span>Subtotal</span>
                        <span>€{totals.subtotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg p-3" style={{ background: 'color-mix(in oklab, var(--accent) 14%, transparent)', boxShadow: '0 0 0 1px var(--accent) inset' }}>
                        <div className="font-mono text-[9px] uppercase tracking-[0.22em] accent">Today (50%)</div>
                        <div className="font-display font-bold text-2xl text-1 mt-1">€{totals.deposit.toLocaleString()}</div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-mut mt-1">unlocks build</div>
                      </div>
                      <div className="rounded-lg p-3 border bd" style={{ background: 'var(--surface)' }}>
                        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-mut">On delivery (50%)</div>
                        <div className="font-display font-bold text-2xl text-1 mt-1">€{totals.balance.toLocaleString()}</div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-mut mt-1">after your sign-off</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Icon.Check className="w-4 h-4 mt-0.5 accent shrink-0" /> Work begins the moment your 50% lands.
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon.Check className="w-4 h-4 mt-0.5 accent shrink-0" /> Final 50% only after you approve the live site.
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon.Check className="w-4 h-4 mt-0.5 accent shrink-0" /> 7-day deposit refund if discovery doesn't fit.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowContractPreview(true);
                        trackEvent('Contract Preview Opened', { tier: data.tier });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border accent font-mono text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:opacity-80"
                      style={{ borderColor: 'color-mix(in oklab, var(--accent) 50%, transparent)' }}
                    >
                      <Icon.ArrowUpRight className="w-3.5 h-3.5" />
                      Preview Service Agreement
                    </button>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut">opens in modal</span>
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-start gap-3 text-sm text-2 cursor-pointer">
                      <input type="checkbox" checked={data.accept_50} onChange={(e) => set('accept_50', e.target.checked)} className="mt-1 accent-fuchsia-500" />
                      <span>I understand work starts upon receipt of the 50% deposit, with the balance due before launch.</span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-2 cursor-pointer">
                      <input type="checkbox" checked={data.accept_terms} onChange={(e) => set('accept_terms', e.target.checked)} className="mt-1 accent-fuchsia-500" />
                      <span>
                        {data.customer_type === 'b2b' ? (
                          <>
                            Ich bestätige, dass ich die{' '}
                            <a href="/agb" target="_blank" rel="noopener noreferrer" className="accent underline">
                              AGB für Unternehmen
                            </a>{' '}
                            und den Werkvertrag gelesen habe und ihren Bedingungen zustimme.
                          </>
                        ) : data.customer_type === 'b2c' ? (
                          <>
                            Ich bestätige, dass ich die{' '}
                            <a href="/agb-b2c" target="_blank" rel="noopener noreferrer" className="accent underline">
                              AGB für Verbraucher
                            </a>
                            , die{' '}
                            <a href="/widerrufsbelehrung" target="_blank" rel="noopener noreferrer" className="accent underline">
                              Widerrufsbelehrung
                            </a>{' '}
                            und den Werkvertrag gelesen habe und ihren Bedingungen zustimme.
                          </>
                        ) : (
                          <>Ich bestätige, dass ich die AGB und den Werkvertrag gelesen habe und ihren Bedingungen zustimme.</>
                        )}
                      </span>
                    </label>

                    {data.customer_type === 'b2c' && (
                      <label
                        className="flex items-start gap-3 text-sm text-2 cursor-pointer rounded-lg p-3 border"
                        style={{
                          background: 'color-mix(in oklab, var(--gold) 8%, transparent)',
                          borderColor: 'color-mix(in oklab, var(--gold) 35%, transparent)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={data.accept_widerruf_waiver}
                          onChange={(e) => set('accept_widerruf_waiver', e.target.checked)}
                          className="mt-1 accent-yellow-500"
                        />
                        <span>
                          Ich verlange ausdrücklich, dass Trendiva Lux mit der Ausführung der bestellten Dienstleistung
                          vor Ablauf der Widerrufsfrist beginnt. Mir ist bekannt, dass ich mein Widerrufsrecht bei
                          vollständiger Vertragserfüllung durch Trendiva Lux verliere. / I expressly request that
                          Trendiva Lux begin the execution of the ordered service before the end of the withdrawal
                          period. I am aware that I lose my right of withdrawal upon full performance of the contract
                          by Trendiva Lux.
                        </span>
                      </label>
                    )}

                    {(() => {
                      const missing: string[] = [];
                      if (!data.customer_type) missing.push('customer type');
                      if (!data.accept_50) missing.push('deposit acknowledgment');
                      if (!data.accept_terms) missing.push('terms acknowledgment');
                      if (data.customer_type === 'b2c' && !data.accept_widerruf_waiver) missing.push('Widerrufsrecht waiver');
                      if (missing.length === 0) return null;
                      return (
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] gold pt-1">
                          Please confirm: {missing.join(' · ')}.
                        </p>
                      );
                    })()}
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
                      ? 'Redirecting to Stripe…'
                      : isCustom
                      ? <>Book Strategy Call <Icon.ArrowRight className="w-3.5 h-3.5" /></>
                      : <>Pay €{totals.deposit.toLocaleString()} &amp; Start <Icon.ArrowRight className="w-3.5 h-3.5" /></>}
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

      {showMotionUpsell && (
        <UpsellOverlay
          tag="// SUGGESTED ADD-ON"
          title="Want the full cinematic experience?"
          body="Add the Cinematic Motion Package — GSAP scroll choreography, Framer Motion micro-interactions, the signature TrendivaLux feel that made KNZN go viral. Pre-checked because most clients add it."
          ctaLabel={`Add — €${ADDON_PRICING.motion.price}`}
          skipLabel="Skip — keep base motion"
          onAccept={() => {
            set('addons', (a: string[]) => (a.includes('motion') ? a : [...a, 'motion']));
            setShowMotionUpsell(false);
            next();
          }}
          onSkip={() => {
            setShowMotionUpsell(false);
            next();
          }}
          accent="var(--accent-2)"
        />
      )}
      {showMaintenanceUpsell && (
        <UpsellOverlay
          tag="// PROTECT YOUR INVESTMENT"
          title="Keep it sharp, hands-off."
          body="Add the Maintenance Retainer — security patches, content updates, monthly analytics review. Your first month is free. Cancel anytime."
          ctaLabel={`Add — €${ADDON_PRICING.maintenance.price}/mo · 1st month free`}
          skipLabel="Skip — I'll self-maintain"
          onAccept={() => {
            set('addons', (a: string[]) => (a.includes('maintenance') ? a : [...a, 'maintenance']));
            setShowMaintenanceUpsell(false);
            next();
          }}
          onSkip={() => {
            setShowMaintenanceUpsell(false);
            next();
          }}
          accent="var(--accent)"
        />
      )}
      {showContractPreview && (
        <Suspense fallback={null}>
          <ContractPreviewModal
            isOpen={showContractPreview}
            onClose={() => setShowContractPreview(false)}
            tier={data.tier}
            customerName={data.name}
            addons={data.addons}
            hasRush={data.deadline === 'rush'}
          />
        </Suspense>
      )}
    </div>
  );
};

export default OrderModal;
