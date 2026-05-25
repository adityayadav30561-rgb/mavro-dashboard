import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Save, ChevronUp, ChevronDown, GitBranch, Copy,
} from 'lucide-react';
import { GlassCard } from '@/components/cyber/GlassCard';
import { getWebsites } from '@/api/websites';
import {
  listRoutingForms, createRoutingForm, updateRoutingForm, deleteRoutingForm, listEventTypes,
} from '../api/scheduler';

// ════════════════════════════════════════════════════════════════════════════
// RoutingFormsPage — admin CRUD + rule editor
// ════════════════════════════════════════════════════════════════════════════

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi-select' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes / No' },
];

const RULE_OPS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
  { value: 'includes_any', label: 'includes any' },
];

function emptyForm(tenantId) {
  return {
    tenant: tenantId,
    name: 'New routing form',
    description: '',
    questions: [],
    rules: [],
    fallback: null,
    isActive: false,
  };
}

export default function RoutingFormsPage() {
  const [forms, setForms] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [tenantFilter, setTenantFilter] = useState('all');
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = tenantFilter === 'all' ? {} : { tenant: tenantFilter };
      const [fRes, eRes, wRes] = await Promise.all([
        listRoutingForms(params),
        eventTypes.length ? Promise.resolve(null) : listEventTypes(),
        websites.length ? Promise.resolve(null) : getWebsites({ limit: 100 }),
      ]);
      setForms(fRes.data.forms || []);
      if (eRes) setEventTypes(eRes.data.eventTypes || []);
      if (wRes) setWebsites(wRes.data.data.websites || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load routing forms');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tenantFilter]);

  const update = (patch) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const selectForm = (f) => {
    setDraft({ ...f, tenant: f.tenant?._id || f.tenant });
    setDirty(false);
  };
  const handleCreate = () => {
    const tenant = tenantFilter !== 'all' ? tenantFilter : (websites[0] && websites[0]._id);
    if (!tenant) { toast.error('Pick a tenant first'); return; }
    setDraft(emptyForm(tenant)); setDirty(true);
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      if (draft._id) {
        const res = await updateRoutingForm(draft._id, draft);
        toast.success('Saved');
        setDraft({ ...res.data.form, tenant: res.data.form.tenant?._id || res.data.form.tenant });
      } else {
        const res = await createRoutingForm(draft);
        toast.success('Routing form created');
        setDraft({ ...res.data.form, tenant: res.data.form.tenant?._id || res.data.form.tenant });
      }
      setDirty(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!draft?._id) { setDraft(null); return; }
    if (!window.confirm(`Archive routing form "${draft.name}"?`)) return;
    try {
      await deleteRoutingForm(draft._id);
      toast.success('Archived');
      setDraft(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };
  const handleCopySlug = () => {
    if (!draft?.slug) return;
    const url = `${window.location.origin}/route/${draft.slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Public URL copied'));
  };

  const scopedEventTypes = useMemo(() => {
    if (!draft) return [];
    return eventTypes.filter((e) => String(e.tenant?._id || e.tenant) === String(draft.tenant));
  }, [draft, eventTypes]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
            <GitBranch size={14} /> Scheduler · Routing Forms
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Routing forms</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)}
            className="text-sm rounded-lg border border-border bg-background px-3 py-2">
            <option value="all">All tenants</option>
            {websites.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button type="button" onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
            <Plus size={14} /> New form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2">
          {loading ? <div className="text-sm text-muted-foreground">Loading…</div>
            : forms.length === 0 ? (
              <GlassCard className="p-6 text-sm text-muted-foreground text-center">
                No routing forms yet.
              </GlassCard>
            ) : forms.map((f) => {
              const active = draft?._id === f._id;
              return (
                <button key={f._id} type="button" onClick={() => selectForm(f)}
                  className={`w-full text-left rounded-xl border p-3 transition ${active ? 'border-brand-500 bg-brand-500/5' : 'border-border bg-card hover:bg-muted/30'}`}>
                  <div className="text-sm font-medium truncate">{f.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground truncate">/{f.slug} · {f.questions?.length || 0} questions · {f.rules?.length || 0} rules</div>
                </button>
              );
            })}
        </div>

        <div className="lg:col-span-2">
          {!draft ? (
            <GlassCard className="p-10 text-center">
              <GitBranch className="mx-auto mb-3 text-muted-foreground" size={32} />
              <p className="text-sm font-medium">Pick a routing form to edit, or create a new one.</p>
            </GlassCard>
          ) : (
            <GlassCard className="p-5 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <input value={draft.name} onChange={(e) => update({ name: e.target.value })}
                  className="flex-1 text-base font-semibold rounded-md border border-border bg-background px-2 py-1.5" />
                {draft.slug && (
                  <button type="button" onClick={handleCopySlug}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:bg-muted transition" title="Copy public URL">
                    <Copy size={12} /> /route/{draft.slug}
                  </button>
                )}
                <button type="button" onClick={handleDelete}
                  className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>

              <textarea value={draft.description || ''} onChange={(e) => update({ description: e.target.value })}
                rows={2} placeholder="Description (optional)"
                className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5" />

              <Section title="Questions" hint="What invitees answer before booking. Use the `key` in rules.">
                <QuestionsEditor questions={draft.questions || []} onChange={(qs) => update({ questions: qs })} />
              </Section>

              <Section title="Rules" hint="First matching rule wins. Add a fallback below.">
                <RulesEditor rules={draft.rules || []}
                  questions={draft.questions || []}
                  eventTypes={scopedEventTypes}
                  onChange={(rules) => update({ rules })} />
              </Section>

              <Section title="Fallback" hint="Where to send the invitee when no rule matches.">
                <TargetEditor target={draft.fallback}
                  eventTypes={scopedEventTypes}
                  onChange={(t) => update({ fallback: t })} />
              </Section>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={draft.isActive !== false}
                    onChange={(e) => update({ isActive: e.target.checked })} />
                  Active (publicly accessible)
                </label>
                <div className="flex items-center gap-2">
                  {dirty && <span className="text-[11px] text-amber-500">Unsaved</span>}
                  <button type="button" onClick={handleSave} disabled={saving || !dirty}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition">
                    <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1">{title}</div>
      {hint && <div className="text-[11px] text-muted-foreground mb-2">{hint}</div>}
      {children}
    </div>
  );
}

function QuestionsEditor({ questions, onChange }) {
  const add = () => onChange([...questions, { key: `q${questions.length + 1}`, label: 'New question', type: 'short_text', options: [], isRequired: false, sortOrder: questions.length }]);
  const updateAt = (i, patch) => onChange(questions.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const remove = (i) => onChange(questions.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const next = [...questions];
    const ni = i + dir;
    if (ni < 0 || ni >= next.length) return;
    [next[i], next[ni]] = [next[ni], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          <div className="flex items-start gap-2">
            <div className="flex flex-col">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronUp size={12} /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === questions.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronDown size={12} /></button>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
              <input value={q.key} onChange={(e) => updateAt(i, { key: e.target.value })} placeholder="key (id used in rules)"
                className="text-sm rounded-md border border-border bg-background px-2 py-1.5" />
              <input value={q.label} onChange={(e) => updateAt(i, { label: e.target.value })} placeholder="Question label"
                className="text-sm rounded-md border border-border bg-background px-2 py-1.5" />
              <select value={q.type} onChange={(e) => updateAt(i, { type: e.target.value })}
                className="text-sm rounded-md border border-border bg-background px-2 py-1.5">
                {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <label className="inline-flex items-center gap-2 text-xs">
                <input type="checkbox" checked={!!q.isRequired} onChange={(e) => updateAt(i, { isRequired: e.target.checked })} /> Required
              </label>
              {(q.type === 'select' || q.type === 'multi_select') && (
                <textarea value={(q.options || []).join('\n')} onChange={(e) => updateAt(i, { options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="One option per line" rows={3}
                  className="md:col-span-2 text-sm rounded-md border border-border bg-background px-2 py-1.5" />
              )}
            </div>
            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition"><Trash2 size={12} /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition"><Plus size={12} /> Add question</button>
    </div>
  );
}

function RulesEditor({ rules, questions, eventTypes, onChange }) {
  const add = () => onChange([...rules, { label: '', conditions: [{ questionKey: questions[0]?.key || '', op: 'equals', value: '' }], target: { type: 'event_type', eventTypeSlug: eventTypes[0]?.slug || '' } }]);
  const updateAt = (i, patch) => onChange(rules.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const remove = (i) => onChange(rules.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {rules.map((r, i) => (
        <div key={i} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <input value={r.label || ''} onChange={(e) => updateAt(i, { label: e.target.value })} placeholder={`Rule ${i + 1} label (optional)`}
              className="flex-1 text-sm rounded-md border border-border bg-background px-2 py-1" />
            <button type="button" onClick={() => remove(i)} className="p-1 rounded-md hover:bg-rose-500/10 text-rose-500 transition"><Trash2 size={12} /></button>
          </div>
          <ConditionsEditor conditions={r.conditions || []} questions={questions}
            onChange={(conds) => updateAt(i, { conditions: conds })} />
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">→ Route to:</div>
          <TargetEditor target={r.target} eventTypes={eventTypes} onChange={(t) => updateAt(i, { target: t })} />
        </div>
      ))}
      <button type="button" onClick={add}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition"><Plus size={12} /> Add rule</button>
    </div>
  );
}

function ConditionsEditor({ conditions, questions, onChange }) {
  const add = () => onChange([...conditions, { questionKey: questions[0]?.key || '', op: 'equals', value: '' }]);
  const updateAt = (i, patch) => onChange(conditions.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const remove = (i) => onChange(conditions.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-1.5">
      {conditions.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <select value={c.questionKey} onChange={(e) => updateAt(i, { questionKey: e.target.value })}
            className="text-xs rounded-md border border-border bg-background px-2 py-1">
            <option value="" disabled>question…</option>
            {questions.map((q) => <option key={q.key} value={q.key}>{q.key}</option>)}
          </select>
          <select value={c.op} onChange={(e) => updateAt(i, { op: e.target.value })}
            className="text-xs rounded-md border border-border bg-background px-2 py-1">
            {RULE_OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input value={c.value ?? ''} onChange={(e) => updateAt(i, { value: e.target.value })}
            placeholder="value" className="flex-1 text-xs rounded-md border border-border bg-background px-2 py-1" />
          <button type="button" onClick={() => remove(i)} className="p-1 rounded hover:bg-rose-500/10 text-rose-500 transition"><Trash2 size={11} /></button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition">
        <Plus size={10} /> Add condition (AND)
      </button>
    </div>
  );
}

function TargetEditor({ target, eventTypes, onChange }) {
  const t = target || { type: 'event_type', eventTypeSlug: '' };
  return (
    <div className="flex items-center gap-2">
      <select value={t.type} onChange={(e) => onChange({ ...t, type: e.target.value })}
        className="text-xs rounded-md border border-border bg-background px-2 py-1">
        <option value="event_type">Event type</option>
        <option value="url">External URL</option>
      </select>
      {t.type === 'event_type' ? (
        <select value={t.eventTypeSlug || ''} onChange={(e) => onChange({ ...t, eventTypeSlug: e.target.value })}
          className="flex-1 text-xs rounded-md border border-border bg-background px-2 py-1">
          <option value="">(choose event type)</option>
          {eventTypes.map((e) => <option key={e._id} value={e.slug}>{e.name}</option>)}
        </select>
      ) : (
        <input value={t.url || ''} onChange={(e) => onChange({ ...t, url: e.target.value })}
          placeholder="https://..." className="flex-1 text-xs rounded-md border border-border bg-background px-2 py-1" />
      )}
    </div>
  );
}
