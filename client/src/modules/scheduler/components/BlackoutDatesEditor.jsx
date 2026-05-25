import { useState } from 'react';
import { Plus, X } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// BlackoutDatesEditor — date chip picker
// ════════════════════════════════════════════════════════════════════════════
// Stores ISO YYYY-MM-DD strings. Empty slots resolved against event timezone
// downstream by the availability engine (Phase 4).
// ════════════════════════════════════════════════════════════════════════════

export default function BlackoutDatesEditor({ blackoutDates, onChange }) {
  const [draft, setDraft] = useState('');

  const add = (e) => {
    e.preventDefault();
    if (!draft || !/^\d{4}-\d{2}-\d{2}$/.test(draft)) return;
    if ((blackoutDates || []).includes(draft)) {
      setDraft('');
      return;
    }
    onChange([...(blackoutDates || []), draft].sort());
    setDraft('');
  };

  const remove = (d) => onChange((blackoutDates || []).filter((x) => x !== d));

  return (
    <div>
      <form onSubmit={add} className="flex items-center gap-2 mb-3">
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-sm rounded-md border border-border bg-background px-2 py-1.5"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition"
        >
          <Plus size={12} /> Add blackout
        </button>
      </form>
      {(!blackoutDates || blackoutDates.length === 0) ? (
        <p className="text-xs text-muted-foreground">No blackout dates configured.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {blackoutDates.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted text-foreground"
            >
              {d}
              <button
                type="button"
                onClick={() => remove(d)}
                className="hover:text-rose-500 transition"
                aria-label={`Remove ${d}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
