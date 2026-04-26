import { useState } from 'react';
import { Icon } from './Icons';

const QA: [string, string][] = [
  ['How fast can you actually deliver?', 'Landing tier in 3 days. Business in 14. Store in 21. Web App in 4 to 6 weeks. We hit these dates because we run lean and use AI-augmented tooling. The deadline is not a marketing claim — it is in your contract.'],
  ['Who actually builds the site?', 'Jay (founder) leads every project end to end. We use AI agents (Claude Code, R59, R60) as force multipliers, not as replacements. You always work directly with the founder. No account managers, no offshore handoffs.'],
  ['What if I do not like the design?', 'One round of revisions is included before build. If after revisions we still are not aligned, you cancel and your deposit is refunded. We do not start building until you say go.'],
  ['Do you offer hosting and maintenance?', 'Optional. Cloudflare Pages hosting is free for most projects. Maintenance retainers start at €290 per month for security patches, content updates, and analytics reviews. You can also self-host. Your call.'],
  ['Is the site mine, or do you keep ownership?', 'Yours. Completely. On launch day you receive the GitHub repo, all credentials, all domain records, all assets. We do not hold ownership over a single byte.'],
  ['What about hosting Germany / GDPR / Datenschutz?', 'Cloudflare offers EU data residency. We provide a GDPR-compliant cookie banner, an Impressum template (per §5 TMG), and Datenschutzerklärung based on IT-Recht Kanzlei templates. We are based in Düren, we know the rules.'],
  ['Can you redesign my existing site instead of building from scratch?', 'Yes. Send us your URL during discovery. If a redesign is better than a rebuild, we will tell you (and quote it accordingly).'],
];

export const FAQ = () => {
  const [open, setOpen] = useState(0);
  return (
    <section className="relative py-24 md:py-32 bg-app overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-30" />

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '80%',
          height: '70%',
          background: 'radial-gradient(ellipse at 50% 50%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 60%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative max-w-[920px] mx-auto px-6">
        <div className="text-center mb-14 max-w-[680px] mx-auto">
          <div className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] accent">
            <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent) 60%, transparent)' }} />
            <span>// QUESTIONS</span>
            <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--accent) 60%, transparent)' }} />
          </div>
          <h2 className="font-display font-bold tracking-display mt-5 text-[clamp(2.2rem,5vw,3.6rem)] leading-[0.96] text-1">
            Everything
            <span className="font-script grad-text-cm italic"> else.</span>
          </h2>
          <p className="text-2 mt-5 leading-relaxed font-editorial text-[1.1rem]">Plain answers, no padding. If something is missing here, just ask.</p>
        </div>

        <div
          className="rounded-2xl border bd backdrop-blur-md overflow-hidden"
          style={{
            background: 'color-mix(in oklab, var(--surface) 50%, transparent)',
            boxShadow: 'inset 0 1px 0 color-mix(in oklab, var(--text) 10%, transparent), 0 30px 60px -30px color-mix(in oklab, var(--accent) 18%, transparent)',
          }}
        >
          {QA.map(([q, a], i) => {
            const isOpen = open === i;
            const accent = i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? 'var(--accent-2)' : 'var(--gold)';
            return (
              <div
                key={q}
                className="relative border-b bd last:border-b-0 transition-colors"
                style={{ background: isOpen ? `color-mix(in oklab, ${accent} 6%, transparent)` : 'transparent' }}
              >
                {isOpen && (
                  <span
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ background: `linear-gradient(180deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 12px ${accent}` }}
                  />
                )}
                <button
                  className="w-full text-left px-6 md:px-8 py-5 flex items-center justify-between gap-6 group"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                >
                  <span className="flex items-start gap-5">
                    <span
                      className="font-marquee text-[18px] leading-none mt-0.5 transition-colors"
                      style={{
                        color: isOpen ? 'transparent' : 'color-mix(in oklab, var(--text-muted) 80%, transparent)',
                        WebkitTextStroke: isOpen ? `1px ${accent}` : 'none',
                      }}
                    >
                      0{i + 1}
                    </span>
                    <span className="font-display font-semibold text-base md:text-lg text-1 group-hover:opacity-80 transition leading-snug">{q}</span>
                  </span>
                  <span
                    className="grid place-items-center w-8 h-8 rounded-full border bd shrink-0 transition-all duration-300"
                    style={{
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                      background: isOpen ? `color-mix(in oklab, ${accent} 18%, transparent)` : 'transparent',
                      borderColor: isOpen ? `color-mix(in oklab, ${accent} 60%, transparent)` : 'var(--border)',
                      boxShadow: isOpen ? `0 0 18px color-mix(in oklab, ${accent} 40%, transparent)` : 'none',
                    }}
                  >
                    <Icon.Plus className="w-3.5 h-3.5" style={{ color: isOpen ? accent : 'var(--text-2)' }} />
                  </span>
                </button>
                <div className="grid transition-all duration-400 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}>
                  <div className="overflow-hidden">
                    <p className="px-6 md:px-8 pb-6 pl-[68px] md:pl-[80px] text-2 leading-relaxed font-editorial text-[1.05rem]">{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center font-script italic text-2 text-lg">
          Still curious?{' '}
          <a href="#contact" className="accent underline-offset-4 hover:underline transition not-italic font-mono text-[11px] uppercase tracking-[0.22em] ml-1">
            Ask in the discovery questionnaire ↓
          </a>
        </p>
      </div>
    </section>
  );
};

export default FAQ;
