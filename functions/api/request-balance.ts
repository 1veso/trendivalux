import type { PagesFunction } from '@cloudflare/workers-types';
import { Resend } from 'resend';
import { createAdminClient } from '../_shared/supabase-admin';
import { PAID_ORDER_STATUSES, checkoutReturnUrl } from '../_shared/order-flow';
import { validateUuid } from '../_shared/validation';
import { euro } from '../../src/config/payment-plans';
import type { Env } from '../_shared/env';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = validateUuid(body.orderId), token = validateUuid(body.token);
    if (!id || !token) return new Response('Invalid private link', { status: 400 });
    const admin = createAdminClient(env);
    const { data: order } = await admin.from('orders').select('*').eq('id', id).eq('quote_review_token', token).single();
    if (!order) return new Response('Order not found', { status: 404 });
    if (order.payment_plan !== 'split' || !PAID_ORDER_STATUSES.has(order.status) || order.paid_amount_cents <= 0 || order.paid_amount_cents >= order.total_price_cents) return new Response('No payable final balance', { status: 409 });
    if (!order.balance_email_sent_at) {
      const result = await new Resend(env.RESEND_API_KEY).emails.send({
        from: 'Primoz · Trendiva Lux <hello@trendivalux.com>', to: order.customer_email, replyTo: env.FOUNDER_EMAIL,
        subject: 'Trendiva Lux — Schlusszahlung vor Projektübergabe',
        text: `Guten Tag ${order.customer_name},\n\nfür Ihr vereinbartes Projekt ist nach Abnahme und vor der endgültigen Übergabe die Schlusszahlung von ${euro(order.total_price_cents - order.paid_amount_cents)} einschließlich Umsatzsteuer fällig. Sie können sie über den folgenden sicheren Stripe-Link bezahlen:\n${checkoutReturnUrl(env, order)}&stage=balance\n\nBei Fragen zur Abnahme oder Übergabe antworten Sie bitte auf diese E-Mail.\n\nViele Grüße\nPrimoz Vesenjak\nTrendiva Lux`,
      }, { idempotencyKey: `final-balance-${id}` });
      if (result.error) throw new Error(result.error.message);
      const { error } = await admin.from('orders').update({ balance_email_sent_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error('Could not save email receipt');
    }
    return Response.json({ sent: true });
  } catch (error) { console.error('[balance]', error); return new Response('Could not email balance. Retry using the same link.', { status: 503 }); }
};
