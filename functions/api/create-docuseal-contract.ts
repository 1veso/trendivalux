import type { PagesFunction } from '@cloudflare/workers-types';
import { createAdminClient } from '../_shared/supabase-admin';
import { computeDepositLineItems, isServerTier, type ServerTierId } from '../../src/config/pricing';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '../_shared/rate-limit';
import { validateEmail, validateEnum, validateString, validateUuid } from '../_shared/validation';
import type { Env } from '../_shared/env';

interface CreateDocuSealContractRequest {
  sessionId?: unknown;
  tier?: unknown;
  customerEmail?: unknown;
  customerName?: unknown;
  customerType?: unknown;
}

interface DocuSealSubmitter {
  id?: number;
  submission_id?: number;
  embed_src?: string;
  [key: string]: unknown;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rateLimit = await checkRateLimit({
    identifier: getClientIdentifier(request),
    endpoint: 'create-docuseal-contract',
    maxRequests: 5,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter ?? 60);

  try {
    const rawBody = (await request.json()) as CreateDocuSealContractRequest;

    const sessionId = validateUuid(rawBody.sessionId as string | undefined);
    if (!sessionId) return new Response('Invalid sessionId', { status: 400 });

    const customerEmail = validateEmail(rawBody.customerEmail as string | undefined);
    if (!customerEmail) return new Response('Invalid customer email', { status: 400 });

    // customerName is optional; if present it must be a clean string ≤200 chars.
    let customerName: string | null = null;
    const rawName = rawBody.customerName;
    if (rawName !== undefined && rawName !== null && rawName !== '') {
      customerName = validateString(rawName as string, 200);
      if (!customerName) return new Response('Invalid customer name', { status: 400 });
    }

    const customerType = validateEnum(rawBody.customerType as string | undefined, ['b2b', 'b2c'] as const);
    if (!customerType) return new Response('Missing or invalid customerType', { status: 400 });

    const rawTier = rawBody.tier;
    if (typeof rawTier !== 'string' || !isServerTier(rawTier))
      return new Response('Tier does not support contract flow', { status: 400 });
    const serverTier: ServerTierId = rawTier;

    // Server-authoritative pricing: no addons, no rush at contract creation time.
    // The 50% deposit is always computed server-side — the client never supplies
    // an amount.
    const computation = computeDepositLineItems(serverTier, [], false);
    const supabase = createAdminClient(env);

    // Fetch questionnaire answers to store with the order so the founder kickoff
    // email (sent from the DocuSeal webhook on completion) has full context.
    const { data: questionnaire } = await supabase
      .from('questionnaires')
      .select('answers')
      .eq('session_id', sessionId)
      .single();
    const questionnaireAnswers = (questionnaire?.answers as Record<string, unknown>) ?? {};

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tier: serverTier,
        total_price_cents: computation.totalSubtotalCents,
        deposit_amount_cents: computation.totalDepositCents,
        customer_email: customerEmail,
        customer_name: customerName,
        questionnaire_data: {
          ...questionnaireAnswers,
          customer_type: customerType,
          server_computed: {
            tier: serverTier,
            addons_charged: computation.chargedAddonIds,
            has_rush: false,
            total_subtotal_cents: computation.totalSubtotalCents,
            total_deposit_cents: computation.totalDepositCents,
            line_items: computation.lineItems.map((li) => ({
              id: li.id,
              name: li.name,
              full_amount_cents: li.fullAmountCents,
              unit_amount_cents: li.unitAmountCents,
            })),
            computed_at: new Date().toISOString(),
          },
        },
        status: 'created',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('[create-docuseal-contract] Order insert failed:', orderError);
      return new Response(`Failed to create order: ${orderError?.message || 'unknown'}`, { status: 500 });
    }

    const { error: linkError } = await supabase
      .from('questionnaires')
      .update({ converted_to_order_id: order.id })
      .eq('session_id', sessionId);
    if (linkError) {
      // Non-fatal: the order still exists and the DocuSeal flow proceeds, but the
      // questionnaire→order link (used by the scoping page) is broken. Log it.
      console.warn('[create-docuseal-contract] failed to link questionnaire to order', {
        sessionId,
        orderId: order.id,
        message: linkError.message,
      });
    }

    const rawTemplateId =
      customerType === 'b2b' ? env.DOCUSEAL_TEMPLATE_ID_B2B : env.DOCUSEAL_TEMPLATE_ID_B2C;

    if (!rawTemplateId) {
      console.error('[create-docuseal-contract] template ID not configured for', customerType);
      return new Response('Contract template not configured', { status: 500 });
    }

    const templateId = parseInt(rawTemplateId, 10);
    if (isNaN(templateId)) {
      console.error('[create-docuseal-contract] non-numeric template ID:', rawTemplateId);
      return new Response('Invalid contract template configuration', { status: 500 });
    }

    const signerRole = env.DOCUSEAL_SIGNER_ROLE || 'Client';
    const depositEur = computation.totalDepositCents / 100;

    const submitterPayload: Record<string, unknown> = {
      role: signerRole,
      name: customerName || customerEmail,
      email: customerEmail,
      external_id: order.id,
      metadata: {
        order_id: order.id,
        session_id: sessionId,
        tier: serverTier,
        customer_type: customerType,
      },
    };
    if (env.DOCUSEAL_PAYMENT_FIELD_NAME) {
      submitterPayload.values = { [env.DOCUSEAL_PAYMENT_FIELD_NAME]: depositEur };
    } else {
      // Without this env var the server-computed deposit never reaches DocuSeal's
      // payment field — the contract would be created with a blank/zero amount.
      // Warn loudly so a misconfigured deploy is diagnosable.
      console.warn(
        '[create-docuseal-contract] DOCUSEAL_PAYMENT_FIELD_NAME is not set — deposit amount not injected into the DocuSeal payment field. Set it or bake a fixed amount into the template.',
      );
    }

    const docusealResponse = await fetch(`${env.DOCUSEAL_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': env.DOCUSEAL_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        send_email: true,
        // After signing + paying, DocuSeal redirects the signer to the
        // post-payment scoping questionnaire. The order id in the path lets the
        // page work cross-device (no reliance on the original browser's storage).
        completed_redirect_url: `${env.SITE_URL}/scoping/${order.id}`,
        submitters: [submitterPayload],
      }),
    });

    if (!docusealResponse.ok) {
      const errorText = await docusealResponse.text().catch(() => '');
      console.error('[create-docuseal-contract] DocuSeal API error:', docusealResponse.status, errorText);
      return new Response(`Contract service error: ${docusealResponse.status}`, { status: 502 });
    }

    const submitters = (await docusealResponse.json()) as DocuSealSubmitter[];
    const firstSubmitter = Array.isArray(submitters) ? submitters[0] : undefined;
    const signingUrl = firstSubmitter?.embed_src;

    if (!signingUrl) {
      console.error('[create-docuseal-contract] DocuSeal response missing embed_src', submitters);
      return new Response('Contract service returned no signing URL', { status: 502 });
    }

    const submissionId = firstSubmitter?.submission_id;
    await supabase
      .from('orders')
      .update({
        contract_status: 'sent',
        contract_docuseal_id: submissionId != null ? String(submissionId) : null,
        contract_signing_url: signingUrl,
        status: 'contract_sent',
      })
      .eq('id', order.id);

    return Response.json({ signingUrl });
  } catch (err) {
    console.error('[create-docuseal-contract] error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(`Internal error: ${message}`, { status: 500 });
  }
};
