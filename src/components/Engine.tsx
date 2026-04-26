import { useEffect, useRef, useState } from 'react';
import { Orbs } from './Atmosphere';

const STACK = [
  {
    id: 'edge',
    n: '01',
    label: 'EDGE · DELIVERY',
    sub: 'global · 18ms cold',
    techs: ['Cloudflare'],
    accent: '#FBAD41',
    swatchA: '#F38020',
    swatchB: '#FBAD41',
    headline: 'Served from 300+ PoPs, worldwide.',
    detail: 'Static assets streamed from the closest edge. Workers run server logic at the edge for sub-50ms TTFB anywhere on earth. EU data residency on demand.',
    metrics: [['TTFB', '~18ms'], ['POP COUNT', '300+'], ['REGIONS', 'GLOBAL']],
  },
  {
    id: 'data',
    n: '02',
    label: 'DATA · AUTH',
    sub: 'postgres · row-level',
    techs: ['Supabase', 'Postgres'],
    accent: '#3ECF8E',
    swatchA: '#3ECF8E',
    swatchB: '#1E5C42',
    headline: 'Postgres with row-level security, baked in.',
    detail: 'Realtime subscriptions, edge functions, and full auth flows. Self-hostable when you outgrow managed hosting. No vendor lock-in.',
    metrics: [['SCHEMA', 'RELATIONAL'], ['AUTH', 'RLS'], ['REALTIME', '✓']],
  },
  {
    id: 'commerce',
    n: '03',
    label: 'COMMERCE',
    sub: 'subscriptions · checkout',
    techs: ['Stripe'],
    accent: '#A78BFA',
    swatchA: '#635BFF',
    swatchB: '#9B89F2',
    headline: 'Stripe Checkout, Subscriptions, Tax — wired.',
    detail: 'PCI-DSS handled, webhooks plumbed to Supabase out of the box. Recurring revenue, one-shot, marketplace splits — same toolkit.',
    metrics: [['PCI', 'HANDLED'], ['WEBHOOKS', 'LIVE'], ['CURRENCIES', '135+']],
  },
  {
    id: 'runtime',
    n: '04',
    label: 'APP RUNTIME',
    sub: 'react · typescript',
    techs: ['React 18', 'TypeScript'],
    accent: '#61DAFB',
    swatchA: '#61DAFB',
    swatchB: '#3178C6',
    headline: 'React 18 + strict TypeScript. No any.',
    detail: 'Component contracts. Design-tokenized styling. Maintainable a year from now — not just on launch day. Refactor without fear.',
    metrics: [['TYPE COV', '100%'], ['STRICT', 'ON'], ['BUNDLE', 'OPTIMIZED']],
  },
  {
    id: 'motion',
    n: '05',
    label: 'MOTION · VISUAL',
    sub: 'gsap · framer · three',
    techs: ['GSAP', 'Framer', 'Three'],
    accent: '#22D3EE',
    swatchA: '#22D3EE',
    swatchB: '#0055FF',
    headline: 'Cinematic surface, choreographed.',
    detail: 'GSAP for timeline. Framer Motion for component states. Three.js when 3D earns its place. The cinematic surface lives here.',
    metrics: [['FPS', '60+'], ['LIBS', '3'], ['SURFACE', 'CINEMATIC']],
  },
  {
    id: 'intel',
    n: '06',
    label: 'INTELLIGENCE · OPS',
    sub: 'openrouter · n8n flows',
    techs: ['OpenRouter', 'n8n'],
    accent: '#FB923C',
    swatchA: '#7C3AED',
    swatchB: '#FF8A00',
    headline: 'Model-agnostic AI. Visual workflows.',
    detail: 'OpenRouter so you switch models without rewriting. n8n for visual automation that survives staff changes. The brain on top of the stack.',
    metrics: [['MODELS', '100+'], ['FLOWS', 'VISUAL'], ['UPTIME', '99.9%']],
  },
];

