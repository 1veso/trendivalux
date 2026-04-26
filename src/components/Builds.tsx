import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icons';
import { Orbs } from './Atmosphere';

const BUILDS = [
  {
    id: 'knzn',
    title: 'KNZN',
    subtitle: 'License-Plate Commerce',
    label: 'COMMERCE / DÜREN',
    url: 'https://knzn.pages.dev',
    href: 'https://knzn.pages.dev',
    blurb:
      'A full-funnel German Zulassungsdienst commerce site with cinematic GSAP scroll, an embedded AI customer-service agent, and a Lottie stamp ceremony at checkout. €4,200+ first-month revenue.',
    stack: ['Cloudflare', 'Stripe', 'Supabase', 'GSAP', 'Klaus AI'],
    accentVar: 'var(--accent-2)',
    posterGlyph: 'DN-TL · 1984',
    posterMotif: 'plate',
  },
  {
    id: 'aurion',
    title: 'Aurion',
    subtitle: 'Peptide Research Platform',
    label: 'E-COMMERCE / LAB',
    url: 'https://aurionlabs.shop',
    href: 'https://aurionlabs.shop',
    blurb:
      'A 39-SKU peptide research storefront with COA transparency on every product, an AI compound-information chatbot, Stripe + Coinbase Commerce checkout, and DHL shipping API integration.',
    stack: ['React 19', 'Vite', 'Supabase', 'Stripe', 'Coinbase', 'DHL'],
    accentVar: 'var(--accent)',
    posterGlyph: 'C₂₀H₃₂N₆O₅',
    posterMotif: 'lab',
  },
  {
    id: 'getautomata',
    title: 'GetAutomata',
    subtitle: 'AI Automation Services',
    label: 'SISTER BRAND / SAAS',
    url: 'https://getautomata.ai',
    href: 'https://getautomata.ai',
    blurb:
      'Public-facing marketing landing built on the cinematic stack — converts visitors into automation clients while the dashboard delivers their workflows.',
    stack: ['TypeScript', 'React', 'Workers', 'n8n', 'OpenRouter'],
    accentVar: 'var(--accent)',
    posterGlyph: 'AUTO/MATA · OS',
    posterMotif: 'tron',
  },
  {
    id: 'mission',
    title: 'Mission Control',
    subtitle: 'GetAutomata Dashboard',
    label: 'DASHBOARD / PRIVATE',
    url: 'https://go.getautomata.ai',
    href: 'https://go.getautomata.ai',
    blurb:
      'The private agent-orchestration dashboard for GetAutomata clients — one design system, two products, end-to-end. Authenticated workflows, real-time runs, billing.',
    stack: ['Supabase', 'Stripe', 'Cloudflare', 'OpenRouter'],
    accentVar: 'var(--gold)',
    posterGlyph: 'GO · MISSION/CTRL',
    posterMotif: 'tron',
  },
  {
    id: 'amboss',
    title: 'Amboss Apparel',
    subtitle: 'Protective Streetwear',
    label: 'BRAND + STORE / DE',
    url: 'https://ambossapparel.com',
    href: 'https://ambossapparel.com',
    blurb:
      'A premium brand identity and storefront for an anti-stab protective apparel line — the intersection of fashion and personal safety, designed without compromise on either side.',
    stack: ['Shopify', 'GSAP', '3D Asset Pipeline'],
    accentVar: 'var(--accent-2)',
    posterGlyph: 'AMBOSS · KEVLAR',
    posterMotif: 'apparel',
  },
  {
    id: 'importia',
    title: 'Importia',
    subtitle: 'Cinematic Visitenkarte',
    label: 'IMPORT BRAND / DE',
    url: 'https://importia.pages.dev',
    href: 'https://importia.pages.dev',
    blurb:
      'A scroll-choreographed digital business card for an import brand — built on the cinematic-sites kit and deployed to Cloudflare Pages.',
    stack: ['Cloudflare', 'GSAP', 'Lenis'],
    accentVar: 'var(--accent)',
    posterGlyph: 'IMPORTIA · V',
    posterMotif: 'card',
  },
  {
    id: 'imkarton',
    title: 'Imkarton',
    subtitle: 'Cinematic Visitenkarte',
    label: 'PACKAGING / DE',
    url: 'https://imkarton.pages.dev',
    href: 'https://imkarton.pages.dev',
    blurb:
      "A sister Visitenkarte build to Importia — the same cinematic signature applied to a different brand category. Demonstrates the kit's tonal range.",
    stack: ['Cloudflare', 'GSAP', 'Lenis'],
    accentVar: 'var(--accent-2)',
    posterGlyph: 'IMKARTON · PKG',
    posterMotif: 'box',
  },
  {
    id: 'noquito',
    title: 'Noquito',
    subtitle: 'Bilingual DE/EN Landing',
    label: 'ANTI-MOSQUITO / B2C',
    url: 'https://noquito.pages.dev',
    href: 'https://noquito.pages.dev',
    blurb:
      'A cheeky, conversion-focused bilingual landing for a residential anti-mosquito screen brand. Demonstrates tonal range across the agency portfolio.',
    stack: ['Cloudflare', 'i18n', 'Stripe'],
    accentVar: 'var(--accent)',
    posterGlyph: 'NOQUITO · DE/EN',
    posterMotif: 'screen',
  },
];

