import { Icon } from './Icons';
import { Orbs } from './Atmosphere';
import { Tilt } from './Hero';

const TIERS = [
  {
    id: 'landing',
    name: 'Landing',
    eyebrow: '// SINGLE PAGE CONVERSION MACHINE',
    price: '€1,990',
    priceFrom: 'from',
    audience: 'For founders launching a product, freelancers, local businesses with one offer.',
    features: ['One-page cinematic site', 'GSAP scroll choreography', 'Mobile-first', 'Custom domain + SSL', 'Cloudflare deploy', 'Contact form + analytics'],
    timeline: 'Delivered in 3 days',
    accent: 'accent',
  },
  {
    id: 'business',
    name: 'Business',
    eyebrow: '// MULTI-PAGE BRAND PRESENCE',
    price: '€3,990',
    priceFrom: 'from',
    audience: 'For established businesses ready to upgrade their digital face.',
    features: ['5 to 7 custom pages', 'Blog-ready CMS', 'Custom motion language', 'SEO foundation', 'Email capture forms', 'Analytics dashboard'],
    timeline: 'Delivered in 14 days',
    accent: 'accent',
  },
  {
    id: 'store',
    name: 'Store',
    eyebrow: '// E-COMMERCE WITH STRIPE',
    price: '€6,990',
    priceFrom: 'from',
    audience: 'For brands selling physical or digital products.',
    features: ['Stripe checkout integration', 'Supabase customer accounts', 'Product catalog (up to 50 SKUs)', 'Order management', 'Email automation', 'GDPR-compliant cookie banner'],
    timeline: 'Delivered in 21 days',
    accent: 'accent-2',
    popular: true,
  },
  {
    id: 'webapp',
    name: 'Web App',
    eyebrow: '// CUSTOM APPLICATION',
    price: '€12,990',
    priceFrom: 'from',
    audience: 'For SaaS founders, marketplaces, businesses needing real software.',
    features: ['Auth + user dashboards', 'Custom database schema', 'Stripe subscriptions', 'n8n automation hooks', 'Admin panel', 'API integrations'],
    timeline: 'Delivered in 4 to 6 weeks',
    accent: 'accent-2',
  },
  {
    id: 'custom',
    name: 'Custom',
    eyebrow: '// BESPOKE ENGAGEMENT',
    price: '€20,000',
    priceFrom: 'from',
    audience: 'For enterprises, multi-brand portfolios, ongoing partnerships.',
    features: ['Multi-month engagement', 'Retainer optional', 'Dedicated capacity', 'Strategic consultation', 'Priority delivery', 'Direct founder access'],
    timeline: 'Custom timeline',
    accent: 'gold',
    isCustom: true,
  },
] as const;

type Tier = (typeof TIERS)[number];

