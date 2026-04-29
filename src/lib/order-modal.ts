import { supabase } from './supabase';

export type QuestionnaireAnswers = Record<string, unknown>;
export type ServerTier = 'landing' | 'business' | 'store' | 'webapp';

export function getOrCreateSessionId(): string {
  return crypto.randomUUID();
}

export async function saveQuestionnaireStep(
  sessionId: string,
  tier: string,
  step: number,
  answers: QuestionnaireAnswers,
): Promise<void> {
  const { error } = await supabase.from('questionnaires').upsert({
    session_id: sessionId,
    tier,
    current_step: step,
    answers,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to save questionnaire step:', error);
    // Save-on-blur is best-effort. We do not throw or show UI errors.
  }
}

export interface SubmitQuestionnaireInput {
  sessionId: string;
  tier: ServerTier;
  answers: QuestionnaireAnswers;
  customerEmail: string;
  customerName?: string;
  customerType: 'b2b' | 'b2c';
  acceptedWidereufWaiver: boolean;
}

// The server is authoritative for pricing. It re-derives the deposit and per-line
// breakdown from the answers payload (addons + deadline) using src/config/pricing.ts,
// so callers do not (and must not) send precomputed totals.
export async function submitQuestionnaire(
  input: SubmitQuestionnaireInput,
): Promise<{ checkoutUrl: string } | { error: string }> {
  await supabase
    .from('questionnaires')
    .update({ completed: true, answers: input.answers })
    .eq('session_id', input.sessionId);

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: input.sessionId,
      tier: input.tier,
      answers: input.answers,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      customerType: input.customerType,
      acceptedWidereufWaiver: input.acceptedWidereufWaiver,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return { error: `Failed to create checkout: ${errorBody}` };
  }

  const { checkoutUrl } = (await response.json()) as { checkoutUrl: string };
  return { checkoutUrl };
}

export function bookStrategyCall(): void {
  const calcomUrl = import.meta.env.VITE_CALCOM_BOOKING_URL || 'https://cal.com/trendivalux/30min';
  window.open(calcomUrl, '_blank', 'noopener,noreferrer');
}
