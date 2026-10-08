interface CaptureResult { success: boolean; error?: string }

async function capture(email: string, kind: 'waitlist' | 'audit'): Promise<CaptureResult> {
  try {
    const response = await fetch('/api/capture-lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), kind }),
    });
    return response.ok ? { success: true } : {
      success: false,
      error: response.status === 429 ? 'Please wait a minute before trying again.' : 'Could not save your email. Please try again.',
    };
  } catch { return { success: false, error: 'Connection interrupted. Please try again.' }; }
}

export const captureWaitlistEmail = (email: string) => capture(email, 'waitlist');
export const captureSiteAuditLead = (email: string) => capture(email, 'audit');
