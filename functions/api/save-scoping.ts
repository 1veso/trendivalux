import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import { validateUuid, validatePlainObject } from '../_shared/validation';
import { sendFounderAlert } from '../_shared/email';
import type { Env } from '../_shared/env';

// POST /api/save-scoping
//
// Validates the incoming scoping payload, optionally uploads client-provided
// files to the client-assets Supabase Storage bucket, and merges the scoping
// answers into the existing questionnaire row linked to this order during
// Task 2 (create-docuseal-contract sets converted_to_order_id).
//
// Per-file upload failure is NON-FATAL — if a single upload throws or the
// bucket is missing, that file is recorded with url: null and processing
// continues. One bad file never 500s the whole request.
//
// The human must create a `client-assets` bucket in Supabase Storage.
// Make it public (or switch getPublicUrl → createSignedUrl for private).
// Graceful fallback: if the bucket is absent, files are skipped and the
// scoping form data still saves successfully.

const ALLOWED_STATUSES = new Set(['contract_signed_deposit_paid', 'active', 'completed']);

const BUCKET = 'client-assets';

// Per-file cap: 10 MB decoded bytes
const MAX_FILE_DECODED_BYTES = 10 * 1024 * 1024;
// Maximum number of files per submission
const MAX_FILES = 20;
// Total decoded bytes across all files in one submission: 40 MB
const MAX_TOTAL_DECODED_BYTES = 40 * 1024 * 1024;

// Scoping JSON text cap: 200 KB prevents megabyte text dumps (B2)
const MAX_SCOPING_JSON_LENGTH = 200_000;
// Individual field caps (B2)
const MAX_PITCH_LENGTH = 5_000;
const MAX_URL_LIST_LENGTH = 10_000;

const VALID_CATEGORIES = new Set<string>(['brand', 'reference', 'content', 'other']);

// Allowed file extensions (primary gate — mime from data: URI is advisory)
const ALLOWED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg',
  'pdf',
  'doc', 'docx',
  'ppt', 'pptx',
  'xls', 'xlsx',
  'txt', 'md',
  'csv',
  'zip',
]);

const EXT_CONTENT_TYPE: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  zip: 'application/zip',
};

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

interface AttachmentInput {
  filename: string;
  dataBase64: string;
  category: string;
}

interface AttachmentResult {
  filename: string;
  category: string;
  url: string | null;
  error?: string;
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

  // B3: optional sessionId for questionnaire row fallback
  const sessionId = validateUuid(rawBody.sessionId as string | undefined);

  const scoping = validatePlainObject(rawBody.scoping);
  if (!scoping) return new Response('Invalid scoping data', { status: 400 });

  // ── B2: Per-field size caps ─────────────────────────────────────────────────
  if (JSON.stringify(scoping).length > MAX_SCOPING_JSON_LENGTH) {
    return new Response(`Scoping payload too large (max ${MAX_SCOPING_JSON_LENGTH} chars)`, { status: 400 });
  }
  const businessBlock = scoping.business;
  if (businessBlock && typeof businessBlock === 'object' && !Array.isArray(businessBlock)) {
    const pitch = (businessBlock as Record<string, unknown>).pitch;
    if (typeof pitch === 'string' && pitch.length > MAX_PITCH_LENGTH) {
      return new Response(`Pitch too long (max ${MAX_PITCH_LENGTH} chars)`, { status: 400 });
    }
  }
  const refsField = scoping.references;
  if (refsField !== undefined && JSON.stringify(refsField).length > MAX_URL_LIST_LENGTH) {
    return new Response(`References too long (max ${MAX_URL_LIST_LENGTH} chars)`, { status: 400 });
  }

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

  // ── Find linked questionnaire row (B3: sessionId fallback) ─────────────────
  let questionnaire: QuestionnaireRow | null = null;
  let firstLookupError: string | undefined;

  {
    const { data: q, error: qErr } = await supabase
      .from('questionnaires')
      .select('session_id, answers')
      .eq('converted_to_order_id', orderId)
      .single();
    if (!qErr && q) {
      questionnaire = q as QuestionnaireRow;
    } else {
      firstLookupError = qErr?.message;
    }
  }

  if (!questionnaire && sessionId) {
    const { data: q, error: qErr } = await supabase
      .from('questionnaires')
      .select('session_id, answers')
      .eq('session_id', sessionId)
      .single();
    if (!qErr && q) questionnaire = q as QuestionnaireRow;
  }

  if (!questionnaire) {
    console.error('[save-scoping] questionnaire not found for order', orderId, firstLookupError);
    return Response.json({ saved: false, error: 'Questionnaire not found' }, { status: 404 });
  }

  const qRow = questionnaire;
  const existingAnswers = qRow.answers ?? {};

  // ── B1: Server-side idempotency guard ──────────────────────────────────────
  // If scoping has already been saved, refuse the overwrite.
  if (typeof existingAnswers.scoping === 'object' && existingAnswers.scoping !== null) {
    return Response.json({ saved: false, error: 'Already submitted' }, { status: 409 });
  }

  // ── Build normalised attachment inputs ──────────────────────────────────────
  // Accept new `attachments` array; also accept legacy `logo` field → brand category
  const attachmentInputs: AttachmentInput[] = [];

