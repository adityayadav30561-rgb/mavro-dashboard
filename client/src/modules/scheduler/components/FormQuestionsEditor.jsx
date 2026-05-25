import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createFormQuestion,
  updateFormQuestion,
  deleteFormQuestion,
  reorderFormQuestions,
} from '../api/scheduler';

// ════════════════════════════════════════════════════════════════════════════
// FormQuestionsEditor — intake form builder
// ════════════════════════════════════════════════════════════════════════════
// Lives inside the EventTypeEditor. Persists changes immediately via the
// nested /event-types/:id/questions API so the editor can stay split between
// "form" and "rest of config".
// ════════════════════════════════════════════════════════════════════════════

const TYPES = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'select', label: 'Select (single)' },
  { value: 'multi_select', label: 'Select (multi)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'number', label: 'Number' },
  { value: 'url', label: 'URL' },
];

const HAS_OPTIONS = (t) => t === 'select' || t === 'multi_select';

export default function FormQuestionsEditor({ eventTypeId, questions, onChange }) {
  const [busy, setBusy] = useState(false);

  const refresh = (next) => onChange(next);

  const handleCreate = async () => {
    setBusy(true);
    try {
      const res = await createFormQuestion(eventTypeId, {
        label: 'New question',
        type: 'short_text',
        isRequired: false,
      });
      refresh([...(questions || []), res.data.question]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create question');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (id, patch) => {
    const optimistic = (questions || []).map((q) => (q._id === id ? { ...q, ...patch } : q));
    refresh(optimistic);
    try {
      await updateFormQuestion(eventTypeId, id, patch);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    const optimistic = (questions || []).filter((q) => q._id !== id);
    refresh(optimistic);
    try {
      await deleteFormQuestion(eventTypeId, id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleMove = async (id, dir) => {
    const arr = [...(questions || [])];
    const idx = arr.findIndex((q) => q._id === id);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= arr.length) return;
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    refresh(arr);
    try {
      await reorderFormQuestions(eventTypeId, arr.map((q) => q._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reorder failed');
    }
  };

  if (!eventTypeId) {
    return (
      <p className="text-sm text-muted-foreground">
        Save the event type first — then add intake questions here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {(questions || []).map((q, idx) => (
        <div key={q._id} className="rounded-lg border border-border/60 p-3">
          <div className="flex items-start gap-2">
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => handleMove(q._id, -1)}
                disabled={idx === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition"
                title="Move up"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleMove(q._id, 1)}
                disabled={idx === questions.length - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition"
                title="Move down"
              >
                <ChevronDown size={12} />
              </button>
            </div>
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={q.label}
                onChange={(e) => handleUpdate(q._id, { label: e.target.value })}
                placeholder="Question label"
                className="text-sm rounded-md border border-border bg-background px-2 py-1.5"
              />
              <select
                value={q.type}
                onChange={(e) => {
                  const nextType = e.target.value;
                  const patch = { type: nextType };
                  // Clear options when switching away from select types
                  if (!HAS_OPTIONS(nextType)) patch.options = [];
                  handleUpdate(q._id, patch);
                }}
                className="text-sm rounded-md border border-border bg-background px-2 py-1.5"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                value={q.placeholder || ''}
                onChange={(e) => handleUpdate(q._id, { placeholder: e.target.value })}
                placeholder="Placeholder (optional)"
                className="text-sm rounded-md border border-border bg-background px-2 py-1.5"
              />
              <input
                value={q.helpText || ''}
                onChange={(e) => handleUpdate(q._id, { helpText: e.target.value })}
                placeholder="Help text (optional)"
                className="text-sm rounded-md border border-border bg-background px-2 py-1.5"
              />
              {HAS_OPTIONS(q.type) && (
                <textarea
                  value={(q.options || []).join('\n')}
                  onChange={(e) =>
                    handleUpdate(q._id, {
                      options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="One option per line"
                  className="md:col-span-2 text-sm rounded-md border border-border bg-background px-2 py-1.5 min-h-[80px]"
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5 items-end">
              <label className="inline-flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={!!q.isRequired}
                  onChange={(e) => handleUpdate(q._id, { isRequired: e.target.checked })}
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => handleDelete(q._id)}
                className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleCreate}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition disabled:opacity-50"
      >
        <Plus size={12} /> Add question
      </button>
    </div>
  );
}
