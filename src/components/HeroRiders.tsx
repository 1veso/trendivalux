import { useEffect, useId, useRef, useState } from 'react';

// The scene is decorative and loads after the hero content. A static composition
// remains for reduced motion, unavailable WebGL, and lost graphics contexts.
export default function HeroRiders() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let cleanup: (() => void) | undefined;
    let pending = false;
    const start = async () => {
      if (disposed || pending || cleanup || motion.matches || !window.WebGL2RenderingContext) return;
      pending = true;
      try {
        const { mountRiderScene } = await import('./hero-riders/scene');
        if (disposed || motion.matches) return;
        cleanup = mountRiderScene(element, () => { if (!disposed) setReady(true); }, () => { if (!disposed) setReady(false); });
      } catch { if (!disposed) setReady(false); }
      finally { pending = false; }
    };
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) void start(); }, { rootMargin: '150px' });
    observer.observe(element);
    const onMotion = () => {
      if (motion.matches) { cleanup?.(); cleanup = undefined; setReady(false); }
      else void start();
    };
    motion.addEventListener('change', onMotion);
    return () => { disposed = true; observer.disconnect(); motion.removeEventListener('change', onMotion); cleanup?.(); };
  }, []);

  return <div className="hero-riders absolute inset-x-0 bottom-[-5%] h-[44%] pointer-events-none" aria-hidden="true" data-renderer={ready ? 'webgl' : 'static'}>
    <div className="absolute inset-0" style={{ opacity: ready ? 0 : 1 }}>
      <div className="absolute inset-x-[-20%] top-[24%] bottom-[-30%]" style={{ transform: 'perspective(700px) rotateX(62deg)', transformOrigin: '50% 0%', backgroundImage: 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 32%, transparent) 1px, transparent 1px), linear-gradient(color-mix(in srgb, var(--accent-2) 32%, transparent) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'linear-gradient(transparent, #000 28%)' }} />
      <svg viewBox="0 0 1200 400" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <linearGradient id={`${id}-cyan`}><stop stopColor="var(--accent)" stopOpacity="0"/><stop offset="1" stopColor="var(--accent)" stopOpacity=".8"/></linearGradient>
          <linearGradient id={`${id}-pink`}><stop stopColor="var(--accent-2)" stopOpacity="0"/><stop offset="1" stopColor="var(--accent-2)" stopOpacity=".8"/></linearGradient>
        </defs>
        {[{ x: 280, y: 255, color: 'var(--accent)', trail: 'cyan', flip: 1 }, { x: 880, y: 160, color: 'var(--accent-2)', trail: 'pink', flip: -1 }].map(({x,y,color,trail,flip}) => <g key={trail} transform={`translate(${x} ${y}) scale(${flip} 1)`}>
          <path d="M-280 6 Q-150 12-55 22 L-55-20 Q-150-34-280-16Z" fill={`url(#${id}-${trail})`} opacity=".35"/>
          <path d="M-260 25Q-150 30-55 26" stroke={color} strokeWidth="2" opacity=".55"/>
          <ellipse cx="0" cy="43" rx="89" ry="13" fill={color} opacity=".08"/>
          <g stroke={color} strokeWidth="3" fill="#111c29">
            <ellipse cx="-44" cy="25" rx="24" ry="26"/><ellipse cx="50" cy="12" rx="23" ry="25"/>
            <path d="M-58 7-23-12 46-22 62-3 12 18-47 23Z"/>
            <path d="M-30-10-17-33 6-50 30-28 38-19"/>
            <ellipse cx="13" cy="-54" rx="13" ry="15"/>
          </g>
          <path d="M7-55 25-59M-17-28 13-14 6 12M28-28 43-24" stroke={color} strokeWidth="4"/>
        </g>)}
      </svg>
    </div>
    <div ref={host} className="absolute inset-0" style={{ opacity: ready ? 1 : 0, maskImage: 'linear-gradient(to bottom, transparent, #000 18%)' }} />
  </div>;
}
