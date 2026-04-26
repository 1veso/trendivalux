import { Fragment, useEffect, useRef, useState } from 'react';

const PHASES = [
  {
    n: '01',
    kw: 'ONBOARDING',
    title: 'Onboarding',
    range: 'Day 0 — 1',
    body: 'No cold call. No NDA theatre. You complete a 12-step Seamless Onboarding questionnaire — designed so a busy founder can finish it in one sitting — and we answer with a written fit verdict. Plain language. Zero fluff.',
    micro: ['12-step questionnaire', 'Asynchronous · no calls', 'Written fit verdict'],
    glyph: 'discovery',
  },
  {
    n: '02',
    kw: 'DESIGN',
    title: 'Design',
    range: 'Day 2 — 4',
    body: 'You receive a high-fidelity Figma prototype with full motion direction, copy structure, and visual identity worked through. One round of revisions included. We do not touch a line of code until you say go.',
    micro: ['Figma prototype', 'Motion direction', 'One revision round'],
    glyph: 'design',
  },
  {
    n: '03',
    kw: 'BUILD',
    title: 'Build',
    range: 'Day 5 — 12',
    body: 'We construct the site in our cinematic stack — React, GSAP, Lottie, Stripe, Supabase, Cloudflare. Daily progress updates. Live preview link from Day 8 so you can scrub the whole build in your browser.',
    micro: ['Cinematic stack', 'Daily progress', 'Day-8 live preview'],
    glyph: 'build',
  },
  {
    n: '04',
    kw: 'LAUNCH',
    title: 'Launch',
    range: 'Day 13 — 14',
    body: 'We deploy to your custom domain on Cloudflare Pages. Full handover documentation, repo access, deployment keys — everything turned over. You own it. Forever. We are one Slack message away from the next moonshot.',
    micro: ['Cloudflare deploy', 'Full handover', 'Permanent ownership'],
    glyph: 'launch',
  },
];

const useSectionScroll = (ref: React.RefObject<HTMLElement>) => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const total = r.height + window.innerHeight * 0.4;
      const traveled = window.innerHeight - r.top + window.innerHeight * 0.2;
      const next = Math.max(0, Math.min(1, traveled / total));
      setP(next);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
  return p;
};

const SunsetBackdrop = ({ progress }: { progress: number }) => {
  const sunY = 100 - Math.sin(progress * Math.PI) * 70;
  const sunGlow = 0.55 + Math.sin(progress * Math.PI) * 0.45;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            color-mix(in oklab, var(--bg) 90%, #1a0030 ${10 + progress * 10}%) 0%,
            color-mix(in oklab, var(--sun-3) 24%, var(--bg) 76%) 30%,
            color-mix(in oklab, var(--sun-1) 22%, var(--bg) 78%) 55%,
            color-mix(in oklab, var(--sun-2) 18%, var(--bg) 82%) 75%,
            var(--bg) 100%)`,
          opacity: 0.85,
          transition: 'background 1200ms ease',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '50%',
          top: `${sunY}%`,
          width: 'min(85vw, 1100px)',
          height: 'min(85vw, 1100px)',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle,
            color-mix(in oklab, var(--sun-2) 70%, white) 0%,
            color-mix(in oklab, var(--sun-1) 60%, transparent) 22%,
            color-mix(in oklab, var(--sun-3) 30%, transparent) 50%,
            transparent 70%)`,
          filter: `blur(${30 - progress * 10}px)`,
          opacity: sunGlow,
          transition: 'top 1200ms cubic-bezier(.2,.7,.1,1), opacity 1200ms ease, filter 800ms ease',
        }}
      />
      <div
        className="absolute inset-x-0"
        style={{
          top: `${sunY}%`,
          transform: 'translateY(-50%)',
          height: '24vh',
          background: `repeating-linear-gradient(180deg,
            transparent 0px, transparent 10px,
            color-mix(in oklab, var(--sun-2) 30%, transparent) 10px,
            color-mix(in oklab, var(--sun-2) 30%, transparent) 11px)`,
          opacity: 0.55 * sunGlow,
          mixBlendMode: 'screen',
          maskImage: 'radial-gradient(ellipse 60% 70% at 50% 50%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 50% 50%, black, transparent 75%)',
        }}
      />
      <div className="absolute inset-0 noise opacity-[0.06]" />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: 'linear-gradient(180deg, transparent, color-mix(in oklab, var(--bg) 80%, black) 80%, var(--bg) 100%)',
        }}
      />
    </div>
  );
};