type Build = (typeof BUILDS)[number];

const BrandPoster = ({ build }: { build: Build }) => {
  const motifs: Record<string, any> = {
    plate: (
      <svg viewBox="0 0 400 250" className="absolute inset-0 w-full h-full opacity-90">
        <defs>
          <linearGradient id={`p-${build.id}`} x1="0" x2="1">
            <stop offset="0" stopColor={build.accentVar} stopOpacity="0.0" />
            <stop offset="0.5" stopColor={build.accentVar} stopOpacity="0.5" />
            <stop offset="1" stopColor={build.accentVar} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <rect x="60" y="95" width="280" height="60" rx="6" fill="white" stroke={build.accentVar} strokeWidth="2" />
        <text x="200" y="138" textAnchor="middle" fontFamily="DM Mono" fontWeight="700" fontSize="28" fill="#0a0a12" letterSpacing="6">
          DN · TL · 1984
        </text>
        <line x1="0" y1="200" x2="400" y2="200" stroke={`url(#p-${build.id})`} strokeWidth="2" />
      </svg>
    ),
    lab: (
      <svg viewBox="0 0 400 250" className="absolute inset-0 w-full h-full opacity-80">
        {[...Array(6)].map((_, i) => (
          <circle key={i} cx={70 + i * 52} cy={125 + Math.sin(i) * 18} r="14" fill="none" stroke={build.accentVar} strokeWidth="1.2" />
        ))}
        {[...Array(5)].map((_, i) => (
          <line
            key={i}
            x1={84 + i * 52}
            y1={125 + Math.sin(i) * 18}
            x2={108 + i * 52}
            y2={125 + Math.sin(i + 1) * 18}
            stroke={build.accentVar}
            strokeWidth="1.2"
            opacity="0.6"
          />
        ))}
      </svg>
    ),
    tron: (
      <svg viewBox="0 0 400 250" className="absolute inset-0 w-full h-full opacity-80">
        <defs>
          <pattern id={`tron-${build.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 0L40 0L40 40" fill="none" stroke={build.accentVar} strokeWidth="0.6" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="400" height="250" fill={`url(#tron-${build.id})`} />
        <path d="M40 200 L160 130 L240 160 L360 80" fill="none" stroke={build.accentVar} strokeWidth="2" strokeLinecap="round" />
        {[40, 160, 240, 360].map((x, i) => (
          <circle key={i} cx={x} cy={[200, 130, 160, 80][i]} r="4" fill={build.accentVar} />
        ))}
      </svg>
    ),
    card: (
      <svg viewBox="0 0 400 250" className="absolute inset-0 w-full h-full opacity-85">
        <rect x="50" y="60" width="300" height="130" rx="10" fill="none" stroke={build.accentVar} strokeWidth="1.5" />
        <rect x="68" y="80" width="180" height="2" fill={build.accentVar} />
        <rect x="68" y="92" width="120" height="2" fill={build.accentVar} opacity="0.6" />
        <rect x="68" y="160" width="60" height="2" fill={build.accentVar} />
        <circle cx="310" cy="120" r="22" fill="none" stroke={build.accentVar} strokeWidth="1.5" />
      </svg>
    ),
    box: (
      <svg viewBox="0 0 400 250" className="absolute inset-0 w-full h-full opacity-85">
        <path d="M120 90 L200 60 L280 90 L280 180 L200 210 L120 180 Z" fill="none" stroke={build.accentVar} strokeWidth="1.5" />
        <path d="M120 90 L200 120 L280 90 M200 120 L200 210" fill="none" stroke={build.accentVar} strokeWidth="1.2" opacity="0.7" />
      </svg>
    ),
    apparel: (
      <svg viewBox="0 0 400 250" className="absolute inset-0 w-full h-full opacity-85">
        <path
          d="M150 80 L180 60 L220 60 L250 80 L280 100 L260 130 L240 120 L240 200 L160 200 L160 120 L140 130 L120 100 Z"
          fill="none"
          stroke={build.accentVar}
          strokeWidth="1.5"
        />
        <line x1="200" y1="60" x2="200" y2="200" stroke={build.accentVar} strokeWidth="0.6" opacity="0.5" strokeDasharray="3 3" />
      </svg>
    ),
    screen: (
      <svg viewBox="0 0 400 250" className="absolute inset-0 w-full h-full opacity-80">
        {[...Array(12)].map((_, i) => (
          <line key={`v${i}`} x1={80 + i * 20} y1="60" x2={80 + i * 20} y2="200" stroke={build.accentVar} strokeWidth="0.6" opacity="0.5" />
        ))}
        {[...Array(8)].map((_, i) => (
          <line key={`h${i}`} x1="80" y1={70 + i * 18} x2="320" y2={70 + i * 18} stroke={build.accentVar} strokeWidth="0.6" opacity="0.5" />
        ))}
      </svg>
    ),
  };
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, ${build.accentVar} 22%, transparent), transparent 60%),
                       radial-gradient(120% 90% at 80% 90%, color-mix(in oklab, var(--accent-2) 14%, transparent), transparent 65%),
                       var(--surface)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, color-mix(in oklab, var(--text) 4%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--text) 4%, transparent) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {motifs[build.posterMotif]}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div
            className="font-display font-bold text-3xl md:text-5xl tracking-tight chrome-text"
            style={{ filter: `drop-shadow(0 0 24px color-mix(in oklab, ${build.accentVar} 40%, transparent))` }}
          >
            {build.title}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] mt-2" style={{ color: build.accentVar }}>
            {build.posterGlyph}
          </div>
        </div>
      </div>
    </div>
  );
};

