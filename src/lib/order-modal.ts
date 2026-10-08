export type QuestionnaireAnswers = Record<string, unknown>;
import type { ServiceLevel, PaymentPlan } from '../config/payment-plans';

export type ServerTier = 'landing' | 'business' | 'store' | 'webapp';

const SESSION_KEY = 'tl_order_session_id';

export function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (SSR, private mode, etc.) — return ephemeral UUID.
    return crypto.randomUUID();
  }
}

/** Remove the persisted session so the next open starts a fresh order row. */
export function clearSessionId(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // best-effort — SSR / private-mode browsers may not have localStorage
  }
}

export interface StartContractInput {
  sessionId: string;
  tier: ServerTier | 'custom';
  serviceLevel: ServiceLevel;
  paymentPlan: PaymentPlan;
  projectDetails: string;
  answers: QuestionnaireAnswers;
  customerEmail: string;
  customerName?: string;
  customerType: 'b2b' | 'b2c';
}

export async function startContractFlow(
  input: StartContractInput,
): Promise<{ signingUrl?: string; quoteRequested?: boolean } | { error: string }> {
  try {
  const response = await fetch('/api/create-docuseal-contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: input.sessionId,
      tier: input.tier,
      serviceLevel: input.serviceLevel, paymentPlan: input.paymentPlan, projectDetails: input.projectDetails,
      customerEmail: input.customerEmail,
      customerName: input.customerName ?? undefined,
      customerType: input.customerType,
      answers: input.answers,
    }),
  });
  if (!response.ok) {
    return { error: response.status === 429 ? 'Please wait a minute before trying again.' : 'We could not prepare your agreement. Please retry or email hello@trendivalux.com.' };
  }
  const data = (await response.json()) as { signingUrl?: string; quoteRequested?: boolean; error?: string };
  if (data.signingUrl || data.quoteRequested) return { signingUrl: data.signingUrl, quoteRequested: data.quoteRequested };
  return { error: data.error || 'We could not prepare your agreement. Please try again.' };
  } catch {
    return { error: 'Connection interrupted. Your details are still here — please try again.' };
  }
}

export function bookStrategyCall(): void {
  const calcomUrl = import.meta.env.VITE_CALCOM_BOOKING_URL;
  if (calcomUrl && /^https:\/\//.test(calcomUrl)) {
    window.open(calcomUrl, '_blank', 'noopener,noreferrer');
  } else {
    window.openContactModal?.();
  }
}
