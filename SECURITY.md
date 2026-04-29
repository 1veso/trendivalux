# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in TrendivaLux, please report it via email:

**security@trendivalux.com** (or hello@trendivalux.com if security@ is not yet active)

We aim to acknowledge receipt within 48 hours and provide a fix or remediation plan within 14 days for critical issues.

Please do not disclose the vulnerability publicly until we have had the opportunity to address it.

## What's In Scope

- The trendivalux.com web application
- API endpoints under https://trendivalux.com/api/*

## What's Out Of Scope

- Third-party services (Stripe, SignWell, Resend, Cloudflare, Supabase) — report directly to those providers
- Social engineering / phishing of staff
- Physical attacks
- Denial of service via volumetric attacks (Cloudflare handles these)

## Security Measures

This site implements:

- TLS 1.3 with HSTS preload (`max-age=31536000; includeSubDomains; preload`)
- Content Security Policy with restricted external sources (Stripe, SignWell, Plausible, Cal.com, Supabase, Sentry, Google Fonts)
- `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` to prevent clickjacking
- HMAC-SHA256 signature verification on all webhook endpoints with timing-safe comparison
- Rate limiting at the application layer (`functions/_shared/rate-limit.ts`) and at the edge via Cloudflare WAF rules
- Input validation on all user-supplied data via `functions/_shared/validation.ts`
- Honeypot fields on public forms (waitlist, exit-intent, GDPR data-rights request)
- Row-level security on the database with service-role-only policies on sensitive tables
- GDPR-compliant data handling (privacy policy at /datenschutz, data-rights request endpoint at `/api/data-rights/request`)
- Sentry error tracking with cookie + PII scrubbing in `beforeSend`, masked Replay
- Encrypted secrets at rest (Cloudflare Pages encrypted env vars)
- Two-factor authentication required on all administrative accounts

## Coordinated Disclosure

We follow responsible disclosure principles. Researchers who report vulnerabilities ethically will be acknowledged in our security advisories.
