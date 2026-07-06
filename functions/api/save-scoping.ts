import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import { validateUuid, validatePlainObject } from '../_shared/validation';
import { sendFounderAlert } from '../_shared/email';
import type { Env } from '../_shared/env';

// POST /api/save-scoping
//
// Validates the incoming scoping payload, optionally uploads a logo to the
// brand-assets Supabase Storage bucket, and merges the scoping answers into
// the existing questionnaire row that was linked to this order during Task 2
// (create-docuseal-contract sets converted_to_order_id).
//
// Logo upload failure is NON-FATAL — if the bucket is missing or the upload
// errors, we log a warning and continue with logo_url = null.

const ALLOWED_STATUSES = new Set(['contract_signed_deposit_paid', 'active', 'completed']);
const MAX_LOGO_DECODED_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

interface OrderRow {
  id: string;
  tier: string;
  status: string;
  questionnaire_data: Record<string, unknown> | null;
}

interface QuestionnaireRow {
  session_id: string;
  answers: Record<string, unknown> | null;
}

interface LogoPayload {
  filename?: unknown;
  dataBase64?: unknown;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rateLimit = await checkRateLimit({
    identifier: getClientIdentifier(request),
    endpoint: 'save-scoping',
    maxRequests: 5,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter ?? 60);

  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const orderId = validateUuid(rawBody.orderId as string | undefined);
  if (!orderId) return new Response('Invalid orderId', { status: 400 });

  const scoping = validatePlainObject(rawBody.scoping);
  if (!scoping) return new Response('Invalid scoping data', { status: 400 });

  const supabase = createAdminClient(env);

  // ── Gate: order must exist and be in an allowed status ─────────────────────
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, tier, status, questionnaire_data')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return Response.json({ saved: false, error: 'Order not found' }, { status: 404 });
  }

  const orderRow = order as OrderRow;
  if (!ALLOWED_STATUSES.has(orderRow.status)) {
    return Response.json({ saved: false, error: 'Order not ready for scoping' }, { status: 403 });
  }

  // ── Find linked questionnaire row ───────────────────────────────────────────
  // create-docuseal-contract sets converted_to_order_id on the questionnaire
  // after creating the order. We resolve the row here so we can merge into it.
  const { data: questionnaire, error: qError } = await supabase
    .from('questionnaires')
    .select('session_id, answers')
    .eq('converted_to_order_id', orderId)
    .single();

  if (qError || !questionnaire) {
    console.error('[save-scoping] questionnaire not found for order', orderId, qError?.message);
    return Response.json({ saved: false, error: 'Questionnaire not found' }, { status: 404 });
  }

  const qRow = questionnaire as QuestionnaireRow;
  const existingAnswers = qRow.answers ?? {};

  // ── Logo upload (graceful fallback) ────────────────────────────────────────
  const logoRaw = validatePlainObject(rawBody.logo);
  if (logoRaw) {
    const logo = logoRaw as LogoPayload;
    const filename = typeof logo.filename === 'string' ? logo.filename : null;
    const dataBase64 = typeof logo.dataBase64 === 'string' ? logo.dataBase64 : null;

    if (filename && dataBase64) {
      const brand = (scoping.brand && typeof scoping.brand === 'object' && !Array.isArray(scoping.brand))
        ? { ...(scoping.brand as Record<string, unknown>) }
        : {};

      let logoUrl: string | null = null;
      try {
        // data: URL or raw base64
        let rawBase64 = dataBase64;
        let mimeType: string | null = null;
        if (dataBase64.startsWith('data:')) {
          const commaIdx = dataBase64.indexOf(',');
          if (commaIdx !== -1) {
            const header = dataBase64.slice(5, commaIdx); // e.g. "image/png;base64"
            mimeType = header.split(';')[0] ?? null;
            rawBase64 = dataBase64.slice(commaIdx + 1);
          }
        }

        // Rough size guard before decoding (base64 ≈ 4/3 of binary)
        if (rawBase64.length * 0.75 > MAX_LOGO_DECODED_BYTES) {
          console.warn('[save-scoping] logo exceeds 3 MB decoded, skipping upload');
        } else if (!mimeType || !ALLOWED_IMAGE_MIMES.includes(mimeType)) {
          console.warn('[save-scoping] unsupported logo MIME type:', mimeType, '— skipping upload');
        } else {
          const binaryStr = atob(rawBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
          const storagePath = `logos/${orderId}/${sanitized}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('brand-assets')
            .upload(storagePath, bytes, { contentType: mimeType, upsert: true });

          if (uploadError || !uploadData) {
            console.warn('[save-scoping] logo upload failed (continuing without URL):', uploadError?.message);
          } else {
            const { data: pubData } = supabase.storage.from('brand-assets').getPublicUrl(storagePath);
            logoUrl = pubData?.publicUrl ?? null;
          }
        }
      } catch (logoErr) {
        console.warn('[save-scoping] logo processing error (continuing):', (logoErr as Error).message);
      }

      // Merge logo result back into scoping.brand regardless of upload outcome
      brand.logo_url = logoUrl;
      brand.logo_filename = filename;
      scoping.brand = brand;
    }
  }

  // ── Merge scoping into existing questionnaire answers ──────────────────────
  const mergedAnswers = {
    ...existingAnswers,
    scoping: {
      ...scoping,
      submitted_at: new Date().toISOString(),
    },
  };

  const { error: updateError } = await supabase
    .from('questionnaires')
    .update({ answers: mergedAnswers })
    .eq('session_id', qRow.session_id);

  if (updateError) {
    console.error('[save-scoping] failed to update questionnaire:', updateError.message);
    return new Response('Failed to save scoping data', { status: 500 });
  }

  // ── Mirror scoping onto orders.questionnaire_data (nice-to-have, non-fatal) ─
  const existingOrderQData = (orderRow.questionnaire_data ?? {}) as Record<string, unknown>;
  supabase
    .from('orders')
    .update({
      questionnaire_data: { ...existingOrderQData, scoping: mergedAnswers.scoping },
    })
    .eq('id', orderId)
    .then(({ error }) => {
      if (error) console.warn('[save-scoping] order mirror failed (non-fatal):', error.message);
    });

  // ── Founder alert ──────────────────────────────────────────────────────────
  const shortId = orderId.slice(0, 8);
  try {
    await sendFounderAlert(
      env.RESEND_API_KEY,
      env.FOUNDER_EMAIL,
      `Scoping submitted — order ${shortId} (${orderRow.tier})`,
      `<p><strong>Order:</strong> <code>${escapeHtml(shortId)}</code> · tier: <code>${escapeHtml(orderRow.tier)}</code></p>` +
        `<pre style="background:#f4f4f4;padding:12px;border-radius:6px;font-size:12px;` +
        `white-space:pre-wrap;word-break:break-word;">${escapeHtml(JSON.stringify(mergedAnswers.scoping, null, 2))}</pre>`,
    );
  } catch (mailErr) {
    console.error('[save-scoping] founder alert failed (non-fatal):', (mailErr as Error).message);
  }

  return Response.json({ saved: true });
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
