import { useEffect, useRef, useState } from 'react';
import { Lightcycles } from './Lightcycles';

export const Orbs = ({ density = 1 }: { density?: number }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      className="orb-a absolute -left-[20%] -top-[20%] w-[70vw] h-[70vw] rounded-full"
      style={{
        background:
          'radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--sun-1) 60%, transparent), color-mix(in oklab, var(--sun-3) 35%, transparent) 40%, transparent 70%)',
        filter: 'blur(80px)',
        opacity: 0.4 * density,
      }}
    />
    <div
      className="orb-b absolute -right-[25%] -bottom-[25%] w-[78vw] h-[78vw] rounded-full"
      style={{
        background:
          'radial-gradient(circle at 70% 70%, color-mix(in oklab, var(--accent) 55%, transparent), color-mix(in oklab, var(--sun-3) 30%, transparent) 45%, transparent 75%)',
        filter: 'blur(90px)',
        opacity: 0.32 * density,
      }}
    />
    <div
      className="orb-c absolute left-[40%] top-[5%] w-[44vw] h-[44vw] rounded-full"
      style={{
        background:
          'radial-gradient(circle, color-mix(in oklab, var(--sun-2) 55%, transparent), transparent 65%)',
        filter: 'blur(120px)',
        opacity: 0.22 * density,
      }}
    />
  </div>
);

export const Aurora = ({ density = 1 }: { density?: number }) => (
  <div className="pointer-events-none absolute inset-x-0 top-[5%] h-[55vh] overflow-hidden">
    <div
      className="aurora absolute inset-x-[-10%] top-0 h-[60vh]"
      style={{
        background: `linear-gradient(95deg,
          transparent 0%,
          color-mix(in oklab, var(--sun-1) 40%, transparent) 25%,
          color-mix(in oklab, var(--sun-2) 50%, transparent) 45%,
          color-mix(in oklab, var(--sun-3) 40%, transparent) 65%,
          color-mix(in oklab, var(--accent) 35%, transparent) 85%,
          transparent 100%)`,
        opacity: 0.45 * density,
        mixBlendMode: 'screen',
      }}
    />
  </div>
);

export const GridFloor = ({
  height = 'h-[60%]',
  parallaxY = 0,
  sunSize = '38vw',
}: {
  height?: string;
  parallaxY?: number;
  sunSize?: string;
}) => (
  <div className={`pointer-events-none absolute inset-x-0 bottom-0 ${height} overflow-hidden`}>
    <div
      className="absolute left-1/2 top-[8%] -translate-x-1/2 aspect-square"
      style={{ width: sunSize, maxWidth: '620px' }}
    >
      <div
        className="absolute -inset-[20%] rounded-full"
        style={{
          background: 'radial-gradient(circle, color-mix(in oklab, var(--sun-1) 35%, transparent), transparent 60%)',
          filter: 'blur(40px)',
          opacity: 0.8,
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, var(--sun-1) 0%, var(--sun-2) 40%, var(--sun-3) 75%, transparent 80%)',
          filter: 'blur(0.5px)',
          opacity: 0.85,
          maskImage: 'linear-gradient(to bottom, #000 62%, transparent 62%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 62%, transparent 62%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0, transparent 8px, var(--bg) 8px, var(--bg) 12px)',
          maskImage: 'linear-gradient(to bottom, #000 62%, transparent 62%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 62%, transparent 62%)',
          opacity: 0.85,
        }}
      />
      <div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: 'color-mix(in oklab, var(--sun-1) 30%, transparent)',
          maskImage: 'linear-gradient(to bottom, #000 60%, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 60%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-[8%] rounded-full border"
        style={{
          borderColor: 'color-mix(in oklab, var(--sun-2) 25%, transparent)',
          maskImage: 'linear-gradient(to bottom, #000 60%, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 60%, transparent 60%)',
        }}
      />
    </div>

    <div
      className="absolute inset-x-0 top-[42%] h-[2px]"
      style={{
        background: 'linear-gradient(90deg, transparent, var(--accent), var(--accent-2), transparent)',
        filter: 'blur(0.5px)',
      }}
    />
    <div
      className="absolute inset-x-0 top-[40%] h-[160px]"
      style={{
        background: 'linear-gradient(to bottom, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)',
        filter: 'blur(20px)',
      }}
    />

    <div
      className="grid-floor absolute inset-x-[-20%] bottom-[-10%] h-[140%]"
      style={{ transform: `perspective(900px) rotateX(62deg) translateY(${parallaxY}px)` }}
    />

    <svg className="absolute left-2 bottom-[34%] w-[120px] opacity-50" viewBox="0 0 60 140" fill="none">
      <path d="M30 140 L30 70" stroke="var(--text)" strokeWidth="2" />
      <path d="M30 70 C 5 60, 0 40, 5 30 C 15 45, 25 55, 30 70 Z" fill="var(--text)" opacity="0.85" />
      <path d="M30 70 C 55 60, 60 40, 55 30 C 45 45, 35 55, 30 70 Z" fill="var(--text)" opacity="0.85" />
      <path d="M30 70 C 18 50, 16 30, 22 18 C 26 32, 30 50, 30 70 Z" fill="var(--text)" opacity="0.85" />
      <path d="M30 70 C 42 50, 44 30, 38 18 C 34 32, 30 50, 30 70 Z" fill="var(--text)" opacity="0.85" />
    </svg>
    <svg className="absolute right-4 bottom-[36%] w-[90px] opacity-40" viewBox="0 0 60 140" fill="none">
      <path d="M30 140 L30 70" stroke="var(--text)" strokeWidth="2" />
      <path d="M30 70 C 5 60, 0 40, 5 30 C 15 45, 25 55, 30 70 Z" fill="var(--text)" />
      <path d="M30 70 C 55 60, 60 40, 55 30 C 45 45, 35 55, 30 70 Z" fill="var(--text)" />
      <path d="M30 70 C 18 50, 16 30, 22 18 C 26 32, 30 50, 30 70 Z" fill="var(--text)" />
      <path d="M30 70 C 42 50, 44 30, 38 18 C 34 32, 30 50, 30 70 Z" fill="var(--text)" />
    </svg>
  </div>
);