  if (Array.isArray(rawBody.attachments)) {
    for (const item of rawBody.attachments) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Record<string, unknown>;
      if (typeof rec.filename !== 'string' || typeof rec.dataBase64 !== 'string') continue;
      const cat =
        typeof rec.category === 'string' && VALID_CATEGORIES.has(rec.category)
          ? rec.category
          : 'other';
      attachmentInputs.push({ filename: rec.filename, dataBase64: rec.dataBase64, category: cat });
    }
  }

  // Legacy logo field (back-compat)
  const logoRaw = validatePlainObject(rawBody.logo);
  if (
    logoRaw &&
    typeof logoRaw.filename === 'string' &&
    typeof logoRaw.dataBase64 === 'string'
  ) {
    attachmentInputs.push({
      filename: logoRaw.filename,
      dataBase64: logoRaw.dataBase64 as string,
      category: 'brand',
    });
  }

  // ── Upload attachments (graceful per-file failure) ──────────────────────────
  const uploaded: AttachmentResult[] = [];
  let firstBrandUrl: string | null = null;
  let totalDecodedBytes = 0;
  let fileCount = 0;

  for (const att of attachmentInputs) {
    // Cap total file count
    if (fileCount >= MAX_FILES) {
      uploaded.push({
        filename: att.filename,
        category: att.category,
        url: null,
        error: 'File count limit reached, skipped',
      });
      continue;
    }

    try {
      // Strip data: URI prefix to get raw base64
      let rawBase64 = att.dataBase64;
      if (rawBase64.startsWith('data:')) {
        const commaIdx = rawBase64.indexOf(',');
        if (commaIdx !== -1) rawBase64 = rawBase64.slice(commaIdx + 1);
      }

      // Validate by extension (primary gate)
      const dotIdx = att.filename.lastIndexOf('.');
      const ext = dotIdx !== -1 ? att.filename.slice(dotIdx + 1).toLowerCase() : '';
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        uploaded.push({
          filename: att.filename,
          category: att.category,
          url: null,
          error: `File type .${ext || '(none)'} not allowed, skipped`,
        });
        continue;
      }

      // Pre-decode size guard (base64 chars × 0.75 ≈ decoded bytes)
      if (rawBase64.length * 0.75 > MAX_FILE_DECODED_BYTES) {
        uploaded.push({
          filename: att.filename,
          category: att.category,
          url: null,
          error: 'File too large (max 10 MB), skipped',
        });
        continue;
      }

      // Decode and exact-size checks
      const binaryStr = atob(rawBase64);
      const exactBytes = binaryStr.length;

      if (exactBytes > MAX_FILE_DECODED_BYTES) {
        uploaded.push({
          filename: att.filename,
          category: att.category,
          url: null,
          error: 'File too large (max 10 MB), skipped',
        });
        continue;
      }
      if (totalDecodedBytes + exactBytes > MAX_TOTAL_DECODED_BYTES) {
        uploaded.push({
          filename: att.filename,
          category: att.category,
          url: null,
          error: 'Total upload size limit reached, skipped',
        });
        continue;
      }

      const bytes = new Uint8Array(exactBytes);
      for (let i = 0; i < exactBytes; i++) bytes[i] = binaryStr.charCodeAt(i);

      // Sanitize filename: strip path separators, collapse whitespace, cap length
      const sanitized = att.filename
        .replace(/[/\\]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 128);
      const storagePath = `orders/${orderId}/${att.category}/${sanitized}`;
      const contentType = EXT_CONTENT_TYPE[ext] ?? 'application/octet-stream';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, bytes, { contentType, upsert: true });

      if (uploadError || !uploadData) {
        console.warn(
          '[save-scoping] upload failed for',
          att.filename,
          '(continuing):',
          uploadError?.message,
        );
        uploaded.push({
          filename: att.filename,
          category: att.category,
          url: null,
          error: uploadError?.message ?? 'Upload failed',
        });
      } else {
        const { data: pubData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        const url = pubData?.publicUrl ?? null;
        uploaded.push({ filename: att.filename, category: att.category, url });
        totalDecodedBytes += exactBytes;
        fileCount++;
        if (att.category === 'brand' && firstBrandUrl === null && url !== null) {
          firstBrandUrl = url;
        }
      }
    } catch (err) {
      console.warn(
        '[save-scoping] error processing',
        att.filename,
        '(continuing):',
        (err as Error).message,
      );
      uploaded.push({
        filename: att.filename,
        category: att.category,
        url: null,
        error: (err as Error).message,
      });
    }
  }

  // Attach upload results to scoping payload
  if (uploaded.length > 0) {
    scoping.attachments = uploaded;
  }

  // Back-compat: set scoping.brand.logo_url → first successful brand upload
  if (firstBrandUrl !== null) {
    const brand =
      scoping.brand && typeof scoping.brand === 'object' && !Array.isArray(scoping.brand)
        ? { ...(scoping.brand as Record<string, unknown>) }
        : {};
    brand.logo_url = firstBrandUrl;
    scoping.brand = brand;
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

  // ── Mirror scoping onto orders.questionnaire_data (non-fatal) ──────────────
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
