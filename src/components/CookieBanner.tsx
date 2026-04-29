import { useEffect, useState } from 'react';

const COOKIE_NAME = 'tlx_consent';

function getConsent(): 'accepted' | 'declined' | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const value = match.split('=')[1];
  return value === 'accepted' || value === 'declined' ? value : null;
}

function setConsent(value: 'accepted' | 'declined') {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${oneYear}; path=/; SameSite=Lax`;
}

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    setConsent('accepted');
    setVisible(false);
  }

  function decline() {
    setConsent('declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[55] p-4 border-t bd backdrop-blur-md"
      style={{
        background: 'color-mix(in oklab, var(--surface) 92%, transparent)',
        boxShadow: '0 -10px 40px -10px color-mix(in oklab, var(--accent) 20%, transparent)',
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-2 text-sm">
          We use Plausible Analytics (cookieless, privacy-first) to understand site usage. Read our{' '}
          <a href="/datenschutz" className="accent underline">
            Datenschutzerklärung
          </a>
          .
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={decline}
            type="button"
            className="px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] border bd rounded-full hover:opacity-70 transition text-2"
          >
            Decline
          </button>
          <button
            onClick={accept}
            type="button"
            className="px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] rounded-full transition"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
