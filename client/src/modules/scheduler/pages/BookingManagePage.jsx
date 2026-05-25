import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  CheckCircle2, AlertTriangle, Clock, Globe, ArrowLeft, ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react';
import {
  resolveBookingByToken,
  cancelBookingByToken,
  rescheduleBookingByToken,
  fetchPublicSlots,
} from '../api/scheduler';

// ════════════════════════════════════════════════════════════════════════════
// BookingManagePage — invitee self-service via token
// ════════════════════════════════════════════════════════════════════════════
// Route: /manage/:token
// Token comes from confirmation/reminder emails. Backend resolves it as
// `cancel` or `reschedule` mode (whichever token matched). UI branches on it.
// ════════════════════════════════════════════════════════════════════════════

function detectTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

export default function BookingManagePage() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: null, booking: null, mode: null });
  const [view, setView] = useState('overview'); // overview | reschedule | done
  const [cancelReason, setCancelReason] = useState('');
  const [doneMessage, setDoneMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await resolveBookingByToken(token);
        if (cancelled) return;
        const data = res.data || res;
        setState({ loading: false, error: null, booking: data.booking, mode: data.mode });
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err.message, booking: null, mode: null });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    try {
      await cancelBookingByToken(token, cancelReason);
      setDoneMessage('Booking cancelled.');
      setView('done');
    } catch (err) {
      setState((s) => ({ ...s, error: err.message }));
    }
  };

  const { loading, error, booking, mode } = state;

  if (loading) {
    return <Shell><div className="text-sm text-muted-foreground">Loading booking…</div></Shell>;
  }
  if (error || !booking) {
    return <Shell>
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-500">
        {error || 'Booking not found'}
      </div>
    </Shell>;
  }

  if (view === 'done') {
    return <Shell>
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={36} />
        <p className="text-base font-medium">{doneMessage}</p>
        <p className="text-xs text-muted-foreground mt-1">You'll receive a confirmation email shortly.</p>
      </div>
    </Shell>;
  }

  if (view === 'reschedule' && mode === 'reschedule') {
    return <Shell>
      <button type="button" onClick={() => setView('overview')}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition">
        <ArrowLeft size={12} /> Back
      </button>
      <RescheduleStage
        booking={booking}
        token={token}
        onDone={() => { setDoneMessage('Booking rescheduled.'); setView('done'); }}
      />
    </Shell>;
  }

  return <Shell>
    <OverviewStage
      booking={booking}
      mode={mode}
      cancelReason={cancelReason}
      setCancelReason={setCancelReason}
      onCancel={handleCancel}
      onReschedule={() => setView('reschedule')}
    />
  </Shell>;
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium mb-2">
          Manage your booking
        </div>
        {children}
      </div>
    </div>
  );
}