const useEngineReveal = (ref: React.RefObject<HTMLElement>) => {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setRevealed(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return revealed;
};

const useCarouselControl = (ref: React.RefObject<HTMLElement>, total: number) => {
  const [angle, setAngle] = useState(0);
  const stateRef = useRef({
    angle: 0,
    target: 0,
    dragging: false,
    lastX: 0,
    vel: 0,
    lastInteraction: 0,
  });
  const stepDeg = 360 / total;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = stateRef.current;
      const idle = !s.dragging && Date.now() - s.lastInteraction > 600;

      if (s.dragging) {
        // direct angle is set by drag handler
      } else {
        if (idle && Math.abs(s.vel) < 0.1) {
          s.target = Math.round(s.angle / stepDeg) * stepDeg;
        } else {
          s.angle += s.vel;
          s.vel *= 0.92;
          s.target = s.angle;
        }
        const diff = s.target - s.angle;
        s.angle += diff * 0.12;
      }
      setAngle(s.angle);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stepDeg]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = stateRef.current;
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
      s.dragging = true;
      s.lastX = e.clientX;
      s.vel = 0;
      s.lastInteraction = Date.now();
      el.style.cursor = 'grabbing';
      (el as any).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      s.lastX = e.clientX;
      s.angle += dx * 0.35;
      s.vel = dx * 0.35;
      s.lastInteraction = Date.now();
    };
    const onUp = () => {
      s.dragging = false;
      s.lastInteraction = Date.now();
      el.style.cursor = 'grab';
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = stateRef.current;
    let hovered = false;
    const onEnter = () => { hovered = true; };
    const onLeave = () => { hovered = false; };
    const onWheel = (e: WheelEvent) => {
      if (!hovered) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        s.angle += e.deltaX * 0.4;
        s.vel = e.deltaX * 0.4;
        s.lastInteraction = Date.now();
      }
    };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('wheel', onWheel as any);
    };
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = stateRef.current;
    const onKey = (e: KeyboardEvent) => {
      const r = el.getBoundingClientRect();
      const inView = r.top < window.innerHeight * 0.8 && r.bottom > 0;
      if (!inView) return;
      if (e.key === 'ArrowLeft') {
        s.target = Math.round((s.angle + stepDeg) / stepDeg) * stepDeg;
        s.lastInteraction = Date.now();
      }
      if (e.key === 'ArrowRight') {
        s.target = Math.round((s.angle - stepDeg) / stepDeg) * stepDeg;
        s.lastInteraction = Date.now();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ref, stepDeg]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = stateRef.current;
    let lastT: number | null = null;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      lastT = e.touches[0].clientX;
      s.lastInteraction = Date.now();
    };
    const onMove = (e: TouchEvent) => {
      if (lastT == null || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastT;
      lastT = e.touches[0].clientX;
      s.angle += dx * 0.5;
      s.vel = dx * 0.5;
      s.lastInteraction = Date.now();
    };
    const onEnd = () => {
      lastT = null;
      s.lastInteraction = Date.now();
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [ref]);

  const goTo = (i: number) => {
    const s = stateRef.current;
    const target = -i * stepDeg;
    const cur = s.angle;
    const diff = (((target - cur) % 360) + 540) % 360 - 180;
    s.target = cur + diff;
    s.angle = cur;
    s.vel = 0;
    s.lastInteraction = Date.now() + 1500;
  };

  const activeIdx = (((Math.round(-angle / stepDeg) % total) + total) % total);

  return { angle, activeIdx, goTo };
};

