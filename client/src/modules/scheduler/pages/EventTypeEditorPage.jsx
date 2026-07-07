import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Clock, MapPin, Calendar as CalendarIcon, FileText, Users, ShieldCheck, EyeOff,
} from 'lucide-react';
import { GlassCard } from '@/components/cyber/GlassCard';
import { getWebsites } from '@/api/websites';
import {
  getEventType,
  createEventType,
  updateEventType,
} from '../api/scheduler';
import AvailabilityEditor from '../components/AvailabilityEditor';
import BlackoutDatesEditor from '../components/BlackoutDatesEditor';
import FormQuestionsEditor from '../components/FormQuestionsEditor';

// ════════════════════════════════════════════════════════════════════════════
// EventTypeEditorPage — create + edit event types
// ════════════════════════════════════════════════════════════════════════════
// One page, sectioned. We split into Tabs to keep the form scannable while
// the schema is large (Core / Schedule / Booking rules / Intake form / Team).
// ════════════════════════════════════════════════════════════════════════════

const COLOR_OPTIONS = ['violet', 'cyan', 'emerald', 'amber', 'rose', 'blue', 'pink', 'slate'];
const COMMON_TIMEZONES = [
  'UTC', 'Asia/Kolkata', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney',
];

const TABS = [
  { id: 'core',  label: 'Core',          icon: FileText },
  { id: 'sched', label: 'Schedule',      icon: CalendarIcon },
  { id: 'rules', label: 'Booking rules', icon: ShieldCheck },
  { id: 'form',  label: 'Intake form',   icon: FileText },
  { id: 'team',  label: 'Team (beta)',   icon: Users },
];

const EMPTY = {
  tenant: '',
  name: '',
  description: '',
  color: 'violet',
  durationMinutes: 30,
  locationType: 'google_meet',
  locationValue: '',
  timezone: 'UTC',
  availability: [],
  overrideDates: [],
  blackoutDates: [],
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  minNoticeHours: 4,
  dailyCap: null,
  rollingWindowDays: 60,
  slotIncrementMinutes: 30,
  requireConfirmation: false,
  allowReschedule: true,
  allowCancellation: true,
  cancellationWindowHours: 4,
  isActive: true,
  isPublic: true,
  internalOnly: false,
  isTeamEvent: false,
  hostSelectionStrategy: null,
  teamMembers: [],
};