const TierCard = ({
  tier,
  onReserve,
  onCall,
}: {
  tier: Tier;
  onReserve: (id: string) => void;
  onCall: () => void;
}) => {
  const isCustom = (tier as any).isCustom;
  const popular = (tier as any).popular;
  const accentColor = tier.accent === 'accent-2' ? 'var(--accent-2)' : tier.accent === 'gold' ? 'var(--gold)' : 'var(--accent)';
  const tierUrl = `/tiers/${tier.id}`;
  const goToTier = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    window.location.href = tierUrl;
  };
  return (
    <Tilt max={4} className="h-full">
      <div
        onClick={goToTier}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') window.location.href = tierUrl;
        }}
        className="relative h-full rounded-2xl border bg-surface backdrop-blur-md overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2 neon-edge group rim-light cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
        style={{
          background: 'color-mix(in oklab, var(--surface) 70%, transparent)',
          borderColor: popular ? 'color-mix(in oklab, var(--accent-2) 60%, transparent)' : 'var(--border)',
          boxShadow: popular
            ? '0 30px 60px -25px color-mix(in oklab, var(--accent-2) 35%, transparent), 0 0 0 1px color-mix(in oklab, var(--accent-2) 25%, transparent) inset'
            : '0 30px 60px -30px color-mix(in oklab, var(--bg) 80%, transparent), 0 1px 0 0 color-mix(in oklab, var(--text) 4%, transparent) inset',
        }}
      >
        {popular && (
          <div
            className="absolute top-0 right-0 z-10 px-3 py-1 rounded-bl-lg font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white"
            style={{ background: 'var(--accent-2)' }}
          >
            ★ Most Booked
          </div>
        )}
        {isCustom && (
          <div
            className="absolute top-0 right-0 z-10 px-3 py-1 rounded-bl-lg font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-black"
            style={{ background: 'var(--gold)' }}
          >
            Bespoke
          </div>
        )}

        <div
          className="absolute bottom-3 right-3 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-1
                     font-mono text-[8.5px] uppercase tracking-[0.25em] inline-flex items-center gap-1.5 px-2 py-1 rounded-full border bd"
          style={{
            color: accentColor,
            background: 'color-mix(in oklab, var(--surface) 80%, transparent)',
            borderColor: `color-mix(in oklab, ${accentColor} 40%, transparent)`,
            boxShadow: `0 0 16px color-mix(in oklab, ${accentColor} 25%, transparent)`,
          }}
        >
          Open <span aria-hidden="true">→</span>
        </div>

        <div className="p-6 lg:p-7 flex flex-col flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            {tier.eyebrow}
          </div>
          <h3 className="font-display font-bold text-3xl tracking-tight mt-2 text-1">{tier.name}</h3>

          <div
            className="relative mt-5 rounded-xl border bd p-4 overflow-hidden"
            style={{ background: 'color-mix(in oklab, var(--surface-2) 60%, transparent)' }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: `linear-gradient(110deg, transparent 30%, color-mix(in oklab, ${accentColor} 18%, transparent) 50%, transparent 70%)`,
              }}
            />
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-mut">{tier.priceFrom}</div>
            <div
              className="font-display font-bold text-4xl tracking-tight mt-1 text-1"
              style={{ textShadow: `0 0 20px color-mix(in oklab, ${accentColor} 30%, transparent)` }}
            >
              {tier.price}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-2 mt-1">{tier.timeline}</div>
          </div>

          <p className="text-2 text-sm leading-relaxed mt-5">{tier.audience}</p>

          <ul className="space-y-2.5 mt-5 flex-1">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-1">
                <span
                  className="grid place-items-center w-4 h-4 rounded-full mt-0.5 shrink-0"
                  style={{
                    background: `color-mix(in oklab, ${accentColor} 18%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${accentColor} 50%, transparent)`,
                  }}
                >
                  <Icon.Check className="w-2.5 h-2.5" style={{ color: accentColor }} />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-5 border-t bd">
            {isCustom ? (
              <button
                onClick={onCall}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition"
                style={{ background: 'var(--gold)', color: '#000' }}
              >
                Book Strategy Call <Icon.ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onReserve(tier.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition"
                style={{
                  background: popular ? accentColor : 'transparent',
                  color: popular ? '#fff' : accentColor,
                  border: `1px solid ${accentColor}`,
                }}
              >
                Reserve Slot — €500 <Icon.ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <a
              href={`/tiers/${tier.id}`}
              className="block w-full mt-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-mut hover:text-2 transition"
            >
              View full tier details →
            </a>
          </div>
        </div>
      </div>
    </Tilt>
  );
};

export const Offers = ({
  onReserve,
  onCall,
}: {
  onReserve: (id: string) => void;
  onCall: () => void;
}) => (
  <section id="offers" className="relative py-24 md:py-32 bg-app overflow-hidden">
    <div className="absolute inset-0 opacity-40">
      <Orbs density={0.4} />
    </div>
    <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-50" />

    <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] accent-2">
          <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent-2) 60%, transparent)' }} />
          <span>// CHOOSE YOUR ENGAGEMENT</span>
        </div>
        <h2 className="font-display font-bold tracking-display mt-4 text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.96] text-1">
          Five ways to
          <span className="block font-script grad-text-cm italic">work together.</span>
        </h2>
        <p className="text-2 mt-5 leading-relaxed font-editorial text-[1.1rem] max-w-[640px]">
          Every tier secures with a <span className="text-1">€500 deposit</span>. Refundable within 7 days after the discovery questionnaire.
          Credited to your final invoice.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mt-14">
        {TIERS.map((t) => (
          <TierCard key={t.id} tier={t} onReserve={onReserve} onCall={onCall} />
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mut">
        <span className="inline-flex items-center gap-2">
          <Icon.Shield className="w-3.5 h-3.5 accent" /> 7-Day Refund
        </span>
        <span className="inline-flex items-center gap-2">
          <Icon.Key className="w-3.5 h-3.5 accent" /> Full Ownership
        </span>
        <span className="inline-flex items-center gap-2">
          <Icon.Unlock className="w-3.5 h-3.5 accent" /> No Lock-In
        </span>
        <span className="inline-flex items-center gap-2">
          <Icon.CreditCard className="w-3.5 h-3.5 accent" /> Stripe Secured
        </span>
      </div>
    </div>
  </section>
);

export default Offers;
