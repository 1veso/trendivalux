import { Resend } from 'resend';

export interface DepositConfirmationEmailParams {
  to: string;
  customerName: string;
  tier: string;
  depositAmount: string;
  finalPaymentAmount: string;
  contractSigningUrl: string;
  calcomBookingUrl: string;
  orderId: string;
}

export async function sendDepositConfirmation(
  apiKey: string,
  params: DepositConfirmationEmailParams,
): Promise<void> {
  const resend = new Resend(apiKey);

  const greeting = params.customerName ? `Hi ${escapeHtml(params.customerName)},` : 'Hi,';

  await resend.emails.send({
    from: 'TrendivaLux <hello@trendivalux.com>',
    to: params.to,
    subject: `Your TrendivaLux ${params.tier} project is locked in`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0A0A0F;">
    <div style="font-family: Inter, system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; background: #0A0A0F; color: #FFFFFF; padding: 40px 32px;">
      <h1 style="color: #00E5D4; font-size: 28px; line-height: 1.2; margin: 0 0 16px;">Welcome to TrendivaLux.</h1>
      <p style="font-size: 16px; line-height: 1.55; color: #E0E0E8; margin: 0 0 12px;">${greeting}</p>
      <p style="font-size: 16px; line-height: 1.55; color: #E0E0E8; margin: 0 0 12px;">
        Your <strong style="color:#FFFFFF;">${escapeHtml(params.tier)}</strong> project deposit of
        <strong style="color:#FFFFFF;">${escapeHtml(params.depositAmount)}</strong> has been confirmed.
        Work begins within 24 hours.
      </p>
      <p style="font-size: 14px; line-height: 1.55; color: #A0A0B8; margin: 0 0 24px;">
        Order reference: <span style="font-family: 'JetBrains Mono', ui-monospace, monospace; color:#00E5D4;">${escapeHtml(params.orderId.slice(0, 8))}</span>
      </p>

      <h2 style="color: #FF0080; font-size: 18px; letter-spacing: 0.04em; text-transform: uppercase; margin: 32px 0 12px;">Two next steps</h2>
      <ol style="padding-left: 20px; margin: 0 0 24px; color: #E0E0E8;">
        <li style="margin-bottom: 14px; line-height: 1.55;">
          <strong style="color:#FFFFFF;">Sign your service agreement.</strong>
          Your contract is ready for review and digital signature.<br />
          <a href="${escapeAttr(params.contractSigningUrl)}" style="color:#00E5D4; font-weight:600;">Review and sign here →</a>
        </li>
        <li style="margin-bottom: 14px; line-height: 1.55;">
          <strong style="color:#FFFFFF;">Book your discovery call.</strong>
          A 30-minute kickoff conversation, scheduled within the next 24 hours.<br />
          <a href="${escapeAttr(params.calcomBookingUrl)}" style="color:#00E5D4; font-weight:600;">Pick a time that works →</a>
        </li>
      </ol>

      <div style="border:1px solid #1F1F2E; border-radius:12px; padding:18px 20px; margin:28px 0; background:#0F0F19;">
        <div style="font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#FF0080; margin-bottom:8px;">// Final invoice</div>
        <p style="font-size:14px; line-height:1.5; color:#A0A0B8; margin:0;">
          The remaining <strong style="color:#FFFFFF;">${escapeHtml(params.finalPaymentAmount)}</strong> is due once we hand over the live site and you sign off. No surprises, no hidden fees.
        </p>
      </div>

      <p style="font-size:14px; line-height:1.55; color:#A0A0B8; margin:32px 0 8px;">
        Questions? Reply directly to this email — it goes to my inbox.
      </p>
      <hr style="border:0; border-top:1px solid #1F1F2E; margin:32px 0;" />
      <p style="font-size:12px; color:#5C5C7A; line-height:1.4; margin:0;">
        TrendivaLux. Built in Düren. Deployed globally.
      </p>
    </div>
  </body>
</html>`,
  });
}

export interface FounderKickoffEmailParams {
  to: string;
  orderId: string;
  tier: string;
  customerEmail: string;
  customerName?: string | null;
  totalPrice: string;
  depositPrice: string;
  questionnaireAnswers: Record<string, unknown>;
}

export async function sendFounderKickoff(
  apiKey: string,
  params: FounderKickoffEmailParams,
): Promise<void> {
  const resend = new Resend(apiKey);

  const customerLabel = params.customerName
    ? `${escapeHtml(params.customerName)} <${escapeHtml(params.customerEmail)}>`
    : escapeHtml(params.customerEmail);

  await resend.emails.send({
    from: 'TrendivaLux Orders <orders@trendivalux.com>',
    to: params.to,
    subject: `New ${params.tier} order locked in — ${params.customerEmail}`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;font-family:Inter,system-ui,-apple-system,sans-serif;color:#111;background:#fff;">
    <div style="max-width:680px;margin:0 auto;padding:32px 24px;">
      <h1 style="font-size:22px;margin:0 0 8px;">New order locked in</h1>
      <p style="margin:0 0 18px;color:#444;font-size:14px;">A client just paid the 50% deposit. Don't forget to email them the signed contract within 24 hours.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#666;width:160px;">Order ID</td><td style="padding:6px 0;font-family:ui-monospace,monospace;">${escapeHtml(params.orderId)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Tier</td><td style="padding:6px 0;"><strong>${escapeHtml(params.tier)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666;">Total price</td><td style="padding:6px 0;">${escapeHtml(params.totalPrice)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Deposit paid</td><td style="padding:6px 0;">${escapeHtml(params.depositPrice)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Customer</td><td style="padding:6px 0;">${customerLabel}</td></tr>
      </table>
      <h2 style="font-size:16px;margin:24px 0 8px;color:#111;">Questionnaire answers</h2>
      <pre style="background:#f4f4f4;padding:16px;border-radius:8px;font-family:ui-monospace,monospace;font-size:12px;overflow-x:auto;white-space:pre-wrap;word-break:break-word;">${escapeHtml(JSON.stringify(params.questionnaireAnswers, null, 2))}</pre>
      <p style="margin:24px 0 0;color:#666;font-size:12px;">— TrendivaLux Orders Bot</p>
    </div>
  </body>
</html>`,
  });
}

