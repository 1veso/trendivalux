import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { DigitalSunset, Vignette } from './Atmosphere';

export const FinalCTA = ({ onWaitlist }: { onWaitlist: () => void }) => (
  <section id="contact" className="relative py-28 md:py-40 bg-app overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-40" style={{ zIndex: 5 }} />

    <DigitalSunset tempo={1.0} intensity={1.2} id="final-sunset" />
    <Vignette />

    <div className="relative max-w-[900px] mx-auto px-6 text-center">
      <div className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] gold">
        <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--gold) 60%, transparent)' }} />
        <span>// READY?</span>
        <span className="h-px w-10" style={{ background: 'color-mix(in oklab, var(--gold) 60%, transparent)' }} />
      </div>
      <h2 className="font-marquee mt-6 text-[clamp(2.4rem,6vw,5rem)] leading-[1.05] uppercase neon-tube-pink">Two slots left</h2>
      <h3 className="font-script grad-text italic text-[clamp(2rem,5vw,3.6rem)] leading-[1] mt-2">this month.</h3>
      <p className="text-2 text-lg leading-relaxed max-w-[600px] mx-auto mt-7 font-editorial text-[1.18rem]">
        After that, we open booking for next month. Reserve yours now or join the waitlist — either way, the next reply lands in your inbox within 24 hours.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#offers"
          className="gold-pulse group inline-flex items-center gap-2.5 pl-6 pr-5 py-3.5 rounded-full font-mono text-[12px] font-bold uppercase tracking-[0.18em] cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            window.openOrderModal?.('landing');
          }}
          style={{ background: 'var(--gold)', color: '#000' }}
        >
          Reserve a Slot — €500
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/15 group-hover:translate-x-0.5 transition">
            <Icon.ArrowRight className="w-3.5 h-3.5" />
          </span>
        </a>
        <button
          onClick={onWaitlist}
          className="group inline-flex items-center gap-2 pl-5 pr-4 py-3.5 rounded-full border accent font-mono text-[12px] font-semibold uppercase tracking-[0.18em] transition"
          style={{ borderColor: 'color-mix(in oklab, var(--accent) 50%, transparent)' }}
        >
          Join Waitlist
          <Icon.Mail className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-12 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-mut">
        <Icon.MapPin className="w-3.5 h-3.5" />
        <span>Düren, DE — Replies within 24h</span>
      </div>
    </div>
  </section>
);

const MONTH_LABEL = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const StickyBar = ({
  onReserve,
  remainingSlots,
  onWaitlist,
}: {
  onReserve: (id?: string) => void;
  remainingSlots?: number | null;
  onWaitlist?: () => void;
}) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const offers = document.getElementById('offers');
      const offY = offers ? offers.getBoundingClientRect().top : 9999;
      const past = window.scrollY > 600;
      const inOffers = offY < 200 && offY > -1500;
      setShow(past && !inOffers);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLoading = remainingSlots === null || remainingSlots === undefined;
  const isBookedOut = !isLoading && remainingSlots === 0;
  const labelText = isLoading
    ? 'Loading availability…'
    : isBookedOut
      ? 'Booked out this month'
      : `${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} remaining`;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-500 ${show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="border-t backdrop-blur-xl"
        style={{
          borderColor: 'color-mix(in oklab, var(--accent-2) 60%, transparent)',
          background: 'color-mix(in oklab, var(--bg) 75%, transparent)',
          boxShadow: '0 -10px 40px -10px color-mix(in oklab, var(--accent-2) 30%, transparent)',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent-2)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent-2)' }} />
            </span>
            <span className="text-1 truncate">{labelText}</span>
            <span className="hidden sm:inline text-mut">— {MONTH_LABEL}</span>
          </div>
          {isBookedOut && onWaitlist ? (
            <button
              onClick={onWaitlist}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition cursor-pointer shrink-0"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              Join Waitlist <Icon.ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <a
              href="#offers"
              onClick={(e) => {
                e.preventDefault();
                onReserve?.('landing');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition cursor-pointer shrink-0"
              style={{ background: 'var(--gold)', color: '#000' }}
            >
              Reserve Slot <Icon.ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalCTA;
