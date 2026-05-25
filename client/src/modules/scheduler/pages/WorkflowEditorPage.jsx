import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Zap, Plus, Trash2, ChevronUp, ChevronDown, Save, Settings, Pause, Play,
} from 'lucide-react';
import { GlassCard } from '@/components/cyber/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { getWebsites } from '@/api/websites';
import {
  listWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  listEventTypes,
} from '../api/scheduler';

// ════════════════════════════════════════════════════════════════════════════
// WorkflowEditorPage — admin automation editor
// ════════════════════════════════════════════════════════════════════════════
// One page, two panes:
//   Left:  list of workflows (per tenant)
//   Right: editor for the selected workflow
// Persists each save explicitly — no auto-save (prevents accidental fan-out).
// ════════════════════════════════════════════════════════════════════════════

const TRIGGERS = [
  { value: 'booking_created',     label: 'When a booking is created' },
  { value: 'booking_cancelled',   label: 'When a booking is cancelled' },
  { value: 'booking_rescheduled', label: 'When a booking is rescheduled' },
  { value: 'before_meeting',      label: 'Before meeting (offset)' },
  { value: 'after_meeting',       label: 'After meeting (offset)' },
];

const STEP_TYPES = [
  { value: 'send_email', label: 'Send email' },
  { value: 'send_sms',   label: 'Send SMS' },
  { value: 'send_slack', label: 'Post to Slack' },
  { value: 'wait',       label: 'Wait' },
  { value: 'webhook',    label: 'Webhook (POST)' },
];

const STATUS_TONE = {
  draft:    { tone: 'slate',  label: 'Draft' },
  active:   { tone: 'emerald', label: 'Active' },
  paused:   { tone: 'amber',  label: 'Paused' },
  archived: { tone: 'rose',   label: 'Archived' },
};

function emptyWorkflow(tenantId) {
  return {
    tenant: tenantId,
    name: 'New workflow',
    description: '',
    trigger: 'booking_created',
    triggerOffsetMinutes: 0,
    eventType: null,
    status: 'draft',
    actions: [],
  };
}

