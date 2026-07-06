import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import SEO from '../components/SEO';

// ── Local chip/card components ────────────────────────────────────────────────
// These were removed from OrderModal in the Task 1 restructure.
// Recreated here for the post-payment scoping form.

interface ChipOption {
  id: string;
  label: string;
}

interface ChipGroupProps {
  options: readonly ChipOption[];
  selected: string[];
  onChange: (v: string[]) => void;
  multiselect?: boolean;
}

function ChipGroup({ options, selected, onChange, multiselect = true }: ChipGroupProps) {
  const toggle = (id: string) => {
    if (multiselect) {
      onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
    } else {
      onChange(selected.includes(id) ? [] : [id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(o => {
        const active = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            className="px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-[0.14em] border transition-all"
            style={{
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--text-2)',
              borderColor: active ? 'var(--accent)' : 'var(--border)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface CardOption {
  id: string;
  label: string;
  sub?: string;
}

interface CardSelectProps {
  options: readonly CardOption[];
  selected: string;
  onChange: (v: string) => void;
}

function CardSelect({ options, selected, onChange }: CardSelectProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
      {options.map(o => {
        const active = selected === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className="rounded-xl border p-3 text-left transition-all"
            style={{
              background: active
                ? 'color-mix(in oklab, var(--accent) 14%, var(--surface))'
                : 'var(--surface)',
              borderColor: active ? 'var(--accent)' : 'var(--border)',
            }}
          >
            <div
              className="text-sm font-semibold leading-snug"
              style={{ color: 'var(--text)' }}
            >
              {o.label}
            </div>
            {o.sub && (
              <div
                className="text-[11px] mt-0.5 leading-snug"
                style={{ color: 'var(--text-2)' }}
              >
                {o.sub}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

function Field({ label, hint, required, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="font-mono text-[10px] uppercase tracking-[0.20em]"
        style={{ color: 'var(--accent)' }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--accent-2)' }}> *</span>
        )}
      </label>
      {hint && (
        <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--accent-2)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="pt-2">
      <div
        className="font-mono text-[10px] uppercase tracking-[0.20em] mb-1"
        style={{ color: 'var(--accent-2)' }}
      >
        // section
      </div>
      <h2 className="font-display font-bold text-lg tracking-tight">{children}</h2>
    </div>
  );
}

// ── File upload helpers ───────────────────────────────────────────────────────

// Client-side per-file cap — matches the server-side limit in save-scoping.ts
const CLIENT_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const BRAND_ACCEPT = 'image/*,.pdf,.svg';
const REFERENCE_ACCEPT = 'image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.zip';

// Inline file list with per-file size display and remove button
function AttachmentList({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  if (files.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 mt-2">
      {files.map((f, i) => (
        <li
          key={i}
          className="flex items-center gap-2 text-xs font-mono"
          style={{ color: 'var(--text-2)' }}
        >
          <span className="truncate flex-1">{f.name}</span>
          <span className="shrink-0 opacity-60">{formatFileSize(f.size)}</span>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border transition-colors"
            style={{ color: 'var(--accent-2)', borderColor: 'var(--accent-2)' }}
            aria-label={`Remove ${f.name}`}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border px-3 py-2.5 text-sm bg-transparent outline-none ' +
  'focus:border-[var(--accent)] transition-colors placeholder:opacity-40';

// ── Option lists ──────────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { id: 'b2b', label: 'B2B' },
  { id: 'b2c', label: 'B2C' },
  { id: 'local_de', label: 'Local DE' },
  { id: 'eu_wide', label: 'EU-wide' },
  { id: 'global', label: 'Global' },
  { id: 'creator', label: 'Creator / Indie' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'government', label: 'Government' },
] as const satisfies readonly ChipOption[];

const VIBE_OPTIONS = [
  { id: 'cinematic_dark', label: 'Cinematic Dark', sub: 'Bold, moody, high contrast' },
  { id: 'sunrise_warm', label: 'Sunrise Warm', sub: 'Energetic, orange-pink gradients' },
  { id: 'editorial_minimal', label: 'Editorial Minimal', sub: 'Clean, whitespace-driven' },
  { id: 'brutalist_mono', label: 'Brutalist Mono', sub: 'Raw, type-forward' },
  { id: 'lux_gold', label: 'Lux Gold', sub: 'Premium, metallic, sophisticated' },
  { id: 'custom', label: 'Surprise Me', sub: 'Trust us to get creative' },
] as const satisfies readonly CardOption[];

const PAGE_OPTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'blog', label: 'Blog' },
  { id: 'contact', label: 'Contact' },
  { id: 'faq', label: 'FAQ' },
  { id: 'legal', label: 'Legal / Imprint' },
  { id: 'shop', label: 'Shop / Listings' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'auth', label: 'Auth (Login/Register)' },
  { id: 'landing', label: 'Landing / Campaign' },
] as const satisfies readonly ChipOption[];

const INTEGRATION_OPTIONS = [
  { id: 'stripe', label: 'Stripe' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'supabase', label: 'Supabase' },
  { id: 'auth', label: 'Auth' },
  { id: 'cal', label: 'Cal.com' },
  { id: 'email', label: 'Email / Newsletter' },
  { id: 'crm', label: 'CRM' },
  { id: 'ai', label: 'AI / LLM' },
  { id: 'n8n', label: 'n8n / Zapier' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'crypto', label: 'Crypto / Web3' },
  { id: 'custom', label: 'Custom API' },
] as const satisfies readonly ChipOption[];

const CONTENT_OPTIONS = [
  { id: 'have_all', label: 'Have everything', sub: 'Text, images, copy ready to go' },
  { id: 'have_some', label: 'Have some', sub: "I'll send what I have; rest is TBD" },
  { id: 'need_all', label: 'Need everything', sub: 'Copywriting + images included' },
] as const satisfies readonly CardOption[];

const LANGUAGE_OPTIONS = [
  { id: 'de', label: 'German only' },
  { id: 'en', label: 'English only' },
  { id: 'de_en', label: 'German + English' },
  { id: 'fr', label: 'French' },
  { id: 'es', label: 'Spanish' },
  { id: 'other', label: 'Other' },
] as const satisfies readonly ChipOption[];

const DEADLINE_OPTIONS = [
  { id: 'standard', label: 'Standard', sub: '4–8 weeks, relaxed timeline' },
  { id: 'rush', label: 'Rush', sub: '2–3 weeks (+30% surcharge)' },
  { id: 'specific', label: 'Specific date', sub: "I have a hard deadline" },
] as const satisfies readonly CardOption[];

// ── Form state ────────────────────────────────────────────────────────────────

interface ScopingForm {
  businessName: string;
  websiteUrl: string;
  pitch: string;
  audience: string[];
  audienceFreeform: string;
  vibe: string;
  pages: string[];
  integrations: string[];
  contentStatus: string;
  language: string;
  brandFiles: File[];
  referenceFiles: File[];
  colors: string;
  fonts: string;
  references: string;
  deadline: string;
  specificDate: string;
  vatId: string;
  legalName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
}

const INITIAL_FORM: ScopingForm = {
  businessName: '',
  websiteUrl: '',
  pitch: '',
  audience: [],
  audienceFreeform: '',
  vibe: '',
  pages: [],
  integrations: [],
  contentStatus: '',
  language: '',
  brandFiles: [],
  referenceFiles: [],
  colors: '',
  fonts: '',
  references: '',
  deadline: 'standard',
  specificDate: '',
  vatId: '',
  legalName: '',
  street: '',
  postalCode: '',
  city: '',
  country: 'DE',
  phone: '',
};

type PageState = 'loading' | 'not_ready' | 'already_submitted' | 'form' | 'success';

type FormErrors = Partial<Record<keyof ScopingForm, string>>;

// ── Page component ────────────────────────────────────────────────────────────

export default function PostPaymentScoping() {
  const { orderId } = useParams<{ orderId: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [form, setForm] = useState<ScopingForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const brandFilesRef = useRef<HTMLInputElement>(null);
  const refFilesRef = useRef<HTMLInputElement>(null);
  const [fileWarnings, setFileWarnings] = useState<{ brand: string[]; reference: string[] }>({
    brand: [],
    reference: [],
  });

  // Check whether this orderId is ready and not yet submitted
  useEffect(() => {
    if (!orderId) {
      setPageState('not_ready');
      return;
    }
    fetch(`/api/scoping-context?order_id=${encodeURIComponent(orderId)}`)
      .then(r => r.json() as Promise<{ ready?: boolean; alreadySubmitted?: boolean }>)
      .then(data => {
        if (!data.ready) {
          setPageState('not_ready');
        } else if (data.alreadySubmitted) {
          setPageState('already_submitted');
        } else {
          setPageState('form');
        }
      })
      .catch(() => setPageState('not_ready'));
  }, [orderId]);

  // Typed setter that also clears the corresponding field error
  function set<K extends keyof ScopingForm>(key: K) {
    return (value: ScopingForm[K]) => {
      setForm(prev => ({ ...prev, [key]: value }));
      if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
    };
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.businessName.trim()) next.businessName = 'Business name is required.';
    if (!form.pitch.trim()) next.pitch = 'One-sentence pitch is required.';
    if (form.pitch.length > 240) next.pitch = 'Keep it under 240 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleFileAdd(fileList: FileList | null, category: 'brand' | 'reference') {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const warnings: string[] = [];
    const valid: File[] = [];
    for (const file of incoming) {
      if (file.size > CLIENT_MAX_FILE_BYTES) {
        warnings.push(`"${file.name}" exceeds 10 MB and was not added.`);
      } else {
        valid.push(file);
      }
    }
    if (category === 'brand') {
      setForm(prev => ({ ...prev, brandFiles: [...prev.brandFiles, ...valid] }));
      setFileWarnings(prev => ({ ...prev, brand: warnings }));
      if (brandFilesRef.current) brandFilesRef.current.value = '';
    } else {
      setForm(prev => ({ ...prev, referenceFiles: [...prev.referenceFiles, ...valid] }));
      setFileWarnings(prev => ({ ...prev, reference: warnings }));
      if (refFilesRef.current) refFilesRef.current.value = '';
    }
  }

  function removeFile(category: 'brand' | 'reference', index: number) {
    if (category === 'brand') {
      setForm(prev => ({ ...prev, brandFiles: prev.brandFiles.filter((_, i) => i !== index) }));
    } else {
      setForm(prev => ({
        ...prev,
        referenceFiles: prev.referenceFiles.filter((_, i) => i !== index),
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    // Read all selected files to base64 — each is non-fatal; skip on error
    const attachments: Array<{ filename: string; dataBase64: string; category: string }> = [];
    for (const file of form.brandFiles) {
      try {
        const p = await fileToPayload(file);
        attachments.push({ ...p, category: 'brand' });
      } catch { /* skip */ }
    }
    for (const file of form.referenceFiles) {
      try {
        const p = await fileToPayload(file);
        attachments.push({ ...p, category: 'reference' });
      } catch { /* skip */ }
    }

    const scoping = {
      business: {
        name: form.businessName.trim(),
        website_url: form.websiteUrl.trim() || null,
        pitch: form.pitch.trim(),
      },
      audience: {
        types: form.audience,
        freeform: form.audienceFreeform.trim() || null,
      },
      vibe: form.vibe || null,
      pages: form.pages,
      integrations: form.integrations,
      content_status: form.contentStatus || null,
      language: form.language || null,
      brand: {
        colors: form.colors.trim() || null,
        fonts: form.fonts.trim() || null,
      },
      references: form.references.trim()
        ? form.references
            .trim()
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(Boolean)
        : [],
      deadline: {
        type: form.deadline,
        specific_date:
          form.deadline === 'specific' ? form.specificDate || null : null,
      },
      onboarding: {
        vat_id: form.vatId.trim() || null,
        legal_name: form.legalName.trim() || null,
        address: {
          street: form.street.trim() || null,
          postal_code: form.postalCode.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
        },
        phone: form.phone.trim() || null,
      },
    };

    try {
      const res = await fetch('/api/save-scoping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, scoping, attachments }),
      });
      if (res.ok) {
        setPageState('success');
      } else {
        const msg = await res.text().catch(() => '');
        setSubmitError(msg || 'Something went wrong — please try again.');
      }
    } catch {
      setSubmitError('Network error — check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shell styles ─────────────────────────────────────────────────────────────

  const shell = {
    style: { background: 'var(--bg)', color: 'var(--text)' } as React.CSSProperties,
  };

  // ── Non-form states ───────────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen grid place-items-center p-8" {...shell}>
        <SEO title="Project Brief" pathname="/scoping" noIndex />
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mut">
          Loading your project brief…
        </p>
      </div>
    );
  }

  if (pageState === 'not_ready') {
    return (
      <div className="min-h-screen grid place-items-center px-4 py-12" {...shell}>
        <SEO title="Project Brief" pathname="/scoping" noIndex />
        <div className="max-w-md text-center">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.28em] mb-3 text-mut"
          >
            // NOT AVAILABLE
          </div>
          <h1 className="font-display font-bold text-2xl mb-3">Form not available</h1>
          <p className="text-sm leading-relaxed text-2">
            This scoping form isn't active yet — your signature and deposit may
            still be processing, or the link may be incorrect. Check your email,
            or{' '}
            <a
              href="mailto:hello@trendivalux.com"
              style={{ color: 'var(--accent)' }}
              className="underline"
            >
              contact us
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (pageState === 'already_submitted') {
    return (
      <div className="min-h-screen grid place-items-center px-4 py-12" {...shell}>
        <SEO title="Project Brief" pathname="/scoping" noIndex />
        <div className="max-w-md text-center">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.28em] mb-3"
            style={{ color: 'var(--accent)' }}
          >
            // BRIEF RECEIVED
          </div>
          <h1 className="font-display font-bold text-3xl mb-3">
            We've got your details.
          </h1>
          <p className="text-sm leading-relaxed text-2">
            We've already received your project brief — thank you. We'll be in
            touch within 24 hours to confirm next steps.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen grid place-items-center px-4 py-12" {...shell}>
        <SEO title="Project Brief" pathname="/scoping" noIndex />
        <div className="max-w-2xl text-center">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.28em] mb-4"
            style={{ color: 'var(--accent)' }}
          >
            // BRIEF RECEIVED
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight leading-tight mb-4">
            <span
              style={{
                backgroundImage:
                  'linear-gradient(90deg, var(--accent-2), var(--accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Your project is fully scoped.
            </span>
          </h1>
          <p className="text-lg leading-relaxed text-2">
            We have everything we need. Expect a message within 24 hours with
            your project timeline and first preview.
          </p>
          {orderId && (
            <p
              className="font-mono text-[10px] uppercase tracking-[0.22em] mt-8 text-mut"
            >
              Order{' '}
              <span style={{ color: 'var(--accent)' }}>{orderId.slice(0, 8)}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────

  const inputStyle = { borderColor: 'var(--border)', color: 'var(--text)' };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 sm:py-14" {...shell}>
      <SEO title="Project Brief" pathname="/scoping" noIndex />
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2"
            style={{ color: 'var(--accent-2)' }}
          >
            // POST-PAYMENT SCOPING
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight leading-tight">
            Tell us everything.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-2">
            Fill this in once — it's everything we need to start building. The
            more detail you provide, the fewer questions we'll ask later.
          </p>
          {orderId && (
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] mt-3 text-mut">
              Order{' '}
              <span style={{ color: 'var(--accent)' }}>{orderId.slice(0, 8)}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* ── Your Business ─────────────────────────────────────────────── */}
          <SectionHeading>Your Business</SectionHeading>

          <Field label="Business name" required error={errors.businessName}>
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              placeholder="ACME GmbH"
              value={form.businessName}
              onChange={e => set('businessName')(e.target.value)}
              maxLength={200}
            />
          </Field>

          <Field label="Existing website URL" hint="Leave blank if you don't have one yet.">
            <input
              type="url"
              className={inputClass}
              style={inputStyle}
              placeholder="https://example.com"
              value={form.websiteUrl}
              onChange={e => set('websiteUrl')(e.target.value)}
            />
          </Field>

          <Field
            label="One-sentence pitch"
            hint="What you do, and for whom. Max 240 characters."
            required
            error={errors.pitch}
          >
            <textarea
              className={inputClass}
              style={{ ...inputStyle, resize: 'none' }}
              rows={2}
              placeholder="We help freelance architects close more projects with AI-powered proposal tools."
              value={form.pitch}
              onChange={e => set('pitch')(e.target.value)}
              maxLength={240}
            />
            <div
              className="text-[10px] text-right"
              style={{
                color: form.pitch.length > 220 ? 'var(--accent-2)' : 'var(--text-2)',
              }}
            >
              {form.pitch.length}/240
            </div>
          </Field>

          {/* ── Audience ──────────────────────────────────────────────────── */}
          <SectionHeading>Target Audience</SectionHeading>

          <Field label="Who is your customer?" hint="Select all that apply.">
            <ChipGroup
              options={AUDIENCE_OPTIONS}
              selected={form.audience}
              onChange={set('audience')}
            />
          </Field>

          <Field label="Additional audience detail" hint="Optional — e.g. age range, geography, niche.">
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              placeholder="25–45 y.o. founders in DACH region"
              value={form.audienceFreeform}
              onChange={e => set('audienceFreeform')(e.target.value)}
              maxLength={300}
            />
          </Field>

          {/* ── Visual direction ──────────────────────────────────────────── */}
          <SectionHeading>Visual Direction</SectionHeading>

          <Field label="Pick the vibe closest to your brand">
            <CardSelect
              options={VIBE_OPTIONS}
              selected={form.vibe}
              onChange={set('vibe')}
            />
          </Field>

          {/* ── Pages ─────────────────────────────────────────────────────── */}
          <SectionHeading>Pages</SectionHeading>

          <Field label="Which pages do you need?" hint="Select everything you want in scope.">
            <ChipGroup
              options={PAGE_OPTIONS}
              selected={form.pages}
              onChange={set('pages')}
            />
          </Field>

          {/* ── Integrations ──────────────────────────────────────────────── */}
          <SectionHeading>Integrations</SectionHeading>

          <Field label="Third-party tools to connect" hint="Select all that apply.">
            <ChipGroup
              options={INTEGRATION_OPTIONS}
              selected={form.integrations}
              onChange={set('integrations')}
            />
          </Field>

          {/* ── Content status ────────────────────────────────────────────── */}
          <SectionHeading>Content Status</SectionHeading>

          <Field label="Where are you with copy and images?">
            <CardSelect
              options={CONTENT_OPTIONS}
              selected={form.contentStatus}
              onChange={set('contentStatus')}
            />
          </Field>

          {/* ── Languages ─────────────────────────────────────────────────── */}
          <SectionHeading>Languages</SectionHeading>

          <Field label="Site language(s)">
            <ChipGroup
              options={LANGUAGE_OPTIONS}
              selected={form.language ? [form.language] : []}
              onChange={v => set('language')(v[v.length - 1] ?? '')}
              multiselect={false}
            />
          </Field>

          {/* ── Brand assets ──────────────────────────────────────────────── */}
          <SectionHeading>Brand Assets</SectionHeading>

          <Field
            label="Logo &amp; brand files"
            hint="Upload your logo and any other brand files (images, PDF). Max 10 MB per file."
          >
            {fileWarnings.brand.length > 0 && (
              <ul className="flex flex-col gap-0.5 mb-2">
                {fileWarnings.brand.map((w, i) => (
                  <li key={i} className="text-[11px]" style={{ color: 'var(--accent-2)' }}>
                    {w}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => brandFilesRef.current?.click()}
              className="px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-[0.14em] transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-2)',
                background: 'var(--surface)',
              }}
            >
              Add brand files
            </button>
            <input
              ref={brandFilesRef}
              type="file"
              accept={BRAND_ACCEPT}
              multiple
              className="hidden"
              onChange={e => handleFileAdd(e.target.files, 'brand')}
            />
            <AttachmentList
              files={form.brandFiles}
              onRemove={i => removeFile('brand', i)}
            />
          </Field>

          <Field label="Brand colors" hint="Hex codes, one per line or comma-separated.">
            <textarea
              className={inputClass}
              style={{ ...inputStyle, resize: 'none' }}
              rows={2}
              placeholder="#0A0A0F, #00E5D4, #FF0080"
              value={form.colors}
              onChange={e => set('colors')(e.target.value)}
              maxLength={400}
            />
          </Field>

          <Field label="Brand fonts" hint="Font names you use or want to use.">
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              placeholder="Inter, JetBrains Mono"
              value={form.fonts}
              onChange={e => set('fonts')(e.target.value)}
              maxLength={200}
            />
          </Field>

          {/* ── Reference sites ───────────────────────────────────────────── */}
          <SectionHeading>Reference Sites</SectionHeading>

          <Field label="Sites you love" hint="One URL per line. Share up to 10.">
            <textarea
              className={inputClass}
              style={{ ...inputStyle, resize: 'none' }}
              rows={4}
              placeholder={'https://linear.app\nhttps://stripe.com\nhttps://vercel.com'}
              value={form.references}
              onChange={e => set('references')(e.target.value)}
              maxLength={2000}
            />
          </Field>

          <Field
            label="Reference files"
            hint="Moodboards, screenshots, PDFs, decks — anything that shows what you like. Max 10 MB per file."
          >
            {fileWarnings.reference.length > 0 && (
              <ul className="flex flex-col gap-0.5 mb-2">
                {fileWarnings.reference.map((w, i) => (
                  <li key={i} className="text-[11px]" style={{ color: 'var(--accent-2)' }}>
                    {w}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => refFilesRef.current?.click()}
              className="px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-[0.14em] transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-2)',
                background: 'var(--surface)',
              }}
            >
              Add reference files
            </button>
            <input
              ref={refFilesRef}
              type="file"
              accept={REFERENCE_ACCEPT}
              multiple
              className="hidden"
              onChange={e => handleFileAdd(e.target.files, 'reference')}
            />
            <AttachmentList
              files={form.referenceFiles}
              onRemove={i => removeFile('reference', i)}
            />
          </Field>

          {/* ── Timeline ──────────────────────────────────────────────────── */}
          <SectionHeading>Timeline</SectionHeading>

          <Field label="Delivery timeline">
            <CardSelect
              options={DEADLINE_OPTIONS}
              selected={form.deadline}
              onChange={set('deadline')}
            />
          </Field>

          {form.deadline === 'specific' && (
            <Field label="Target date" required>
              <input
                type="date"
                className={inputClass}
                style={inputStyle}
                value={form.specificDate}
                onChange={e => set('specificDate')(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </Field>
          )}

          {/* ── Billing & onboarding ──────────────────────────────────────── */}
          <SectionHeading>Billing &amp; Onboarding</SectionHeading>
          <p className="text-xs -mt-3 text-2">
            Required for invoicing and legal documentation. All fields are optional
            unless your service agreement states otherwise.
          </p>

          <Field label="VAT ID / USt-IdNr" hint="B2B clients: enter your EU VAT identification number.">
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              placeholder="DE123456789"
              value={form.vatId}
              onChange={e => set('vatId')(e.target.value)}
              maxLength={30}
            />
          </Field>

          <Field label="Legal business name" hint="As it appears on your trade register or invoices.">
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              placeholder="ACME Digital GmbH"
              value={form.legalName}
              onChange={e => set('legalName')(e.target.value)}
              maxLength={200}
            />
          </Field>

          <Field label="Street address">
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              placeholder="Musterstraße 12"
              value={form.street}
              onChange={e => set('street')(e.target.value)}
              maxLength={200}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Postal code">
              <input
                type="text"
                className={inputClass}
                style={inputStyle}
                placeholder="52349"
                value={form.postalCode}
                onChange={e => set('postalCode')(e.target.value)}
                maxLength={20}
              />
            </Field>
            <Field label="City">
              <input
                type="text"
                className={inputClass}
                style={inputStyle}
                placeholder="Düren"
                value={form.city}
                onChange={e => set('city')(e.target.value)}
                maxLength={100}
              />
            </Field>
          </div>

          <Field label="Country">
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              placeholder="DE"
              value={form.country}
              onChange={e => set('country')(e.target.value)}
              maxLength={60}
            />
          </Field>

          <Field label="Phone number" hint="Optional — for quick questions during the project.">
            <input
              type="tel"
              className={inputClass}
              style={inputStyle}
              placeholder="+49 160 000 0000"
              value={form.phone}
              onChange={e => set('phone')(e.target.value)}
              maxLength={30}
            />
          </Field>

          {/* ── Submit ────────────────────────────────────────────────────── */}
          <div className="mt-2">
            {submitError && (
              <p
                className="text-sm mb-4 p-3 rounded-lg border"
                style={{
                  color: 'var(--accent-2)',
                  borderColor: 'var(--accent-2)',
                  background:
                    'color-mix(in oklab, var(--accent-2) 8%, transparent)',
                }}
              >
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-display font-bold text-base tracking-wide transition-all disabled:opacity-50"
              style={{ background: 'var(--accent-2)', color: '#fff' }}
            >
              {submitting ? 'Sending…' : 'Submit Project Brief'}
            </button>
            <p className="text-[11px] text-center mt-3 text-mut">
              No spam. Your details are only used to build your project.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToPayload(
  file: File,
): Promise<{ filename: string; dataBase64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ filename: file.name, dataBase64: reader.result as string });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
