import { Plus, Trash2 } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// AvailabilityEditor — weekly schedule + per-day windows
// ════════════════════════════════════════════════════════════════════════════
// Controlled component. Receives `availability` as an array of
//   { dayOfWeek: 0..6, windows: [{ start: 'HH:mm', end: 'HH:mm' }] }
// and emits the same shape via `onChange`.
// ════════════════════════════════════════════════════════════════════════════

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normalizeToFullWeek(availability) {
  const map = new Map((availability || []).map((d) => [d.dayOfWeek, d.windows || []]));
  return DAYS.map((_, i) => ({
    dayOfWeek: i,
    windows: map.get(i) || [],
  }));
}

export default function AvailabilityEditor({ availability, onChange }) {
  const days = normalizeToFullWeek(availability);

  const update = (next) => {
    // Strip days with no windows so the API payload stays compact, then
    // rehydrate to a full week locally so the UI stays stable.
    const compact = next.filter((d) => d.windows.length > 0);
    onChange(compact);
  };

  const addWindow = (dayIdx) => {
    const next = days.map((d) => ({ ...d }));
    next[dayIdx] = {
      ...next[dayIdx],
      windows: [...next[dayIdx].windows, { start: '09:00', end: '17:00' }],
    };
    update(next);
  };

  const removeWindow = (dayIdx, winIdx) => {
    const next = days.map((d) => ({ ...d, windows: [...d.windows] }));
    next[dayIdx].windows.splice(winIdx, 1);
    update(next);
  };

  const updateWindow = (dayIdx, winIdx, patch) => {
    const next = days.map((d) => ({ ...d, windows: d.windows.map((w) => ({ ...w })) }));
    next[dayIdx].windows[winIdx] = { ...next[dayIdx].windows[winIdx], ...patch };
    update(next);
  };

  const copyFrom = (sourceIdx) => {
    const sourceWindows = days[sourceIdx].windows.map((w) => ({ ...w }));
    const next = days.map((d, i) => (i === sourceIdx ? d : { ...d, windows: sourceWindows.map((w) => ({ ...w })) }));
    update(next);
  };

  return (
    <div className="space-y-2">
      {days.map((d, idx) => (
        <div key={idx} className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
          <div className="w-12 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {DAYS[idx]}
          </div>
          <div className="flex-1 min-w-0">
            {d.windows.length === 0 ? (
              <button
                type="button"
                onClick={() => addWindow(idx)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <Plus size={12} /> Unavailable — add window
              </button>
            ) : (
              <div className="space-y-1.5">
                {d.windows.map((w, wIdx) => (
                  <div key={wIdx} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={w.start}
                      onChange={(e) => updateWindow(idx, wIdx, { start: e.target.value })}
                      className="text-sm rounded-md border border-border bg-background px-2 py-1 w-28"
                    />
                    <span className="text-xs text-muted-foreground">→</span>
                    <input
                      type="time"
                      value={w.end}
                      onChange={(e) => updateWindow(idx, wIdx, { end: e.target.value })}
                      className="text-sm rounded-md border border-border bg-background px-2 py-1 w-28"
                    />
                    <button
                      type="button"
                      onClick={() => removeWindow(idx, wIdx)}
                      className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition"
                      title="Remove window"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addWindow(idx)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                >
                  <Plus size={12} /> Add another window
                </button>
              </div>
            )}
          </div>
          {d.windows.length > 0 && idx < 6 && (
            <button
              type="button"
              onClick={() => copyFrom(idx)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition"
              title="Copy this day to the rest of the week"
            >
              Copy → week
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