export default function WorkflowEditorPage() {
  const [workflows, setWorkflows] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [tenantFilter, setTenantFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null); // currently-edited workflow (deep copy)
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tenantFilter !== 'all') params.tenant = tenantFilter;
      const [wfRes, evRes, wsRes] = await Promise.all([
        listWorkflows(params),
        eventTypes.length ? Promise.resolve(null) : listEventTypes(),
        websites.length ? Promise.resolve(null) : getWebsites({ limit: 100 }),
      ]);
      setWorkflows(wfRes.data.workflows || []);
      if (evRes) setEventTypes(evRes.data.eventTypes || []);
      if (wsRes) setWebsites(wsRes.data.data.websites || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tenantFilter]);

  const handleCreate = () => {
    const tenant = tenantFilter !== 'all' ? tenantFilter : (websites[0] && websites[0]._id);
    if (!tenant) { toast.error('Pick a tenant first'); return; }
    setDraft(emptyWorkflow(tenant));
    setDirty(true);
  };

  const handleSelect = (wf) => {
    setDraft({ ...wf, tenant: wf.tenant?._id || wf.tenant, eventType: wf.eventType?._id || wf.eventType || null });
    setDirty(false);
  };

  const update = (patch) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      if (draft._id) {
        const res = await updateWorkflow(draft._id, draft);
        toast.success('Saved');
        const wf = res.data.workflow;
        setDraft({ ...wf, tenant: wf.tenant?._id || wf.tenant, eventType: wf.eventType?._id || wf.eventType || null });
      } else {
        const res = await createWorkflow(draft);
        toast.success('Workflow created');
        const wf = res.data.workflow;
        setDraft({ ...wf, tenant: wf.tenant?._id || wf.tenant, eventType: wf.eventType?._id || wf.eventType || null });
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
    if (!window.confirm(`Delete workflow "${draft.name}"?`)) return;
    try {
      await deleteWorkflow(draft._id);
      toast.success('Deleted');
      setDraft(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
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
            <Zap size={14} /> Scheduler · Workflows
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Workflows</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)}
            className="text-sm rounded-lg border border-border bg-background px-3 py-2">
            <option value="all">All tenants</option>
            {websites.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button type="button" onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
            <Plus size={14} /> New workflow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: list */}
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : workflows.length === 0 ? (
            <GlassCard className="p-6 text-sm text-muted-foreground text-center">
              No workflows yet. Click "New workflow" to start.
            </GlassCard>
          ) : (
            workflows.map((wf) => {
              const meta = STATUS_TONE[wf.status] || STATUS_TONE.draft;
              const active = draft?._id === wf._id;
              return (
                <button key={wf._id} type="button" onClick={() => handleSelect(wf)}
                  className={`w-full text-left rounded-xl border p-3 transition ${active ? 'border-brand-500 bg-brand-500/5' : 'border-border bg-card hover:bg-muted/30'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{wf.name}</span>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] border border-${meta.tone}-500/30 bg-${meta.tone}-500/5 text-${meta.tone}-500`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground truncate">
                    {wf.trigger} · {wf.actions?.length || 0} step{(wf.actions?.length || 0) === 1 ? '' : 's'}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: editor */}
        <div className="lg:col-span-2">
          {!draft ? (
            <GlassCard className="p-10 text-center">
              <Settings className="mx-auto mb-3 text-muted-foreground" size={32} />
              <p className="text-sm font-medium">Pick a workflow to edit, or create a new one.</p>
            </GlassCard>
          ) : (
            <GlassCard className="p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <input value={draft.name} onChange={(e) => update({ name: e.target.value })}
                  placeholder="Workflow name"
                  className="flex-1 text-base font-semibold rounded-md border border-border bg-background px-2 py-1.5" />
                <button type="button" onClick={handleDelete}
                  className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Trigger">
                  <select value={draft.trigger} onChange={(e) => update({ trigger: e.target.value })}
                    className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5">
                    {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                {(draft.trigger === 'before_meeting' || draft.trigger === 'after_meeting') && (
                  <Field label="Offset (minutes)" hint="Negative = before, positive = after the meeting time.">
                    <input type="number" value={draft.triggerOffsetMinutes ?? 0}
                      onChange={(e) => update({ triggerOffsetMinutes: Number(e.target.value) })}
                      className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5" />
                  </Field>
                )}
                <Field label="Scope" hint="Run for a specific event type, or all event types in the tenant.">
                  <select value={draft.eventType || ''} onChange={(e) => update({ eventType: e.target.value || null })}
                    className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5">
                    <option value="">All event types in tenant</option>
                    {scopedEventTypes.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={draft.status} onChange={(e) => update({ status: e.target.value })}
                    className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5">
                    {Object.entries(STATUS_TONE).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                  </select>
                </Field>
                <Field label="Description" hint="Optional — for your team's reference.">
                  <textarea value={draft.description || ''} onChange={(e) => update({ description: e.target.value })}
                    rows={2} className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5" />
                </Field>
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">Steps</div>
                <ActionsEditor actions={draft.actions || []}
                  onChange={(actions) => update({ actions })} />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                {dirty && <span className="text-[11px] text-amber-500">Unsaved changes</span>}
                <button type="button" onClick={handleSave} disabled={saving || !dirty}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition">
                  <Save size={14} /> {saving ? 'Saving…' : 'Save workflow'}
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionsEditor({ actions, onChange }) {
  const updateAt = (idx, patch) => {
    const next = actions.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    onChange(next);
  };
  const remove = (idx) => onChange(actions.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const next = [...actions];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= next.length) return;
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange(next);
  };
  const add = () => onChange([...actions, { type: 'send_email', config: {}, delayMinutes: 0, isActive: true }]);

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-xs text-muted-foreground mb-2">No steps yet.</p>
        <button type="button" onClick={add}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition">
          <Plus size={12} /> Add first step
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((a, idx) => (
        <div key={idx} className="rounded-lg border border-border p-3">
          <div className="flex items-start gap-2">
            <div className="flex flex-col">
              <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition"><ChevronUp size={12} /></button>
              <button type="button" onClick={() => move(idx, 1)} disabled={idx === actions.length - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition"><ChevronDown size={12} /></button>
            </div>
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
              <select value={a.type} onChange={(e) => updateAt(idx, { type: e.target.value, config: {} })}
                className="text-sm rounded-md border border-border bg-background px-2 py-1.5">
                {STEP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="number" value={a.delayMinutes ?? 0}
                onChange={(e) => updateAt(idx, { delayMinutes: Math.max(0, Number(e.target.value)) })}
                placeholder="Delay (minutes)"
                className="text-sm rounded-md border border-border bg-background px-2 py-1.5" />
              {a.type === 'webhook' && (
                <input value={(a.config && a.config.url) || ''}
                  onChange={(e) => updateAt(idx, { config: { ...(a.config || {}), url: e.target.value } })}
                  placeholder="https://yourservice.com/hooks/booking"
                  className="md:col-span-2 text-sm rounded-md border border-border bg-background px-2 py-1.5" />
              )}
              {a.type === 'send_email' && (
                <div className="md:col-span-2 space-y-1.5">
                  <input value={(a.config?.template?.subject) || ''}
                    onChange={(e) => updateAt(idx, { config: { ...(a.config || {}), template: { ...(a.config?.template || {}), subject: e.target.value } } })}
                    placeholder="Custom subject — leave blank for default template"
                    className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5" />
                  <textarea value={(a.config?.template?.html) || ''}
                    onChange={(e) => updateAt(idx, { config: { ...(a.config || {}), template: { ...(a.config?.template || {}), html: e.target.value } } })}
                    placeholder="HTML body — supports {{invitee.name}} {{event.name}} {{meeting.link}} {{start.local}} {{host.name}}"
                    rows={3}
                    className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5 font-mono" />
                </div>
              )}
              {a.type === 'send_sms' && (
                <div className="md:col-span-2 space-y-1.5">
                  <input value={(a.config?.to) || '{{invitee.phone}}'}
                    onChange={(e) => updateAt(idx, { config: { ...(a.config || {}), to: e.target.value } })}
                    placeholder="To — defaults to {{invitee.phone}}"
                    className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5" />
                  <input value={(a.config?.body) || ''}
                    onChange={(e) => updateAt(idx, { config: { ...(a.config || {}), body: e.target.value } })}
                    placeholder="SMS body — supports {{invitee.name}} {{event.name}} {{start.local}}"
                    className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5" />
                </div>
              )}
              {a.type === 'send_slack' && (
                <div className="md:col-span-2 space-y-1.5">
                  <input value={(a.config?.webhookUrl) || ''}
                    onChange={(e) => updateAt(idx, { config: { ...(a.config || {}), webhookUrl: e.target.value } })}
                    placeholder="Slack incoming webhook URL"
                    className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5" />
                  <input value={(a.config?.text) || ''}
                    onChange={(e) => updateAt(idx, { config: { ...(a.config || {}), text: e.target.value } })}
                    placeholder="Message text — supports {{invitee.name}} {{event.name}} {{start.local}}"
                    className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5" />
                </div>
              )}
              {a.type === 'wait' && (
                <p className="md:col-span-2 text-[11px] text-muted-foreground">
                  Delay-only step — useful for spacing subsequent actions.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 items-end">
              <label className="inline-flex items-center gap-1 text-xs">
                <input type="checkbox" checked={a.isActive !== false}
                  onChange={(e) => updateAt(idx, { isActive: e.target.checked })} />
                Active
              </label>
              <button type="button" onClick={() => remove(idx)}
                className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition" title="Delete">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition">
        <Plus size={12} /> Add step
      </button>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="block mt-1 text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