const GaussianHorizon = ({ progress, activePhase }: { progress: number; activePhase: number }) => {
  const PATH =
    'M 0 280 ' +
    'C 100 280, 140 100, 200 100  S 300 280, 400 280 ' +
    'C 500 280, 540 80,  600 80   S 700 280, 800 280 ' +
    'C 900 280, 940 60,  1000 60  S 1100 280, 1200 280 ' +
    'C 1300 280,1340 40, 1400 40  S 1500 280, 1600 280';
  return (
    <svg
      className="absolute inset-x-0 pointer-events-none"
      style={{ top: '0', height: '100%' }}
      viewBox="0 0 1600 320"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="horizon-stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--sun-3)" />
          <stop offset="0.33" stopColor="var(--sun-1)" />
          <stop offset="0.66" stopColor="var(--sun-2)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
        <linearGradient id="horizon-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="color-mix(in oklab, var(--sun-1) 50%, transparent)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--sun-2) 0%, transparent)" />
        </linearGradient>
        <filter id="horizon-glow" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path d={PATH + ' L 1600 320 L 0 320 Z'} fill="url(#horizon-fill)" opacity={0.5 + progress * 0.3} />

      <path
        d={PATH}
        fill="none"
        stroke="url(#horizon-stroke)"
        strokeWidth="14"
        opacity={0.35 * (0.5 + progress * 0.5)}
        filter="url(#horizon-glow)"
        style={{ strokeDasharray: 6500, strokeDashoffset: 6500 - 6500 * progress, transition: 'stroke-dashoffset 600ms linear' }}
      />
      <path
        d={PATH}
        fill="none"
        stroke="url(#horizon-stroke)"
        strokeWidth="2"
        style={{
          strokeDasharray: 6500,
          strokeDashoffset: 6500 - 6500 * progress,
          transition: 'stroke-dashoffset 600ms linear',
          filter: 'drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 50%, transparent))',
        }}
      />

      {[200, 600, 1000, 1400].map((cx, i) => {
        const cy = [100, 80, 60, 40][i];
        const lit = activePhase >= i;
        return (
          <g key={i} style={{ transition: 'opacity 700ms ease', opacity: lit ? 1 : 0.25 }}>
            <circle cx={cx} cy={cy} r="9" fill="var(--bg)" stroke="url(#horizon-stroke)" strokeWidth="2" />
            <circle
              cx={cx}
              cy={cy}
              r={lit ? 14 : 9}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1"
              opacity={lit ? 0.7 : 0}
              style={{ transition: 'all 700ms ease' }}
            />
            {lit && (
              <circle cx={cx} cy={cy} r="20" fill="none" stroke="var(--accent-2)" strokeWidth="1" opacity="0.5">
                <animate attributeName="r" from="10" to="36" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const SceneDiscovery = ({ active }: { active: boolean }) => {
  const STEPS = 12;
  const questions = [
    { lbl: 'Brand name', val: 'TrendivaLux', w: 120 },
    { lbl: 'Goal · primary KPI', val: '+ Conversions', w: 140 },
    { lbl: 'Voice + tone', val: 'Premium · cinematic', w: 170 },
    { lbl: 'Launch window', val: '14 days', w: 80 },
  ];
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="sd-fill" x1="0" x2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--accent-2)" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="32" y="22" width="256" height="156" rx="6" fill="var(--surface)" stroke="color-mix(in oklab, var(--accent-2) 50%, var(--border))" strokeWidth="1" />
      <text x="46" y="40" fontFamily="DM Mono" fontSize="8" fill="var(--text-muted)" letterSpacing="2">
        SEAMLESS ONBOARDING
      </text>
      <text x="274" y="40" fontFamily="DM Mono" fontSize="8" fill="var(--accent)" letterSpacing="2" textAnchor="end">
        12 / 12
      </text>
      <g>
        {[...Array(STEPS)].map((_, i) => (
          <rect
            key={i}
            x={46 + i * 16.4}
            y={46}
            width="14.4"
            height="3"
            rx="1.5"
            fill={active ? 'url(#sd-fill)' : 'var(--surface-2)'}
            stroke="var(--border)"
            strokeWidth="0.4"
            style={{
              opacity: active ? 1 : 0.4,
              transition: `opacity 350ms ease ${300 + i * 90}ms, fill 350ms ease ${300 + i * 90}ms`,
            }}
          />
        ))}
      </g>
      <g>
        {questions.map((q, i) => {
          const ty = 64 + i * 26;
          const baseDelay = 600 + i * 420;
          return (
            <g key={i}>
              <rect
                x="46"
                y={ty}
                width="11"
                height="11"
                rx="2"
                fill={active ? 'color-mix(in oklab, var(--accent) 20%, transparent)' : 'var(--surface-2)'}
                stroke={active ? 'var(--accent)' : 'var(--border)'}
                strokeWidth="0.8"
                style={{ transition: `all 300ms ease ${baseDelay}ms` }}
              />
              {active && (
                <path
                  d={`M ${49} ${ty + 5.5} l 2.5 2.5 l 4.5 -4.5`}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="14"
                  strokeDashoffset="14"
                  style={{ animation: `sd-tick 350ms cubic-bezier(.4,0,.2,1) ${baseDelay + 150}ms forwards` }}
                />
              )}
              <text x="64" y={ty + 5} fontFamily="DM Mono" fontSize="6.5" fill="var(--text-muted)" letterSpacing="1.4">
                {q.lbl.toUpperCase()}
              </text>
              <rect
                x="64"
                y={ty + 8.5}
                width={active ? q.w : 0}
                height="9"
                rx="1.5"
                fill="color-mix(in oklab, var(--accent-2) 14%, transparent)"
                stroke="color-mix(in oklab, var(--accent-2) 50%, transparent)"
                strokeWidth="0.6"
                style={{ transition: `width 600ms cubic-bezier(.4,0,.2,1) ${baseDelay + 250}ms` }}
              />
              <text x="68" y={ty + 15} fontFamily="DM Mono" fontSize="7" fill="var(--accent-2)" style={{ opacity: active ? 1 : 0, transition: `opacity 300ms ${baseDelay + 650}ms` }}>
                {q.val}
              </text>
            </g>
          );
        })}
      </g>
      <g
        style={{
          opacity: active ? 1 : 0,
          transform: active ? 'translateY(0)' : 'translateY(8px)',
          transformOrigin: 'center',
          transition: 'all 500ms cubic-bezier(.2,.7,.1,1) 2400ms',
        }}
      >
        <rect x="118" y="170" width="84" height="14" rx="7" fill="var(--accent)" />
        <text x="160" y="180" textAnchor="middle" fontFamily="DM Mono" fontSize="7" fill="var(--bg)" letterSpacing="2" fontWeight="700">
          SUBMIT ▸
        </text>
      </g>
      <style>{`@keyframes sd-tick { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
};

const SceneDesign = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 320 200" className="w-full h-full" aria-hidden="true">
    <defs>
      <pattern id="sg-grid" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M16 0 L0 0 L0 16" stroke="var(--accent-2)" strokeWidth="0.4" fill="none" opacity="0.4" />
      </pattern>
    </defs>
    <rect
      x="40"
      y="30"
      width="240"
      height="140"
      rx="6"
      fill="var(--surface)"
      stroke="var(--accent-2)"
      strokeWidth="1.5"
      strokeDasharray={active ? '0' : '760'}
      strokeDashoffset={active ? '0' : '760'}
      style={{ transition: 'all 1200ms cubic-bezier(.2,.7,.1,1)' }}
    />
    <rect x="40" y="30" width={active ? '240' : '0'} height="140" fill="url(#sg-grid)" style={{ transition: 'width 1400ms cubic-bezier(.2,.7,.1,1) 200ms' }} />
    <g style={{ opacity: active ? 1 : 0, transition: 'opacity 600ms 600ms' }}>
      <rect x="52" y="42" width={active ? '100' : '0'} height="14" rx="2" fill="var(--accent)" style={{ transition: 'width 700ms 700ms' }} />
      <rect x="52" y="62" width={active ? '60' : '0'} height="6" rx="1" fill="var(--text-muted)" style={{ transition: 'width 700ms 850ms' }} />
      <rect x="52" y="74" width={active ? '160' : '0'} height="6" rx="1" fill="var(--text-muted)" style={{ transition: 'width 700ms 950ms' }} />
      <rect
        x="52"
        y="94"
        width={active ? '100' : '0'}
        height="60"
        rx="3"
        fill="color-mix(in oklab, var(--accent-2) 30%, transparent)"
        stroke="var(--accent-2)"
        strokeWidth="0.8"
        style={{ transition: 'width 700ms 1100ms' }}
      />
      <rect
        x="160"
        y="94"
        width={active ? '108' : '0'}
        height="28"
        rx="3"
        fill="color-mix(in oklab, var(--accent) 22%, transparent)"
        stroke="var(--accent)"
        strokeWidth="0.8"
        style={{ transition: 'width 700ms 1200ms' }}
      />
      <rect
        x="160"
        y="126"
        width={active ? '108' : '0'}
        height="28"
        rx="3"
        fill="color-mix(in oklab, var(--accent) 22%, transparent)"
        stroke="var(--accent)"
        strokeWidth="0.8"
        style={{ transition: 'width 700ms 1300ms' }}
      />
    </g>
    {active && (
      <g style={{ animation: 'sg-cursor 4s cubic-bezier(.4,0,.2,1) infinite' }}>
        <path d="M0 0 L0 14 L4 11 L7 17 L9 16 L6 10 L11 10 Z" fill="white" stroke="black" strokeWidth="0.8" />
      </g>
    )}
    <style>{`
      @keyframes sg-cursor {
        0%   { transform: translate(60px, 50px); opacity: 0; }
        10%  { opacity: 1; }
        40%  { transform: translate(180px, 110px); }
        70%  { transform: translate(220px, 140px); }
        90%  { opacity: 1; }
        100% { transform: translate(220px, 140px); opacity: 0; }
      }
    `}</style>
  </svg>
);

const SceneBuild = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 320 200" className="w-full h-full" aria-hidden="true">
    <rect x="20" y="20" width="280" height="160" rx="6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.2" />
    <rect x="20" y="20" width="280" height="22" rx="6" fill="color-mix(in oklab, var(--surface-2) 80%, transparent)" />
    <circle cx="34" cy="31" r="3" fill="var(--accent-2)" />
    <circle cx="46" cy="31" r="3" fill="var(--gold)" />
    <circle cx="58" cy="31" r="3" fill="var(--accent)" />
    <text x="160" y="35" textAnchor="middle" fontFamily="DM Mono" fontSize="8" fill="var(--text-muted)">
      — build / cinematic-stack —
    </text>
    {[
      { y: 56, w: 200, c: 'var(--accent)' },
      { y: 70, w: 140, c: 'var(--text-muted)' },
      { y: 84, w: 180, c: 'var(--accent-2)' },
      { y: 98, w: 100, c: 'var(--text-muted)' },
      { y: 112, w: 220, c: 'var(--gold)' },
      { y: 126, w: 160, c: 'var(--accent)' },
    ].map((l, i) => (
      <rect key={i} x="34" y={l.y} width={active ? l.w : 0} height="4" rx="1" fill={l.c} opacity="0.85" style={{ transition: `width 500ms ease ${300 + i * 180}ms` }} />
    ))}
    <rect x="34" y="148" width="252" height="6" rx="3" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="0.6" />
    <rect
      x="34"
      y="148"
      width={active ? '252' : '0'}
      height="6"
      rx="3"
      fill="var(--accent)"
      style={{ transition: 'width 1800ms cubic-bezier(.4,0,.2,1) 300ms', filter: 'drop-shadow(0 0 4px var(--accent))' }}
    />
    {active && (
      <g style={{ animation: 'sb-scroll 4s linear infinite' }}>
        <text x="34" y="170" fontFamily="DM Mono" fontSize="6" fill="var(--text-muted)">
          01001100 11010001 1010·11 PUSH origin/main · build:ok 17ms · LIGHTHOUSE 98 · HMR · DEPLOY · ▲
        </text>
      </g>
    )}
    <style>{`@keyframes sb-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-160px); } }`}</style>
  </svg>
);

const SceneLaunch = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 320 200" className="w-full h-full" aria-hidden="true">
    <defs>
      <linearGradient id="sl-trail" x1="0" x2="1">
        <stop offset="0" stopColor="var(--sun-2)" stopOpacity="0" />
        <stop offset="0.5" stopColor="var(--sun-1)" stopOpacity="0.9" />
        <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <line x1="20" y1="170" x2="300" y2="170" stroke="var(--border)" strokeWidth="0.8" />
    {[...Array(12)].map((_, i) => (
      <circle
        key={i}
        cx={20 + ((i * 23) % 280)}
        cy={20 + ((i * 17) % 100)}
        r={0.8 + (i % 3) * 0.4}
        fill="white"
        opacity={active ? 0.6 : 0}
        style={{ transition: `opacity 800ms ${i * 60}ms`, animation: active ? `sl-twinkle 2s ease-in-out ${i * 0.2}s infinite` : 'none' }}
      />
    ))}
    <path
      d="M 60 170 Q 130 150 180 100 T 280 30"
      fill="none"
      stroke="url(#sl-trail)"
      strokeWidth="6"
      strokeDasharray="380"
      strokeDashoffset={active ? 0 : 380}
      style={{ transition: 'stroke-dashoffset 1600ms cubic-bezier(.4,0,.2,1) 200ms' }}
    />
    {active && (
      <circle r="5" fill="var(--accent)" style={{ filter: 'drop-shadow(0 0 10px var(--accent))', animation: 'sl-rocket 1800ms cubic-bezier(.4,0,.2,1) 200ms forwards' }}>
        <animateMotion dur="1.8s" begin="0.2s" fill="freeze" path="M 60 170 Q 130 150 180 100 T 280 30" />
      </circle>
    )}
    {active &&
      [0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={i}
          cx={260 + (i % 3) * 10 - 10}
          cy={28 + (i < 3 ? 0 : 14)}
          r="1.6"
          fill={['var(--accent-2)', 'var(--gold)', 'var(--accent)'][i % 3]}
          style={{ animation: `sl-confetti 1.4s ease-out ${1.4 + i * 0.08}s forwards`, opacity: 0 }}
        />
      ))}
    <g
      style={{
        transformOrigin: '160px 110px',
        transform: active ? 'scale(1) rotate(-6deg)' : 'scale(0.4) rotate(-30deg)',
        opacity: active ? 1 : 0,
        transition: 'transform 700ms cubic-bezier(.2,.9,.1,1.1) 1.6s, opacity 600ms ease 1.6s',
      }}
    >
      <rect x="120" y="92" width="80" height="34" rx="6" fill="var(--gold)" stroke="var(--bg)" strokeWidth="1.5" />
      <text x="160" y="115" textAnchor="middle" fontFamily="Monoton" fontSize="20" fill="var(--bg)" letterSpacing="2">
        LIVE
      </text>
    </g>
    <style>{`
      @keyframes sl-twinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
      @keyframes sl-confetti{ 0% { transform: translate(0,0) scale(0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(0px, -30px) scale(1.6); opacity: 0; } }
    `}</style>
  </svg>
);

const SCENES: Record<string, any> = {
  discovery: SceneDiscovery,
  design: SceneDesign,
  build: SceneBuild,
  launch: SceneLaunch,
};

const PhaseRow = ({ phase, idx, active, total }: { phase: any; idx: number; active: boolean; total: number }) => {
  const Scene = SCENES[phase.glyph];
  const isLast = idx === total - 1;
  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 py-14 md:py-20">
      {idx > 0 && (
        <span
          className="hidden lg:block absolute left-[6.5%] -top-20 w-px h-20"
          style={{
            background: `linear-gradient(180deg, transparent, color-mix(in oklab, var(--accent) ${active ? 80 : 20}%, transparent))`,
            transition: 'background 700ms ease',
          }}
        />
      )}

      <div className="lg:col-span-2 flex lg:block items-center gap-4">
        <div
          className="relative w-20 h-20 lg:w-24 lg:h-24 grid place-items-center rounded-xl border transition-all duration-700"
          style={{
            borderColor: active ? `color-mix(in oklab, var(--accent) 50%, var(--border))` : 'var(--border)',
            background: active ? `color-mix(in oklab, var(--surface-2) 70%, transparent)` : 'color-mix(in oklab, var(--surface) 70%, transparent)',
            boxShadow: active ? '0 0 50px color-mix(in oklab, var(--accent) 28%, transparent), inset 0 0 0 4px color-mix(in oklab, var(--accent) 8%, transparent)' : 'none',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span
            className="font-marquee text-3xl lg:text-4xl"
            style={{
              color: active ? 'transparent' : 'var(--text-muted)',
              WebkitTextStroke: active ? '1.2px color-mix(in oklab, var(--accent) 90%, white)' : '0',
              textShadow: active
                ? '0 0 12px color-mix(in oklab, var(--accent) 70%, transparent), 0 0 30px color-mix(in oklab, var(--accent-2) 40%, transparent)'
                : 'none',
              transition: 'all 600ms ease',
            }}
          >
            {phase.n}
          </span>
          {active && (
            <>
              <span
                className="absolute -inset-1 rounded-xl border"
                style={{ borderColor: 'color-mix(in oklab, var(--accent) 35%, transparent)', animation: 'phase-ring 2.4s ease-in-out infinite' }}
              />
              <span className="absolute inset-0 rounded-xl" style={{ boxShadow: 'inset 0 0 30px color-mix(in oklab, var(--sun-1) 22%, transparent)' }} />
            </>
          )}
        </div>
        <div className="lg:hidden">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] accent-2">{phase.range}</div>
          <div className="font-display font-bold text-2xl mt-1 text-1">{phase.title}</div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div
          className="relative rounded-2xl border bd overflow-hidden"
          style={{
            aspectRatio: '320 / 200',
            background: 'color-mix(in oklab, var(--surface) 60%, transparent)',
            boxShadow: active
              ? `0 30px 60px -30px color-mix(in oklab, var(--accent) 40%, transparent), inset 0 1px 0 0 color-mix(in oklab, var(--text) 8%, transparent)`
              : '0 20px 40px -25px rgba(0,0,0,0.5)',
            transition: 'box-shadow 800ms ease',
          }}
        >
          <div className="absolute top-2 left-3 flex gap-1.5 z-10">
            <span className="w-2 h-2 rounded-full" style={{ background: 'color-mix(in oklab, var(--accent-2) 70%, transparent)' }} />
            <span className="w-2 h-2 rounded-full" style={{ background: 'color-mix(in oklab, var(--gold) 70%, transparent)' }} />
            <span className="w-2 h-2 rounded-full" style={{ background: 'color-mix(in oklab, var(--accent) 70%, transparent)' }} />
          </div>
          <div className="absolute top-2 right-3 z-10 font-mono text-[9px] uppercase tracking-[0.25em] text-mut">{phase.kw}_PHASE.scene</div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, color-mix(in oklab, var(--text) 5%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--text) 5%, transparent) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              opacity: 0.55,
            }}
          />
          <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
          <Scene active={active} />
          <span
            className="absolute inset-x-0 bottom-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) ${active ? 80 : 20}%, transparent), transparent)`,
              transition: 'background 700ms ease',
            }}
          />
        </div>
      </div>

      <div className="lg:col-span-5 lg:pt-2">
        <div className="hidden lg:block">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--accent-2)' }}>
            {phase.range} · {phase.kw}
          </div>
          <h3 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-1 mt-2">{phase.title}</h3>
        </div>
        <p className="text-2 leading-relaxed mt-4 max-w-prose">{phase.body}</p>
        <ul className="mt-5 space-y-2">
          {phase.micro.map((m: string, i: number) => (
            <li
              key={i}
              className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-2"
              style={{
                opacity: active ? 1 : 0.55,
                transform: active ? 'translateX(0)' : 'translateX(-6px)',
                transition: `all 500ms ease ${200 + i * 100}ms`,
              }}
            >
              <span className="w-4 h-px" style={{ background: 'var(--accent)' }} />
              <span>{m}</span>
            </li>
          ))}
        </ul>
        {!isLast && active && (
          <div className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--accent)', animation: 'phase-handoff 1.6s ease-in-out infinite' }}>
            <span>Hands off to {PHASES[idx + 1].kw}</span>
            <span className="w-6 h-px" style={{ background: 'var(--accent)' }} />
            <span>↓</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const Process = () => {
  const ref = useRef<HTMLElement>(null);
  const progress = useSectionScroll(ref);
  const activePhases = PHASES.map((_, i) => progress > (i + 0.4) / PHASES.length);
  const activePhaseIndex = activePhases.lastIndexOf(true);

  return (
    <section ref={ref} className="relative py-28 md:py-40 bg-app overflow-hidden">
      <SunsetBackdrop progress={progress} />
      <GaussianHorizon progress={progress} activePhase={activePhaseIndex} />

      <div className="relative max-w-[1500px] mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] accent">
            <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent) 60%, transparent)' }} />
            <span>// HOW WE WORK</span>
            <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent) 60%, transparent)' }} />
          </div>
          <h2 className="font-display font-bold tracking-display mt-5 text-[clamp(2.4rem,5.4vw,4.2rem)] leading-[0.96] text-1">
            Four phases.
            <span className="block font-script grad-text-cm mt-1">From hello to launched.</span>
          </h2>
          <p className="text-2 leading-relaxed mt-5 max-w-2xl mx-auto">
            Two weeks. One sunset arc. Each phase paints itself into the next — discovery becomes design, design hands off to build, build crests into launch. You're with us at every brushstroke.
          </p>
          <div className="mt-8 max-w-md mx-auto flex items-center gap-3">
            {PHASES.map((p, i) => (
              <Fragment key={p.n}>
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.22em]"
                  style={{ color: activePhases[i] ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 600ms ease' }}
                >
                  {p.n}
                </span>
                {i < PHASES.length - 1 && (
                  <span className="flex-1 h-px relative" style={{ background: 'var(--border)' }}>
                    <span
                      className="absolute left-0 top-0 h-full transition-all duration-700"
                      style={{
                        width: activePhases[i + 1] ? '100%' : activePhases[i] ? '50%' : '0%',
                        background: `linear-gradient(90deg, var(--accent), var(--accent-2))`,
                        boxShadow: '0 0 8px color-mix(in oklab, var(--accent) 60%, transparent)',
                      }}
                    />
                  </span>
                )}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="relative">
          {PHASES.map((p, i) => (
            <PhaseRow key={p.n} phase={p} idx={i} active={activePhases[i]} total={PHASES.length} />
          ))}
        </div>

        <div className="mt-10 pt-10 border-t bd flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-mut">
            <span className="accent">▸</span> 14 days · 4 phases · 1 cinematic engine
          </div>
          <div className="font-display italic text-2 text-base">
            "Print to plate, plate to chrome." <span className="text-mut font-mono text-[10px] uppercase ml-2 not-italic">— studio motto</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes phase-ring {
          0%, 100% { transform: scale(1);   opacity: 0.4; }
          50%      { transform: scale(1.06); opacity: 1; }
        }
        @keyframes phase-handoff {
          0%, 100% { transform: translateY(0);   opacity: 0.7; }
          50%      { transform: translateY(4px); opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default Process;
