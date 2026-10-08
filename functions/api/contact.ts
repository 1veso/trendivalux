import type { PagesFunction } from '@cloudflare/workers-types';
import { Resend } from 'resend';
import type { Env } from '../_shared/env';
import { validateEmail, validateString } from '../_shared/validation';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const limit = await checkRateLimit({ identifier: getClientIdentifier(request), endpoint: 'contact', maxRequests: 3, windowSeconds: 60 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter ?? 60);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return new Response('Invalid request', { status: 400 }); }
  const name = validateString(body.name, 200);
  const email = validateEmail(body.email);
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!name || !email || !message || message.length > 5000) return new Response('Invalid message', { status: 400 });
  try {
    const result = await new Resend(env.RESEND_API_KEY).emails.send({
      from: 'TrendivaLux <hello@trendivalux.com>', to: env.FOUNDER_EMAIL,
      replyTo: email, subject: 'TrendivaLux project enquiry',
      text: `From: ${name} <${email}>\n\n${message}`,
    });
    if (result.error) throw new Error(result.error.message);
    return Response.json({ sent: true });
  } catch (error) {
    console.error('[contact] delivery failed', error);
    return new Response('Message delivery unavailable', { status: 503 });
  }
};