const EngineCard = ({
  data,
  idx,
  total,
  angle,
  revealed,
  isActive,
  onClick,
}: {
  data: any;
  idx: number;
  total: number;
  angle: number;
  revealed: boolean;
  isActive: boolean;
  onClick: (i: number) => void;
}) => {
  const stepDeg = 360 / total;
  const cardAngle = idx * stepDeg;
  const relAngle = (((cardAngle + angle) % 360) + 540) % 360 - 180;
  const distFromFront = Math.abs(relAngle);
  const focus = Math.max(0, 1 - distFromFront / 90);
  const radius = 520;
  const cardW = 360;
  const cardH = 540;

  return (
    <div
      data-no-drag={isActive ? '' : null}
      onClick={() => onClick(idx)}
      className="absolute left-1/2 top-1/2 select-none"
      style={{
        width: cardW,
        height: cardH,
        marginLeft: -cardW / 2,
        marginTop: -cardH / 2,
        transform: `rotateY(${cardAngle}deg) translateZ(${radius}px)`,
        transformStyle: 'preserve-3d',
        opacity: revealed ? (distFromFront > 110 ? 0 : 1) : 0,
        transition: revealed ? 'opacity 600ms ease' : 'opacity 800ms ease',
        transitionDelay: revealed ? `${idx * 80}ms` : '0ms',
        cursor: distFromFront > 5 ? 'pointer' : 'default',
        backfaceVisibility: 'hidden',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden border bd flex flex-col"
        style={{
          background: `
            linear-gradient(180deg,
              color-mix(in oklab, var(--surface-2) 96%, transparent) 0%,
              color-mix(in oklab, var(--surface) 92%, transparent) 100%
            ),
            radial-gradient(ellipse 100% 60% at 50% 0%, color-mix(in oklab, ${data.accent} ${20 + focus * 25}%, transparent) 0%, transparent 70%)
          `,
          borderColor: isActive ? `color-mix(in oklab, ${data.accent} 70%, transparent)` : `color-mix(in oklab, var(--border) ${75 + focus * 20}%, transparent)`,
          boxShadow: `
            0 ${20 + focus * 30}px ${40 + focus * 50}px -20px color-mix(in oklab, ${data.accent} ${focus * 50}%, transparent),
            0 8px 24px -12px rgba(0,0,0,0.5),
            inset 0 1px 0 color-mix(in oklab, var(--text) ${10 + focus * 15}%, transparent),
            inset 0 -1px 0 color-mix(in oklab, ${data.accent} ${focus * 40}%, transparent)
          `,
          filter: `brightness(${0.6 + focus * 0.4}) saturate(${0.7 + focus * 0.5})`,
          transition: 'border-color 300ms ease, box-shadow 300ms ease, filter 300ms ease',
        }}
      >
        <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${data.accent}, transparent)`, opacity: 0.7 + focus * 0.3 }} />

        <div className="px-7 pt-7 pb-5 border-b bd flex-shrink-0" style={{ borderColor: 'color-mix(in oklab, var(--border) 60%, transparent)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-mut">L{data.n}</div>
              <div className="font-mono text-[12px] uppercase tracking-[0.22em] mt-1.5" style={{ color: data.accent }}>
                {data.label}
              </div>
              <div className="font-script italic text-[14px] mt-1 text-2">{data.sub}</div>
            </div>
            <div
              className="font-display font-bold text-[42px] leading-none"
              style={{
                color: 'transparent',
                WebkitTextStroke: `1px color-mix(in oklab, ${data.accent} 70%, transparent)`,
                fontFamily: 'var(--font-display)',
              }}
            >
              {data.n}
            </div>
          </div>
        </div>

        <div className="px-7 py-6 flex-1 flex flex-col gap-5">
          <h3 className="font-display font-bold text-1 text-[20px] leading-[1.2] tracking-display" style={{ textWrap: 'pretty' as any }}>
            {data.headline}
          </h3>
          <p className="font-editorial text-2 text-[14px] leading-relaxed" style={{ textWrap: 'pretty' as any }}>
            {data.detail}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-auto">
            {data.techs.map((t: string) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bd font-mono text-[10px] uppercase tracking-[0.18em] text-1 whitespace-nowrap"
                style={{
                  background: 'color-mix(in oklab, var(--surface) 70%, transparent)',
                  borderColor: `color-mix(in oklab, ${data.accent} 35%, var(--border))`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${data.swatchA}, ${data.swatchB})`, boxShadow: `0 0 6px ${data.swatchA}66` }}
                />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="px-7 pb-6 pt-4 border-t bd flex-shrink-0" style={{ borderColor: 'color-mix(in oklab, var(--border) 60%, transparent)' }}>
          <div className="grid grid-cols-3 gap-2">
            {data.metrics.map(([k, v]: [string, string]) => (
              <div key={k}>
                <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-mut">{k}</div>
                <div className="font-mono text-[12px] uppercase tracking-[0.14em] mt-0.5 text-1">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${data.accent}, transparent)`, opacity: 0.4 + focus * 0.3 }} />
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          top: '100%',
          width: '80%',
          height: '32px',
          marginTop: 12,
          background: `radial-gradient(ellipse, color-mix(in oklab, ${data.accent} 70%, transparent), transparent 70%)`,
          filter: 'blur(14px)',
          opacity: 0.4 + focus * 0.5,
        }}
      />
    </div>
  );
};

const Carousel = ({ revealed, onActiveChange }: { revealed: boolean; onActiveChange?: (i: number) => void }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const { angle, activeIdx, goTo } = useCarouselControl(stageRef, STACK.length);

  useEffect(() => {
    onActiveChange?.(activeIdx);
  }, [activeIdx, onActiveChange]);

  return (
    <div className="relative" style={{ perspective: '2200px', perspectiveOrigin: '50% 50%' }}>
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      <div
        ref={stageRef}
        className="relative mx-auto"
        style={{
          width: '100%',
          height: 640,
          transformStyle: 'preserve-3d',
          cursor: 'grab',
          touchAction: 'pan-y',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateZ(-520px) rotateY(${angle}deg)`,
            transition: 'none',
          }}
        >
          {STACK.map((s, i) => (
            <EngineCard
              key={s.id}
              data={s}
              idx={i}
              total={STACK.length}
              angle={angle}
              revealed={revealed}
              isActive={activeIdx === i}
              onClick={(idx) => goTo(idx)}
            />
          ))}
        </div>

        <div
          className="absolute left-1/2 bottom-0 pointer-events-none"
          style={{
            width: 900,
            height: 80,
            transform: 'translateX(-50%) translateY(60px)',
            background: 'radial-gradient(ellipse at 50% 50%, color-mix(in oklab, var(--accent) 22%, transparent) 0%, transparent 65%)',
            filter: 'blur(14px)',
          }}
        />
      </div>

      <div className="mt-12 flex items-center justify-center gap-2">
        {STACK.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Go to ${s.label}`}
            className="group relative h-2 rounded-full transition-all duration-500 cursor-pointer"
            style={{
              width: activeIdx === i ? 32 : 8,
              background:
                activeIdx === i
                  ? `linear-gradient(90deg, ${s.accent}, color-mix(in oklab, ${s.accent} 60%, transparent))`
                  : 'color-mix(in oklab, var(--border) 80%, transparent)',
              boxShadow: activeIdx === i ? `0 0 10px ${s.accent}77` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const Engine = () => {
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useEngineReveal(ref);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = STACK[activeIdx];

  return (
    <section className="relative py-24 md:py-32 bg-app overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-30" />
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <Orbs density={0.4} />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center max-w-[760px] mx-auto">
          <div className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] accent-2">
            <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent-2) 60%, transparent)' }} />
            <span>// THE ENGINE</span>
            <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent-2) 60%, transparent)' }} />
          </div>
          <h2 className="font-display font-bold tracking-display mt-5 text-[clamp(2.4rem,5.4vw,4.2rem)] leading-[0.96] text-1">
            Built on infrastructure
            <span className="block font-script grad-text-cm italic mt-1">you already trust.</span>
          </h2>
          <p className="text-2 mt-6 leading-relaxed font-editorial text-[1.18rem]">
            Six layers, one tower. The same edge, runtime, and data plane that powers Linear, Vercel, and Apple-tier launches — assembled into one cinematic engine. Boring foundations,
            breathtaking surface.
          </p>
        </div>

        <div ref={ref} className="relative mt-16 md:mt-24">
          <div className="flex items-center justify-between mb-6 font-mono text-[10px] uppercase tracking-[0.28em] text-mut">
            <div>
              <span className="accent">▸</span> STACK_TOWER · v26.04
            </div>
            <div className="text-right">
              <span className="text-mut">LAYER </span>
              <span style={{ color: active.accent }}>{active.n} / 06</span>
              <span className="text-mut"> · </span>
              <span style={{ color: active.accent }}>{active.label}</span>
            </div>
          </div>

          <Carousel revealed={revealed} onActiveChange={setActiveIdx} />

          <div className="mt-6 flex items-center justify-center gap-4 font-mono text-[10px] uppercase tracking-[0.28em] text-mut">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 h-5 rounded border bd grid place-items-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-2.5 h-2.5">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
              </span>
              DRAG
            </span>
            <span className="text-mut">·</span>
            <span>↔ SWIPE</span>
            <span className="text-mut">·</span>
            <span>← → KEYS</span>
            <span className="text-mut">·</span>
            <span>CLICK A CARD</span>
          </div>

          <div className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-mut">
            <span className="accent">YOUR SITE.</span> <span className="text-mut">YOUR DATA.</span> <span className="accent-2">YOUR CONTROL.</span>
          </div>
        </div>

        <div className="mt-14 max-w-[760px] mx-auto text-center">
          <p className="font-script italic text-2 text-lg leading-relaxed">
            Boring infrastructure beneath a cinematic surface — that's the whole trick.
            <span className="block font-mono not-italic text-[10px] uppercase tracking-[0.28em] mt-3 accent">▸ STUDIO RULE 03</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Engine;
