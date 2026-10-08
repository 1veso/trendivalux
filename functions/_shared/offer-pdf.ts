import { PDFDocument, rgb, PDFName, PDFString } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { euro, PAYMENT_PLAN_LABELS, type PaymentPlan } from '../../src/config/payment-plans';
import { TIER_NAMES } from '../../src/config/pricing';

export interface OfferOrder {
  id: string; tier: keyof typeof TIER_NAMES; customer_name: string;
  customer_email: string; service_level: 'lux' | 'deluxe'; payment_plan: PaymentPlan;
  net_amount_cents: number; vat_amount_cents: number; total_price_cents: number;
  offer_issued_at?: string; payment_schedule: number[]; questionnaire_data: Record<string, any>;
}
export interface OfferAssets { regular: Uint8Array; bold: Uint8Array; example: Uint8Array }
const W = 595.28, H = 841.89;
const colors = { ink: rgb(.055, .07, .12), muted: rgb(.37, .4, .46), gold: rgb(.66, .49, .21), paper: rgb(.98, .97, .94), line: rgb(.86, .84, .79), teal: rgb(0, .45, .43) };

export async function createOfferPdf(order: OfferOrder, scope: string[], timeline: string, assets: OfferAssets) {
  const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(assets.regular, { subset: true });
  const bold = await pdf.embedFont(assets.bold, { subset: true });
  const image = await pdf.embedJpg(assets.example);
  const date = order.offer_issued_at ? new Date(order.offer_issued_at) : new Date(); const validUntil = new Date(date); validUntil.setUTCDate(validUntil.getUTCDate() + 30);
  const dateText = date.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
  const validity = validUntil.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
  const reference = `TL-${order.id.slice(0, 8).toUpperCase()}`;
  const selected = `${TIER_NAMES[order.tier]} ${order.service_level.toUpperCase()}`;
  function page(number: number, title: string) {
    const page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: colors.paper });
    page.drawText('TRENDIVA LUX', { x: 45, y: H - 46, font: bold, size: 11, color: colors.ink });
    page.drawText(`${reference}  /  ${dateText}`, { x: 335, y: H - 46, font: regular, size: 9, color: colors.muted });
    page.drawLine({ start: { x: 45, y: H - 63 }, end: { x: W - 45, y: H - 63 }, color: colors.line, thickness: 1 });
    page.drawText(title, { x: 45, y: H - 109, font: bold, size: 25, color: colors.ink });
    page.drawText('Primoz Vesenjak  ·  hello@trendivalux.com  ·  trendivalux.com', { x: 45, y: 30, font: regular, size: 8, color: colors.muted });
    page.drawText(`${number} / 3`, { x: W - 65, y: 30, font: regular, size: 8, color: colors.muted });
    return page;
  }
  function text(page: any, value: string, top: number, size = 11, width = W - 90, strong = false) {
    const font = strong ? bold : regular;
    let y = H - top;
    for (const paragraph of value.split('\n')) {
      let line = '';
      for (const word of paragraph.split(' ')) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) > width && line) {
          page.drawText(line, { x: 45, y, size, font, color: colors.ink }); y -= size * 1.5; line = word;
        } else line = next;
      }
      if (line) { page.drawText(line, { x: 45, y, size, font, color: colors.ink }); y -= size * 1.5; }
      y -= size * .35;
    }
    return H - y;
  }
  const first = page(1, 'Ihr Projekt. Klar vereinbart.');
  let top = text(first, `Für ${order.customer_name}`, 153, 14, W - 90, true);
  top = text(first, `Sie haben ${selected} gewählt. Dieses Angebot beschreibt die vereinbarte Umsetzung und Ihre ausgewählte Zahlungsweise. Ich bin Ihr direkter Ansprechpartner und begleite Ihr Projekt von der Abstimmung bis zur Veröffentlichung.`, top + 22, 12);
  first.drawRectangle({ x: 45, y: 310, width: W - 90, height: 190, color: colors.ink });
  first.drawText(selected, { x: 65, y: 461, size: 23, font: bold, color: colors.paper });
  first.drawText('Einmaliges Website- / Webprojekt', { x: 65, y: 429, size: 11, font: regular, color: colors.paper });
  first.drawText(euro(order.total_price_cents), { x: 65, y: 365, size: 34, font: bold, color: rgb(.86, .7, .4) });
  first.drawText('Gesamtpreis inklusive 19 % Umsatzsteuer', { x: 65, y: 339, size: 10, font: regular, color: colors.paper });
  text(first, `Ihre Auswahl\n${({full:'Vollzahlung',split:'50 % nach Unterzeichnung, 50 % vor Übergabe',monthly4:'Vier monatliche Zahlungen'})[order.payment_plan]}\n\nNetto: ${euro(order.net_amount_cents)}  ·  Umsatzsteuer: ${euro(order.vat_amount_cents)}\nGültig bis: ${validity}`, 557, 11);
  text(first, 'So geht es weiter\nAngebot prüfen und digital unterschreiben. Danach öffnet sich Stripe automatisch. Sobald die erste Zahlung bestätigt ist, erhalten Sie Ihren Projektbrief.', 699, 11);

  const second = page(2, 'Umfang und Zahlungsplan');
  top = text(second, selected, 150, 16, W - 90, true);
  for (const item of scope) top = text(second, `• ${item}`, top + 5, 10.5);
  if (top > 435) throw new Error('Offer scope exceeds the verified PDF layout');
  top = Math.max(top + 30, 445);
  top = text(second, 'Ihre vereinbarten Zahlungen', top, 15, W - 90, true);
  const planText = order.payment_plan === 'full'
    ? `Einmalig nach Unterzeichnung: ${euro(order.payment_schedule[0])} brutto.`
    : order.payment_plan === 'split'
      ? `${euro(order.payment_schedule[0])} brutto nach Unterzeichnung.\n${euro(order.payment_schedule[1])} brutto nach Abnahme, vor der endgültigen Projektübergabe.`
      : `Erste Rate nach Unterzeichnung: ${euro(order.payment_schedule[0])} brutto.\nRate 2 und 3: jeweils ${euro(order.payment_schedule[1])} brutto, monatlich.\nSchlussrate: ${euro(order.payment_schedule[3])} brutto, im vierten Monat.\nVier Zahlungen insgesamt, ohne Aufpreis und ohne Verlängerung. Kein Wartungsabo.`;
  top = text(second, planText, top + 9, 10.5);
  top = text(second, `Gesamt: ${euro(order.total_price_cents)} brutto (${euro(order.net_amount_cents)} netto + ${euro(order.vat_amount_cents)} Umsatzsteuer).`, top + 6, 10.5, W - 90, true);
  top = text(second, `Zeitplan: ${timeline}. Der Zeitplan beginnt nach Eingang der ersten Zahlung und der benötigten Inhalte und Zugänge.${order.questionnaire_data.customer_type === 'b2c' ? ' Bei Verbrauchern zusätzlich nach Ablauf der Widerrufsfrist; ein früherer Beginn erfordert eine gesonderte ausdrückliche Erklärung.' : ''} Veröffentlichung nach Fertigstellung und Ihrer Freigabe; bei Ratenzahlung müssen die bis dahin fälligen Zahlungen geleistet sein.`, top + 14, 9.5);
  text(second, 'Hosting, Domain, laufende Wartung, kostenpflichtige Fremddienste und Fotografie sind nicht im einmaligen Entwicklungspreis enthalten. Neue Funktionen, zusätzliche Seiten oder Richtungswechsel vereinbaren wir vorab gesondert. Sie liefern freigegebene Inhalte, Rechtstexte und erforderliche Nutzungsrechte. Die technische Einbindung der Rechtstexte ist enthalten.', top + 12, 9.5);

  const third = page(3, 'So starten wir');
  third.drawImage(image, { x: 45, y: 538, width: 215, height: 148 });
  third.drawText('Arbeitsbeispiel: KNZN', { x: 282, y: 666, size: 13, font: bold, color: colors.ink });
  third.drawText('Ein von mir freigegebenes', { x: 282, y: 641, size: 10, font: regular, color: colors.muted });
  third.drawText('Beispiel aus meinem Portfolio.', { x: 282, y: 625, size: 10, font: regular, color: colors.muted });
  third.drawText('knzn.pages.dev', { x: 282, y: 594, size: 11, font: bold, color: colors.teal });
  const annotation = pdf.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [280, 588, 410, 610], Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: PDFString.of('https://knzn.pages.dev') } });
  third.node.set(PDFName.of('Annots'), pdf.context.obj([pdf.context.register(annotation)]));
  text(third, 'Sie arbeiten direkt mit mir. Umfang und Zusatzarbeiten stimmen wir klar ab; Änderungen am vereinbarten Auftrag erfolgen nur nach Ihrer Freigabe.', 326, 10.5);
  top = text(third, 'Angebotsannahme und Beauftragung', 393, 17, W - 90, true);
  top = text(third, `Hiermit beauftrage ich Primoz Vesenjak, Trendiva Lux, mit ${selected} gemäß Angebot ${reference} vom ${dateText}, dem aufgeführten Umfang und der ausgewählten Zahlungsweise.`, top + 13, 10.5);
  top = text(third, `Auftraggeber: ${order.customer_name}\nE-Mail: ${order.customer_email}\nZahlungsweise: ${({full:'Vollzahlung',split:'50 % nach Unterzeichnung, 50 % vor Übergabe',monthly4:'Vier monatliche Zahlungen'})[order.payment_plan]}`, top + 8, 10.5);
  text(third, `Es gelten die ${order.questionnaire_data.customer_type === 'b2c' ? 'AGB für Verbraucher (trendivalux.com/agb-b2c) und die Widerrufsbelehrung (trendivalux.com/widerrufsbelehrung)' : 'AGB für Unternehmen (trendivalux.com/agb)'}. Nutzung ab freigegebener Veröffentlichung; endgültige Projektdateien und vereinbarte Rechte nach vollständiger Zahlung. Fremdlizenzen bleiben vorbehalten.`, 568, 9.5);
  third.drawText('Ort / Datum', { x: 45, y: 195, font: regular, size: 9, color: colors.muted });
  third.drawLine({ start: { x: 45, y: 168 }, end: { x: 230, y: 168 }, color: colors.line });
  third.drawText('Unterschrift der bevollmächtigten Person', { x: 45, y: 137, font: regular, size: 9, color: colors.muted });
  third.drawRectangle({ x: 45, y: 57, width: 300, height: 72, borderWidth: 1, borderColor: colors.line });
  pdf.setTitle(`Websiteangebot ${order.customer_name} - Trendiva Lux`); pdf.setAuthor('Primoz Vesenjak - Trendiva Lux');
  return pdf.save();
}

export const OFFER_SIGNING_FIELDS = [
  { name: 'Ort / Datum', type: 'text', role: 'Client', required: true, areas: [{ page: 3, x: 45 / W, y: (H - 191) / H, w: 185 / W, h: 24 / H }] },
  { name: 'Unterschrift', type: 'signature', role: 'Client', required: true, areas: [{ page: 3, x: 45 / W, y: (H - 129) / H, w: 300 / W, h: 72 / H }] },
];