export default function EventTypeEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [tab, setTab] = useState('core');
  const [form, setForm] = useState(EMPTY);
  const [questions, setQuestions] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    (async () => {
      try {
        const wRes = await getWebsites({ limit: 100 });
        const list = wRes.data.data.websites || [];
        setWebsites(list);
        if (isNew && list.length && !form.tenant) {
          update({ tenant: list[0]._id });
        }
        if (!isNew) {
          const res = await getEventType(id);
          const ev = res.data.eventType;
          setForm({
            ...EMPTY,
            ...ev,
            tenant: ev.tenant?._id || ev.tenant,
            owner: ev.owner?._id || ev.owner,
          });
          setQuestions(res.data.questions || []);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load editor');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    if (!form.name?.trim()) return toast.error('Name is required');
    if (!form.tenant) return toast.error('Tenant is required');
    if (!form.durationMinutes) return toast.error('Duration is required');
    setSaving(true);
    try {
      if (isNew) {
        const res = await createEventType(form);
        toast.success('Event type created');
        navigate(`/scheduler/event-types/${res.data.eventType._id}/edit`, { replace: true });
      } else {
        await updateEventType(id, form);
        toast.success('Saved');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading event type…</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/scheduler/event-types')}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition"
      >
        <ArrowLeft size={12} /> All event types
      </button>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
            {isNew ? 'New event type' : 'Edit event type'}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
            {form.name || 'Untitled event'}
          </h1>
          {!isNew && (
            <p className="text-xs text-muted-foreground mt-1">
              Slug: <code className="text-foreground">{form.slug}</code>
              {!form.isActive && <span className="ml-2 text-amber-500">· Inactive</span>}
              {form.internalOnly && <span className="ml-2 text-muted-foreground"><EyeOff size={11} className="inline" /> Internal</span>}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition"
        >
          <Save size={14} /> {saving ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm transition border-b-2 -mb-px ${
                active
                  ? 'border-brand-500 text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'core' && <CoreTab form={form} update={update} websites={websites} isNew={isNew} />}
      {tab === 'sched' && <ScheduleTab form={form} update={update} />}
      {tab === 'rules' && <RulesTab form={form} update={update} />}
      {tab === 'form' && (
        <GlassCard className="p-5">
          <h2 className="text-base font-semibold mb-1">Intake questions</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Asked during the booking flow in addition to name, email, and timezone.
          </p>
          <FormQuestionsEditor eventTypeId={id} questions={questions} onChange={setQuestions} />
        </GlassCard>
      )}
      {tab === 'team' && <TeamTab form={form} update={update} />}
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

function NumberInput({ value, onChange, min = 0, max = 9999, step = 1 }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5"
    />
  );
}

function CoreTab({ form, update, websites, isNew }) {
  return (
    <GlassCard className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name" hint="Shown to invitees on the booking page.">
          <input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5"
            placeholder="30-min Discovery Call"
          />
        </Field>
        <Field label="Tenant" hint={isNew ? '' : 'Tenant cannot be changed after creation.'}>
          <select
            value={form.tenant}
            onChange={(e) => update({ tenant: e.target.value })}
            disabled={!isNew}
            className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5 disabled:opacity-60"
          >
            <option value="" disabled>Choose tenant…</option>
            {websites.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Duration (minutes)">
          <NumberInput
            value={form.durationMinutes}
            onChange={(v) => update({ durationMinutes: v })}
            min={5}
            max={1440}
            step={5}
          />
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-1.5">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update({ color: c })}
                aria-label={c}
                className={`w-6 h-6 rounded-full border-2 transition ${form.color === c ? 'border-foreground' : 'border-transparent'}`}
                style={{ backgroundColor: dotFor(c) }}
              />
            ))}
          </div>
        </Field>
        <Field label="Description" hint="Markdown supported on the public booking page.">
          <textarea
            value={form.description || ''}
            onChange={(e) => update({ description: e.target.value })}
            rows={3}
            className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5"
            placeholder="What this meeting is about, what to prep, etc."
          />
        </Field>
        <Field label="Location">
          <div className="space-y-1.5">
            <select
              value={form.locationType}
              onChange={(e) => update({ locationType: e.target.value, locationValue: '' })}
              className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5"
            >
              <option value="google_meet">Google Meet (auto-generated)</option>
              <option value="phone">Phone call</option>
              <option value="in_person">In person</option>
              <option value="custom">Custom link / location</option>
            </select>
            {form.locationType !== 'google_meet' && (
              <input
                value={form.locationValue || ''}
                onChange={(e) => update({ locationValue: e.target.value })}
                placeholder={
                  form.locationType === 'phone'
                    ? '+1 555 0100'
                    : form.locationType === 'in_person'
                    ? '123 Office St, Floor 4'
                    : 'https://meet.example.com/abc'
                }
                className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5"
              />
            )}
          </div>
        </Field>
        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          <Toggle label="Active" value={form.isActive} onChange={(v) => update({ isActive: v })} />
          <Toggle label="Public" value={form.isPublic} onChange={(v) => update({ isPublic: v })} />
          <Toggle label="Internal only" value={form.internalOnly} onChange={(v) => update({ internalOnly: v })} />
        </div>
      </div>
    </GlassCard>
  );
}

function ScheduleTab({ form, update }) {
  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <h2 className="text-base font-semibold mb-1">Timezone + slot grid</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Availability windows below are stored in this timezone. Invitees see slots converted to their own zone.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Host timezone">
            <select
              value={form.timezone}
              onChange={(e) => update({ timezone: e.target.value })}
              className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
              {!COMMON_TIMEZONES.includes(form.timezone) && (
                <option value={form.timezone}>{form.timezone}</option>
              )}
            </select>
          </Field>
          <Field label="Slot increment (min)" hint="Slot grid step on the booking page.">
            <NumberInput
              value={form.slotIncrementMinutes}
              onChange={(v) => update({ slotIncrementMinutes: v })}
              min={5}
              max={240}
              step={5}
            />
          </Field>
          <Field label="Rolling window (days)" hint="How far ahead invitees can book.">
            <NumberInput
              value={form.rollingWindowDays}
              onChange={(v) => update({ rollingWindowDays: v })}
              min={1}
              max={365}
            />
          </Field>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="text-base font-semibold mb-1">Weekly availability</h2>
        <p className="text-xs text-muted-foreground mb-3">
          When you're available to take meetings, in <strong>{form.timezone}</strong>.
        </p>
        <AvailabilityEditor
          availability={form.availability}
          onChange={(v) => update({ availability: v })}
        />
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="text-base font-semibold mb-1">Blackout dates</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Days the event type is unavailable regardless of weekly availability.
        </p>
        <BlackoutDatesEditor
          blackoutDates={form.blackoutDates}
          onChange={(v) => update({ blackoutDates: v })}
        />
      </GlassCard>
    </div>
  );
}

function RulesTab({ form, update }) {
  return (
    <GlassCard className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Buffer before (min)">
          <NumberInput value={form.bufferBeforeMinutes} onChange={(v) => update({ bufferBeforeMinutes: v })} max={240} step={5} />
        </Field>
        <Field label="Buffer after (min)">
          <NumberInput value={form.bufferAfterMinutes} onChange={(v) => update({ bufferAfterMinutes: v })} max={240} step={5} />
        </Field>
        <Field label="Min notice (hours)" hint="Earliest a slot can be booked relative to now.">
          <NumberInput value={form.minNoticeHours} onChange={(v) => update({ minNoticeHours: v })} max={720} />
        </Field>
        <Field label="Daily cap" hint="Max bookings per day. Leave blank for unlimited.">
          <NumberInput value={form.dailyCap} onChange={(v) => update({ dailyCap: v })} max={999} />
        </Field>
        <Field label="Cancellation window (hours)" hint="Invitees can self-cancel up to this many hours before start.">
          <NumberInput value={form.cancellationWindowHours} onChange={(v) => update({ cancellationWindowHours: v })} max={720} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Toggle label="Require confirmation" value={form.requireConfirmation} onChange={(v) => update({ requireConfirmation: v })} />
          <Toggle label="Allow reschedule" value={form.allowReschedule} onChange={(v) => update({ allowReschedule: v })} />
          <Toggle label="Allow cancellation" value={form.allowCancellation} onChange={(v) => update({ allowCancellation: v })} />
        </div>
      </div>
    </GlassCard>
  );
}

function TeamTab({ form, update }) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs text-muted-foreground mb-4">
        Team scheduling foundation. Selection strategy + team members persist now; the routing logic ships with the availability engine in Phase 4.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Toggle label="Team event" value={form.isTeamEvent} onChange={(v) => update({ isTeamEvent: v })} />
        <Field label="Host selection strategy">
          <select
            value={form.hostSelectionStrategy || ''}
            onChange={(e) => update({ hostSelectionStrategy: e.target.value || null })}
            disabled={!form.isTeamEvent}
            className="w-full text-sm rounded-md border border-border bg-background px-2 py-1.5 disabled:opacity-60"
          >
            <option value="">(none)</option>
            <option value="round_robin">Round robin</option>
            <option value="collective">Collective (all attend)</option>
            <option value="load_balanced">Load balanced</option>
            <option value="manual">Manual assignment</option>
          </select>
        </Field>
      </div>
    </GlassCard>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-border"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function dotFor(color) {
  const map = {
    violet: '#c2431f', cyan: '#2f7a88', emerald: '#5f7a34', amber: '#bc8425',
    rose: '#b23a4e', blue: '#3b82f6', pink: '#c95a6c', slate: '#64748b',
  };
  return map[color] || '#c2431f';
}
