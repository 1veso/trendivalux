# TrendivaLux Landing Page

The public-facing landing page and self-service order flow for TrendivaLux,
a cinematic websites agency in Düren, Germany.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind (custom IntersectionObserver-based reveals; inline SVG icons — no Framer Motion / Lucide)
- **Backend:** Cloudflare Pages Functions (serverless TypeScript)
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Payments:** Stripe (5 products, 50% deposit model, payouts to Wise EUR)
- **Email:** Resend (added in Phase 2 Prompt 2)
- **Contracts:** SignWell (added in Phase 2 Prompt 2)
- **Hosting:** Cloudflare Pages with custom domain trendivalux.com
- **Package manager:** pnpm

## Local Development

1. Clone the repo. Ensure pnpm is installed globally (`npm install -g pnpm`).
2. Run `pnpm install`.
3. Copy `.env.example` to `.env.local` and fill in the credentials.
4. Run `pnpm dev`. The page renders at http://localhost:5173.

## Build

`pnpm build` produces the production build in `dist/`.

## Deployment

Cloudflare Pages auto-deploys on every push to the main branch. The build
command is `pnpm build` and the output directory is `dist/`.

## Project Phases

- **Phase 1 (Complete):** Static landing page built by Claude Design.
- **Phase 2 Prompt 1 (Complete):** Foundation — Supabase schema, dedicated Stripe
  account with Wise payout, Stripe products, Cloudflare Pages Functions structure,
  environment configuration.
- **Phase 2 Prompt 2 (Next):** Conversion engine — OrderModal persistence,
  Stripe checkout, contract generation, SignWell signing, email automation.
- **Phase 2 Prompt 3:** Polish and launch — waitlist, exit-intent, scarcity counter,
  SEO, legal page placeholders, Plausible Analytics, custom domain, end-to-end smoke test.
- **Phase 3:** Legal documents polish (Impressum, Datenschutz, AGB, Werkvertrag template).
- **Phase 4:** Security hardening audit.

## Contact

hello@trendivalux.com
