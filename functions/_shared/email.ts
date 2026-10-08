import { Resend } from 'resend';

export interface DepositConfirmationEmailParams {
  to: string;
  customerName: string;
  tier: string;
  depositAmount: string;
  finalPaymentAmount: string;
  paymentPlan?: string;
  remainingPayments?: string[];
  scopingUrl: string;
  orderId: string;
}

export async function sendDepositConfirmation(
  apiKey: string,
  params: DepositConfirmationEmailParams,
): Promise<void> {
  const resend = new Resend(apiKey);

  const greeting = params.customerName ? `Hi ${escapeHtml(params.customerName)},` : 'Hi,';

  const result = await resend.emails.send({
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
        Your <strong style="color:#FFFFFF;">${escapeHtml(params.tier)}</strong> project payment of
        <strong style="color:#FFFFFF;">${escapeHtml(params.depositAmount)}</strong> has been confirmed.
        Next, complete your project brief so we can begin.
      </p>
      <p style="font-size: 14px; line-height: 1.55; color: #A0A0B8; margin: 0 0 24px;">
        Order reference: <span style="font-family: 'JetBrains Mono', ui-monospace, monospace; color:#00E5D4;">${escapeHtml(params.orderId.slice(0, 8))}</span>
      </p>

      <h2 style="color:#FF0080;font-size:18px;margin:32px 0 12px;">Your project brief</h2>
      <p style="font-size:16px;line-height:1.55;color:#E0E0E8;">
        Your signed agreement is saved. Tell us about your business, content and preferred direction.<br />
        <a href="${escapeAttr(params.scopingUrl)}" style="color:#00E5D4;font-weight:600;">Complete your project brief →</a>
      </p>

      <div style="border:1px solid #1F1F2E; border-radius:12px; padding:18px 20px; margin:28px 0; background:#0F0F19;">
        <div style="font-family: 'JetBrains Mono', ui-monospace, monospace; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#FF0080; margin-bottom:8px;">// Final invoice</div>
        <p style="font-size:14px; line-height:1.5; color:#A0A0B8; margin:0;">
          ${params.paymentPlan === 'full' ? 'Your project price is paid in full. No development balance remains.' : params.paymentPlan === 'monthly4' ? `Three monthly payments remain: ${(params.remainingPayments || []).map(escapeHtml).join(', ')}. Your card is charged monthly; the four-payment plan ends automatically.` : `The remaining <strong style="color:#FFFFFF;">${escapeHtml(params.finalPaymentAmount)}</strong> is due after acceptance and before final project handover.`}
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
  }, { idempotencyKey: `deposit-${params.orderId}` });
  if (result.error) throw new Error(result.error.message);
}

export async function sendCheckoutInvite(apiKey: string, params: { to: string; customerName: string | null; tier: string; checkoutUrl: string; orderId: string }): Promise<void> {
  const result = await new Resend(apiKey).emails.send({
    from: 'TrendivaLux <hello@trendivalux.com>', to: params.to,
    subject: `Your ${params.tier} agreement is signed — complete your payment`,
    html: `<p>Hi ${escapeHtml(params.customerName || 'there')},</p><p>Your tailored agreement is signed and saved. The next step is the payment selected in your agreement via Stripe.</p><p><a href="${escapeAttr(params.checkoutUrl)}">Continue to secure checkout →</a></p><p>Your project brief follows after payment. Reference: ${escapeHtml(params.orderId.slice(0, 8))}</p>`,
  }, { idempotencyKey: `checkout-${params.orderId}` });
  if (result.error) throw new Error(result.error.message);
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
  reviewUrl?: string;
}

