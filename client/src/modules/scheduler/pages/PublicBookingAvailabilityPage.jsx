import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  ChevronLeft, ChevronRight, Clock, Globe, Calendar as CalendarIcon, ArrowLeft,
  CheckCircle2, Download, ExternalLink,
} from 'lucide-react';
import {
  fetchPublicEventType,
  fetchPublicSlots,
  createPublicBooking,
  icsDownloadUrl,
} from '../api/scheduler';

// ════════════════════════════════════════════════════════════════════════════
// PublicBookingAvailabilityPage — full booking flow
// ════════════════════════════════════════════════════════════════════════════
// 3 stages:
//   slots     — date picker + slot grid
//   form      — intake fields (always: name/email/tz) + dynamic FormQuestions
//   confirmed — meeting link + add-to-calendar
// Back button on each stage rewinds.
// ════════════════════════════════════════════════════════════════════════════

function detectTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

function resolveTenantSlug(paramSlug) {
  if (paramSlug) return paramSlug;
  const target = import.meta.env.VITE_BUILD_TARGET;
  if (target && target !== 'full') return target;
  const usp = new URLSearchParams(window.location.search);
  return usp.get('tenant') || '';
}

export default function PublicBookingAvailabilityPage() {
  const { eventSlug, tenantSlug: tenantParam } = useParams();
  const tenantSlug = resolveTenantSlug(tenantParam);

  const [stage, setStage] = useState('slots');
  const [eventMeta, setEventMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [timezone, setTimezone] = useState(detectTimezone());
  const [weekOffset, setWeekOffset] = useState(0);
  const [slotsState, setSlotsState] = useState({ slots: [], loading: true, error: null });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({ inviteeName: '', inviteeEmail: '', answers: {} });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  // Range — 7-day window
  const range = useMemo(() => {
    const now = DateTime.now().setZone(timezone).startOf('day');
    const start = now.plus({ days: weekOffset * 7 });
    const end = start.plus({ days: 7 });
    return { start: start.toUTC().toJSDate(), end: end.toUTC().toJSDate() };
  }, [timezone, weekOffset]);

  // Load metadata + questions
  useEffect(() => {
    if (!tenantSlug || !eventSlug) {
      setSlotsState((s) => ({ ...s, loading: false, error: 'Missing tenant or event slug' }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const meta = await fetchPublicEventType(tenantSlug, eventSlug);
        if (cancelled) return;
        const data = meta.data || meta;
        setEventMeta(data);
        setQuestions(data.questions || []);
      } catch (err) {
        if (!cancelled) setSlotsState((s) => ({ ...s, loading: false, error: err.message }));
      }
    })();
    return () => { cancelled = true; };
  }, [tenantSlug, eventSlug]);

  // Load slots
  useEffect(() => {
    if (!tenantSlug || !eventSlug || stage !== 'slots') return;
    let cancelled = false;
    setSlotsState({ slots: [], loading: true, error: null });
    (async () => {
      try {
        const body = await fetchPublicSlots(tenantSlug, eventSlug, {
          start: range.start, end: range.end, timezone,
        });
        if (cancelled) return;
        const data = body.data || body;
        setSlotsState({ slots: data.slots || [], loading: false, error: null });
      } catch (err) {
        if (!cancelled) setSlotsState({ slots: [], loading: false, error: err.message });
      }
    })();
    return () => { cancelled = true; };
  }, [tenantSlug, eventSlug, range.start, range.end, timezone, stage]);

  const slotsByDay = useMemo(() => {
    const out = new Map();
    for (const s of slotsState.slots) {
      const dt = DateTime.fromISO(s.inviteeLocalStart).setZone(timezone);
      const key = dt.toFormat('yyyy-LL-dd');
      if (!out.has(key)) out.set(key, []);
      out.get(key).push(s);
    }
    return out;
  }, [slotsState.slots, timezone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (!formData.inviteeName.trim() || !formData.inviteeEmail.trim()) {
      setSubmitError('Name and email are required');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const answers = Object.entries(formData.answers).map(([qid, value]) => ({
        questionId: qid,
        value,
      }));
      const body = await createPublicBooking(tenantSlug, eventSlug, {
        startUtc: selectedSlot.startUtc,
        endUtc: selectedSlot.endUtc,
        hash: selectedSlot.hash,
        inviteeName: formData.inviteeName.trim(),
        inviteeEmail: formData.inviteeEmail.trim(),
        inviteeTimezone: timezone,
        formAnswers: answers,
      });
      const data = body.data || body;
      setConfirmation(data);
      setStage('confirmed');
    } catch (err) {
      if (err.code === 'SLOT_ALREADY_BOOKED' || err.code === 'SLOT_UNAVAILABLE' || err.code === 'STALE_SLOT') {
        setSubmitError(`${err.message}. Pick another slot.`);
        // Bounce back to slots so the user can try again on a fresh grid
        setTimeout(() => {
          setStage('slots');
          setSelectedSlot(null);
        }, 1500);
      } else {
        setSubmitError(err.message || 'Booking failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <Header
          eventMeta={eventMeta?.eventType}
          timezone={timezone}
          onTimezoneChange={setTimezone}
        />

        {stage === 'slots' && (
          <SlotStage
            slotsByDay={slotsByDay}
            slotsState={slotsState}
            range={range}
            timezone={timezone}
            weekOffset={weekOffset}
            onPrev={() => setWeekOffset((o) => Math.max(0, o - 1))}
            onNext={() => setWeekOffset((o) => o + 1)}
            onSelect={(s) => { setSelectedSlot(s); setStage('form'); }}
          />
        )}

        {stage === 'form' && selectedSlot && (
          <FormStage
            slot={selectedSlot}
            timezone={timezone}
            eventMeta={eventMeta?.eventType}
            questions={questions}
            formData={formData}
            setFormData={setFormData}
            submitting={submitting}
            error={submitError}
            onBack={() => { setStage('slots'); setSubmitError(null); }}
            onSubmit={handleSubmit}
          />
        )}

        {stage === 'confirmed' && confirmation && (
          <ConfirmedStage confirmation={confirmation} timezone={timezone} eventMeta={eventMeta?.eventType} />
        )}
      </div>
    </div>
  );
}

function Header({ eventMeta, timezone, onTimezoneChange }) {
  return (
    <div className="mb-8">
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium">
        Schedule a meeting
      </div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
        {eventMeta?.name || 'Loading…'}
      </h1>
      {eventMeta?.description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{eventMeta.description}</p>
      )}
      {eventMeta && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock size={12} /> {eventMeta.durationMinutes}m</span>
          <span className="inline-flex items-center gap-1"><Globe size={12} /> {timezone}</span>
          <select
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className="text-xs rounded-md border border-border bg-background px-2 py-1"
          >
            {[timezone, 'UTC', 'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Australia/Sydney']
              .filter((tz, i, arr) => arr.indexOf(tz) === i)
              .map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function SlotStage({ slotsByDay, slotsState, range, timezone, weekOffset, onPrev, onNext, onSelect }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={onPrev} disabled={weekOffset === 0}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted disabled:opacity-40 transition">
          <ChevronLeft size={12} /> Previous week
        </button>
        <div className="text-xs text-muted-foreground">
          {DateTime.fromJSDate(range.start).setZone(timezone).toFormat('LLL d')}
          {' – '}
          {DateTime.fromJSDate(range.end).setZone(timezone).minus({ days: 1 }).toFormat('LLL d, yyyy')}
        </div>
        <button type="button" onClick={onNext}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition">
          Next week <ChevronRight size={12} />
        </button>
      </div>

      {slotsState.loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading available slots…
        </div>
      ) : slotsState.error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-500">
          {slotsState.error}
        </div>
      ) : slotsByDay.size === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <CalendarIcon className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-base font-medium">No availability this week</p>
          <p className="text-sm text-muted-foreground mt-1">Try the next week.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(slotsByDay.entries()).map(([dateKey, slots]) => (
            <DayColumn key={dateKey} dateKey={dateKey} slots={slots} timezone={timezone} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function DayColumn({ dateKey, slots, timezone, onSelect }) {
  const dt = DateTime.fromISO(dateKey, { zone: timezone });
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{dt.toFormat('cccc')}</div>
      <div className="text-base font-semibold mt-0.5">{dt.toFormat('LLL d')}</div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {slots.map((s) => (
          <button key={s.hash} type="button" onClick={() => onSelect(s)}
            className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-[12.5px] hover:border-brand-500 hover:text-brand-500 transition">
            {DateTime.fromISO(s.inviteeLocalStart).setZone(timezone).toFormat('h:mm a')}
          </button>
        ))}
      </div>
    </div>
  );
}

function FormStage({ slot, timezone, eventMeta, questions, formData, setFormData, submitting, error, onBack, onSubmit }) {
  const slotLabel = DateTime.fromISO(slot.inviteeLocalStart).setZone(timezone).toFormat('cccc, LLL d · h:mm a');
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 md:p-8 max-w-2xl mx-auto">
      <button type="button" onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition">
        <ArrowLeft size={12} /> Back to slots
      </button>
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">Confirm your details</div>
      <h2 className="text-xl font-semibold mt-1">{slotLabel}</h2>
      <p className="text-xs text-muted-foreground mt-1">{eventMeta?.durationMinutes}m · {timezone}</p>

      <div className="mt-6 space-y-4">
        <Field label="Your name" required>
          <input value={formData.inviteeName} onChange={(e) => setFormData({ ...formData, inviteeName: e.target.value })}
            className="w-full text-sm rounded-md border border-border bg-background px-3 py-2" required />
        </Field>
        <Field label="Email" required>
          <input type="email" value={formData.inviteeEmail}
            onChange={(e) => setFormData({ ...formData, inviteeEmail: e.target.value })}
            className="w-full text-sm rounded-md border border-border bg-background px-3 py-2" required />
        </Field>
        {questions.map((q) => (
          <QuestionField key={q._id} q={q} value={formData.answers[q._id]}
            onChange={(v) => setFormData({ ...formData, answers: { ...formData.answers, [q._id]: v } })} />
        ))}
      </div>

      {error && (
        <div className="mt-4 px-3 py-2 rounded-md border border-rose-500/30 bg-rose-500/5 text-sm text-rose-500">{error}</div>
      )}

      <button type="submit" disabled={submitting}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition">
        {submitting ? 'Confirming…' : 'Confirm booking'}
      </button>
    </form>
  );
}

function QuestionField({ q, value, onChange }) {
  if (q.type === 'long_text') {
    return (
      <Field label={q.label} hint={q.helpText} required={q.isRequired}>
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder}
          rows={3} required={q.isRequired}
          className="w-full text-sm rounded-md border border-border bg-background px-3 py-2" />
      </Field>
    );
  }
  if (q.type === 'select') {
    return (
      <Field label={q.label} hint={q.helpText} required={q.isRequired}>
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} required={q.isRequired}
          className="w-full text-sm rounded-md border border-border bg-background px-3 py-2">
          <option value="">{q.placeholder || 'Choose…'}</option>
          {(q.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
    );
  }
  if (q.type === 'multi_select') {
    const arr = Array.isArray(value) ? value : [];
    const toggle = (opt) => onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
    return (
      <Field label={q.label} hint={q.helpText} required={q.isRequired}>
        <div className="flex flex-wrap gap-1.5">
          {(q.options || []).map((opt) => (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              className={`px-2.5 py-1 rounded-md border text-xs transition ${arr.includes(opt) ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-border'}`}>
              {opt}
            </button>
          ))}
        </div>
      </Field>
    );
  }
  if (q.type === 'checkbox') {
    return (
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
        <span className="text-sm">{q.label}{q.isRequired && ' *'}</span>
      </label>
    );
  }
  const inputType = q.type === 'email' ? 'email' : q.type === 'phone' ? 'tel' : q.type === 'url' ? 'url' : q.type === 'number' ? 'number' : 'text';
  return (
    <Field label={q.label} hint={q.helpText} required={q.isRequired}>
      <input type={inputType} value={value || ''}
        onChange={(e) => onChange(inputType === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={q.placeholder} required={q.isRequired}
        className="w-full text-sm rounded-md border border-border bg-background px-3 py-2" />
    </Field>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="block mt-1 text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function ConfirmedStage({ confirmation, timezone, eventMeta }) {
  const start = DateTime.fromISO(confirmation.startUtc).setZone(timezone);
  const end = DateTime.fromISO(confirmation.endUtc).setZone(timezone);
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 md:p-8 max-w-2xl mx-auto text-center">
      <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={40} />
      <h2 className="text-xl font-semibold">You're booked.</h2>
      <p className="text-sm text-muted-foreground mt-1">
        {start.toFormat('cccc, LLL d · h:mm a')} – {end.toFormat('h:mm a')} ({timezone})
      </p>
      {confirmation.meetingLink ? (
        <a href={confirmation.meetingLink} target="_blank" rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
          <ExternalLink size={14} /> Join meeting
        </a>
      ) : (
        <p className="mt-5 text-xs text-muted-foreground">
          {confirmation.providerError
            ? 'Calendar event will be created shortly. You\'ll receive the meeting link by email.'
            : 'Meeting link will be available shortly.'}
        </p>
      )}
      <div className="mt-5">
        <a href={icsDownloadUrl(confirmation.cancelToken)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
          <Download size={12} /> Add to calendar (.ics)
        </a>
      </div>
      {(eventMeta?.allowCancellation || eventMeta?.allowReschedule) && (
        <p className="mt-6 text-[11px] text-muted-foreground">
          Need to make changes? Use the cancel + reschedule link in your confirmation email (Phase 6).
        </p>
      )}
    </div>
  );
}