export const StarField = () => (
  <div className="pointer-events-none absolute inset-0 stars opacity-80" />
);

export const Birds = () => (
  <div
    className="pointer-events-none absolute inset-x-0 top-[12%] h-[12vh] overflow-hidden hidden [data-theme=light]:block"
    style={{ display: 'var(--show-birds, none)' as any }}
  >
    {[0, 1, 2, 3].map((i) => (
      <svg
        key={i}
        className="bird-glide absolute"
        viewBox="0 0 30 12"
        style={{
          top: `${i * 18}%`,
          width: `${24 + i * 6}px`,
          animationDelay: `${i * 4}s`,
          animationDuration: `${22 + i * 3}s`,
          opacity: 0.4,
        }}
      >
        <path d="M2 8 Q 8 1, 15 6 Q 22 1, 28 8" stroke="var(--text)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    ))}
  </div>
);

export const HexLattice = ({ opacity = 0.1 }: { opacity?: number }) => {
  const cells: any[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 14; c++) {
      const x = c * 60 + (r % 2 === 0 ? 0 : 30);
      const y = r * 52;
      cells.push(
        <polygon
          key={`${r}-${c}`}
          points="20,0 40,12 40,36 20,48 0,36 0,12"
          transform={`translate(${x} ${y})`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="0.6"
        />,
      );
    }
  }
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 840 416"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    >
      {cells}
    </svg>
  );
};

export const Vignette = () => (
  <>
    <div className="pointer-events-none absolute inset-0 scanlines opacity-[0.6]" />
    <div className="pointer-events-none absolute inset-0 noise opacity-30" />
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: 'radial-gradient(ellipse at center, transparent 50%, var(--vignette) 100%)' }}
    />
  </>
);

const useMouseParallax = (ref: React.RefObject<HTMLElement>, strength = 1) => {
  const [m, setM] = useState({ mx: 0, my: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0,
      latestX = 0,
      latestY = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      latestX = ((e.clientX - r.left) / r.width - 0.5) * 2 * strength;
      latestY = ((e.clientY - r.top) / r.height - 0.5) * 2 * strength;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          setM({ mx: latestX, my: latestY });
        });
    };
    const onLeave = () => setM({ mx: 0, my: 0 });
    window.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return m;
};

