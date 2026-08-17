// Small labelled chip used for channel / mail-status across the Lead Capture
// screens. Unknown or unset values render a muted dash rather
// than guessing a label — several lead fields are legitimately empty on
// records imported before they existed.
export default function Chip({ map, value, fallback = '—' }) {
  const entry = map?.[value];
  if (!entry) {
    return <span className="text-xs text-slate-400">{fallback}</span>;
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${entry.cls}`}
    >
      {entry.label}
    </span>
  );
}
