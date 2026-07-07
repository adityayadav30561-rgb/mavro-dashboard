import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Plus, Search, Copy, Trash2, ToggleLeft, ToggleRight, Clock,
  Calendar as CalendarIcon, Users, Lock, Eye, EyeOff,
} from 'lucide-react';
import { GlassCard } from '@/components/cyber/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { getWebsites } from '@/api/websites';
import {
  listEventTypes,
  setEventTypeActive,
  duplicateEventType,
  deleteEventType,
} from '../api/scheduler';

// ════════════════════════════════════════════════════════════════════════════
// EventTypesPage — list view of all bookable event types
// ════════════════════════════════════════════════════════════════════════════
// Premium-SaaS style admin list. Each row shows essential metadata + quick
// actions (toggle active, duplicate, archive). Tenant filter + search bar
// scope the table. "New event type" button → /scheduler/event-types/new.
// ════════════════════════════════════════════════════════════════════════════

const COLOR_DOTS = {
  violet: '#c2431f',
  cyan: '#2f7a88',
  emerald: '#5f7a34',
  amber: '#bc8425',
  rose: '#b23a4e',
  blue: '#3b82f6',
  pink: '#c95a6c',
  slate: '#64748b',
};

export default function EventTypesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenantFilter, setTenantFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tenantFilter !== 'all') params.tenant = tenantFilter;
      if (activeFilter !== 'all') params.isActive = activeFilter;
      if (search) params.search = search;
      const [evRes, wRes] = await Promise.all([
        listEventTypes(params),
        websites.length ? Promise.resolve(null) : getWebsites({ limit: 100 }),
      ]);
      setItems(evRes.data.eventTypes || []);
      if (wRes) setWebsites(wRes.data.data.websites || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load event types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantFilter, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    load();
  };

  const handleToggleActive = async (item) => {
    try {
      await setEventTypeActive(item._id, !item.isActive);
      toast.success(item.isActive ? 'Deactivated' : 'Activated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDuplicate = async (item) => {
    try {
      const res = await duplicateEventType(item._id);
      toast.success('Duplicated');
      const newId = res.data?.eventType?._id;
      if (newId) navigate(`/scheduler/event-types/${newId}/edit`);
      else load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duplicate failed');
    }
  };

  const handleArchive = async (item) => {
    if (!window.confirm(`Archive "${item.name}"? Existing bookings stay; the slug is released.`)) return;
    try {
      await deleteEventType(item._id);
      toast.success('Archived');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Archive failed');
    }
  };

  const grouped = useMemo(() => {
    const out = new Map();
    for (const it of items) {
      const key = it.tenant?._id || 'unscoped';
      if (!out.has(key)) {
        out.set(key, { tenantName: it.tenant?.name || 'Unknown', tenantSlug: it.tenant?.slug || '', items: [] });
      }
      out.get(key).items.push(it);
    }
    return Array.from(out.entries());
  }, [items]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6"
      >
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
            <CalendarIcon size={14} /> Scheduler · Event Types
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
            Event types
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Reusable meeting templates — define duration, availability, intake form, and booking restrictions once. Every event type gets its own public booking URL.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/scheduler/event-types/new')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
        >
          <Plus size={16} /> New event type
        </button>
      </motion.div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event types…"
            className="w-full text-sm rounded-lg border border-border bg-background pl-9 pr-3 py-2"
          />
        </form>
        <select
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2"
        >
          <option value="all">All tenants</option>
          {websites.map((w) => (
            <option key={w._id} value={w._id}>{w.name}</option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2"
        >
          <option value="all">Any status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading event types…</div>
      ) : items.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <CalendarIcon className="mx-auto mb-3 text-muted-foreground" size={36} />
          <p className="text-base font-medium">No event types yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Create your first event type to start collecting bookings.
          </p>
          <button
            type="button"
            onClick={() => navigate('/scheduler/event-types/new')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
          >
            <Plus size={16} /> Create event type
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {grouped.map(([tenantId, group]) => (
            <div key={tenantId}>
              <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
                {group.tenantName} <span className="text-muted-foreground/60">/{group.tenantSlug}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {group.items.map((it) => (
                  <EventTypeRow
                    key={it._id}
                    item={it}
                    onEdit={() => navigate(`/scheduler/event-types/${it._id}/edit`)}
                    onToggle={() => handleToggleActive(it)}
                    onDuplicate={() => handleDuplicate(it)}
                    onArchive={() => handleArchive(it)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventTypeRow({ item, onEdit, onToggle, onDuplicate, onArchive }) {
  const dot = COLOR_DOTS[item.color] || COLOR_DOTS.violet;
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onEdit} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span aria-hidden className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
            <span className="font-semibold text-sm truncate">{item.name}</span>
            {!item.isActive && <Badge>Inactive</Badge>}
            {item.isTeamEvent && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                <Users size={11} /> Team
              </span>
            )}
            {item.internalOnly && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                <Lock size={11} /> Internal
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock size={11} /> {item.durationMinutes}m
            </span>
            <span className="truncate">/{item.slug}</span>
            {item.owner?.name && <span className="truncate hidden sm:inline">· {item.owner.name}</span>}
          </div>
          {item.description && (
            <p className="mt-2 text-[12.5px] text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-muted transition"
            title={item.isActive ? 'Deactivate' : 'Activate'}
          >
            {item.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 rounded-lg hover:bg-muted transition"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={onArchive}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition"
            title="Archive"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