const GalleryCard = ({
  build,
  depth,
  distance,
  onActivate,
  isCenter,
  hover,
}: {
  build: Build;
  depth: number;
  distance: number;
  onActivate: () => void;
  isCenter: boolean;
  hover: boolean;
}) => {
  const angle = depth * -22;
  const x = depth * 64;
  const z = -distance * 220;
  const scale = 1 - Math.min(distance * 0.08, 0.32);
  const opacity = distance > 3 ? 0 : 1 - Math.min(distance * 0.18, 0.6);
  const filter = isCenter
    ? `drop-shadow(0 40px 60px color-mix(in oklab, ${build.accentVar} 18%, transparent)) drop-shadow(0 20px 40px rgba(0,0,0,0.4))`
    : `blur(${Math.min(distance * 0.6, 2.5)}px) brightness(${1 - Math.min(distance * 0.1, 0.35)})`;

  return (
    <div
      className="absolute top-1/2 left-1/2 will-change-transform pointer-events-none"
      style={{
        width: 'clamp(360px, 58vw, 760px)',
        height: 'clamp(260px, 42vw, 540px)',
        transform: `translate3d(calc(-50% + ${x}%), -50%, 0) perspective(1600px) rotateY(${angle}deg) translateZ(${z}px) scale(${scale})`,
        opacity,
        filter,
        transition: hover
          ? 'transform 700ms cubic-bezier(.2,.7,.1,1), opacity 700ms ease, filter 700ms ease'
          : 'transform 900ms cubic-bezier(.2,.7,.1,1), opacity 900ms ease, filter 900ms ease',
        zIndex: 100 - Math.round(distance * 10),
      }}
    >
      <a
        href={build.href}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => {
          if (!isCenter) {
            e.preventDefault();
            onActivate();
          }
        }}
        className="block w-full h-full pointer-events-auto group"
        style={{
          transform: isCenter ? `translateY(${hover ? -10 : 0}px)` : 'none',
          transition: 'transform 600ms cubic-bezier(.2,.7,.1,1)',
        }}
      >
        <div
          className="relative w-full h-full rounded-xl overflow-hidden border bd"
          style={{
            background: 'var(--surface)',
            boxShadow: isCenter
              ? `0 60px 90px -40px color-mix(in oklab, ${build.accentVar} 35%, transparent),
                 0 30px 60px -30px rgba(0,0,0,0.6),
                 inset 0 1px 0 0 color-mix(in oklab, var(--text) 8%, transparent)`
              : '0 30px 50px -25px rgba(0,0,0,0.6)',
            borderColor: isCenter ? `color-mix(in oklab, ${build.accentVar} 40%, var(--border))` : 'var(--border)',
          }}
        >
          <div
            className="relative h-9 flex items-center gap-2 px-3 border-b bd shrink-0"
            style={{ background: 'color-mix(in oklab, var(--surface-2) 80%, transparent)' }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'color-mix(in oklab, var(--accent-2) 70%, transparent)' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'color-mix(in oklab, var(--gold) 70%, transparent)' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'color-mix(in oklab, var(--accent) 70%, transparent)' }} />
            <div
              className="ml-3 flex-1 min-w-0 h-5 rounded border bd flex items-center px-2 font-mono text-[10px] text-mut truncate"
              style={{ background: 'color-mix(in oklab, var(--bg) 50%, transparent)' }}
            >
              <span className="accent mr-1.5">▸</span>
              <span className="truncate">{build.url.replace(/^https?:\/\//, '')}</span>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-mut hidden md:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
              LIVE
            </div>
          </div>

          <div className="relative" style={{ height: 'calc(100% - 36px)' }}>
            <BrandPoster build={build} />

            {distance < 1.5 && (
              <iframe
                src={build.url}
                title={build.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  border: 'none',
                  background: 'transparent',
                  opacity: isCenter ? 1 : 0.85,
                  transition: 'opacity 600ms ease',
                }}
              />
            )}

            <div
              className="absolute inset-x-0 bottom-0 p-4 md:p-5 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, color-mix(in oklab, var(--bg) 92%, transparent) 0%, color-mix(in oklab, var(--bg) 70%, transparent) 60%, transparent 100%)',
              }}
            >
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: build.accentVar }}>
                    {build.label}
                  </div>
                  <h3 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-1 truncate">{build.title}</h3>
                  <div className="text-2 text-sm mt-0.5 truncate">{build.subtitle}</div>
                </div>
                <span
                  className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] px-3 py-1.5 rounded-full border"
                  style={{
                    color: build.accentVar,
                    borderColor: `color-mix(in oklab, ${build.accentVar} 60%, transparent)`,
                    background: `color-mix(in oklab, ${build.accentVar} 10%, transparent)`,
                  }}
                >
                  Open <Icon.ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {[
              'top-2 left-2 border-t border-l',
              'top-2 right-2 border-t border-r',
              'bottom-2 left-2 border-b border-l',
              'bottom-2 right-2 border-b border-r',
            ].map((p, i) => (
              <span
                key={i}
                className={`absolute ${p} w-3 h-3 transition-opacity duration-500`}
                style={{ borderColor: build.accentVar, opacity: isCenter ? 0.7 : 0 }}
              />
            ))}
          </div>
        </div>

        {isCenter && (
          <div
            className="absolute left-0 right-0 top-full h-[40%] pointer-events-none"
            style={{
              transform: 'scaleY(-1) translateY(-2px)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 60%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 60%)',
            }}
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ background: 'var(--surface)' }}>
              <BrandPoster build={build} />
            </div>
          </div>
        )}
      </a>
    </div>
  );
};

