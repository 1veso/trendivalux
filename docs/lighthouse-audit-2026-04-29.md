# Lighthouse Audit — 2026-04-29 (Phase 4 Mobile Polish)

This doc replaces the headless `pnpm dlx lighthouse` flow that was originally
spec'd in the Phase 4 prompt — running headless Chrome reliably from this
Windows / WSL-bash shell against `https://trendivalux.com` was not worth
fighting. Instead, this is a **manual verification checklist** to run in
Chrome DevTools after the Phase 4 deploy lands on Cloudflare Pages.

## How to run the audit

1. Open Chrome → `https://trendivalux.com` (after the Phase 4 deploy is live).
2. Cmd/Ctrl+Shift+I → DevTools → Lighthouse panel.
3. Pick **Mobile** preset, all four categories (Performance, Accessibility,
   Best Practices, SEO), Navigation mode, "Default (no throttling)" → keep it.
4. Click **Analyze page load**.
5. Save the JSON export → drop into `lighthouse-baseline.report.json` in repo
   root (already gitignored — see `.gitignore` patch in this commit).

Repeat steps 1-5 for each priority page:

- `/` — landing
- `/agb` — longest legal page
- `/tiers/landing` — first tier deep page
- `/datenschutz` — Datenschutzerklärung (largest legal chunk)

## Targets (Mobile)

| Category       | Target | Notes                                                                |
|----------------|--------|----------------------------------------------------------------------|
| Performance    | ≥ 85   | Realistic ceiling for animation-heavy site; FCP/LCP are the levers   |
| Accessibility  | ≥ 95   | Touch targets, ARIA labels, color contrast — should be near-100      |
| Best Practices | ≥ 95   | HTTPS, no console errors, no deprecated APIs                         |
| SEO            | ≥ 95   | Sitemap, meta tags, structured data, viewport meta — covered by SEO  |

## Phase 4 optimizations already applied

These are the perf wins shipped during this phase — the audit should reflect
them.

- Main bundle reduced from **951 KB / 274 KB gzipped** to **~607 KB / 172 KB
  gzipped** by lazy-loading `OrderModal`, `ContractPreviewModal`, and all
  five legal pages (Impressum, Datenschutz, AGB-B2B, AGB-B2C, Widerrufs-
  belehrung) via `React.lazy()` + Suspense.
- `react-markdown` and `remark-gfm` (~150 KB combined) moved into the
  shared lazy chunk loaded only by markdown-rendering routes — the homepage
  no longer pays for them.
- Modals now render `null` until first `open === true`, so even their
  React tree is deferred (`{orderOpen && <Suspense>...`).

## Likely Performance flags to watch

Rerun and compare against these expectations:

- **LCP (Largest Contentful Paint)**: ≤ 2.5s. The hero headline (Monoton
  font + neon-tube text-shadow) is the LCP element on `/`. If LCP fails,
  the candidates are: webfont blocking, the `DigitalSunset` SVG, or the
  parallax orbs.
- **TBT (Total Blocking Time)**: ≤ 200ms. The Builds gallery uses pointer
  events + auto-cycle. If TBT fails, the gallery's `useEffect`/state churn
  from auto-cycle is the prime suspect.
- **CLS (Cumulative Layout Shift)**: ≤ 0.1. The TopNav is fixed. The
  Reveal animation uses transform/opacity (no layout shift). The Builds
  gallery cards have explicit `clamp()` dimensions. CLS should be near 0.
- **FCP (First Contentful Paint)**: ≤ 1.8s. With the smaller initial JS
  bundle this should improve materially.

## Likely Accessibility flags to watch

- Color contrast on `text-mut` (`var(--text-muted)` = `#5C5C7A` on dark bg
  `#050308`) — ratio ~4.6:1 which is borderline AA for body text but passes
  for "non-essential text" / 18pt. If flagged, can pump to `#7B7B95`.
- Touch targets — Phase 4 explicitly bumped Back/Next/Close/Submit to
  min-h-[44px], should pass.
- The `button` inside `Tilt` wrapper (tier card) is keyboard-accessible via
  `tabIndex={0}` and `onKeyDown` Enter handler — should pass.

## Likely SEO flags to watch

- Sitemap is at `/sitemap.xml` (Phase 3) — verify it 200s after Phase 4
  deploy.
- Meta description and viewport meta are set via `<SEO />` component
  (uses `react-helmet-async`).
- Legal pages have `noIndex` set (they shouldn't be indexed) — but
  Lighthouse SEO also checks for `<title>`, which they have via `<SEO />`.

## Outstanding items (deferred to a future phase)

- **Image optimization**: there are no `<img>` tags with raw heavy assets
  on the homepage today — branding is via SVG and CSS. If Phase 5 adds
  case-study screenshots, those need WebP + responsive `srcset`.
- **Webfont preloading**: Monoton, Syne, Familjen Grotesk, DM Mono,
  Instrument Serif — five fonts load from Google Fonts in `index.html`.
  Adding `<link rel="preconnect">` + `display=swap` (verify the URL
  already has `display=swap`) could shave a few hundred ms off FCP.
- **Critical CSS inlining**: vite-plugin-criters or beasties could inline
  above-the-fold CSS. Defer until the audit shows render-blocking CSS as a
  flagged issue.

## Verification checklist (paste scores below after running)

```
URL: https://trendivalux.com/
Date: 2026-04-29 (post-Phase-4 deploy)

Performance:    [ ] ___
Accessibility:  [ ] ___
Best Practices: [ ] ___
SEO:            [ ] ___
```

If any score falls below target, capture the top failed audits from the
Lighthouse JSON's `audits` section (filter `score < 0.9`) and open a
follow-up issue. The Phase 4 work is done; tuning further is a separate
engagement.
