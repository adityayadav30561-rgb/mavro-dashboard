import { cn } from '@/lib/utils';

/**
 * Hand-written empty state — Caveat annotation + hand-drawn arrow pointing at
 * the action, on-theme with the Paper Ledger. Use instead of icon+text blocks.
 *
 * <EmptyState note="nothing logged this month" hint="add your first entry" onAction={openAdd} actionLabel="Add entry" />
 * Compact mode = single-line annotation (for table empties).
 */
function HandArrow({ className }) {
  return (
    <svg viewBox="0 0 80 40" className={cn('w-12 h-6', className)} fill="none" aria-hidden>
      <path
        d="M6 8 C 26 30, 48 34, 68 22 M68 22 l-9 -1.5 M68 22 l-4 8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

export default function EmptyState({ note, hint, actionLabel, onAction, compact = false, className }) {
  if (compact) {
    return (
      <p className={cn('font-hand text-[17px] text-muted-foreground/80 text-center', className)}>
        {note}
      </p>
    );
  }
  return (
    <div className={cn('py-8 px-6 flex flex-col items-center text-center', className)}>
      <p className="font-hand text-[22px] leading-snug text-muted-foreground">{note}</p>
      {hint && (
        <div className="flex items-center gap-1.5 mt-1 text-primary">
          <p className="font-hand text-[19px]">{hint}</p>
          <HandArrow />
        </div>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
