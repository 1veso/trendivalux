# TrendivaLux Cloudflare Pages Functions

This directory contains all serverless API endpoints. Cloudflare Pages auto-deploys
any TypeScript file in /functions/api/ as a serverless function at the corresponding
URL path.

## Structure

- `_shared/` — utilities used by multiple endpoints. Files prefixed with underscore
  are NOT exposed as endpoints.
- `api/` — public endpoints. Each file maps to a URL.
  - `api/create-checkout-session.ts` → POST /api/create-checkout-session
  - `api/stripe-webhook.ts` → POST /api/stripe-webhook
  - `api/docuseal-webhook.ts` → POST /api/docuseal-webhook
  - (more added in Prompt 2)

## Environment Variables

All Cloudflare Pages Functions read environment variables from the `Env` interface
defined in `_shared/env.ts`. These must be configured in Cloudflare Pages dashboard
under Settings > Environment Variables for the production deployment to work.

For local development, the same variables are read from `.env.local` via Vite.