const Particles = ({ accent }: { accent: string }) => {
  const seeds = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: 1 + Math.random() * 2.5,
        d: 8 + Math.random() * 16,
        o: 0.15 + Math.random() * 0.45,
        delay: -Math.random() * 14,
      })),
    [],
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {seeds.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            background: i % 3 === 0 ? accent : 'rgba(255,255,255,0.6)',
            opacity: p.o,
            filter: 'blur(0.5px)',
            animation: `dust-drift ${p.d}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            boxShadow: i % 3 === 0 ? `0 0 6px ${accent}` : 'none',
          }}
        />
      ))}
    </div>
  );
};

const Gallery = () => {
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [hover, setHover] = useState(false);
  const [auto, setAuto] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; active: number } | null>(null);

  useEffect(() => {
    if (!auto || hover) return;
    const t = setInterval(() => setActive((a) => (a + 1) % BUILDS.length), 7200);
    return () => clearInterval(t);
  }, [auto, hover]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!stageRef.current) return;
      const r = stageRef.current.getBoundingClientRect();
      const inView = r.top < window.innerHeight * 0.8 && r.bottom > 0;
      if (!inView) return;
      if (e.key === 'ArrowLeft') {
        setActive((a) => (a - 1 + BUILDS.length) % BUILDS.length);
        setAuto(false);
      }
      if (e.key === 'ArrowRight') {
        setActive((a) => (a + 1) % BUILDS.length);
        setAuto(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, active };
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    setAuto(false);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    setDrag(dx);
  };
  const onPointerUp = () => {
    if (!dragStart.current) {
      setDrag(0);
      return;
    }
    const threshold = 90;
    if (drag > threshold) setActive((a) => (a - 1 + BUILDS.length) % BUILDS.length);
    if (drag < -threshold) setActive((a) => (a + 1) % BUILDS.length);
    dragStart.current = null;
    setDrag(0);
  };

  const signed = (i: number) => {
    let d = i - active;
    if (d > BUILDS.length / 2) d -= BUILDS.length;
    if (d < -BUILDS.length / 2) d += BUILDS.length;
    return d + drag / 240;
  };

  const cur = BUILDS[active];

  return (
    <div className="relative">
      <div
        ref={stageRef}
        className="relative select-none touch-pan-y"
        style={{ height: 'clamp(380px, 56vw, 680px)', perspective: '1800px' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          onPointerUp();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(60% 70% at 50% 60%, color-mix(in oklab, ${cur.accentVar} 12%, transparent), transparent 70%)`,
            transition: 'background 800ms ease',
          }}
        />
        <Particles accent={cur.accentVar} />

        {BUILDS.map((b, i) => {
          const d = signed(i);
          return (
            <GalleryCard
              key={b.id}
              build={b}
              depth={d}
              distance={Math.abs(d)}
              isCenter={Math.abs(d) < 0.5}
              hover={hover && Math.abs(d) < 0.5}
              onActivate={() => {
                setActive(i);
                setAuto(false);
              }}
            />
          );
        })}

        <button
          onClick={() => {
            setActive((a) => (a - 1 + BUILDS.length) % BUILDS.length);
            setAuto(false);
          }}
          aria-label="Previous build"
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 grid place-items-center w-12 h-12 rounded-full border bd backdrop-blur-md hover:scale-110 transition"
          style={{ background: 'color-mix(in oklab, var(--bg) 60%, transparent)' }}
        >
          <Icon.ArrowRight className="w-5 h-5 text-1 rotate-180" />
        </button>
        <button
          onClick={() => {
            setActive((a) => (a + 1) % BUILDS.length);
            setAuto(false);
          }}
          aria-label="Next build"
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 grid place-items-center w-12 h-12 rounded-full border bd backdrop-blur-md hover:scale-110 transition"
          style={{ background: 'color-mix(in oklab, var(--bg) 60%, transparent)' }}
        >
          <Icon.ArrowRight className="w-5 h-5 text-1" />
        </button>
      </div>

      <div className="relative max-w-3xl mx-auto mt-10 md:mt-14 text-center">
        <div key={cur.id} style={{ animation: 'fade-up 600ms cubic-bezier(.2,.7,.1,1) both' }}>
          <p className="text-2 leading-relaxed text-base md:text-lg">{cur.blurb}</p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-5">
            {cur.stack.map((s) => (
              <span
                key={s}
                className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border bd text-2"
                style={{ background: 'color-mix(in oklab, var(--surface-2) 70%, transparent)' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-3xl mx-auto mt-8 flex items-center justify-center gap-2 flex-wrap">
        {BUILDS.map((b, i) => (
          <button
            key={b.id}
            onClick={() => {
              setActive(i);
              setAuto(false);
            }}
            aria-label={`Go to ${b.title}`}
            className="group relative font-mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 rounded transition"
            style={{
              color: i === active ? b.accentVar : 'var(--text-muted)',
              background: i === active ? `color-mix(in oklab, ${b.accentVar} 12%, transparent)` : 'transparent',
            }}
          >
            <span className="mr-1.5 text-[9px] opacity-60">{String(i + 1).padStart(2, '0')}</span>
            {b.title}
            <span
              className="absolute inset-x-2 -bottom-px h-px transition-all"
              style={{ background: i === active ? b.accentVar : 'transparent' }}
            />
          </button>
        ))}
      </div>

      <div className="relative max-w-3xl mx-auto mt-6 flex items-center gap-4 px-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mut shrink-0">
          {String(active + 1).padStart(2, '0')} / {String(BUILDS.length).padStart(2, '0')}
        </span>
        <div className="flex-1 h-px relative" style={{ background: 'var(--border)' }}>
          <div
            className="absolute left-0 top-0 h-full transition-all duration-500"
            style={{
              width: `${((active + 1) / BUILDS.length) * 100}%`,
              background: `linear-gradient(90deg, var(--accent), ${cur.accentVar})`,
              boxShadow: `0 0 12px ${cur.accentVar}`,
            }}
          />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mut shrink-0 hidden sm:inline">
          Drag · Click · ←/→
        </span>
      </div>
    </div>
  );
};

export const Builds = () => (
  <section id="builds" className="relative py-24 md:py-36 bg-app overflow-hidden">
    <div className="absolute inset-0 opacity-50">
      <Orbs density={0.5} />
    </div>
    <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-50" />

    <div className="relative max-w-[1500px] mx-auto px-4 md:px-10">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] accent">
          <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent) 60%, transparent)' }} />
          <span>// SELECTED BUILDS</span>
          <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent) 60%, transparent)' }} />
        </div>
        <h2 className="font-display font-bold tracking-display mt-5 text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.98] text-1">
          Eight signatures. <span className="font-script grad-text-cm">one stack.</span>
        </h2>
        <p className="text-2 mt-5 leading-relaxed">
          Drag, swipe, or click any card to open the live site. Every build below ships on the same cinematic engine — from license-plate
          commerce to peptide research storefronts.
        </p>
      </div>

      <div className="mt-16">
        <Gallery />
      </div>
    </div>
  </section>
);

export default Builds;
