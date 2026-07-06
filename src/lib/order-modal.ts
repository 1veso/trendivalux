import { supabase } from './supabase';

export type QuestionnaireAnswers = Record<string, unknown>;
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

export interface StartContractInput {
  sessionId: string;
  tier: ServerTier;
  answers: QuestionnaireAnswers;
  customerEmail: string;
  customerName?: string;
  customerType: 'b2b' | 'b2c';
}

/** Phase A stub. Phase B will replace this with a real DocuSeal signing URL. */
export async function startContractFlow(
  input: StartContractInput,
): Promise<{ signingUrl: string } | { error: string }> {
  await supabase
    .from('questionnaires')
    .update({ completed: true, answers: input.answers })
    .eq('session_id', input.sessionId);

  // Phase B will replace this stub with a real DocuSeal signing URL.
  return { error: 'Contract flow not yet wired (Phase B).' };
}

export function bookStrategyCall(): void {
  const calcomUrl = import.meta.env.VITE_CALCOM_BOOKING_URL || 'https://cal.com/trendivalux/30min';
  window.open(calcomUrl, '_blank', 'noopener,noreferrer');
}
