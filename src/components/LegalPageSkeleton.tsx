export const LegalPageSkeleton = () => (
  <div
    className="min-h-screen grid place-items-center px-4"
    style={{ background: 'var(--bg)', color: 'var(--text)' }}
  >
    <div className="flex flex-col items-center gap-3">
      <span
        className="inline-block w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'color-mix(in oklab, var(--accent) 65%, transparent)', borderTopColor: 'transparent' }}
        aria-hidden="true"
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mut">
        Lade… / Loading…
      </span>
    </div>
  </div>
);

export default LegalPageSkeleton;
