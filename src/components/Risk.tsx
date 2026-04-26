import { Icon } from './Icons';

const PILLARS = [
  {
    I: 'Shield',
    num: 'I',
    clause: 'CLAUSE 01',
    tag: 'REFUND',
    title: 'Seven-Day Refund',
    body: 'If after our discovery questionnaire you decide we are not the right fit, your €500 deposit is fully refunded. No questions, no friction.',
    accent: 'var(--accent)',
    accentName: 'cyan',
  },
  {
    I: 'Key',
    num: 'II',
    clause: 'CLAUSE 02',
    tag: 'OWNERSHIP',
    title: 'Full Ownership Transfer',
    body: 'On launch day you receive every file, every credential, every domain record. You own the site forever. We do not hold your business hostage.',
    accent: 'var(--accent-2)',
    accentName: 'magenta',
  },
  {
    I: 'Unlock',
    num: 'III',
    clause: 'CLAUSE 03',
    tag: 'NO LOCK-IN',
    title: 'No Hidden Retainers',
    body: 'Hosting, maintenance, and updates are optional and clearly priced. You pay once for the build. Recurring is your choice.',
    accent: 'var(--gold)',
    accentName: 'gold',
  },
];

const Pillar = ({ p }: { p: any }) => {
  const I = (Icon as any)[p.I];
  return (
    <div className="relative group h-full">
      <article
        className="relative h-full rounded-[18px] border bd overflow-hidden transition-all duration-500 group-hover:-translate-y-1"
        style={{
          background: `linear-gradient(180deg,
            color-mix(in oklab, var(--surface) 92%, transparent) 0%,
            color-mix(in oklab, var(--surface-2) 78%, transparent) 100%)`,
          boxShadow: `
            inset 0 1px 0 color-mix(in oklab, var(--text) 18%, transparent),
            inset 0 -1px 0 color-mix(in oklab, ${p.accent} 32%, transparent),
            0 22px 48px -24px color-mix(in oklab, ${p.accent} 38%, transparent)
          `,
        }}
      >
        <div
          className="absolute top-0 inset-x-0 h-3 pointer-events-none flex items-center justify-center"
          style={{
            background: `linear-gradient(180deg, color-mix(in oklab, ${p.accent} 12%, transparent) 0%, transparent 100%)`,
          }}
        >
          <div
            className="w-full h-px"
            style={{
              backgroundImage: `radial-gradient(circle, color-mix(in oklab, ${p.accent} 65%, transparent) 0.6px, transparent 1px)`,
              backgroundSize: '6px 1px',
              backgroundRepeat: 'repeat-x',
              opacity: 0.85,
            }}
          />
        </div>

        <div
          className="absolute top-0 bottom-0 left-0 w-[3px]"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${p.accent} 30%, ${p.accent} 70%, transparent 100%)`,
            opacity: 0.55,
            boxShadow: `0 0 12px ${p.accent}`,
          }}
        />

        <div className="relative p-7 pt-8 h-full flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.32em] flex items-center gap-2" style={{ color: 'color-mix(in oklab, var(--text) 70%, transparent)' }}>
                <span style={{ color: p.accent, opacity: 0.9 }}>§</span>
                <span className="text-mut">{p.clause}</span>
                <span className="text-mut opacity-50">·</span>
                <span className="text-mut">NOTARIZED</span>
              </div>
              <div
                className="inline-flex items-center gap-2 mt-3 px-2.5 py-1 rounded-full border font-mono text-[9px] uppercase tracking-[0.28em]"
                style={{
                  background: `color-mix(in oklab, ${p.accent} 14%, transparent)`,
                  borderColor: `color-mix(in oklab, ${p.accent} 45%, transparent)`,
                  color: p.accent,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.accent, boxShadow: `0 0 8px ${p.accent}` }} />
                {p.tag}
              </div>
            </div>

            <div className="relative shrink-0 transition-transform duration-500 group-hover:rotate-[8deg]">
              <div
                className="w-[68px] h-[68px] rounded-full grid place-items-center relative"
                style={{
                  background: `radial-gradient(circle at 32% 28%,
                    color-mix(in oklab, ${p.accent} 38%, transparent) 0%,
                    color-mix(in oklab, ${p.accent} 14%, transparent) 50%,
                    color-mix(in oklab, ${p.accent} 22%, transparent) 100%)`,
                  border: `1.5px solid color-mix(in oklab, ${p.accent} 55%, transparent)`,
                  boxShadow: `
                    0 0 28px color-mix(in oklab, ${p.accent} 40%, transparent),
                    inset 0 2px 4px color-mix(in oklab, var(--text) 25%, transparent),
                    inset 0 -2px 4px color-mix(in oklab, ${p.accent} 35%, transparent)
                  `,
                }}
              >
                <div
                  className="absolute inset-1.5 rounded-full pointer-events-none"
                  style={{ border: `1px dashed color-mix(in oklab, ${p.accent} 50%, transparent)`, opacity: 0.7 }}
                />
                <I className="w-7 h-7 relative" style={{ color: p.accent, filter: `drop-shadow(0 0 6px ${p.accent})` }} />
              </div>
              <div
                className="absolute -top-2 -right-1 font-marquee text-[14px] leading-none px-1.5 py-0.5 rounded"
                style={{
                  background: 'color-mix(in oklab, var(--surface) 90%, transparent)',
                  border: `1px solid color-mix(in oklab, ${p.accent} 50%, transparent)`,
                  color: p.accent,
                  letterSpacing: '0.05em',
                }}
              >
                {p.num}
              </div>
            </div>
          </div>

          <h3 className="font-display font-bold text-[1.45rem] text-1 mt-6 leading-[1.08] tracking-display">{p.title}</h3>

          <p className="text-2 leading-relaxed mt-3 font-editorial text-[1.02rem] flex-1">{p.body}</p>

          <div className="mt-7 pt-4 flex items-end justify-between gap-3" style={{ borderTop: `1px dashed color-mix(in oklab, ${p.accent} 28%, transparent)` }}>
            <div className="font-script italic text-[0.95rem] leading-none" style={{ color: `color-mix(in oklab, ${p.accent} 80%, var(--text))`, opacity: 0.85 }}>
              ✓ Approved
            </div>
            <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-mut text-right leading-tight">
              <div>Düren · DE</div>
              <div className="opacity-60">v.{2024 + ['I', 'II', 'III'].indexOf(p.num)}.01</div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export const Risk = () => (
  <section className="relative py-24 md:py-32 bg-app overflow-hidden" data-screen-label="06 Promise">
    <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-30" />

    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{
        width: '90%',
        height: '80%',
        background: 'radial-gradient(ellipse at 50% 50%, color-mix(in oklab, var(--gold) 12%, transparent), transparent 60%)',
        filter: 'blur(40px)',
      }}
    />

    <div
      className="absolute inset-0 pointer-events-none opacity-[0.06]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent 0px, transparent 31px, color-mix(in oklab, var(--text) 60%, transparent) 31px, color-mix(in oklab, var(--text) 60%, transparent) 32px)',
      }}
    />

    <div className="relative max-w-[1100px] mx-auto px-6 lg:px-10">
      <div className="text-center max-w-[760px] mx-auto">
        <div className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] gold">
          <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--gold) 60%, transparent)' }} />
          <span>// THE PROMISE</span>
          <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--gold) 60%, transparent)' }} />
        </div>
        <h2 className="font-display font-bold tracking-display mt-5 text-[clamp(2.2rem,5vw,3.6rem)] leading-[0.96] text-1">
          Three guarantees.
          <span className="block font-script grad-text-cm italic mt-1">Zero lock-in.</span>
        </h2>
        <p className="text-2 mt-5 leading-relaxed font-editorial text-[1.1rem] max-w-[600px] mx-auto">
          The studio works for you, not the other way around. Every contract carries these three lines — in writing, on day one.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
        {PILLARS.map((p) => (
          <Pillar key={p.title} p={p} />
        ))}
      </div>

      <div className="mt-16 relative">
        <div className="flex items-end justify-center gap-8 md:gap-14 max-w-[860px] mx-auto">
          <div className="flex-1 max-w-[180px] hidden sm:block">
            <div className="font-script italic text-1 text-[1.1rem] leading-none mb-1.5 text-right pr-2" style={{ color: 'color-mix(in oklab, var(--accent-2) 70%, var(--text))' }}>
              T. Lux
            </div>
            <div className="h-px w-full" style={{ background: 'color-mix(in oklab, var(--text) 35%, transparent)' }} />
            <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-mut mt-1.5 text-right pr-2">Studio · Düren</div>
          </div>

          <div className="shrink-0 grid place-items-center">
            <div
              className="relative w-[88px] h-[88px] rounded-full grid place-items-center"
              style={{
                background: `radial-gradient(circle at 32% 28%,
                  color-mix(in oklab, var(--gold) 32%, transparent) 0%,
                  color-mix(in oklab, var(--gold) 10%, transparent) 60%,
                  color-mix(in oklab, var(--gold) 18%, transparent) 100%)`,
                border: `1.5px solid color-mix(in oklab, var(--gold) 55%, transparent)`,
                boxShadow: `
                  0 0 36px color-mix(in oklab, var(--gold) 35%, transparent),
                  inset 0 2px 4px color-mix(in oklab, var(--text) 22%, transparent),
                  inset 0 -2px 4px color-mix(in oklab, var(--gold) 30%, transparent)
                `,
              }}
            >
              <div className="absolute inset-2 rounded-full" style={{ border: '1px dashed color-mix(in oklab, var(--gold) 55%, transparent)' }} />
              <div className="text-center leading-none">
                <div className="font-marquee text-[10px] uppercase tracking-[0.2em] gold">Signed</div>
                <div className="font-script italic text-[1.1rem] gold mt-0.5">in ink</div>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-[180px] hidden sm:block">
            <div className="font-script italic text-1 text-[1.1rem] leading-none mb-1.5" style={{ color: 'color-mix(in oklab, var(--accent) 70%, var(--text))' }}>
              The Client
            </div>
            <div className="h-px w-full" style={{ background: 'color-mix(in oklab, var(--text) 35%, transparent)' }} />
            <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-mut mt-1.5">Day One · ____</div>
          </div>
        </div>

        <div className="mt-9 text-center">
          <div className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-mut">
            <span className="h-px w-8" style={{ background: 'color-mix(in oklab, var(--gold) 50%, transparent)' }} />
            <span>SIGNED IN INK · DÜREN, DE</span>
            <span className="h-px w-8" style={{ background: 'color-mix(in oklab, var(--gold) 50%, transparent)' }} />
          </div>
          <p className="font-script italic text-2 text-[1.15rem] mt-3 max-w-[640px] mx-auto leading-snug">
            <span className="opacity-60 mr-1">"</span>
            We move fast because we have to. We honor the small print because we choose to.
            <span className="opacity-60 ml-1">"</span>
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Risk;
