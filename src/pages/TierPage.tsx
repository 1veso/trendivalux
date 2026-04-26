import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icons';
import { Orbs, DigitalSunset } from '../components/Atmosphere';
import { TopNav, FadeUp } from '../components/Hero';
import { Footer, ContactModal } from '../components/Footer';
import { OrderModal } from '../components/OrderModal';
import type { TierConfig } from '../lib/tier-configs';

const Reveal = ({ children, delay = 0 }: { children: any; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        transform: shown ? 'translateY(0)' : 'translateY(24px)',
        opacity: shown ? 1 : 0,
        transition: `opacity 800ms cubic-bezier(.2,.7,.1,1) ${delay}ms, transform 800ms cubic-bezier(.2,.7,.1,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const TierIcons: Record<string, any> = {
  Spark: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M12 2v6m0 8v6m-10-10h6m8 0h6M4.5 4.5l4 4m7 7l4 4m0-15l-4 4m-7 7l-4 4" /></svg>,
  Layout: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
  Type: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M4 7V5h16v2M9 19h6M12 5v14" /></svg>,
  Stripe: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M14 7c-2-1-5-1-5 1s5 1 5 4-3 3-5 2" /><path d="M12 4v16" /></svg>,
  Speed: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M3 12a9 9 0 1118 0" /><path d="M12 12l5-3" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>,
  Mobile: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></svg>,
  Cms: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="3" y="4" width="18" height="6" rx="1" /><rect x="3" y="14" width="18" height="6" rx="1" /><circle cx="7" cy="7" r="0.8" fill="currentColor" /><circle cx="7" cy="17" r="0.8" fill="currentColor" /></svg>,
  Blog: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M4 19h12a4 4 0 004-4V7l-4-4H8a4 4 0 00-4 4v12z" /><path d="M8 9h8M8 13h6" /></svg>,
  Multi: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>,
  Forms: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h10M7 14h6" /></svg>,
  Search: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" /></svg>,
  Cart: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M3 4h2l3 12h11l3-9H7" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></svg>,
  Db: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.6 3.6 3 8 3s8-1.4 8-3V6M4 12v6c0 1.6 3.6 3 8 3s8-1.4 8-3v-6" /></svg>,
  Catalog: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></svg>,
  Email: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>,
  Cookie: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M12 3a9 9 0 109 9 5 5 0 01-5-5 4 4 0 01-4-4z" /><circle cx="9" cy="13" r="0.8" fill="currentColor" /><circle cx="14" cy="15" r="0.8" fill="currentColor" /><circle cx="11" cy="9" r="0.8" fill="currentColor" /></svg>,
  Shipping: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="2" y="8" width="12" height="9" rx="1" /><path d="M14 11h5l3 3v3h-8" /><circle cx="6" cy="19" r="1.6" /><circle cx="18" cy="19" r="1.6" /></svg>,
  Auth: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>,
  Dashboard: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M3 12a9 9 0 1118 0" /><path d="M12 12l4-4" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /></svg>,
  Billing: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></svg>,
  Admin: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0114 0" /><path d="M19 5l1 1-1 1" /></svg>,
  Api: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M8 4l-4 8 4 8M16 4l4 8-4 8M14 4l-4 16" /></svg>,
  Ai: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z" /></svg>,
  N8n: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="5" cy="12" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><circle cx="19" cy="12" r="2" /><path d="M7 12h3M14 7l3 4M14 17l3-4" /></svg>,
  Payment: (p: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M14 15h4" /></svg>,
};

const TierHero = ({ config }: { config: TierConfig }) => {
  const accent = config.accentVar;
  const isGold = config.accent === 'gold';
  const isMagenta = config.accent === 'accent-2';
  const sunsetTempo = isGold ? 0.85 : isMagenta ? 0.65 : 0.45;
  const sunsetIntensity = isGold ? 1.1 : isMagenta ? 1.0 : 0.9;

  return (
    <section className="relative min-h-[96vh] pt-32 md:pt-40 pb-24 overflow-hidden">
      <div className="absolute inset-0">
        <DigitalSunset tempo={sunsetTempo} intensity={sunsetIntensity} id={`tier-${config.id}-sunset`} />
      </div>
      <div className="absolute inset-0 scanlines opacity-25 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70vw 50vh at 50% 80%, color-mix(in oklab, ${accent} 22%, transparent), transparent 60%)`,
        }}
      />

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10">
        <FadeUp delay={100}>
          <a href="/" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-2 hover:text-1 transition">
            <Icon.ArrowLeft className="w-3 h-3" /> TrendivaLux · All Tiers
          </a>
        </FadeUp>

        <FadeUp delay={200} className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color: accent }}>
              <span className="h-px w-10" style={{ background: `color-mix(in oklab, ${accent} 60%, transparent)` }} />
              <span>{config.eyebrow}</span>
            </div>
            {(config as any).badge && (
              <span
                className="px-2.5 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{ background: accent, color: isGold ? '#000' : '#fff' }}
              >
                {(config as any).badge}
              </span>
            )}
          </div>
        </FadeUp>

        <FadeUp delay={350} className="mt-6">
          <h1
            className="font-marquee text-[clamp(3.5rem,13vw,11rem)] leading-[0.88] tracking-tight tier-name-float"
            style={{
              color: 'transparent',
              WebkitTextStroke: `1.6px color-mix(in oklab, ${accent} 90%, white)`,
              textShadow: `0 0 8px color-mix(in oklab, ${accent} 80%, transparent), 0 0 28px color-mix(in oklab, ${accent} 55%, transparent), 0 0 60px color-mix(in oklab, ${accent} 32%, transparent), 0 0 120px color-mix(in oklab, ${accent} 18%, transparent)`,
            }}
          >
            {config.name.toUpperCase()}
          </h1>
        </FadeUp>

        <FadeUp delay={550} className="mt-8">
          <h2 className="font-display font-bold text-[clamp(2rem,5vw,4rem)] leading-[1.0] tracking-display max-w-[900px] text-1">
            {config.heroTagline.split(' ').map((w, i, arr) => {
              const isAccent = i === arr.length - 1;
              return (
                <span key={i} style={isAccent ? { color: accent } : {}}>
                  {w}
                  {i < arr.length - 1 ? ' ' : ''}
                </span>
              );
            })}
          </h2>
        </FadeUp>

        <FadeUp delay={750} className="mt-6 max-w-[640px]">
          <p className="text-2 text-lg md:text-xl leading-relaxed">{config.heroSubline}</p>
        </FadeUp>

        <FadeUp delay={950} className="mt-10">
          <div
            className="relative inline-flex flex-wrap items-end gap-x-10 gap-y-4 p-6 rounded-2xl border bd overflow-hidden tier-price-card"
            style={{
              background: 'color-mix(in oklab, var(--surface) 60%, transparent)',
              backdropFilter: 'blur(8px)',
              boxShadow: `0 30px 80px -30px color-mix(in oklab, ${accent} 50%, transparent), inset 0 1px 0 color-mix(in oklab, var(--text) 14%, transparent), inset 0 -1px 0 color-mix(in oklab, ${accent} 38%, transparent)`,
            }}
          >
            <span
              className="absolute inset-0 pointer-events-none tier-price-sweep"
              style={{ background: `linear-gradient(110deg, transparent 30%, color-mix(in oklab, ${accent} 22%, transparent) 50%, transparent 70%)` }}
            />
            <div className="relative">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-mut">Investment</div>
              <div
                className="font-display font-bold text-5xl md:text-6xl mt-1 text-1"
                style={{ textShadow: `0 0 24px color-mix(in oklab, ${accent} 35%, transparent)` }}
              >
                {config.priceLabel}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut mt-1">50% to start · 50% on launch</div>
            </div>
            <div className="h-12 w-px hidden md:block relative" style={{ background: 'var(--border)' }} />
            <div className="relative">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-mut">Timeline</div>
              <div className="font-display font-bold text-5xl md:text-6xl mt-1" style={{ color: accent, textShadow: `0 0 24px color-mix(in oklab, ${accent} 50%, transparent)` }}>
                {config.timeline}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut mt-1">{config.timelineRange}</div>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={1150} className="mt-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.openOrderModal?.(config.id)}
            className="gold-pulse group inline-flex items-center gap-2.5 pl-6 pr-5 py-3.5 rounded-full font-mono text-[12px] font-bold uppercase tracking-[0.18em]"
            style={{ background: 'var(--gold)', color: '#000' }}
          >
            Reserve Your Slot
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/15 group-hover:translate-x-0.5 transition">
              <Icon.ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
          <a
            href="#features"
            className="group inline-flex items-center gap-2 pl-5 pr-4 py-3.5 rounded-full border font-mono text-[12px] font-semibold uppercase tracking-[0.18em] transition"
            style={{ color: accent, borderColor: `color-mix(in oklab, ${accent} 50%, transparent)` }}
          >
            See What's Included
            <Icon.ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition" />
          </a>
        </FadeUp>

        <FadeUp delay={1350} className="mt-16">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden border bd max-w-[820px]"
            style={{ background: 'var(--border)' }}
          >
            {[
              ['Δ Build', config.timeline, accent],
              ['Λ Quality', '95+', 'var(--accent-2)'],
              [
                'Σ Pages',
                config.id === 'landing'
                  ? '1'
                  : config.id === 'business'
                  ? '5–7'
                  : config.id === 'store'
                  ? '6–9'
                  : config.id === 'webapp'
                  ? '8+'
                  : '∞',
                'var(--gold)',
              ],
              ['Ω Yours', '100%', accent],
            ].map(([k, v, c]) => (
              <div key={k as string} className="px-5 py-5 relative overflow-hidden group" style={{ background: 'var(--bg)' }}>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-mut">{k}</div>
                <div
                  className="font-display font-bold text-2xl md:text-3xl mt-1.5 transition-all"
                  style={{
                    color: c as string,
                    textShadow: `0 0 16px color-mix(in oklab, ${c} 40%, transparent)`,
                  }}
                >
                  {v}
                </div>
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(110deg, transparent 40%, color-mix(in oklab, ${c} 14%, transparent) 50%, transparent 60%)` }}
                />
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

const TierMarquee = ({ config }: { config: TierConfig }) => {
  const accent = config.accentVar;
  const items = [
    `★ ${config.name.toUpperCase()}`,
    config.priceLabel,
    config.timeline,
    'BUILT IN DÜREN, DE',
    '7-DAY REFUND',
    'FULL OWNERSHIP',
    'NO LOCK-IN',
    `★ ${config.eyebrow.replace('// ', '')}`,
  ];
  const tripled = [...items, ...items, ...items];

  return (
    <section
      className="relative py-6 overflow-hidden border-y bd"
      style={{
        background: `linear-gradient(90deg, var(--surface), color-mix(in oklab, ${accent} 8%, var(--surface)), var(--surface))`,
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, var(--bg), transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(-90deg, var(--bg), transparent)' }}
      />

      <div className="flex items-center whitespace-nowrap tier-marquee-track">
        {tripled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-6 mx-6 font-marquee text-[clamp(1.5rem,3vw,2.4rem)] leading-none"
            style={{
              color: i % 4 === 1 ? accent : 'transparent',
              WebkitTextStroke: i % 4 === 1 ? 'none' : `1px color-mix(in oklab, ${accent} 65%, var(--text))`,
              textShadow: i % 4 === 1 ? `0 0 22px color-mix(in oklab, ${accent} 50%, transparent)` : 'none',
              letterSpacing: '0.04em',
            }}
          >
            {item}
            <span className="text-mut text-2xl mx-2 opacity-50">◆</span>
          </span>
        ))}
      </div>
    </section>
  );
};

const BestForGrid = ({ config }: { config: TierConfig }) => {
  const accent = config.accentVar;
  return (
    <section className="relative py-20 md:py-28 bg-app overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-30" />
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-10">
          <Reveal>
            <div
              className="rounded-2xl border bd p-7 lg:p-9 h-full"
              style={{
                background: 'color-mix(in oklab, var(--surface) 60%, transparent)',
                boxShadow: `0 0 0 1px color-mix(in oklab, ${accent} 18%, transparent) inset`,
              }}
            >
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: accent }}>
                <span className="grid place-items-center w-5 h-5 rounded-full" style={{ background: `color-mix(in oklab, ${accent} 18%, transparent)`, border: `1px solid ${accent}` }}>
                  <Icon.Check className="w-3 h-3" style={{ color: accent }} />
                </span>
                <span>// BEST FOR</span>
              </div>
              <h3 className="font-display font-bold text-2xl md:text-3xl tracking-tight mt-4 text-1">
                You'll get the most value from <span style={{ color: accent }}>{config.name}</span> if you're:
              </h3>
              <ul className="mt-6 space-y-3">
                {config.bestFor.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-2 text-base leading-relaxed">
                    <span className="mt-[10px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
                    <span className="flex-1 min-w-0">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-2xl border bd p-7 lg:p-9 h-full" style={{ background: 'color-mix(in oklab, var(--surface-2) 50%, transparent)' }}>
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-mut">
                <span className="grid place-items-center w-5 h-5 rounded-full border bd">
                  <span className="w-2 h-px" style={{ background: 'var(--text-muted)' }} />
                </span>
                <span>// NOT INCLUDED IN THIS TIER</span>
              </div>
              <h3 className="font-display font-bold text-2xl md:text-3xl tracking-tight mt-4 text-1">If you need:</h3>
              <ul className="mt-6 space-y-3">
                {config.notIncluded.map((n, i) => (
                  <li key={i} className="flex items-start gap-3 text-2 text-base leading-relaxed">
                    <span className="mt-[10px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--text-muted)' }} />
                    <span className="flex-1 min-w-0">{n}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 pt-6 border-t bd font-mono text-[10px] uppercase tracking-[0.22em] text-mut">
                See <a href="/#offers" className="accent underline hover:opacity-70">all 5 tiers</a> to compare.
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const DeepFeatures = ({ config }: { config: TierConfig }) => {
  const accent = config.accentVar;
  return (
    <section id="features" className="relative py-24 md:py-32 bg-app overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <Orbs density={0.3} />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color: accent }}>
              <span className="h-px w-10" style={{ background: `color-mix(in oklab, ${accent} 60%, transparent)` }} />
              <span>// WHAT YOU GET</span>
            </div>
            <h2 className="font-display font-bold tracking-display mt-4 text-[clamp(2rem,4.5vw,3.4rem)] leading-[0.98] text-1">
              Every line. Every feature. <span style={{ color: accent }}>Itemized.</span>
            </h2>
            <p className="text-2 text-lg leading-relaxed mt-5">No vague bullet points. Every feature explained — what it is, why it matters, how it ships.</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {config.deepFeatures.map((f, i) => {
            const IconComp = TierIcons[f.icon] || TierIcons.Spark;
            const featureNum = String(i + 1).padStart(2, '0');
            return (
              <Reveal key={f.title} delay={i * 80}>
                <div
                  className="group relative h-full p-7 rounded-2xl border bd transition-all duration-500 hover:-translate-y-1.5 neon-edge rim-light overflow-hidden"
                  style={{
                    background: 'color-mix(in oklab, var(--surface) 70%, transparent)',
                    boxShadow: `0 18px 40px -22px color-mix(in oklab, ${accent} 25%, transparent)`,
                  }}
                  onMouseMove={(e) => {
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    (e.currentTarget as HTMLElement).style.setProperty('--mx', `${e.clientX - r.left}px`);
                    (e.currentTarget as HTMLElement).style.setProperty('--my', `${e.clientY - r.top}px`);
                  }}
                >
                  <div
                    className="absolute -top-3 -right-2 font-marquee leading-none pointer-events-none select-none transition-all duration-500 opacity-30 group-hover:opacity-90 group-hover:scale-105"
                    style={{
                      fontSize: '82px',
                      color: 'transparent',
                      WebkitTextStroke: `1px color-mix(in oklab, ${accent} 35%, transparent)`,
                    }}
                  >
                    {featureNum}
                  </div>
                  <div
                    className="relative grid place-items-center w-14 h-14 rounded-xl border transition-all duration-500 group-hover:scale-110"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, color-mix(in oklab, ${accent} 24%, transparent), color-mix(in oklab, ${accent} 6%, transparent))`,
                      borderColor: `color-mix(in oklab, ${accent} 50%, transparent)`,
                      color: accent,
                      boxShadow: `0 0 24px color-mix(in oklab, ${accent} 40%, transparent), inset 0 1px 0 color-mix(in oklab, var(--text) 16%, transparent)`,
                    }}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="font-display font-bold text-xl tracking-tight mt-5 text-1 relative">{f.title}</div>
                  <p className="text-2 text-sm leading-relaxed mt-2.5 relative">{f.body}</p>
                  <span
                    className="absolute bottom-0 inset-x-7 h-px transition-opacity duration-500 opacity-50 group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                  />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const TierProcess = ({ config }: { config: TierConfig }) => {
  const accent = config.accentVar;
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            config.timelineSteps.forEach((_, i) => setTimeout(() => setActive((prev) => Math.max(prev, i)), 200 + i * 220));
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [config]);
  const progress = active < 0 ? 0 : ((active + 1) / config.timelineSteps.length) * 100;

  return (
    <section className="relative py-24 md:py-32 bg-app overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-30" />
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color: accent }}>
              <span className="h-px w-10" style={{ background: `color-mix(in oklab, ${accent} 60%, transparent)` }} />
              <span>// HOW WE BUILD {config.name.toUpperCase()}</span>
            </div>
            <h2 className="font-display font-bold tracking-display mt-4 text-[clamp(2rem,4.5vw,3.4rem)] leading-[0.98] text-1">
              {config.timelineSteps.length} phases. <span style={{ color: accent }}>{config.timeline}.</span>
            </h2>
            <p className="text-2 text-lg leading-relaxed mt-5">
              {config.timelineRange}. No surprises. Daily Loom updates from Day 1.
            </p>
          </div>
        </Reveal>

        <div ref={ref} className="relative">
          <div className="hidden lg:block absolute left-0 right-0 top-[64px] h-px" style={{ background: 'var(--border)' }} />
          <div
            className="hidden lg:block absolute left-0 top-[64px] h-px transition-[width] duration-1000"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accent}, color-mix(in oklab, ${accent} 60%, var(--accent-2)))`,
              boxShadow: `0 0 12px color-mix(in oklab, ${accent} 60%, transparent)`,
            }}
          />

          <ol className={`grid grid-cols-1 md:grid-cols-2 ${config.timelineSteps.length > 4 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-8 lg:gap-6`}>
            {config.timelineSteps.map((s, i) => {
              const lit = active >= i;
              return (
                <li key={s.n} className="relative">
                  <div className="flex items-center gap-4 lg:block">
                    <div
                      className="relative w-16 h-16 lg:w-[52px] lg:h-[52px] grid place-items-center rounded-xl border transition-all duration-500"
                      style={{
                        borderColor: lit ? accent : 'var(--border)',
                        background: lit ? `color-mix(in oklab, ${accent} 10%, transparent)` : 'var(--surface)',
                        boxShadow: lit ? `0 0 30px color-mix(in oklab, ${accent} 45%, transparent), 0 0 0 4px color-mix(in oklab, ${accent} 8%, transparent) inset` : 'none',
                      }}
                    >
                      <span className="font-mono font-bold text-lg lg:text-base" style={{ color: lit ? accent : 'var(--text-muted)' }}>
                        {s.n}
                      </span>
                    </div>
                    <div className="lg:hidden">
                      <div className="font-display font-bold text-xl text-1">{s.title}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--accent-2)' }}>
                        {s.range}
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block mt-6">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--accent-2)' }}>
                      {s.range}
                    </div>
                    <div className="font-display font-bold text-2xl mt-1.5 text-1">{s.title}</div>
                  </div>
                  <p className="text-2 text-sm leading-relaxed mt-3 lg:max-w-[260px]">{s.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};

const TierExamples = ({ config }: { config: TierConfig }) => {
  const accent = config.accentVar;
  return (
    <section className="relative py-20 md:py-28 bg-app overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-30" />
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color: accent }}>
                <span className="h-px w-10" style={{ background: `color-mix(in oklab, ${accent} 60%, transparent)` }} />
                <span>// {config.name.toUpperCase()} BUILDS</span>
              </div>
              <h2 className="font-display font-bold tracking-display mt-4 text-[clamp(1.7rem,3.5vw,2.8rem)] leading-[1.0] text-1">
                Real businesses. Real launches.
              </h2>
            </div>
            <a href="/#builds" className="font-mono text-[11px] uppercase tracking-[0.22em] inline-flex items-center gap-2 transition" style={{ color: accent }}>
              See full case-study archive <Icon.ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {config.examples.map((ex, i) => (
            <Reveal key={ex.name} delay={i * 100}>
              <div
                className="group relative h-full rounded-2xl border bd overflow-hidden transition-all duration-500 hover:-translate-y-1 neon-edge"
                style={{ background: 'color-mix(in oklab, var(--surface) 70%, transparent)' }}
              >
                <div
                  className="aspect-[4/3] relative overflow-hidden border-b bd"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 30%, var(--surface-2)), var(--surface-2) 60%, color-mix(in oklab, var(--accent-2) 25%, var(--surface-2)))`,
                  }}
                >
                  <div className="absolute inset-0 grid-floor opacity-30" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div
                      className="font-marquee text-[clamp(2rem,5vw,3rem)] tracking-tight"
                      style={{
                        color: 'transparent',
                        WebkitTextStroke: `1px color-mix(in oklab, ${accent} 80%, white)`,
                        textShadow: `0 0 16px color-mix(in oklab, ${accent} 60%, transparent)`,
                      }}
                    >
                      {ex.name.split(' ')[0].toUpperCase()}
                    </div>
                  </div>
                  <div
                    className="absolute top-3 right-3 px-2 py-1 rounded-md font-mono text-[9px] uppercase tracking-[0.22em]"
                    style={{ background: 'rgba(0,0,0,0.5)', color: accent }}
                  >
                    LIVE
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-mut">{ex.role}</div>
                  <div className="font-display font-bold text-xl tracking-tight mt-1.5 text-1">{ex.name}</div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t bd">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: accent }}>
                      {ex.stat}
                    </span>
                    {ex.url !== '#' && <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut">{ex.url} ↗</span>}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const TierFAQ = ({ config }: { config: TierConfig }) => {
  const accent = config.accentVar;
  const [open, setOpen] = useState(0);
  return (
    <section className="relative py-24 md:py-32 bg-app overflow-hidden">
      <div className="relative max-w-[1100px] mx-auto px-6 lg:px-10">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color: accent }}>
              <span className="h-px w-10" style={{ background: `color-mix(in oklab, ${accent} 60%, transparent)` }} />
              <span>// {config.name.toUpperCase()} QUESTIONS</span>
            </div>
            <h2 className="font-display font-bold tracking-display mt-4 text-[clamp(2rem,4.5vw,3.4rem)] leading-[0.98] text-1">The answers that matter.</h2>
          </div>
        </Reveal>

        <div className="space-y-3">
          {config.faq.map((qa, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={i * 60}>
                <div
                  className="rounded-xl border bd overflow-hidden"
                  style={{
                    background: 'color-mix(in oklab, var(--surface) 70%, transparent)',
                    borderColor: isOpen ? `color-mix(in oklab, ${accent} 40%, var(--border))` : 'var(--border)',
                    boxShadow: isOpen ? `0 0 0 1px color-mix(in oklab, ${accent} 25%, transparent) inset` : 'none',
                  }}
                >
                  <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left transition">
                    <span className="font-display font-semibold text-base md:text-lg text-1">{qa.q}</span>
                    <span
                      className="shrink-0 grid place-items-center w-7 h-7 rounded-full border bd transition"
                      style={{
                        borderColor: isOpen ? accent : 'var(--border)',
                        color: isOpen ? accent : 'var(--text-muted)',
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}
                    >
                      <Icon.Plus className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <div className="overflow-hidden transition-[max-height] duration-500" style={{ maxHeight: isOpen ? '400px' : '0' }}>
                    <div className="px-6 pb-5 text-2 text-sm md:text-base leading-relaxed">{qa.a}</div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const TierFinalCTA = ({ config }: { config: TierConfig }) => {
  const accent = config.accentVar;
  return (
    <section className="relative py-28 md:py-36 bg-app overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-40" />
      <Orbs density={0.5} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80vw 50vh at 50% 50%, color-mix(in oklab, ${accent} 14%, transparent), transparent 70%)`,
        }}
      />

      <div className="relative max-w-[900px] mx-auto px-6 lg:px-10 text-center">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] gold">// LAST STEP</div>
          <h3 className="font-display font-bold tracking-display mt-4 text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.95] text-1">
            Reserve your <span style={{ color: accent }}>{config.name}</span> build.
          </h3>
          <p className="text-2 text-lg leading-relaxed max-w-[560px] mx-auto mt-6">
            50% to start. Work begins the moment your deposit lands. Final 50% only after you approve the live site.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.openOrderModal?.(config.id)}
              className="gold-pulse group inline-flex items-center gap-2.5 pl-6 pr-5 py-3.5 rounded-full font-mono text-[12px] font-bold uppercase tracking-[0.18em]"
              style={{ background: 'var(--gold)', color: '#000' }}
            >
              Reserve {config.name} — €{Math.round(config.price / 2).toLocaleString()} deposit
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/15 group-hover:translate-x-0.5 transition">
                <Icon.ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
            <a
              href="/#offers"
              className="group inline-flex items-center gap-2 pl-5 pr-4 py-3.5 rounded-full border font-mono text-[12px] font-semibold uppercase tracking-[0.18em] transition"
              style={{ color: accent, borderColor: `color-mix(in oklab, ${accent} 50%, transparent)` }}
            >
              Compare All Tiers
              <Icon.ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export const TierPage = ({ config }: { config: TierConfig }) => {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tdl-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    const h = new Date().getHours();
    return h >= 6 && h < 18 ? 'light' : 'dark';
  });
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderTier, setOrderTier] = useState(config.id);
  const [contactOpen, setContactOpen] = useState(false);

  const openOrder = (tierId: string = config.id) => {
    setOrderTier(tierId);
    setOrderOpen(true);
  };

  useEffect(() => {
    window.openOrderModal = openOrder;
    window.openContactModal = () => setContactOpen(true);
    return () => {
      delete window.openOrderModal;
      delete window.openContactModal;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('tdl-theme', next);
      } catch (e) {}
      return next;
    });

  useEffect(() => {
    document.title = `${config.name} — TrendivaLux`;
  }, [config.name]);

  return (
    <div className="relative">
      <TopNav scrolled={scrolled} theme={theme} onToggle={toggleTheme} />
      <TierHero config={config} />
      <TierMarquee config={config} />
      <BestForGrid config={config} />
      <DeepFeatures config={config} />
      <TierProcess config={config} />
      <TierExamples config={config} />
      <TierFAQ config={config} />
      <TierFinalCTA config={config} />
      <Footer theme={theme} />
      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} initialTier={orderTier} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
};

export default TierPage;
