/**
 * Seeds the four TrendivaLux tier products into Stripe LIVE mode.
 *
 * Run with:
 *   STRIPE_LIVE_SECRET_KEY=sk_live_... pnpm tsx scripts/seed-live-mode-products.ts
 *
 * Safety guarantees:
 *   1. Refuses to run unless the secret key starts with `sk_live_`. If you
 *      accidentally paste a test key, the script aborts before any API call.
 *   2. Idempotent. Looks up existing products by metadata.tier first; only
 *      creates a product when no live-mode product already exists with that
 *      tier marker. Same for prices — re-running the script does not produce
 *      duplicates.
 *   3. Tier amounts are imported from src/config/pricing.ts so this script
 *      cannot drift from the prices users see on the site.
 *
 * Output: prints the four `VITE_STRIPE_PRICE_*` and `STRIPE_PRICE_*` values
 * to paste into Cloudflare Pages env vars.
 */

import Stripe from 'stripe';
import { TIER_BASE_EUR, TIER_NAMES, type ServerTierId } from '../src/config/pricing';

const SECRET = process.env.STRIPE_LIVE_SECRET_KEY;

if (!SECRET) {
  console.error('STRIPE_LIVE_SECRET_KEY is not set. Aborting.');
  process.exit(1);
}

if (!SECRET.startsWith('sk_live_')) {
  console.error(
    `Refusing to run: STRIPE_LIVE_SECRET_KEY does not start with "sk_live_" (got "${SECRET.slice(0, 7)}..."). ` +
      'This script is for live-mode seeding only. Use the Stripe Dashboard test-mode UI for test products.',
  );
  process.exit(1);
}

const stripe = new Stripe(SECRET, { apiVersion: '2024-06-20' });

interface TierSeed {
  id: ServerTierId;
  name: string;
  description: string;
  amountCents: number;
  metadata: Record<string, string>;
}

const tiers: TierSeed[] = [
  {
    id: 'landing',
    name: `Trendiva Lux ${TIER_NAMES.landing}`,
    description: 'Cinematic single-page landing site. 7-day delivery.',
    amountCents: TIER_BASE_EUR.landing * 100,
    metadata: { tier: 'landing', delivery_days: '7' },
  },
  {
    id: 'business',
    name: `Trendiva Lux ${TIER_NAMES.business}`,
    description: 'Multi-page cinematic business site. 14-day delivery.',
    amountCents: TIER_BASE_EUR.business * 100,
    metadata: { tier: 'business', delivery_days: '14' },
  },
  {
    id: 'store',
    name: `Trendiva Lux ${TIER_NAMES.store}`,
    description: 'Cinematic e-commerce site with Stripe checkout. 21-day delivery.',
    amountCents: TIER_BASE_EUR.store * 100,
    metadata: { tier: 'store', delivery_days: '21' },
  },
  {
    id: 'webapp',
    name: `Trendiva Lux ${TIER_NAMES.webapp}`,
    description: 'Custom web application with auth, database, and admin. 4-6 week delivery.',
    amountCents: TIER_BASE_EUR.webapp * 100,
    metadata: { tier: 'webapp', delivery_days: '28-42' },
  },
];

async function findExistingProductByTier(tier: string): Promise<Stripe.Product | null> {
  // Stripe's product search supports metadata. Falls back to listing all
  // products if search is unavailable on the account.
  try {
    const result = await stripe.products.search({
      query: `metadata['tier']:'${tier}' AND active:'true'`,
      limit: 1,
    });
    return result.data[0] ?? null;
  } catch {
    let starting_after: string | undefined;
    while (true) {
      const page = await stripe.products.list({ limit: 100, starting_after, active: true });
      const hit = page.data.find((p) => p.metadata?.tier === tier);
      if (hit) return hit;
      if (!page.has_more) return null;
      starting_after = page.data[page.data.length - 1].id;
    }
  }
}

async function findActivePriceForProduct(
  productId: string,
  amountCents: number,
): Promise<Stripe.Price | null> {
  const page = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  return (
    page.data.find((p) => p.unit_amount === amountCents && p.currency === 'eur') ?? null
  );
}

async function seed() {
  console.log('Seeding Trendiva Lux products into Stripe LIVE mode...\n');

  const results: Array<{ tier: ServerTierId; productId: string; priceId: string; created: boolean }> = [];

  for (const t of tiers) {
    console.log(`[${t.id}] ${t.name} — €${t.amountCents / 100}`);

    const existingProduct = await findExistingProductByTier(t.id);
    let product: Stripe.Product;
    let productCreated = false;
    if (existingProduct) {
      console.log(`  ↻ existing product found: ${existingProduct.id}`);
      product = existingProduct;
    } else {
      product = await stripe.products.create({
        name: t.name,
        description: t.description,
        metadata: t.metadata,
      });
      productCreated = true;
      console.log(`  ✓ created product: ${product.id}`);
    }

    const existingPrice = await findActivePriceForProduct(product.id, t.amountCents);
    let price: Stripe.Price;
    let priceCreated = false;
    if (existingPrice) {
      console.log(`  ↻ existing price found: ${existingPrice.id}`);
      price = existingPrice;
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: t.amountCents,
        currency: 'eur',
        metadata: t.metadata,
      });
      priceCreated = true;
      console.log(`  ✓ created price: ${price.id}`);
    }

    results.push({
      tier: t.id,
      productId: product.id,
      priceId: price.id,
      created: productCreated || priceCreated,
    });
    console.log('');
  }

  console.log('────────────────────────────────────────');
  console.log('Cloudflare Pages env vars to set (Production):');
  console.log('────────────────────────────────────────');
  for (const r of results) {
    const upper = r.tier.toUpperCase();
    console.log(`VITE_STRIPE_PRICE_${upper}=${r.priceId}`);
    console.log(`STRIPE_PRICE_${upper}=${r.priceId}`);
  }
  console.log('────────────────────────────────────────');

  const anyCreated = results.some((r) => r.created);
  if (!anyCreated) {
    console.log('\nAll four tiers already existed in live mode — no changes made.');
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