export async function sendFounderKickoff(
  apiKey: string,
  params: FounderKickoffEmailParams,
): Promise<void> {
  const resend = new Resend(apiKey);

  const customerLabel = params.customerName
    ? `${escapeHtml(params.customerName)} <${escapeHtml(params.customerEmail)}>`
    : escapeHtml(params.customerEmail);

  const result = await resend.emails.send({
    from: 'TrendivaLux Orders <orders@trendivalux.com>',
    to: params.to,
    subject: `New ${params.tier} order locked in — ${params.customerEmail}`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;font-family:Inter,system-ui,-apple-system,sans-serif;color:#111;background:#fff;">
    <div style="max-width:680px;margin:0 auto;padding:32px 24px;">
      <h1 style="font-size:22px;margin:0 0 8px;">New order locked in</h1>
      <p style="margin:0 0 18px;color:#444;font-size:14px;">A client’s first agreed payment is confirmed. The signed agreement is saved; the client receives a link to the project brief.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#666;width:160px;">Order ID</td><td style="padding:6px 0;font-family:ui-monospace,monospace;">${escapeHtml(params.orderId)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Tier</td><td style="padding:6px 0;"><strong>${escapeHtml(params.tier)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666;">Total price</td><td style="padding:6px 0;">${escapeHtml(params.totalPrice)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Payment received</td><td style="padding:6px 0;">${escapeHtml(params.depositPrice)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Customer</td><td style="padding:6px 0;">${customerLabel}</td></tr>
      </table>
      <h2 style="font-size:16px;margin:24px 0 8px;color:#111;">Questionnaire answers</h2>
      ${params.reviewUrl ? `<p><a href="${escapeAttr(params.reviewUrl)}">Private order review and final balance</a>. Keep this link private. Handover ownership only when the agreed total is confirmed.</p>` : ''}
      <pre style="background:#f4f4f4;padding:16px;border-radius:8px;font-family:ui-monospace,monospace;font-size:12px;overflow-x:auto;white-space:pre-wrap;word-break:break-word;">${escapeHtml(JSON.stringify(params.questionnaireAnswers, null, 2))}</pre>
      <p style="margin:24px 0 0;color:#666;font-size:12px;">— TrendivaLux Orders Bot</p>
    </div>
  </body>
</html>`,
  }, { idempotencyKey: `founder-${params.orderId}` });
  if (result.error) throw new Error(result.error.message);
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
    subject: `Your TrendivaLux payment didn't go through`,
    html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#0A0A0F;">
  <div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:0 auto;background:#0A0A0F;color:#FFFFFF;padding:40px 32px;">
    <h1 style="color:#FF0080;font-size:24px;margin:0 0 16px;">Payment didn't clear</h1>
    <p style="font-size:16px;line-height:1.55;color:#E0E0E8;margin:0 0 12px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.55;color:#E0E0E8;margin:0 0 16px;">
      Your bank declined the payment for your TrendivaLux ${escapeHtml(params.tier)} project. The payment has not cleared.
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

export interface ScopingInviteEmailParams {
  to: string;
  customerName: string | null;
  tier: string;
  scopingUrl: string;
  orderId: string;
}

export async function sendScopingInvite(
  apiKey: string,
  params: ScopingInviteEmailParams,
): Promise<void> {
  const resend = new Resend(apiKey);
  const greeting = params.customerName ? `Hi ${escapeHtml(params.customerName)},` : 'Hi,';
  await resend.emails.send({
    from: 'TrendivaLux <hello@trendivalux.com>',
    to: params.to,
    subject: `Your TrendivaLux ${params.tier} project — tell us the details`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0A0A0F;">
    <div style="font-family:Inter,system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;background:#0A0A0F;color:#FFFFFF;padding:40px 32px;">
      <h1 style="color:#00E5D4;font-size:28px;line-height:1.2;margin:0 0 16px;">Contract signed. Let's build.</h1>
      <p style="font-size:16px;line-height:1.55;color:#E0E0E8;margin:0 0 12px;">${greeting}</p>
      <p style="font-size:16px;line-height:1.55;color:#E0E0E8;margin:0 0 24px;">
        Your <strong style="color:#FFFFFF;">${escapeHtml(params.tier)}</strong> project is officially underway. The contract is signed and the deposit is confirmed.
        The next step: complete your project brief so we can start building — business details, design direction, pages, integrations, brand assets and timeline.
      </p>
      <p style="font-size:14px;line-height:1.55;color:#A0A0B8;margin:0 0 28px;">
        Order reference: <span style="font-family:'JetBrains Mono',ui-monospace,monospace;color:#00E5D4;">${escapeHtml(params.orderId.slice(0, 8))}</span>
      </p>
      <a href="${escapeAttr(params.scopingUrl)}" style="display:inline-block;background:#FF0080;color:#FFFFFF;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;margin-bottom:32px;">Complete your project brief →</a>
      <p style="font-size:14px;line-height:1.55;color:#A0A0B8;margin:28px 0 8px;">
        Questions? Reply to this email and we'll sort it out.
      </p>
      <hr style="border:0;border-top:1px solid #1F1F2E;margin:32px 0;" />
      <p style="font-size:12px;color:#5C5C7A;line-height:1.4;margin:0;">
        TrendivaLux. Built in Düren. Deployed globally.
      </p>
    </div>
  </body>
</html>`,
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
