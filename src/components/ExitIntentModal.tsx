import { useEffect, useState } from 'react';
import { Icon } from './Icons';

interface ExitIntentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export const ExitIntentModal = ({ open, onClose, onSubmit }: ExitIntentModalProps) => {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setHoneypot('');
      setDone(false);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: 'color-mix(in oklab, var(--bg) 82%, transparent)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border bd overflow-hidden"
        style={{
          background: 'var(--surface)',
          boxShadow:
            '0 30px 80px -20px color-mix(in oklab, var(--accent-2) 30%, transparent), 0 0 0 1px color-mix(in oklab, var(--accent-2) 18%, transparent) inset',
          animation: 'modal-in 420ms cubic-bezier(.2,.7,.1,1) both',
          paddingBottom: 'env(safe-area-inset-bottom)',
          overscrollBehavior: 'contain',
        }}
      >
        <style>{`@keyframes modal-in { from { transform: translateY(20px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-11 h-11 grid place-items-center rounded-full border bd hover:opacity-70 transition z-10"
          aria-label="Close"
          type="button"
        >
          <Icon.Close className="w-3.5 h-3.5 text-2" />
        </button>

        <div className="p-6 sm:p-7">
          {!done ? (
            <>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] accent-2">// BEFORE YOU GO</div>
              <h3 className="font-display font-bold text-2xl tracking-tight mt-2 text-1">
                Free 5-minute site audit?
              </h3>
              <p className="text-2 text-sm mt-2">
                Drop your URL — we'll send a personalized teardown of what's losing you conversions. No pitch, just
                signal.
              </p>
              <form
                className="mt-5 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!email || submitting) return;
                  // Honeypot: if a bot filled the hidden field, fake success.
                  if (honeypot) {
                    console.log('[honeypot] exit-intent submission rejected');
                    setDone(true);
                    return;
                  }
                  setError(null);
                  setSubmitting(true);
                  try {
                    const result = await onSubmit(email);
                    if (!result.success) {
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
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  aria-hidden="true"
                  className="absolute left-[-9999px] opacity-0 pointer-events-none"
                  style={{ position: 'absolute', left: '-9999px' }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="w-full min-h-[48px] px-4 py-3 rounded-lg border bd font-mono text-base focus:outline-none"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)', fontSize: '16px' }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-lg font-mono text-[11px] font-bold uppercase tracking-[0.22em] transition disabled:opacity-60"
                  style={{ background: 'var(--accent-2)', color: '#000' }}
                >
                  {submitting ? 'Sending…' : <>Send My Audit <Icon.ArrowRight className="w-3.5 h-3.5" /></>}
                </button>
                {error && (
                  <p
                    className="font-mono text-[10px] uppercase tracking-[0.22em] text-center pt-1"
                    style={{ color: '#ff6b9a' }}
                  >
                    {error}
                  </p>
                )}
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut text-center pt-1">
                  No spam. One email, one audit.
                </p>
              </form>
            </>
          ) : (
            <div className="text-center py-3">
              <div
                className="grid place-items-center w-14 h-14 mx-auto rounded-full border"
                style={{
                  background: 'color-mix(in oklab, var(--accent-2) 12%, transparent)',
                  borderColor: 'color-mix(in oklab, var(--accent-2) 40%, transparent)',
                  boxShadow: '0 0 30px color-mix(in oklab, var(--accent-2) 35%, transparent)',
                }}
              >
                <Icon.Check className="w-6 h-6 accent-2" />
              </div>
              <h3 className="font-display font-bold text-2xl mt-4 text-1">Audit on the way.</h3>
              <p className="text-2 text-sm mt-2">
                We'll review your site and send the teardown to your inbox within 48 hours.
              </p>
              <button
                onClick={onClose}
                type="button"
                className="mt-5 px-5 py-2.5 rounded-lg border bd font-mono text-[11px] uppercase tracking-[0.22em] hover:opacity-70 transition text-2"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExitIntentModal;
