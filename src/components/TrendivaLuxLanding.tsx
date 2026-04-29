import { useEffect, useRef, useState } from 'react';
import { TopNav, Hero } from './Hero';
import { Builds } from './Builds';
import { Offers } from './Offers';
import { Process } from './Process';
import { Engine } from './Engine';
import { Risk } from './Risk';
import { FAQ } from './FAQ';
import { FinalCTA, StickyBar } from './FinalCTA';
import { Footer, WaitlistModal, ContactModal } from './Footer';
import { OrderModal } from './OrderModal';
import { ExitIntentModal } from './ExitIntentModal';
import { CookieBanner } from './CookieBanner';
import { bookStrategyCall } from '../lib/order-modal';
import { captureWaitlistEmail, captureSiteAuditLead } from '../lib/email-capture';
import { useExitIntent } from '../hooks/useExitIntent';
import { trackEvent } from '../lib/analytics';
import { getRemainingSlots } from '../lib/scarcity';
import SEO from './SEO';

declare global {
  interface Window {
    openOrderModal?: (tierId?: string) => void;
    openContactModal?: () => void;
  }
}

const handleBookStrategyCall = () => {
  bookStrategyCall();
};

const handleWaitlistSignup = async (email: string) => {
  const result = await captureWaitlistEmail(email);
  if (result.success) trackEvent('Waitlist Signup');
  return result;
};

const handleSiteAuditLead = async (email: string) => {
  const result = await captureSiteAuditLead(email);
  if (result.success) trackEvent('Site Audit Lead');
  return result;
};

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

export default function TrendivaLuxLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tdl-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    const h = new Date().getHours();
    return h >= 6 && h < 18 ? 'light' : 'dark';
  });
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderTier, setOrderTier] = useState('landing');
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);
  const { shouldShow: showExitIntent, dismiss: dismissExitIntent } = useExitIntent();

  const openOrder = (tierId: string = 'landing') => {
    setOrderTier(tierId);
    setOrderOpen(true);
  };

  useEffect(() => {
    getRemainingSlots().then(setRemainingSlots);
  }, []);

  useEffect(() => {
    window.openOrderModal = openOrder;
    window.openContactModal = () => setContactOpen(true);
    return () => {
      delete window.openOrderModal;
      delete window.openContactModal;
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--show-birds', theme === 'light' ? 'block' : 'none');
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

  return (
    <div className="relative">
      <SEO />
      <TopNav scrolled={scrolled} theme={theme} onToggle={toggleTheme} />
      <Hero theme={theme} remainingSlots={remainingSlots} />
      <Reveal>
        <Builds />
      </Reveal>
      <Reveal>
        <Offers onReserve={openOrder} onCall={handleBookStrategyCall} />
      </Reveal>
      <Reveal>
        <Process />
      </Reveal>
      <Reveal>
        <Engine />
      </Reveal>
      <Reveal>
        <Risk />
      </Reveal>
      <Reveal>
        <FAQ />
      </Reveal>
      <Reveal>
        <FinalCTA onWaitlist={() => setWaitlistOpen(true)} />
      </Reveal>
      <Footer theme={theme} />
      <StickyBar onReserve={openOrder} remainingSlots={remainingSlots} onWaitlist={() => setWaitlistOpen(true)} />
      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} onSubmit={handleWaitlistSignup} />
      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} initialTier={orderTier} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <ExitIntentModal
        open={showExitIntent}
        onClose={dismissExitIntent}
        onSubmit={handleSiteAuditLead}
      />
      <CookieBanner />
    </div>
  );
}
