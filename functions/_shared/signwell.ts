// SignWell helper. Used by the Stripe webhook on checkout.session.completed to
// create a contract document from a template. The embedded signing URL is
// embedded in the deposit confirmation email and rendered in the
// /contract/[order_id] page.
//
// API: POST https://www.signwell.com/api/v1/document_templates/documents/
// Auth: X-Api-Key header.
// Merge fields: passed via template_fields[] keyed by api_id (the field name
// configured on the SignWell template).

const SIGNWELL_API_BASE = 'https://www.signwell.com/api/v1';

// Must match the recipient placeholder configured on the SignWell template.
// If the template uses a different placeholder name, update here.
const RECIPIENT_PLACEHOLDER_NAME = 'Client';

export interface CreateSignWellSubmissionParams {
  apiKey: string;
  templateId: string;
  customerEmail: string;
  customerName: string;
  mergeFields: Record<string, string>;
  testMode?: boolean;
}

export interface SignWellSubmissionResult {
  submissionId: string;
  signingUrl: string;
}

interface SignWellRecipient {
  id?: string;
  email?: string;
  name?: string;
  placeholder_name?: string;
  embedded_signing_url?: string;
}

interface SignWellDocumentResponse {
  id: string;
  recipients?: SignWellRecipient[];
}

export async function createSignWellSubmission(
  params: CreateSignWellSubmissionParams,
): Promise<SignWellSubmissionResult> {
  const templateFields = Object.entries(params.mergeFields).map(([api_id, value]) => ({
    api_id,
    value,
  }));

  const body = {
    test_mode: params.testMode ?? false,
    template_id: params.templateId,
    name: `Trendiva Lux Service Agreement — ${params.customerName || params.customerEmail}`,
    recipients: [
      {
        id: '1',
        placeholder_name: RECIPIENT_PLACEHOLDER_NAME,
        name: params.customerName || params.customerEmail,
        email: params.customerEmail,
      },
    ],
    template_fields: templateFields,
    embedded_signing: true,
    embedded_signing_notifications: true,
    draft: false,
  };

  const response = await fetch(`${SIGNWELL_API_BASE}/document_templates/documents/`, {
    method: 'POST',
    headers: {
      'X-Api-Key': params.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`SignWell API error: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as SignWellDocumentResponse;

  if (!data?.id) {
    throw new Error('SignWell response missing document id');
  }

  const recipient = data.recipients?.find((r) => r.embedded_signing_url) ?? data.recipients?.[0];
  const signingUrl = recipient?.embedded_signing_url;

  if (!signingUrl) {
    throw new Error('SignWell response missing embedded_signing_url for recipient');
  }

  return {
    submissionId: data.id,
    signingUrl,
  };
}

// Verify a SignWell webhook callback. SignWell signs the raw request body
// with HMAC-SHA256 using the webhook secret and sends the hex-encoded digest
// in the X-Signwell-Webhook-Signature header (also accepts X-SignWell-Signature
// for backwards compatibility).
export async function verifySignWellWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expectedHex = bytesToHex(new Uint8Array(signatureBytes));

  return timingSafeEqualHex(expectedHex, signatureHeader.trim());
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
