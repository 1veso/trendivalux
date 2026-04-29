// Defense-in-depth rate limiter for Pages Functions.
//
// In-memory, per-isolate. A determined attacker can distribute requests across
// isolates to defeat this; the authoritative production rate limits live in
// Cloudflare WAF rules (configured in the dashboard, see SECURITY.md and the
// Phase 5 operator checklist). This module exists so that a single hot isolate
// cannot be hammered through a tight loop.

interface RateLimitConfig {
  identifier: string;
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

const memory = new Map<string, { count: number; resetAt: number }>();

// Soft cap to keep the map from growing unbounded across long-lived isolates.
// Beyond this we drop the oldest entry on each insert.
const MAX_ENTRIES = 5000;

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const key = `${config.endpoint}:${config.identifier}`;
  const now = Date.now();
  const existing = memory.get(key);

  if (!existing || existing.resetAt < now) {
    if (memory.size >= MAX_ENTRIES) {
      const oldest = memory.keys().next().value;
      if (oldest) memory.delete(oldest);
    }
    memory.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true };
  }

  if (existing.count >= config.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfter };
  }

  existing.count++;
  return { allowed: true };
}

export function getClientIdentifier(request: Request): string {
  const cfConnectingIp = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIp) return cfConnectingIp;
  const xForwardedFor = request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim();
  if (xForwardedFor) return xForwardedFor;
  return 'unknown';
}

export function rateLimitResponse(retryAfter: number): Response {
  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'Retry-After': String(retryAfter),
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
