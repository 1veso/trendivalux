import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import { DigitalSunset, Vignette } from './Atmosphere';

export const useScrollY = () => {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return y;
};

export const StaggerWords = ({
  text,
  delay = 0,
  className = '',
  wordClassName = '',
}: {
  text: string;
  delay?: number;
  className?: string;
  wordClassName?: string;
}) => {
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-baseline">
          <span
            className={`inline-block ${wordClassName}`}
            style={{
              animation: `word-rise 1000ms cubic-bezier(.2,.7,.1,1) both`,
              animationDelay: `${delay + i * 90}ms`,
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
      <style>{`@keyframes word-rise { from { transform: translateY(115%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </span>
  );
};

export const FadeUp = ({
  children,
  delay = 0,
  y = 24,
  className = '',
  as: As = 'div' as any,
}: {
  children: any;
  delay?: number;
  y?: number;
  className?: string;
  as?: any;
}) => (
  <As
    className={className}
    style={{
      animation: `fade-up 900ms cubic-bezier(.2,.7,.1,1) both`,
      animationDelay: `${delay}ms`,
    }}
  >
    {children}
    <style>{`@keyframes fade-up { from { transform: translateY(${y}px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
  </As>
);

export const Tilt = ({
  children,
  className = '',
  max = 6,
  glow = true,
}: {
  children: any;
  className?: string;
  max?: number;
  glow?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`;
    if (glow) {
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  };
  return (
    <div
      ref={ref}
      className={`transition-transform duration-300 ease-out will-change-transform ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
};

export const ThemeToggle = ({ theme, onToggle }: { theme: string; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="relative w-14 h-7 rounded-full border bd flex items-center px-0.5 transition group"
    style={{ background: 'var(--surface-2)' }}
    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
  >
    <span
      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition"
      style={{ background: 'linear-gradient(90deg, var(--accent-2), var(--accent))', filter: 'blur(8px)' }}
    />
    <span
      className={`relative w-6 h-6 rounded-full transition-all duration-500 grid place-items-center ${
        theme === 'dark' ? 'translate-x-0' : 'translate-x-7'
      }`}
      style={{
        background:
          theme === 'dark'
            ? 'radial-gradient(circle at 30% 30%, #00E5D4, #0A0A12)'
            : 'radial-gradient(circle at 30% 30%, #FF8FB3, #C8147E)',
        boxShadow:
          theme === 'dark' ? '0 0 12px rgba(0,229,212,0.6)' : '0 0 12px rgba(255,143,179,0.7)',
      }}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" className="w-3 h-3">
          <path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" className="w-3 h-3">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </span>
  </button>
);

export const TopNav = ({
  scrolled,
  theme,
  onToggle,
}: {
  scrolled: boolean;
  theme: string;
  onToggle: () => void;
}) => {
  const logoSrc = theme === 'dark' ? '/logo_dusk.png' : '/logo_dawn.png';
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b ${scrolled ? 'backdrop-blur-xl' : ''}`}
      style={{
        background: scrolled ? 'color-mix(in oklab, var(--bg) 65%, transparent)' : 'transparent',
        borderColor: scrolled ? 'var(--border)' : 'transparent',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3 group">
          <div
            className="relative w-11 h-11 rounded-lg overflow-hidden grid place-items-center transition"
            style={{
              background: theme === 'dark' ? '#0A0A12' : '#FFFFFF',
              boxShadow:
                theme === 'dark'
                  ? '0 0 0 1px rgba(0,229,212,0.25) inset, 0 6px 18px -6px rgba(0,229,212,0.35)'
                  : '0 0 0 1px rgba(200,20,126,0.18) inset, 0 6px 18px -8px rgba(255,107,154,0.45)',
            }}
          >
            <span
              className="absolute inset-0 rounded-lg opacity-60 group-hover:opacity-100 transition"
              style={{
                background:
                  theme === 'dark'
                    ? 'radial-gradient(circle at 50% 60%, rgba(0,229,212,0.30), transparent 65%)'
                    : 'radial-gradient(circle at 50% 60%, rgba(255,143,179,0.30), transparent 65%)',
                filter: 'blur(6px)',
              }}
            />
            <img
              src={logoSrc}
              alt="TrendivaLux"
              className="relative w-9 h-9 object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="leading-none">
            <div className="font-marquee text-[15px] tracking-[0.06em] text-1 uppercase">
              TRENDIVA<span className="accent-2">LUX</span>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-mut mt-1">Cinematic · Düren</div>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-7 font-mono text-[11px] uppercase tracking-[0.22em] text-2">
          <a href="#builds" className="nav-link group">
            <span className="nav-link__bracket">[</span>Builds<span className="nav-link__bracket">]</span>
            <span className="nav-link__rule" />
          </a>
          <a href="#offers" className="nav-link group">
            <span className="nav-link__bracket">[</span>Offers<span className="nav-link__bracket">]</span>
            <span className="nav-link__rule" />
          </a>
          <a href="#contact" className="nav-link group">
            <span className="nav-link__bracket">[</span>Contact<span className="nav-link__bracket">]</span>
            <span className="nav-link__rule" />
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} onToggle={onToggle} />
          <button
            onClick={() => window.openOrderModal?.('landing')}
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[11px] font-semibold uppercase tracking-widest gold-pulse"
            style={{ background: 'var(--gold)', color: '#000' }}
          >
            Start Yours
          </button>
        </div>
      </div>
    </header>
  );
};

export const Hero = ({ theme }: { theme: string }) => {
  const y = useScrollY();
  const parallaxOrbs = Math.min(y * 0.12, 120);
  const fade = Math.max(0, 1 - y / 700);

  const [confirmKey, setConfirmKey] = useState(0);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const triggerConfirm = (which: string) => {
    setConfirmTarget(which);
    setConfirmKey((k) => k + 1);
    window.setTimeout(() => setConfirmTarget(null), 650);
  };

  const eyebrow = '// CINEMATIC WEBSITES';
  const eyebrowAccent = theme === 'dark' ? 'DÜREN → GLOBAL · DUSK MODE' : 'DÜREN → GLOBAL · DAWN MODE';

  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden bg-app">
      <div className="absolute inset-0" style={{ transform: `translateY(${parallaxOrbs * 0.3}px)` }}>
        <DigitalSunset tempo={0.4} intensity={0.95} id="hero-sunset" />
      </div>
      <Vignette />

      <div className="hidden md:block absolute top-24 left-6 lg:left-10 z-10 opacity-70">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <polygon points="60,6 110,33 110,87 60,114 10,87 10,33" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1" />
          <polygon points="60,18 98,40 98,80 60,102 22,80 22,40" stroke="var(--accent-2)" strokeOpacity="0.3" strokeWidth="1" />
          <circle cx="60" cy="60" r="2" fill="var(--accent)" />
        </svg>
      </div>
      <div
        className="hidden md:flex absolute top-24 right-6 lg:right-10 z-10 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em]"
        style={{ color: 'color-mix(in oklab, var(--accent) 80%, transparent)' }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
        <span>SYS · BOOKING_OPEN</span>
        <span className="text-mut">/ R59 · R60 · CC</span>
      </div>

      <div
        className="relative z-20 max-w-[1400px] mx-auto px-6 lg:px-10 pt-36 md:pt-44 pb-24 md:pb-32"
        style={{ opacity: fade, transform: `translateY(${y * 0.08}px)` }}
      >
        <FadeUp delay={300}>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] accent">
            <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent) 60%, transparent)' }} />
            <span>{eyebrow}</span>
            <span className="text-mut">//</span>
            <span className="accent-2">{eyebrowAccent}</span>
          </div>
        </FadeUp>

        <div className="relative mt-7">
          <div className="absolute inset-0 -m-6 pointer-events-none hero-headline-halo" />
          <h1 className="font-marquee relative text-[clamp(2.2rem,6.6vw,6rem)] leading-[1.02] uppercase">
            <div className="neon-tube">
              <StaggerWords text="Your website" delay={700} />
            </div>
            <div className="neon-tube-pink mt-1">
              <StaggerWords text="should move" delay={900} />
            </div>
            <div className="neon-tube mt-1">
              <StaggerWords text="the room." delay={1100} />
            </div>
          </h1>
        </div>
        <h2 className="font-display font-bold tracking-display mt-6 text-[clamp(1.5rem,3.4vw,2.8rem)] leading-[1.02] text-1 max-w-[760px]">
          <StaggerWords text="Most websites are PDFs with a hover state." delay={1400} />{' '}
          <span className="inline-block overflow-hidden align-baseline">
            <span
              className="inline-block font-script grad-text"
              style={{ animation: 'word-rise 1000ms cubic-bezier(.2,.7,.1,1) both', animationDelay: '1620ms', fontWeight: 600 }}
            >
              We build cinematic ones that move you.
            </span>
          </span>
        </h2>

        <FadeUp delay={1700} className="mt-7 max-w-[640px]">
          <p className="text-2 text-lg leading-relaxed">
            Premium motion-driven sites for businesses that want to stop being scrolled past. Built solo. Deployed globally.{' '}
            <span className="text-1">Yours forever.</span>
          </p>
        </FadeUp>

        <FadeUp delay={1900} className="mt-9 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              triggerConfirm('reserve');
              window.openOrderModal?.('landing');
            }}
            data-confirming={confirmTarget === 'reserve' || undefined}
            key={`reserve-${confirmKey}`}
            className="hero-cta hero-cta--gold group relative inline-flex items-center gap-2.5 pl-6 pr-5 py-3.5 rounded-full font-mono text-[12px] font-bold uppercase tracking-[0.18em] overflow-visible"
            style={{ background: 'var(--gold)', color: '#000' }}
          >
            <span className="relative z-[1] inline-flex items-center gap-2.5">
              Let's Build Yours
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/15 group-hover:translate-x-0.5 transition">
                <Icon.ArrowRight className="w-3.5 h-3.5" />
              </span>
            </span>
          </button>
          <a
            href="#builds"
            onClick={() => triggerConfirm('builds')}
            data-confirming={confirmTarget === 'builds' || undefined}
            key={`builds-${confirmKey}`}
            className="hero-cta hero-cta--ghost group relative inline-flex items-center gap-2 pl-5 pr-4 py-3.5 rounded-full border accent font-mono text-[12px] font-semibold uppercase tracking-[0.18em] transition overflow-visible"
            style={{ borderColor: 'color-mix(in oklab, var(--accent) 50%, transparent)' }}
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              See It In Action
              <Icon.ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </span>
          </a>
        </FadeUp>

        <FadeUp delay={2100} className="mt-8 inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent-2)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent-2)' }} />
          </span>
          <span>2 Slots Remaining For This Month</span>
        </FadeUp>

        <FadeUp delay={2300} className="mt-16 max-w-[720px]">
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-app rounded-xl overflow-hidden border bd"
            style={{ background: 'var(--border)' }}
          >
            {[
              ['Δ Build', '3—42 d'],
              ['Stack', 'Cinematic'],
              ['Hosting', 'Cloudflare'],
              ['Ownership', '100%'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="bg-surface backdrop-blur-sm px-4 py-3"
                style={{ background: 'color-mix(in oklab, var(--surface) 80%, transparent)' }}
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-mut">{k}</div>
                <div className="font-display font-semibold text-sm mt-1 text-1">{v}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-6 z-30 flex flex-col items-center gap-2 text-mut font-mono text-[10px] uppercase tracking-[0.3em]"
        style={{ opacity: fade }}
      >
        <span>Scroll</span>
        <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, var(--accent), transparent)' }} />
      </div>
    </section>
  );
};

export default Hero;
