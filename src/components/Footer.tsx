import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icons';

export const Footer = ({ theme }: { theme: string }) => {
  const logoSrc = theme === 'dark' ? '/logo_dusk.png' : '/logo_dawn.png';
  return (
    <footer className="relative bg-app border-t bd">
      <div className="absolute inset-x-0 top-0 h-px sunset-line opacity-60" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <div
                className="relative w-11 h-11 rounded-lg overflow-hidden grid place-items-center"
                style={{
                  background: theme === 'dark' ? '#0A0A12' : '#FFFFFF',
                  boxShadow:
                    theme === 'dark'
                      ? '0 0 0 1px rgba(0,229,212,0.22) inset'
                      : '0 0 0 1px rgba(200,20,126,0.18) inset',
                }}
              >
                <img src={logoSrc} alt="" className="relative w-9 h-9 object-contain" />
              </div>
              <div>
                <div className="font-marquee text-base tracking-[0.05em] text-1 uppercase">
                  TRENDIVA<span className="accent-2">LUX</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-mut mt-1">Cinematic Websites</div>
              </div>
            </div>
            <p className="text-2 text-sm mt-4 max-w-sm leading-relaxed">
              Cinematic Websites for Businesses That Refuse to Be Forgotten. Built solo from Düren. Deployed globally on the edge.
            </p>
            <a
              href="https://getautomata.ai"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bd transition group"
              style={{ background: 'color-mix(in oklab, var(--surface) 60%, transparent)' }}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-mut">Sister Brand</span>
              <span className="font-mono text-[11px] accent">GetAutomata.ai</span>
              <Icon.ArrowUpRight className="w-3 h-3 text-2 group-hover:opacity-70 transition" />
            </a>
          </div>

          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-mut mb-4">Navigate</div>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#builds" className="text-2 hover:opacity-70 transition">Builds</a></li>
              <li><a href="#offers" className="text-2 hover:opacity-70 transition">Offers</a></li>
              <li><a href="#contact" className="text-2 hover:opacity-70 transition">Process</a></li>
              <li><a href="#contact" className="text-2 hover:opacity-70 transition">FAQ</a></li>
              <li><a href="#contact" className="text-2 hover:opacity-70 transition">Contact</a></li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-mut mb-4">Legal</div>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/impressum" className="text-2 hover:opacity-70 transition">Impressum</Link></li>
                <li><Link to="/datenschutz" className="text-2 hover:opacity-70 transition">Datenschutz</Link></li>
                <li><Link to="/agb" className="text-2 hover:opacity-70 transition">AGB (B2B)</Link></li>
                <li><Link to="/agb-b2c" className="text-2 hover:opacity-70 transition">AGB (B2C)</Link></li>
                <li><Link to="/widerrufsbelehrung" className="text-2 hover:opacity-70 transition">Widerrufsbelehrung</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-mut mb-4">Connect</div>
              <button
                onClick={() => window.openContactModal?.()}
                className="contact-cta group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-sm font-mono uppercase tracking-[0.18em] text-[11px] font-semibold transition relative overflow-visible"
                style={{
                  background: 'color-mix(in oklab, var(--accent) 10%, transparent)',
                  borderColor: 'color-mix(in oklab, var(--accent) 50%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                <Icon.Mail className="w-3.5 h-3.5" />
                <span>Send a Message</span>
                <Icon.ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </button>
              <a href="mailto:hello@trendivalux.com" className="mt-3 inline-flex items-center gap-2 text-xs text-mut hover:opacity-70 transition font-mono">
                <span className="opacity-60">or email</span> hello@trendivalux.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t bd flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-mut">Built in Düren. Deployed globally. © 2026 Trendiva Lux.</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-mut flex items-center gap-3">
            <span className="nav-badge">
              <span className="nav-badge__dot" />
              By Trendiva Lux
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} /> SYS · OPERATIONAL
            </span>
            <span>Δ EDGE · 18ms</span>
          </div>
        </div>
      </div>

      <div className="relative h-[80px] sm:h-[120px] md:h-[180px] overflow-hidden border-t bd">
        <div className="absolute inset-0 grid place-items-center">
          <div className="font-marquee text-[16vw] md:text-[18vw] leading-none tracking-[0.02em] select-none whitespace-nowrap uppercase neon-tube" style={{ opacity: 0.55 }}>
            TRENDIVALUX
          </div>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 60%, transparent), color-mix(in oklab, var(--accent-2) 50%, transparent), transparent)',
          }}
        />
      </div>
    </footer>
  );
};

