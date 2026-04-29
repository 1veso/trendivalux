import type { PagesFunction } from '@cloudflare/workers-types';

// Applies security headers to every response served by Cloudflare Pages,
// including static assets. CSP is the load-bearing piece — it locks scripts,
// frames, and outbound connections to the third parties we actually use:
// Stripe, SignWell, Plausible, Cal.com, Supabase, Sentry, Google Fonts.

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://plausible.io https://cdnjs.cloudflare.com https://app.cal.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https: blob:",
  "frame-src https://checkout.stripe.com https://js.stripe.com https://www.signwell.com https://app.cal.com",
  "connect-src 'self' https://api.stripe.com https://www.signwell.com https://*.supabase.co https://plausible.io https://api.cal.com https://*.sentry.io https://*.ingest.sentry.io",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const PERMISSIONS_POLICY = [
  'camera=()',
  'microphone=()',
  'geolocation=()',
  'payment=(self "https://js.stripe.com" "https://checkout.stripe.com")',
  'fullscreen=(self)',
].join(', ');

export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();

  const headers = new Headers(response.headers);

  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', PERMISSIONS_POLICY);
  headers.set('Content-Security-Policy', CSP);
  headers.set('X-XSS-Protection', '1; mode=block');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