function OverviewStage({ booking, mode, cancelReason, setCancelReason, onCancel, onReschedule }) {
  const tz = booking.inviteeTimezone || 'UTC';
  const start = DateTime.fromISO(booking.startTimeUtc).setZone(tz);
  const end = DateTime.fromISO(booking.endTimeUtc).setZone(tz);
  const isCancelled = booking.status === 'cancelled';
  const isRescheduled = booking.status === 'rescheduled';
  const allowCancel = booking.eventType?.allowCancellation !== false && !isCancelled && !isRescheduled;
  const allowReschedule = booking.eventType?.allowReschedule !== false && mode === 'reschedule' && !isCancelled && !isRescheduled;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
        {booking.eventType?.name || 'Your booking'}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        <Clock size={12} className="inline mr-1" />
        {start.toFormat('cccc, LLL d · h:mm a')} – {end.toFormat('h:mm a')}
        <span className="ml-1"><Globe size={12} className="inline" /> {tz}</span>
      </p>

      {booking.meetingLink && !isCancelled && (
        <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
          <ExternalLink size={14} /> Join meeting
        </a>
      )}

      {isCancelled && (
        <div className="mt-4 px-3 py-2 rounded-md border border-rose-500/30 bg-rose-500/5 text-sm text-rose-500 inline-flex items-center gap-2">
          <AlertTriangle size={14} /> This booking has been cancelled
        </div>
      )}
      {isRescheduled && (
        <div className="mt-4 px-3 py-2 rounded-md border border-amber-500/30 bg-amber-500/5 text-sm text-amber-600 inline-flex items-center gap-2">
          <Clock size={14} /> This booking has been rescheduled
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div><strong className="text-foreground">Invitee:</strong> {booking.inviteeName}</div>
        <div><strong className="text-foreground">Email:</strong> {booking.inviteeEmail}</div>
        {booking.locationType && <div><strong className="text-foreground">Location:</strong> {booking.locationType}</div>}
      </div>

      {allowReschedule && (
        <button type="button" onClick={onReschedule}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-sm hover:bg-muted transition">
          Reschedule
        </button>
      )}

      {allowCancel && mode === 'cancel' && (
        <div className="mt-6 border-t border-border pt-5">
          <label className="block text-xs font-medium">Reason (optional)</label>
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
            rows={2} className="mt-1.5 w-full text-sm rounded-md border border-border bg-background px-2 py-1.5" />
          <button type="button" onClick={onCancel}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-rose-500/30 text-sm text-rose-500 hover:bg-rose-500/5 transition">
            Cancel booking
          </button>
        </div>
      )}

      {!allowCancel && !allowReschedule && !isCancelled && !isRescheduled && (
        <p className="mt-5 text-xs text-muted-foreground">
          This link is no longer actionable. Contact the organizer for changes.
        </p>
      )}
    </div>
  );
}

function RescheduleStage({ booking, token, onDone }) {
  const [timezone] = useState(booking.inviteeTimezone || detectTimezone());
  const [weekOffset, setWeekOffset] = useState(0);
  const [slotsState, setSlotsState] = useState({ slots: [], loading: true, error: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const tenantSlug = booking.tenant?.slug;
  const eventSlug = booking.eventType?.slug;

  const range = useMemo(() => {
    const now = DateTime.now().setZone(timezone).startOf('day');
    const start = now.plus({ days: weekOffset * 7 });
    const end = start.plus({ days: 7 });
    return { start: start.toUTC().toJSDate(), end: end.toUTC().toJSDate() };
  }, [timezone, weekOffset]);

  useEffect(() => {
    if (!tenantSlug || !eventSlug) {
      setSlotsState({ slots: [], loading: false, error: 'Missing tenant or event metadata' });
      return;
    }
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
  }, [tenantSlug, eventSlug, range.start, range.end, timezone]);

  const handlePick = async (slot) => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await rescheduleBookingByToken(token, {
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
        hash: slot.hash,
      });
      onDone();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Pick a new time</h2>
      <p className="text-xs text-muted-foreground mt-1">All times in {timezone}.</p>

      <div className="flex items-center justify-between mt-4">
        <button type="button" onClick={() => setWeekOffset((o) => Math.max(0, o - 1))} disabled={weekOffset === 0}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted disabled:opacity-40 transition">
          <ChevronLeft size={12} /> Previous week
        </button>
        <div className="text-xs text-muted-foreground">
          {DateTime.fromJSDate(range.start).setZone(timezone).toFormat('LLL d')} – {DateTime.fromJSDate(range.end).setZone(timezone).minus({ days: 1 }).toFormat('LLL d')}
        </div>
        <button type="button" onClick={() => setWeekOffset((o) => o + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted transition">
          Next week <ChevronRight size={12} />
        </button>
      </div>

      {submitError && (
        <div className="mt-3 px-3 py-2 rounded-md border border-rose-500/30 bg-rose-500/5 text-sm text-rose-500">{submitError}</div>
      )}

      <div className="mt-4">
        {slotsState.loading ? (
          <div className="text-sm text-muted-foreground">Loading slots…</div>
        ) : slotsState.error ? (
          <div className="text-sm text-rose-500">{slotsState.error}</div>
        ) : slotsByDay.size === 0 ? (
          <div className="text-sm text-muted-foreground">No availability this week.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from(slotsByDay.entries()).map(([dateKey, slots]) => (
              <div key={dateKey} className="rounded-xl border border-border p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {DateTime.fromISO(dateKey, { zone: timezone }).toFormat('cccc · LLL d')}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {slots.map((s) => (
                    <button key={s.hash} type="button" disabled={submitting} onClick={() => handlePick(s)}
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-[12.5px] hover:border-brand-500 hover:text-brand-500 disabled:opacity-50 transition">
                      {DateTime.fromISO(s.inviteeLocalStart).setZone(timezone).toFormat('h:mm a')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