export const WaitlistModal = ({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<{ success: boolean; error?: string }> | void;
}) => {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) {
      setEmail('');
      setDone(false);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'color-mix(in oklab, var(--bg) 80%, transparent)' }} onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border bd overflow-hidden"
        style={{
          background: 'var(--surface)',
          boxShadow: '0 30px 80px -20px color-mix(in oklab, var(--accent) 25%, transparent), 0 0 0 1px color-mix(in oklab, var(--accent) 15%, transparent) inset',
          animation: 'modal-in 400ms cubic-bezier(.2,.7,.1,1) both',
          paddingBottom: 'env(safe-area-inset-bottom)',
          overscrollBehavior: 'contain',
        }}
      >
        <style>{`@keyframes modal-in { from { transform: translateY(20px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
        <button onClick={onClose} className="absolute top-3 right-3 w-11 h-11 grid place-items-center rounded-full border bd hover:opacity-70 transition" aria-label="Close">
          <Icon.Close className="w-3.5 h-3.5 text-2" />
        </button>

        <div className="p-6 sm:p-7">
          {!done ? (
            <>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] accent">// WAITLIST</div>
              <h3 className="font-display font-bold text-2xl tracking-tight mt-2 text-1">Get notified when bookings open.</h3>
              <p className="text-2 text-sm mt-2">No spam. One email when next month's slots go live.</p>
              <form
                className="mt-5 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!email || submitting) return;
                  setError(null);
                  setSubmitting(true);
                  try {
                    const result = await onSubmit(email);
                    if (result && typeof result === 'object' && result.success === false) {
                      setError(result.error || 'Something went wrong. Please try again.');
                      setSubmitting(false);
                      return;
                    }
                    setDone(true);
                  } catch {
                    setError('Network error. Please try again.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="w-full min-h-[48px] px-4 py-3 rounded-lg border bd font-mono focus:outline-none"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)', fontSize: '16px' }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-lg font-mono text-[11px] font-bold uppercase tracking-[0.22em] transition disabled:opacity-60"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  {submitting ? 'Joining…' : <>Join Waitlist <Icon.ArrowRight className="w-3.5 h-3.5" /></>}
                </button>
                {error && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-center pt-1" style={{ color: '#ff6b9a' }}>
                    {error}
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="text-center py-3">
              <div
                className="grid place-items-center w-14 h-14 mx-auto rounded-full border"
                style={{
                  background: 'color-mix(in oklab, var(--accent) 10%, transparent)',
                  borderColor: 'color-mix(in oklab, var(--accent) 40%, transparent)',
                  boxShadow: '0 0 30px color-mix(in oklab, var(--accent) 35%, transparent)',
                }}
              >
                <Icon.Check className="w-6 h-6 accent" />
              </div>
              <h3 className="font-display font-bold text-2xl mt-4 text-1">You are on the list.</h3>
              <p className="text-2 text-sm mt-2">We will email you when bookings open.</p>
              <button onClick={onClose} className="mt-5 px-5 py-2.5 rounded-lg border bd font-mono text-[11px] uppercase tracking-[0.22em] hover:opacity-70 transition text-2">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ContactModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName('');
      setEmail('');
      setMessage('');
      setDone(false);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitting(true);
    (window as any).__contactSubmissions = (window as any).__contactSubmissions || [];
    (window as any).__contactSubmissions.push({ name, email, message, ts: new Date().toISOString() });
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'color-mix(in oklab, var(--bg) 80%, transparent)' }} onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border bd overflow-hidden max-h-[100svh] sm:max-h-[92vh] overflow-y-auto"
        style={{
          background: 'var(--surface)',
          boxShadow: '0 30px 80px -20px color-mix(in oklab, var(--accent) 25%, transparent), 0 0 0 1px color-mix(in oklab, var(--accent) 15%, transparent) inset',
          animation: 'modal-in 400ms cubic-bezier(.2,.7,.1,1) both',
          paddingBottom: 'env(safe-area-inset-bottom)',
          overscrollBehavior: 'contain',
        }}
      >
        <style>{`@keyframes modal-in { from { transform: translateY(20px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
        <button onClick={onClose} className="absolute top-3 right-3 w-11 h-11 grid place-items-center rounded-full border bd hover:opacity-70 transition z-10" aria-label="Close">
          <Icon.Close className="w-3.5 h-3.5 text-2" />
        </button>

        <div className="p-6 sm:p-7">
          {!done ? (
            <>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] accent">// CONTACT</div>
              <h3 className="font-display font-bold text-[1.7rem] tracking-tight mt-2 text-1 leading-tight">Tell us about your project.</h3>
              <p className="text-2 text-sm mt-2">A few lines. What you're building, the deadline, anything that matters. We respond within one working day.</p>
              <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="min-h-[48px] px-4 py-3 rounded-lg border bd font-mono focus:outline-none focus:ring-1"
                    style={{ background: 'var(--surface-2)', color: 'var(--text)', fontSize: '16px' }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="min-h-[48px] px-4 py-3 rounded-lg border bd font-mono focus:outline-none focus:ring-1"
                    style={{ background: 'var(--surface-2)', color: 'var(--text)', fontSize: '16px' }}
                  />
                </div>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A few lines about what you're building…"
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border bd font-mono focus:outline-none resize-none"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)', fontSize: '16px' }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-lg font-mono text-[11px] font-bold uppercase tracking-[0.22em] transition disabled:opacity-60"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  {submitting ? (
                    <>
                      <span className="inline-block w-3 h-3 rounded-full border-2 border-black/40 border-t-black animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      Send Message <Icon.ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-mut font-mono uppercase tracking-[0.22em] text-center pt-1">Or email hello@trendivalux.com directly.</p>
              </form>
            </>
          ) : (
            <div className="text-center py-3">
              <div
                className="grid place-items-center w-14 h-14 mx-auto rounded-full border"
                style={{
                  background: 'color-mix(in oklab, var(--accent) 10%, transparent)',
                  borderColor: 'color-mix(in oklab, var(--accent) 40%, transparent)',
                  boxShadow: '0 0 30px color-mix(in oklab, var(--accent) 35%, transparent)',
                }}
              >
                <Icon.Check className="w-6 h-6 accent" />
              </div>
              <h3 className="font-display font-bold text-2xl mt-4 text-1">Message sent.</h3>
              <p className="text-2 text-sm mt-2">We'll respond within one working day. Watch your inbox.</p>
              <button onClick={onClose} className="mt-5 px-5 py-2.5 rounded-lg border bd font-mono text-[11px] uppercase tracking-[0.22em] hover:opacity-70 transition text-2">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Footer;
