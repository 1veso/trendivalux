// Single source of truth for tier base prices, addon prices, and the deposit
// line-item computation used by both the OrderModal preview and the server-side
// Stripe Checkout Session builder. Prices are defined ONCE here.

export type ServerTierId = 'landing' | 'business' | 'store' | 'webapp';
export type AnyTierId = ServerTierId | 'custom';
export type AddonId = 'motion' | 'copywriting' | 'seo' | 'maintenance' | 'rush';

export const TIER_BASE_EUR: Record<ServerTierId, number> = {
  landing: 1990,
  business: 3990,
  store: 6990,
  webapp: 12990,
};

export const TIER_NAMES: Record<AnyTierId, string> = {
  landing: 'Landing',
  business: 'Business',
  store: 'Store',
  webapp: 'Web App',
  custom: 'Custom',
};

// Flat addons billed at the deposit. Maintenance is monthly and is not part of
// the upfront deposit. Rush is a percent-of-base surcharge handled separately.
export const ADDON_FLAT_EUR: Record<'motion' | 'copywriting' | 'seo', number> = {
  motion: 490,
  copywriting: 690,
  seo: 390,
};

export const ADDON_NAMES: Record<AddonId, string> = {
  motion: 'Cinematic Motion Package',
  copywriting: 'Conversion Copywriting',
  seo: 'SEO Foundation',
  maintenance: 'Maintenance Retainer',
  rush: 'Rush Delivery (+25%)',
};

export const ADDON_MONTHLY_EUR = {
  maintenance: 290,
} as const;

export const RUSH_PERCENT = 0.25;

export interface DepositLineItem {
  /** Stable per-item id for logging/debug. Not used by Stripe. */
  id: string;
  /** Customer-facing line label shown on Stripe Checkout. */
  name: string;
  /** Cents charged at deposit time (50% of full item cost). */
  unitAmountCents: number;
  /** Full item cost in cents (deposit is half of this). */
  fullAmountCents: number;
}

export interface DepositComputation {
  lineItems: DepositLineItem[];
  totalDepositCents: number;
  totalSubtotalCents: number;
  /** Addon ids that ended up charged at deposit (excludes maintenance, includes
   *  rush as 'rush' if present). Stored on the order row for audit. */
  chargedAddonIds: string[];
}

/**
 * Build the per-line deposit breakdown for a given tier + selected addons. Used
 * by both client (preview rendering) and server (Stripe Checkout line_items).
 *
 * Rounding: tier base + flat addons are integer EUR so cents are exact. Rush is
 * computed as `Math.round(baseEur * 0.25)` (EUR-level rounding, matching the
 * OrderModal's existing display) before scaling to cents.
 */
export function computeDepositLineItems(
  tier: ServerTierId,
  selectedAddonIds: readonly string[],
  hasRush: boolean,
): DepositComputation {
  const items: DepositLineItem[] = [];
  const charged: string[] = [];

  const tierBaseEur = TIER_BASE_EUR[tier];
  items.push({
    id: `tier_${tier}`,
    name: `TrendivaLux ${TIER_NAMES[tier]} build (50% deposit)`,
    fullAmountCents: tierBaseEur * 100,
    unitAmountCents: Math.round((tierBaseEur * 100) / 2),
  });

  for (const addonId of selectedAddonIds) {
    if (addonId in ADDON_FLAT_EUR) {
      const fullEur = ADDON_FLAT_EUR[addonId as keyof typeof ADDON_FLAT_EUR];
      items.push({
        id: `addon_${addonId}`,
        name: `${ADDON_NAMES[addonId as AddonId]} (50% deposit)`,
        fullAmountCents: fullEur * 100,
        unitAmountCents: Math.round((fullEur * 100) / 2),
      });
      charged.push(addonId);
    }
    // maintenance: monthly, billed separately. rush: handled via hasRush flag.
  }

  if (hasRush) {
    const rushFeeEur = Math.round(tierBaseEur * RUSH_PERCENT);
    items.push({
      id: 'addon_rush',
      name: `${ADDON_NAMES.rush} (50% deposit)`,
      fullAmountCents: rushFeeEur * 100,
      unitAmountCents: Math.round((rushFeeEur * 100) / 2),
    });
    charged.push('rush');
  }

  const totalDepositCents = items.reduce((s, it) => s + it.unitAmountCents, 0);
  const totalSubtotalCents = items.reduce((s, it) => s + it.fullAmountCents, 0);

  // Runtime sanity check: line item count must equal 1 (tier base) + flat addons
  // selected + (1 if rush). Catches silent regressions where addons get dropped
  // between client state and Stripe checkout. Logs a warning rather than throwing
  // so a bad regression never blocks a paying customer at checkout.
  const expectedFlatAddons = selectedAddonIds.filter(
    (a) => a in ADDON_FLAT_EUR,
  ).length;
  const expectedCount = 1 + expectedFlatAddons + (hasRush ? 1 : 0);
  if (items.length !== expectedCount) {
    console.error(
      `[pricing] computeDepositLineItems count mismatch: got ${items.length}, expected ${expectedCount}. tier=${tier} addons=${JSON.stringify(selectedAddonIds)} rush=${hasRush}`,
    );
  }

  return { lineItems: items, totalDepositCents, totalSubtotalCents, chargedAddonIds: charged };
}

export function isServerTier(tier: string): tier is ServerTierId {
  return tier === 'landing' || tier === 'business' || tier === 'store' || tier === 'webapp';
}
