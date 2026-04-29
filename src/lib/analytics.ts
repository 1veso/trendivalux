// Plausible Analytics wrapper. Plausible is loaded via a script tag in index.html
// and exposes a global `plausible` function. We use a typed wrapper so call sites
// stay terse and so the no-op fallback (when the script hasn't loaded or the user
// has DNT/blockers) is silent.

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean | undefined | null>,
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.plausible !== 'function') return;
  if (props) {
    const cleaned: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null) continue;
      cleaned[k] = v;
    }
    window.plausible(name, { props: cleaned });
  } else {
    window.plausible(name);
  }
}
