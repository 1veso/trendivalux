import { useEffect, useState } from 'react';

const COOKIE_NAME = 'tlx_exit_seen';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function hasSeenExitIntent(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE_NAME}=`));
}

function markExitIntentSeen(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=1; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
}

interface UseExitIntentOptions {
  delayMs?: number;
  mobileInactivityMs?: number;
  // Suppression: don't fire on these route prefixes. /contract and /success are
  // post-conversion pages where exit-intent would be obnoxious.
  suppressOnPathPrefixes?: string[];
}

export function useExitIntent(options: UseExitIntentOptions = {}): {
  shouldShow: boolean;
  dismiss: () => void;
} {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    const suppressed = (options.suppressOnPathPrefixes ?? ['/contract', '/success']).some((p) =>
      path.startsWith(p),
    );
    if (suppressed) return;
    if (hasSeenExitIntent()) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    let armTimer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    function trigger() {
      if (!mounted) return;
      if (hasSeenExitIntent()) return;
      setShouldShow(true);
      markExitIntentSeen();
    }

    function handleMouseLeave(event: MouseEvent) {
      // Top-edge exit only. Cursor crossing left/right/bottom is not a tab-close
      // signal.
      if (event.clientY <= 0) trigger();
    }

    function resetInactivity() {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(trigger, options.mobileInactivityMs ?? 30000);
    }

    if (isMobile) {
      const events: (keyof WindowEventMap)[] = ['touchstart', 'scroll', 'click'];
      events.forEach((evt) => window.addEventListener(evt, resetInactivity, { passive: true }));
      resetInactivity();
      return () => {
        mounted = false;
        if (inactivityTimer) clearTimeout(inactivityTimer);
        events.forEach((evt) => window.removeEventListener(evt, resetInactivity));
      };
    }

    const armDelay = options.delayMs ?? 5000;
    armTimer = setTimeout(() => {
      if (mounted) document.addEventListener('mouseleave', handleMouseLeave);
    }, armDelay);

    return () => {
      mounted = false;
      if (armTimer) clearTimeout(armTimer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [options.delayMs, options.mobileInactivityMs, options.suppressOnPathPrefixes]);

  return {
    shouldShow,
    dismiss: () => setShouldShow(false),
  };
}
