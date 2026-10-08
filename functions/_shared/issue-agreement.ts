import { createAdminClient } from './supabase-admin';
import { createOfferPdf, OFFER_SIGNING_FIELDS, type OfferOrder } from './offer-pdf';
import { Resend } from 'resend';
import { checkoutReturnUrl } from './order-flow';
import type { Env } from './env';

export interface AgreementOrder extends OfferOrder {
  checkout_token: string; contract_signing_url?: string | null;
  agreement_email_sent_at?: string | null; contract_request_started_at?: string | null;
  offer_pdf_path?: string | null;
}
export function base64(bytes: Uint8Array) {
  let result = '';
  for (let index = 0; index < bytes.length; index += 8192) result += String.fromCharCode(...bytes.subarray(index, index + 8192));
  return btoa(result);
}

export async function issueAgreement(env: Env, order: AgreementOrder) {
  const admin = createAdminClient(env);
  let bytes: Uint8Array;
  if (order.offer_pdf_path) {
    const { data, error } = await admin.storage.from('offers').download(order.offer_pdf_path);
    if (error || !data) throw new Error('Stored offer unavailable');
    bytes = new Uint8Array(await data.arrayBuffer());
  } else {
    const assets = await Promise.all(['offer-fonts/regular.ttf', 'offer-fonts/bold.ttf', 'portfolio/knzn.jpg'].map(async path => {
      const response = await fetch(`${env.SITE_URL.replace(/\/$/, '')}/${path}`);
      if (!response.ok) throw new Error('Offer assets unavailable');
      return new Uint8Array(await response.arrayBuffer());
    }));
    const scope = order.questionnaire_data.offer_scope as string[];
    const timeline = order.questionnaire_data.offer_timeline as string;
    bytes = await createOfferPdf(order, scope, timeline, { regular: assets[0], bold: assets[1], example: assets[2] });
    const path = `${order.id}/offer.pdf`;
    const { error } = await admin.storage.from('offers').upload(path, bytes, { contentType: 'application/pdf', upsert: true });
    if (error) throw new Error('Could not save tailored offer');
    const { error: linkError } = await admin.from('orders').update({ offer_pdf_path: path }).eq('id', order.id);
    if (linkError) throw new Error('Could not link tailored offer');
  }

  let signingUrl = order.contract_signing_url;
  if (!signingUrl) {
    const started = new Date().toISOString();
    const lock = admin.from('orders').update({ contract_request_started_at: started }).eq('id', order.id);
    if (order.contract_request_started_at) lock.eq('contract_request_started_at', order.contract_request_started_at);
    else lock.is('contract_request_started_at', null);
    const { data: acquired, error: lockError } = await lock.select('id').single();
    if (lockError || !acquired) throw new Error('Agreement is already being prepared');
    const apiBase = env.DOCUSEAL_API_URL.replace(/\/$/, '');
    const headers = { 'X-Auth-Token': env.DOCUSEAL_API_KEY, Accept: 'application/json' };
    try {
      // Recover a provider submission after an interrupted response rather than
      // creating another document for the same order.
      const lookup = await fetch(`${apiBase}/submitters?external_id=${order.id}`, { headers });
      if (!lookup.ok) throw new Error('Could not verify existing agreement');
      const found = await lookup.json() as { data?: Array<{ external_id: string; submission_id: number; embed_src: string }> };
      let signer = found.data?.find(item => item.external_id === order.id);
      if (!signer) {
        const fields = [...OFFER_SIGNING_FIELDS];
        const response = await fetch(`${apiBase}/submissions/pdf`, {
          method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expire_at: new Date(Date.parse(order.offer_issued_at || new Date().toISOString()) + 30 * 86400000).toISOString(),
            name: `Trendiva Lux ${order.tier} ${order.service_level.toUpperCase()} - ${order.id.slice(0, 8)}`,
            send_email: false, bcc_completed: env.FOUNDER_EMAIL, reply_to: env.FOUNDER_EMAIL,
            completed_redirect_url: checkoutReturnUrl(env, order),
            documents: [{ name: 'Ihr persönliches Angebot', file: base64(bytes), fields }],
            submitters: [{ role: 'Client', name: order.customer_name, email: order.customer_email,
              external_id: order.id, completed_redirect_url: checkoutReturnUrl(env, order),
              metadata: { order_id: order.id, payment_plan: order.payment_plan, service_level: order.service_level },
            }],
          }),
        });
        if (!response.ok) throw new Error(`DocuSeal PDF submission failed (${response.status})`);
        signer = (await response.json() as Array<{ external_id: string; submission_id: number; embed_src: string }>)[0];
      }
      if (!signer?.embed_src || !signer.submission_id) throw new Error('Agreement link missing');
      signingUrl = signer.embed_src;
      const { error } = await admin.from('orders').update({
        contract_status: 'sent', contract_docuseal_id: String(signer.submission_id),
        contract_signing_url: signingUrl, status: 'contract_sent', contract_request_started_at: null,
      }).eq('id', order.id);
      if (error) throw new Error('Could not save agreement link');
    } catch (error) {
      await admin.from('orders').update({ contract_request_started_at: null }).eq('id', order.id).eq('contract_request_started_at', started);
      throw error;
    }
  }
  if (!order.agreement_email_sent_at) {
    const result = await new Resend(env.RESEND_API_KEY).emails.send({
      from: 'Primoz · Trendiva Lux <hello@trendivalux.com>', to: order.customer_email,
      replyTo: env.FOUNDER_EMAIL, subject: `Ihr persönliches ${order.service_level.toUpperCase()}-Angebot von Trendiva Lux`,
      text: `Guten Tag ${order.customer_name},\n\nvielen Dank für Ihre Anfrage bei Trendiva Lux. Ich bin Primoz Vesenjak und begleite Ihr Projekt persönlich. Ihr Angebot für das gewählte ${order.tier}-Paket in der Ausführung ${order.service_level.toUpperCase()} finden Sie im Anhang. Es enthält den Leistungsumfang, den Gesamtpreis einschließlich Umsatzsteuer und Ihre ausgewählte Zahlungsweise.\n\nPrüfen und unterschreiben Sie das Angebot über diesen Link:\n${signingUrl}\n\nNach der Unterschrift öffnet sich automatisch Stripe für die erste Zahlung. Anschließend erhalten Sie den Projektbrief, damit ich mit den benötigten Inhalten und Zugängen starten kann. Bei Fragen antworten Sie einfach auf diese E-Mail.\n\nViele Grüße\nPrimoz Vesenjak\nTrendiva Lux\nhttps://trendivalux.com`,
      attachments: [{ filename: `Websiteangebot_Trendiva_Lux_${order.id.slice(0, 8)}.pdf`, content: base64(bytes) }],
    }, { idempotencyKey: `agreement-${order.id}` });
    if (result.error) throw new Error(result.error.message);
    const { error } = await admin.from('orders').update({ agreement_email_sent_at: new Date().toISOString() }).eq('id', order.id);
    if (error) throw new Error('Could not save agreement email receipt');
  }
  return { signingUrl };
}
