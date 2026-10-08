import { Resend } from 'resend';
import { createAdminClient } from './supabase-admin';
import { TIER_NAMES } from '../../src/config/pricing';
import { PAYMENT_PLAN_LABELS } from '../../src/config/payment-plans';
import type { Env } from './env';

export async function sendQuoteRequest(env: Env, order: any) {
  if (order.quote_request_email_sent_at) return;
  const resend = new Resend(env.RESEND_API_KEY);
  const reviewUrl = `${env.SITE_URL.replace(/\/$/, '')}/offer-review/${order.id}?token=${order.quote_review_token}`;
  const customer = await resend.emails.send({
    from: 'Primoz · Trendiva Lux <hello@trendivalux.com>', to: order.customer_email, replyTo: env.FOUNDER_EMAIL,
    subject: `Ihre ${order.service_level.toUpperCase()}-Anfrage bei Trendiva Lux`,
    text: `Guten Tag ${order.customer_name},\n\nvielen Dank für Ihre Anfrage. Ich prüfe den gewünschten Umfang für ${TIER_NAMES[order.tier as keyof typeof TIER_NAMES]} ${order.service_level.toUpperCase()} und erstelle Ihr persönliches Angebot. Sie erhalten es an diese E-Mail-Adresse, bevor eine Zahlung fällig wird.\n\nSie haben „${PAYMENT_PLAN_LABELS[order.payment_plan as keyof typeof PAYMENT_PLAN_LABELS]}“ gewählt. Der genaue Gesamtpreis, die Umsatzsteuer und alle Zahlungsbeträge stehen anschließend im Angebot. Nach Ihrer digitalen Unterschrift öffnet sich Stripe automatisch; nach der ersten bestätigten Zahlung erhalten Sie den Projektbrief.\n\nBei Fragen antworten Sie einfach auf diese Nachricht.\n\nViele Grüße\nPrimoz Vesenjak\nTrendiva Lux`,
  }, { idempotencyKey: `quote-ack-${order.id}` });
  if (customer.error) throw new Error(customer.error.message);
  const founder = await resend.emails.send({
    from: 'Trendiva Lux <hello@trendivalux.com>', to: env.FOUNDER_EMAIL,
    subject: `Angebot vorbereiten: ${order.tier} ${order.service_level.toUpperCase()}`,
    text: `Eine neue Anfrage wartet auf Ihr geprüftes Angebot.\n\nKunde: ${order.customer_name} <${order.customer_email}>\nPaket: ${order.tier} ${order.service_level}\nDetails: ${order.questionnaire_data.project_details || 'Keine zusätzlichen Angaben'}\n\nPrivater Link zum Festlegen von Umfang und Nettopreis:\n${reviewUrl}\n\nDieser Link berechtigt zum Versenden des Angebots. Bitte nicht an den Kunden weitergeben.`,
  }, { idempotencyKey: `quote-review-${order.id}` });
  if (founder.error) throw new Error(founder.error.message);
  const { error } = await createAdminClient(env).from('orders').update({ quote_request_email_sent_at: new Date().toISOString() }).eq('id', order.id);
  if (error) throw new Error('Could not save quote acknowledgement');
}
