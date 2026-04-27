import type { PagesFunction } from '@cloudflare/workers-types';
import { createStripeClient } from '../_shared/stripe-client';
import { createAdminClient } from '../_shared/supabase-admin';
import { computeDepositLineItems, isServerTier, type ServerTierId } from '../../src/config/pricing';
import type { Env } from '../_shared/env';

interface CheckoutRequest {
  sessionId: string;
  tier: string;
  answers: Record<string, unknown>;
  customerEmail?: string;
  customerName?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as CheckoutRequest;
    const { sessionId, tier, answers, customerEmail, customerName } = body;

    if (!sessionId || !tier || !customerEmail) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (!isServerTier(tier)) {
      // 'custom' tier and unknown tiers cannot run through Checkout. The client
      // routes 'custom' to Cal.com instead of hitting this endpoint.
      return new Response(`Tier '${tier}' does not support direct checkout`, { status: 400 });
    }
    const serverTier: ServerTierId = tier;

    // Extract addon selection from the questionnaire answers. Server is
    // authoritative for pricing — we recompute from the source-of-truth in
    // src/config/pricing.ts and ignore any client-supplied totals.
    const addonIds = Array.isArray((answers as { addons?: unknown }).addons)
      ? ((answers as { addons: unknown[] }).addons.filter((a) => typeof a === 'string') as string[])
      : [];
    const deadlineMode =
      (((answers as { brief?: { deadline?: { mode?: unknown } } }).brief?.deadline?.mode) as string | undefined) ?? null;
    const hasRush = deadlineMode === 'rush';

    const computation = computeDepositLineItems(serverTier, addonIds, hasRush);

    // Pre-create the order row using the recomputed totals so the webhook can
    // reconcile and the founder kickoff email shows the actual amounts.
    const { data: order, error: orderError } = await createAdminClient(env)
      .from('orders')
      .insert({
        tier: serverTier,
        total_price_cents: computation.totalSubtotalCents,
        deposit_amount_cents: computation.totalDepositCents,
        customer_email: customerEmail,
        customer_name: customerName || null,
        questionnaire_data: {
          ...(answers as Record<string, unknown>),
          // Audit snapshot of what the server computed at checkout time.
          server_computed: {
            tier: serverTier,
            addons_charged: computation.chargedAddonIds,
            has_rush: hasRush,
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
      console.error('Order pre-create failed:', orderError);
      return new Response(`Failed to create order: ${orderError?.message || 'unknown'}`, { status: 500 });
    }

    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: computation.lineItems.map((li) => ({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: li.unitAmountCents,
          product_data: {
            name: li.name,
          },
        },
      })),
      customer_email: customerEmail,
      success_url: `${env.SITE_URL}/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.SITE_URL}/?checkout_cancelled=true`,
      metadata: {
        order_id: order.id,
        tier: serverTier,
        questionnaire_session_id: sessionId,
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          tier: serverTier,
        },
      },
      locale: 'de',
      submit_type: 'pay',
      billing_address_collection: 'required',
    });

    const supabase = createAdminClient(env);
    await supabase
      .from('orders')
      .update({ stripe_session_id: checkoutSession.id })
      .eq('id', order.id);

    await supabase
      .from('questionnaires')
      .update({ converted_to_order_id: order.id })
      .eq('session_id', sessionId);

    if (!checkoutSession.url) {
      return new Response('Stripe did not return a checkout URL', { status: 500 });
    }

    return Response.json({ checkoutUrl: checkoutSession.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(`Internal error: ${message}`, { status: 500 });
  }
};
