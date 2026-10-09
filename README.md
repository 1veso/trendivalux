# TrendivaLux Landing Page

The public-facing landing page and self-service order flow for TrendivaLux,
a cinematic websites agency in Düren, Germany.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind (custom IntersectionObserver-based reveals; inline SVG icons — no Framer Motion / Lucide)
- **Backend:** Cloudflare Pages Functions (serverless TypeScript)
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Payments:** Stripe (full payment, 50/50, or four finite monthly payments; live-only in production)
- **Email:** Resend (added in Phase 2 Prompt 2)
- **Contracts:** DocuSeal Pro (tailored PDF agreements and signing redirect)
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

## Ordering and commissioning

Choose a package, LUX / DELUXE and a payment plan. Submit contact details, check the inbox, review the attached three-page PDF and sign via DocuSeal. Signing redirects to `/checkout/:orderId`, which verifies the signature and opens Stripe. Confirmed funds unlock `/scoping/:orderId`. Delayed bank payments remain pending. All customer links use private capability tokens; orders and questionnaires are not publicly readable.

Existing package prices are LUX net prices. DELUXE and Custom require a reviewed scope and price: the founder receives a private `/offer-review/:orderId` link. Sending an offer locks its commercial terms. Checkout amounts include the VAT stated in the signed offer. Four payments consist of an initial payment plus a schedule for exactly three future monthly charges, with `end_behavior=cancel`. For 50/50, the founder requests the final balance after acceptance through the same private review page; it must clear before final handover.

No new fixed Stripe catalog prices are required. Inline prices use the frozen signed amounts; installment products and schedules are created idempotently per order.

Required server configuration: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `DOCUSEAL_API_URL`, `DOCUSEAL_API_KEY` (Pro PDF API), `DOCUSEAL_WEBHOOK_SECRET`, `SITE_URL` and `FOUNDER_EMAIL`. Secrets belong in Cloudflare environment bindings. Offer fonts and screenshots are shipped as static assets. PDF generation requires an adequate Pages Functions CPU budget.

Stripe webhook events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `charge.refunded`, `charge.dispute.created`. DocuSeal webhook: `form.completed`, using its timestamped `X-Docuseal-Signature` HMAC. Configure the webhook destinations at `/api/stripe-webhook` and `/api/docuseal-webhook`.

Production provider settings are saved in **Cloudflare → Workers & Pages → trendivalux → Settings → Variables and Secrets → Production**. Save the keys below, then redeploy production. Do not commit secrets or prefix them with `VITE_`.

| Variable | Production value | Type |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Live account `sk_live_…` key, or a suitably permitted `rk_live_…` key | Secret |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the live endpoint `https://trendivalux.com/api/stripe-webhook` | Secret |
| `DOCUSEAL_API_KEY` | Production API key from the DocuSeal account with PDF API entitlement | Secret |
| `DOCUSEAL_API_URL` | `https://api.docuseal.com` for Global, `https://api.docuseal.eu` for Europe; must match the key's account region | Text |
| `DOCUSEAL_WEBHOOK_SECRET` | DocuSeal Console → Webhooks → Security → HMAC signing secret | Secret |
| `SITE_URL` | `https://trendivalux.com` | Text |

In **live Stripe Workbench → Webhooks → Add destination**, select **Your account**, snapshot events and API version `2026-04-22.dahlia`, subscribe to the seven events above, and use the production endpoint. Sandbox keys, CLI listener secrets and sandbox endpoint secrets do not replace the live endpoint's signing secret.

In **DocuSeal Console → Webhooks**, create `https://trendivalux.com/api/docuseal-webhook` with `form.completed` and `submission.completed`. Open **Security → HMAC** and copy the signing secret into Cloudflare's `DOCUSEAL_WEBHOOK_SECRET`. The separate custom-header Secret tab does not supply the HMAC secret this handler verifies. Keep preview credentials and webhook destinations isolated from production.

After redeployment, inspect `/commissioning`. It checks the live Stripe account, database and read-only DocuSeal API access, and reports each configured webhook secret separately. Before accepting customers, verify one authorized agreement email/PDF/signing flow, the signing redirect to Stripe, verified payment delivery, and access to the project brief only after payment. A DocuSeal agent plugin helps development; installing it does not configure the website's production secrets.

The `/commissioning` operator page displays the read-only readiness check. `GET /api/health` checks database access, DocuSeal API connectivity and Stripe live mode plus charge availability. It returns no credentials or customer data. Connectivity does not prove PDF API entitlement, email delivery or configured provider webhook subscriptions; those need a commissioning run. Preview deployments should use their own environment bindings and `SITE_URL`.

Baseline migrations already applied manually were reconciled with the remote history. Both new payment/privacy and private-flow index migrations are applied to production. Run future changes through tracked migrations. `pnpm test`, `pnpm typecheck` and `pnpm build` validate the flow without contacting providers, sending mail or charging customers.

## Contact

hello@trendivalux.com
