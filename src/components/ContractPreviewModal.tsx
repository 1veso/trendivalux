import { useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from './Icons';
import {
  ADDON_NAMES,
  TIER_NAMES,
  type AnyTierId,
  computeDepositLineItems,
  isServerTier,
} from '../config/pricing';
import contractTemplate from '../content/legal/WERKVERTRAG_TEMPLATE.md?raw';

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: string;
  customerName?: string;
  customerAddress?: string;
  addons?: string[];
  hasRush?: boolean;
}

const TIER_TIMELINE: Record<string, string> = {
  landing: '3–7 Tagen / 3–7 days',
  business: '14 Tagen / 14 days',
  store: '21 Tagen / 21 days',
  webapp: '4–6 Wochen / 4–6 weeks',
  custom: 'nach Vereinbarung / as agreed',
};

function fillMergeFields(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `[${key}]`);
}

const markdownComponents = {
  h1: ({ children }: any) => (
    <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-1 text-center mt-2 mb-1">
      {children}
    </h2>
  ),
  h2: ({ children }: any) => (
    <h3 className="font-display font-bold text-1 text-base md:text-lg mt-6 mb-2">
      {children}
    </h3>
  ),
  h3: ({ children }: any) => (
    <h4 className="font-display font-bold text-1 text-base mt-5 mb-2">{children}</h4>
  ),
  p: ({ children }: any) => (
    <p className="text-2 text-sm leading-relaxed my-2.5">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="text-2 text-sm leading-relaxed list-disc pl-6 my-2.5 space-y-1">{children}</ul>
  ),
  li: ({ children }: any) => <li>{children}</li>,
  strong: ({ children }: any) => <strong className="text-1 font-semibold">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  hr: () => (
    <hr
      className="my-6 border-0 h-px"
      style={{ background: 'var(--border)' }}
    />
  ),
  blockquote: ({ children }: any) => (
    <blockquote
      className="my-3 pl-4 border-l-2 italic text-2 text-sm"
      style={{ borderColor: 'var(--gold)' }}
    >
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => {
    const isExternal = !!href && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="accent underline-offset-2 hover:underline"
        style={{ color: 'var(--accent)' }}
      >
        {children}
      </a>
    );
  },
  table: ({ children }: any) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead style={{ background: 'var(--surface-2)' }}>{children}</thead>
  ),
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => (
    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="px-3 py-2 text-left font-display font-semibold text-1">{children}</th>
  ),
  td: ({ children }: any) => <td className="px-3 py-2 align-top text-2">{children}</td>,
};

export default function ContractPreviewModal({
  isOpen,
  onClose,
  tier,
  customerName,
  customerAddress,
  addons,
  hasRush,
}: ContractPreviewModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (isOpen) document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const filledContract = useMemo(() => {
    const tierKey = tier as AnyTierId;
    const tierName = TIER_NAMES[tierKey] ?? (tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : '[Tier]');

    const namedAddons = (addons ?? [])
      .filter((id) => id !== 'rush' && id in ADDON_NAMES)
      .map((id) => `- ${ADDON_NAMES[id as keyof typeof ADDON_NAMES]}`);
    if (hasRush) namedAddons.push(`- ${ADDON_NAMES.rush}`);
    const deliverablesList =
      namedAddons.length > 0
        ? `Tier-Spezifikation **${tierName}** mit folgenden Add-Ons / Tier specification **${tierName}** with the following add-ons:\n\n${namedAddons.join('\n')}`
        : `Lieferumfang gemäß Tier-Spezifikation **${tierName}** / Scope of delivery according to tier specification **${tierName}**.`;

    let totalPriceEur = '[wird bei Bestellung berechnet / calculated at order]';
    let depositEur = '[50% des Gesamtpreises / 50% of total]';
    let finalEur = '[50% des Gesamtpreises / 50% of total]';
    if (isServerTier(tier)) {
      const safeAddons = (addons ?? []).filter((id): id is string => typeof id === 'string');
      const computation = computeDepositLineItems(tier, safeAddons, !!hasRush);
      const totalCents = computation.totalSubtotalCents;
      const depositCents = computation.totalDepositCents;
      const finalCents = totalCents - depositCents;
      const fmt = (cents: number) =>
        `€${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      totalPriceEur = fmt(totalCents);
      depositEur = fmt(depositCents);
      finalEur = fmt(finalCents);
    }

    const mergeValues: Record<string, string> = {
      customer_name: customerName?.trim() || '[Ihr Name / Your Name]',
      customer_address: customerAddress?.trim() || '[Ihre Anschrift / Your Address]',
      tier_name: tierName,
      total_price_eur: totalPriceEur,
      deposit_paid_eur: depositEur,
      final_payment_eur: finalEur,
      delivery_timeline: TIER_TIMELINE[tier] ?? '[Lieferzeit gemäß Tier / per tier]',
      deliverables_list: deliverablesList,
      order_id: '[wird bei Bestellung generiert / generated at order]',
      contract_date: new Date().toLocaleDateString('de-DE'),
    };

    return fillMergeFields(contractTemplate, mergeValues);
  }, [tier, customerName, customerAddress, addons, hasRush]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Service Agreement Preview"
      className="fixed inset-0 z-[100] flex items-end sm:items-start md:items-center justify-center p-0 sm:p-3 md:p-6"
      style={{ background: 'color-mix(in oklab, var(--bg) 88%, transparent)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-3xl max-h-[100svh] sm:max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border bd"
        style={{
          background: 'var(--surface)',
          boxShadow:
            '0 30px 80px -20px color-mix(in oklab, var(--gold) 25%, transparent), 0 0 0 1px color-mix(in oklab, var(--gold) 25%, transparent) inset',
          paddingBottom: 'env(safe-area-inset-bottom)',
          overscrollBehavior: 'contain',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="sticky top-0 z-10 px-5 sm:px-6 md:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b bd backdrop-blur-md flex items-center justify-between gap-4"
          style={{ background: 'color-mix(in oklab, var(--surface) 92%, transparent)' }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.28em] gold">
            // SERVICE AGREEMENT // PREVIEW
          </p>
          <button
            onClick={onClose}
            className="shrink-0 grid place-items-center w-11 h-11 rounded-full border bd hover:opacity-70 transition"
            aria-label="Close preview"
            type="button"
          >
            <Icon.Close className="w-3.5 h-3.5 text-2" />
          </button>
        </header>

        <div className="px-5 sm:px-6 md:px-10 py-6 sm:py-7 text-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mut text-center mb-6">
            Vorschau / Preview — der finale Vertrag wird nach Zahlung über SignWell zur digitalen Unterschrift
            versendet. / The final contract will be sent for digital signature via SignWell after payment.
          </p>

          <article className="contract-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {filledContract}
            </ReactMarkdown>
          </article>
        </div>

        <footer
          className="sticky bottom-0 px-5 sm:px-6 md:px-8 py-3 sm:py-4 border-t bd backdrop-blur-md flex justify-end"
          style={{ background: 'color-mix(in oklab, var(--surface) 92%, transparent)' }}
        >
          <button
            onClick={onClose}
            type="button"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            Got it <Icon.ArrowRight className="w-3.5 h-3.5" />
          </button>
        </footer>
      </div>
    </div>
  );
}