export const DigitalSunset = ({
  tempo = 1.0,
  intensity = 1.0,
  id = 'ds',
}: {
  tempo?: number;
  intensity?: number;
  id?: string;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { mx, my } = useMouseParallax(wrapRef, 1);
  const sec = (n: number) => `${(n / tempo).toFixed(2)}s`;
  const op = (n: number) => Math.min(1, n * intensity);

  const depth = (z: number) => ({
    transform: `translate3d(${mx * z}px, ${my * z * 0.6}px, 0)`,
    transition: 'transform 600ms cubic-bezier(.2,.7,.1,1)',
    willChange: 'transform',
  });

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* L0 — sky gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            color-mix(in oklab, var(--bg) 88%, var(--accent) 8%) 0%,
            color-mix(in oklab, var(--accent) 18%, var(--bg)) 22%,
            color-mix(in oklab, var(--sun-3) 22%, var(--bg)) 42%,
            color-mix(in oklab, var(--sun-2) 28%, var(--bg)) 58%,
            color-mix(in oklab, var(--sun-1) 22%, var(--bg)) 70%,
            color-mix(in oklab, var(--bg) 95%, transparent) 100%)`,
          opacity: op(0.95),
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 70%, color-mix(in oklab, var(--sun-2) 30%, transparent), transparent 60%)`,
          animation: `${id}-skyBreathe ${sec(28)} ease-in-out infinite alternate`,
          opacity: op(0.7),
          mixBlendMode: 'screen',
        }}
      />

      {/* L1 — star field */}
      <div className="absolute inset-0" style={{ ...depth(2), opacity: op(0.5) }}>
        <div
          className="absolute inset-x-0 top-0 h-[55%]"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 12% 8%,  rgba(255,255,255,.9), transparent 50%),
              radial-gradient(1px 1px at 27% 22%, rgba(255,200,220,.7), transparent 50%),
              radial-gradient(1px 1px at 44% 11%, rgba(255,255,255,.8), transparent 50%),
              radial-gradient(1.5px 1.5px at 61% 17%, rgba(180,220,255,.9), transparent 50%),
              radial-gradient(1px 1px at 73% 8%,  rgba(255,255,255,.6), transparent 50%),
              radial-gradient(1px 1px at 86% 28%, rgba(255,255,255,.8), transparent 50%),
              radial-gradient(1.5px 1.5px at 18% 38%, rgba(255,160,200,.8), transparent 50%),
              radial-gradient(1px 1px at 35% 30%, rgba(180,255,240,.7), transparent 50%),
              radial-gradient(1px 1px at 52% 44%, rgba(255,255,255,.7), transparent 50%),
              radial-gradient(1px 1px at 90% 14%, rgba(255,255,255,.7), transparent 50%)
            `,
            animation: `${id}-twinkle ${sec(6)} ease-in-out infinite alternate`,
          }}
        />
      </div>

      {/* L2 — sun disc with scanlines */}
      <div className="absolute inset-x-0" style={{ ...depth(4), bottom: '32%' }}>
        <div className="relative mx-auto" style={{ width: 'min(560px, 60vw)', aspectRatio: '1/1' }}>
          <div
            className="absolute -inset-[40%] rounded-full"
            style={{
              background: `radial-gradient(circle, color-mix(in oklab, var(--sun-1) 40%, transparent), transparent 65%)`,
              filter: 'blur(60px)',
              opacity: op(0.85),
              animation: `${id}-sunPulse ${sec(8)} ease-in-out infinite alternate`,
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 50% 45%, var(--sun-1) 0%, var(--sun-2) 38%, var(--sun-3) 70%, transparent 80%)`,
              opacity: op(0.95),
              maskImage: 'linear-gradient(to bottom, #000 65%, transparent 65%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 65%, transparent 65%)',
              animation: `${id}-sunRise ${sec(40)} ease-in-out infinite alternate`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 10px, var(--bg) 10px, var(--bg) 14px)`,
              maskImage: 'linear-gradient(to bottom, #000 65%, transparent 65%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 65%, transparent 65%)',
              opacity: op(0.85),
              animation: `${id}-scanShift ${sec(30)} linear infinite`,
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: 'color-mix(in oklab, var(--sun-1) 40%, transparent)',
              maskImage: 'linear-gradient(to bottom, #000 60%, transparent 60%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 60%, transparent 60%)',
              boxShadow: `0 0 60px color-mix(in oklab, var(--sun-1) ${50 * intensity}%, transparent)`,
            }}
          />
        </div>
      </div>

      {/* L3 — lens flare */}
      <div
        className="absolute inset-x-0 mx-auto"
        style={{ ...depth(6), bottom: '38%', height: 240, width: 'min(700px, 80vw)', left: 0, right: 0 }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: '120%', height: '60%' }}>
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px]"
            style={{
              background: `linear-gradient(90deg, transparent, color-mix(in oklab, var(--sun-1) 60%, transparent), color-mix(in oklab, var(--sun-2) 80%, transparent), color-mix(in oklab, var(--sun-3) 60%, transparent), transparent)`,
              filter: 'blur(2px)',
              opacity: op(0.7),
              animation: `${id}-flareSweep ${sec(16)} ease-in-out infinite alternate`,
            }}
          />
          {[15, 38, 62, 85].map((x, i) => (
            <div
              key={i}
              className="absolute top-1/2 w-2 h-2 rounded-full"
              style={{
                left: `${x}%`,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${i % 2 ? 'var(--sun-2)' : 'var(--accent)'}, transparent 70%)`,
                filter: 'blur(1px)',
                opacity: op(0.6),
                animation: `${id}-glintTwinkle ${sec(3 + i * 0.5)} ease-in-out infinite alternate`,
                animationDelay: `${-i * 0.7}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* L4 — mountain silhouette */}
      <svg
        className="absolute inset-x-0"
        style={{ ...depth(8), bottom: '30%', width: '120%', height: '12%', left: '-10%' }}
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`${id}-mtnGrad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bg)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M 0 120 L 0 60 L 80 35 L 140 70 L 220 25 L 300 55 L 380 30 L 470 70 L 560 40 L 650 20 L 740 60 L 820 35 L 920 65 L 1000 30 L 1080 55 L 1200 40 L 1200 120 Z"
          fill={`url(#${id}-mtnGrad)`}
          style={{ animation: `${id}-mtnDrift ${sec(60)} linear infinite` }}
        />
      </svg>

      {/* L5 — cloud strata */}
      {[
        { y: '12%', h: '6%', speed: 90, opacity: 0.35, blur: 12 },
        { y: '22%', h: '5%', speed: 70, opacity: 0.28, blur: 10 },
        { y: '34%', h: '4%', speed: 50, opacity: 0.22, blur: 8 },
      ].map((c, i) => (
        <div key={i} className="absolute inset-x-[-20%]" style={{ ...depth(3 + i), top: c.y, height: c.h }}>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg,
                transparent 0%,
                color-mix(in oklab, var(--sun-1) 30%, transparent) 25%,
                color-mix(in oklab, var(--sun-2) 40%, transparent) 50%,
                color-mix(in oklab, var(--sun-3) 30%, transparent) 75%,
                transparent 100%)`,
              filter: `blur(${c.blur}px)`,
              opacity: op(c.opacity),
              mixBlendMode: 'screen',
              animation: `${id}-cloudDrift-${i} ${sec(c.speed)} linear infinite`,
              backgroundSize: '50% 100%',
              backgroundRepeat: 'repeat-x',
            }}
          />
        </div>
      ))}

      {/* L6 — chrome ocean reflection */}
      <div className="absolute inset-x-0" style={{ bottom: 0, height: '32%' }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg,
              color-mix(in oklab, var(--accent) 15%, var(--bg)) 0%,
              color-mix(in oklab, var(--bg) 90%, transparent) 100%)`,
            opacity: op(0.7),
          }}
        />
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: 'min(280px, 32vw)',
            height: '100%',
            background: `linear-gradient(180deg,
              color-mix(in oklab, var(--sun-1) 80%, transparent) 0%,
              color-mix(in oklab, var(--sun-2) 60%, transparent) 30%,
              color-mix(in oklab, var(--sun-3) 30%, transparent) 60%,
              transparent 100%)`,
            filter: 'blur(8px)',
            opacity: op(0.7),
            mixBlendMode: 'screen',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(180deg,
              transparent 0px, transparent 6px,
              color-mix(in oklab, var(--bg) 80%, transparent) 6px, color-mix(in oklab, var(--bg) 80%, transparent) 8px)`,
            opacity: op(0.85),
            maskImage: 'linear-gradient(to bottom, transparent 0%, #000 30%, #000 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 30%, #000 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 top-[10%] h-[8%]"
          style={{
            background: `linear-gradient(90deg, transparent, color-mix(in oklab, var(--sun-1) 50%, transparent), transparent)`,
            filter: 'blur(6px)',
            opacity: op(0.5),
            animation: `${id}-waterShimmer ${sec(12)} ease-in-out infinite alternate`,
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* L7 — neon grid floor + lightcycles minigame */}
      <div
        className="absolute inset-x-[-20%] bottom-[-5%] h-[44%]"
        style={{
          transform: `perspective(900px) rotateX(62deg) translateY(0)`,
          transformOrigin: '50% 0%',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, color-mix(in oklab, var(--accent-2) 70%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in oklab, var(--accent-2) 70%, transparent) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            opacity: op(0.55),
            animation: `${id}-gridScroll ${sec(8)} linear infinite`,
          }}
        />
        {tempo <= 0.6 ? <Lightcycles id={id + '-lc'} /> : null}
        <div
          className="absolute inset-x-0 top-0 h-[20%]"
          style={{
            background: `linear-gradient(to bottom, color-mix(in oklab, var(--accent) 40%, transparent), transparent)`,
            filter: 'blur(8px)',
          }}
        />
      </div>

      {/* L8 — foreground dust motes */}
      <div className="absolute inset-0" style={{ ...depth(20) }}>
        {[...Array(14)].map((_, i) => {
          const x = (i * 37) % 100;
          const y = (i * 53) % 100;
          const dur = 14 + (i % 6) * 3;
          const sz = 1 + (i % 3);
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: sz,
                height: sz,
                background: i % 3 === 0 ? 'var(--sun-1)' : i % 3 === 1 ? 'var(--accent)' : 'var(--accent-2)',
                boxShadow: `0 0 ${sz * 3}px currentColor`,
                color: i % 3 === 0 ? 'var(--sun-1)' : i % 3 === 1 ? 'var(--accent)' : 'var(--accent-2)',
                opacity: op(0.55),
                animation: `${id}-moteFloat-${i % 3} ${sec(dur)} ease-in-out infinite alternate`,
                animationDelay: `${-i * 0.8}s`,
                filter: 'blur(0.5px)',
              }}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes ${id}-skyBreathe {
          0% { transform: translateY(0) scale(1); opacity: ${op(0.6)}; }
          100% { transform: translateY(-2%) scale(1.05); opacity: ${op(0.85)}; }
        }
        @keyframes ${id}-twinkle {
          0%, 100% { opacity: ${op(0.4)}; }
          50% { opacity: ${op(0.8)}; }
        }
        @keyframes ${id}-sunPulse {
          0% { transform: scale(0.95); opacity: ${op(0.7)}; }
          100% { transform: scale(1.08); opacity: ${op(1.0)}; }
        }
        @keyframes ${id}-sunRise {
          0% { transform: translateY(2%); }
          100% { transform: translateY(-2%); }
        }
        @keyframes ${id}-scanShift {
          0% { background-position: 0 0; }
          100% { background-position: 0 14px; }
        }
        @keyframes ${id}-flareSweep {
          0% { transform: translateY(-50%) translateX(-3%) scaleX(0.9); opacity: ${op(0.5)}; }
          100% { transform: translateY(-50%) translateX(3%) scaleX(1.05); opacity: ${op(0.85)}; }
        }
        @keyframes ${id}-glintTwinkle {
          0% { opacity: 0.2; transform: translate(-50%,-50%) scale(0.8); }
          100% { opacity: ${op(0.9)}; transform: translate(-50%,-50%) scale(1.4); }
        }
        @keyframes ${id}-mtnDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-2%); }
        }
        @keyframes ${id}-cloudDrift-0 {
          0% { background-position: 0 0; } 100% { background-position: 50% 0; }
        }
        @keyframes ${id}-cloudDrift-1 {
          0% { background-position: 0 0; } 100% { background-position: -50% 0; }
        }
        @keyframes ${id}-cloudDrift-2 {
          0% { background-position: 0 0; } 100% { background-position: 50% 0; }
        }
        @keyframes ${id}-waterShimmer {
          0% { transform: translateX(-10%); opacity: ${op(0.3)}; }
          100% { transform: translateX(10%); opacity: ${op(0.7)}; }
        }
        @keyframes ${id}-gridScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
        @keyframes ${id}-moteFloat-0 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, -30px); }
        }
        @keyframes ${id}-moteFloat-1 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-15px, -25px); }
        }
        @keyframes ${id}-moteFloat-2 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(8px, -18px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${id}-stop, .${id}-stop * { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DigitalSunset;
