import { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import toast from 'react-hot-toast';
import {
  Calendar as CalendarIcon, Search, Filter, X, ExternalLink, Mail, Clock,
  AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/cyber/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { getWebsites } from '@/api/websites';
import {
  listBookings,
  getBooking,
  cancelBookingAdmin,
  listEventTypes,
} from '../api/scheduler';

// ════════════════════════════════════════════════════════════════════════════
// BookingsPage — admin list + detail drawer
// ════════════════════════════════════════════════════════════════════════════

const STATUS_META = {
  confirmed:   { label: 'Confirmed',   tone: 'emerald', icon: CheckCircle2 },
  cancelled:   { label: 'Cancelled',   tone: 'rose',    icon: XCircle },
  rescheduled: { label: 'Rescheduled', tone: 'amber',   icon: Clock },
  completed:   { label: 'Completed',   tone: 'slate',   icon: CheckCircle2 },
  no_show:     { label: 'No show',     tone: 'amber',   icon: AlertTriangle },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    tenant: 'all',
    status: 'all',
    eventType: 'all',
    from: '',
    to: '',
  });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.tenant !== 'all') params.tenant = filter.tenant;
      if (filter.status !== 'all') params.status = filter.status;
      if (filter.eventType !== 'all') params.eventType = filter.eventType;
      if (filter.from) params.from = new Date(filter.from).toISOString();
      if (filter.to) params.to = new Date(filter.to).toISOString();
      const [bRes, eRes, wRes] = await Promise.all([
        listBookings(params),
        eventTypes.length ? Promise.resolve(null) : listEventTypes(),
        websites.length ? Promise.resolve(null) : getWebsites({ limit: 100 }),
      ]);
      setBookings(bRes.data.bookings || []);
      if (eRes) setEventTypes(eRes.data.eventTypes || []);
      if (wRes) setWebsites(wRes.data.data.websites || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const res = await getBooking(selectedId);
        if (!cancelled) setDetail(res.data.booking);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load booking');
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.trim().toLowerCase();
    return bookings.filter((b) =>
      (b.inviteeName || '').toLowerCase().includes(q) ||
      (b.inviteeEmail || '').toLowerCase().includes(q) ||
      (b.eventType?.name || '').toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const handleCancel = async (id) => {
    const reason = window.prompt('Cancellation reason (optional):', '');
    if (reason === null) return; // user hit Cancel
    try {
      await cancelBookingAdmin(id, reason);
      toast.success('Booking cancelled');
      load();
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
            <CalendarIcon size={14} /> Scheduler · Bookings
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            All bookings across your event types. Click a row for the detail drawer.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invitee name / email / event…"
            className="w-full text-sm rounded-lg border border-border bg-background pl-9 pr-3 py-2" />
        </div>
        <select value={filter.tenant} onChange={(e) => setFilter({ ...filter, tenant: e.target.value })}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2">
          <option value="all">All tenants</option>
          {websites.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2">
          <option value="all">Any status</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="completed">Completed</option>
          <option value="no_show">No show</option>
        </select>
        <select value={filter.eventType} onChange={(e) => setFilter({ ...filter, eventType: e.target.value })}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2">
          <option value="all">Any event type</option>
          {eventTypes.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
        <input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2" />
        <input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2" />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading bookings…</div>
      ) : filteredBySearch.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <CalendarIcon className="mx-auto mb-3 text-muted-foreground" size={36} />
          <p className="text-base font-medium">No bookings match this filter</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filteredBySearch.map((b) => (
            <BookingRow key={b._id} booking={b} onSelect={() => setSelectedId(b._id)} onCancel={() => handleCancel(b._id)} />
          ))}
        </div>
      )}

      {selectedId && (
        <DetailDrawer
          booking={detail}
          loading={detailLoading}
          onClose={() => setSelectedId(null)}
          onCancel={() => handleCancel(selectedId)}
        />
      )}
    </div>
  );
}

function BookingRow({ booking, onSelect, onCancel }) {
  const meta = STATUS_META[booking.status] || STATUS_META.confirmed;
  const StatusIcon = meta.icon;
  const start = DateTime.fromISO(booking.startTimeUtc).setZone(booking.inviteeTimezone || 'UTC');
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 hover:bg-muted/30 transition cursor-pointer"
         onClick={onSelect}>
      <div className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border border-${meta.tone}-500/30 bg-${meta.tone}-500/5 text-${meta.tone}-500`}>
        <StatusIcon size={12} /> {meta.label}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="truncate">{booking.inviteeName}</span>
          <span className="text-muted-foreground text-xs truncate">· {booking.inviteeEmail}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {booking.eventType?.name && <span>{booking.eventType.name}</span>}
          <span>·</span>
          <span>{start.toFormat('cccc, LLL d · h:mm a')}</span>
          {booking.tenant?.slug && <><span>·</span><span>/{booking.tenant.slug}</span></>}
        </div>
      </div>
      {booking.meetingLink && (
        <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="text-xs inline-flex items-center gap-1 text-brand-600 hover:underline">
          <ExternalLink size={11} /> Join
        </a>
      )}
      {booking.status === 'confirmed' && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onCancel(); }}
          className="text-xs text-rose-500 hover:underline">Cancel</button>
      )}
    </div>
  );
}

function DetailDrawer({ booking, loading, onClose, onCancel }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
          <div className="text-sm font-medium">Booking detail</div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition">
            <X size={14} />
          </button>
        </div>
        <div className="p-5">
          {loading || !booking ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <BookingDetailBody booking={booking} onCancel={onCancel} />
          )}
        </div>
      </div>
    </>
  );
}

function BookingDetailBody({ booking, onCancel }) {
  const meta = STATUS_META[booking.status] || STATUS_META.confirmed;
  const tz = booking.inviteeTimezone || 'UTC';
  const start = DateTime.fromISO(booking.startTimeUtc).setZone(tz);
  const end = DateTime.fromISO(booking.endTimeUtc).setZone(tz);
  return (
    <div className="space-y-4">
      <div>
        <Badge>{meta.label}</Badge>
        <h2 className="text-lg font-semibold mt-2">{booking.inviteeName}</h2>
        <a href={`mailto:${booking.inviteeEmail}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <Mail size={12} /> {booking.inviteeEmail}
        </a>
      </div>

      <div className="rounded-lg border border-border p-3 text-sm">
        <div className="font-medium">{booking.eventType?.name || 'Event'}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {start.toFormat('cccc, LLL d · h:mm a')} – {end.toFormat('h:mm a')} ({tz})
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {booking.eventType?.durationMinutes}m · {booking.locationType}
        </div>
      </div>

      {booking.meetingLink && (
        <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
          <ExternalLink size={13} /> Join meeting
        </a>
      )}

      {Array.isArray(booking.formAnswers) && booking.formAnswers.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">
            Intake answers
          </div>
          <div className="space-y-2">
            {booking.formAnswers.map((a, idx) => (
              <div key={idx} className="text-sm">
                <div className="text-xs text-muted-foreground">{a.labelSnapshot}</div>
                <div className="font-medium break-words">
                  {Array.isArray(a.value) ? a.value.join(', ') : String(a.value ?? '—')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <button type="button" onClick={onCancel}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-rose-500/30 text-sm text-rose-500 hover:bg-rose-500/5 transition">
          Cancel booking
        </button>
      )}

      {booking.cancellationReason && (
        <div className="text-xs text-muted-foreground">
          <strong>Cancellation reason:</strong> {booking.cancellationReason}
        </div>
      )}
    </div>
  );
}
