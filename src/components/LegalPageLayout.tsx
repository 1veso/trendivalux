import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEO from './SEO';

type Lang = 'de' | 'en';

interface LegalPageLayoutProps {
  titleDE: string;
  titleEN?: string;
  pathname: string;
  contentDE: string;
  contentEN?: string;
  defaultLang?: Lang;
  noIndex?: boolean;
}

const stripFirstHeading = (md: string): string => {
  const lines = md.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i < lines.length && lines[i].trim().startsWith('#')) {
    lines.splice(i, 1);
    while (i < lines.length && lines[i].trim() === '') {
      lines.splice(i, 1);
    }
  }
  return lines.join('\n');
};

const markdownComponents = {
  h1: ({ children }: any) => (
    <h2 className="font-display font-bold text-1 text-2xl md:text-3xl tracking-tight mt-10 mb-4">
      {children}
    </h2>
  ),
  h2: ({ children }: any) => (
    <h2 className="font-display font-bold text-1 text-xl md:text-2xl tracking-tight mt-9 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="font-display font-bold text-1 text-lg md:text-xl mt-7 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="font-display font-semibold text-1 text-base mt-5 mb-2">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="text-2 text-sm md:text-base leading-relaxed my-3">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="text-2 text-sm md:text-base leading-relaxed list-disc pl-6 my-3 space-y-1.5">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="text-2 text-sm md:text-base leading-relaxed list-decimal pl-6 my-3 space-y-1.5">
      {children}
    </ol>
  ),
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }: any) => {
    const isExternal = !!href && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="accent underline-offset-2 hover:underline transition break-words"
        style={{ color: 'var(--accent)', wordBreak: 'break-word' }}
      >
        {children}
      </a>
    );
  },
  strong: ({ children }: any) => <strong className="text-1 font-semibold">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  hr: () => (
    <hr
      className="my-8 border-0 h-px"
      style={{ background: 'var(--border)' }}
    />
  ),
  blockquote: ({ children }: any) => (
    <blockquote
      className="my-4 pl-4 border-l-2 italic text-2"
      style={{ borderColor: 'var(--accent)' }}
    >
      {children}
    </blockquote>
  ),
  code: ({ inline, children }: any) =>
    inline ? (
      <code
        className="px-1.5 py-0.5 rounded font-mono text-xs"
        style={{ background: 'var(--surface-2)', color: 'var(--accent)' }}
      >
        {children}
      </code>
    ) : (
      <pre
        className="my-4 p-4 rounded-lg font-mono text-xs overflow-x-auto"
        style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
      >
        <code>{children}</code>
      </pre>
    ),
  table: ({ children }: any) => (
    <div className="my-5 overflow-x-auto">
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
  td: ({ children }: any) => (
    <td className="px-3 py-2 align-top text-2">{children}</td>
  ),
};

export default function LegalPageLayout({
  titleDE,
  titleEN,
  pathname,
  contentDE,
  contentEN,
  defaultLang = 'de',
  noIndex,
}: LegalPageLayoutProps) {
  const hasToggle = !!contentEN;
  const [lang, setLang] = useState<Lang>(defaultLang);

  const currentTitle = lang === 'en' && titleEN ? titleEN : titleDE;
  const rawContent = lang === 'en' && contentEN ? contentEN : contentDE;
  const currentContent = stripFirstHeading(rawContent);
  const backLabel = lang === 'en' ? '← Back to home' : '← Zurück zur Startseite';

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <SEO title={currentTitle} pathname={pathname} noIndex={noIndex} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-16 md:py-24">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            to="/"
            className="inline-flex items-center min-h-[44px] font-mono text-[10px] uppercase tracking-[0.24em] sm:tracking-[0.28em] text-mut hover:opacity-70 transition"
          >
            {backLabel}
          </Link>

          {hasToggle && (
            <div
              className="inline-flex items-center rounded-full border p-0.5"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface-2)',
              }}
              role="tablist"
              aria-label="Language"
            >
              {(['de', 'en'] as const).map((l) => {
                const active = lang === l;
                return (
                  <button
                    key={l}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setLang(l)}
                    className="inline-flex items-center justify-center min-h-[36px] px-3.5 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.22em] transition"
                    style={{
                      background: active
                        ? 'color-mix(in oklab, var(--accent) 18%, transparent)'
                        : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-2)',
                      boxShadow: active ? '0 0 0 1px var(--accent) inset' : 'none',
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <header className="mb-8 sm:mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] accent-2">
            // LEGAL
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight mt-2 break-words">
            {currentTitle}
          </h1>
        </header>

        <article className="legal-content break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {currentContent}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