export interface AsyncPaymentFailedEmailParams {
  to: string;
  customerName: string;
  tier: string;
  retryCheckoutUrl?: string;
}

export async function sendAsyncPaymentFailed(
  apiKey: string,
  params: AsyncPaymentFailedEmailParams,
): Promise<void> {
  const resend = new Resend(apiKey);
  const greeting = params.customerName ? `Hi ${escapeHtml(params.customerName)},` : 'Hi,';

  await resend.emails.send({
    from: 'TrendivaLux <hello@trendivalux.com>',
    to: params.to,
    subject: `Your TrendivaLux deposit didn't go through`,
    html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#0A0A0F;">
  <div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:0 auto;background:#0A0A0F;color:#FFFFFF;padding:40px 32px;">
    <h1 style="color:#FF0080;font-size:24px;margin:0 0 16px;">Payment didn't clear</h1>
    <p style="font-size:16px;line-height:1.55;color:#E0E0E8;margin:0 0 12px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.55;color:#E0E0E8;margin:0 0 16px;">
      Your bank declined the deposit for your TrendivaLux ${escapeHtml(params.tier)} project. No charge has been made.
    </p>
    <p style="font-size:16px;line-height:1.55;color:#E0E0E8;margin:0 0 24px;">
      ${params.retryCheckoutUrl
        ? `You can <a href="${escapeAttr(params.retryCheckoutUrl)}" style="color:#00E5D4;">try the payment again</a> or reply to this email and we'll send a new link.`
        : `Reply to this email and we'll send a new payment link, or try a different payment method.`}
    </p>
    <hr style="border:0;border-top:1px solid #1F1F2E;margin:32px 0;" />
    <p style="font-size:12px;color:#5C5C7A;margin:0;">TrendivaLux. Built in Düren. Deployed globally.</p>
  </div>
</body></html>`,
  });
}

export async function sendFounderAlert(
  apiKey: string,
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: 'TrendivaLux Alerts <alerts@trendivalux.com>',
    to,
    subject,
    html: `<div style="font-family:Inter,system-ui,sans-serif;color:#111;font-size:14px;line-height:1.5;">${body}</div>`,
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(input: string): string {
  return escapeHtml(input);
}
