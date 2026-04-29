import { supabase } from './supabase';

// 23505 = unique_violation. We treat duplicate signups as a successful "you're
// already on the list" outcome — same UX as a fresh signup, no error noise.
const UNIQUE_VIOLATION = '23505';

interface CaptureResult {
  success: boolean;
  error?: string;
}

function normalizeEmail(email: string): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@') || trimmed.length < 4) return null;
  return trimmed;
}

export async function captureWaitlistEmail(email: string): Promise<CaptureResult> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { success: false, error: 'Invalid email address' };

  const { error } = await supabase
    .from('waitlist')
    .insert({ email: normalized, source: 'final_cta' });

  if (error && error.code === UNIQUE_VIOLATION) return { success: true };
  if (error) {
    console.error('Waitlist insert failed:', error);
    return { success: false, error: 'Failed to save email. Please try again.' };
  }
  return { success: true };
}

export async function captureSiteAuditLead(email: string): Promise<CaptureResult> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { success: false, error: 'Invalid email address' };

  const { error } = await supabase
    .from('site_audit_leads')
    .insert({ email: normalized, source: 'exit_intent' });

  if (error && error.code === UNIQUE_VIOLATION) return { success: true };
  if (error) {
    console.error('Site audit lead insert failed:', error);
    return { success: false, error: 'Failed to save email. Please try again.' };
  }
  return { success: true };
}
