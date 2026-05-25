import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle2,
  ShieldCheck, Mail, Globe,
} from 'lucide-react';
import { GlassCard } from '@/components/cyber/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { getWebsites } from '@/api/websites';
import { apiBase, apiPath } from '@/lib/apiBase';
import {
  listCalendarConnections,
  deleteCalendarConnection,
} from '../api/scheduler';
import api from '@/api/axios';

// ════════════════════════════════════════════════════════════════════════════
// CalendarConnectionsPage — admin connection management
// ════════════════════════════════════════════════════════════════════════════
// Phase 2 surface:
//   - List existing connections (per current user, scoped to their tenants)
//   - Connect a new Google calendar (per selected tenant)
//   - Refresh / disconnect existing connections
//   - Show connection health (active / reauth_required / revoked / expired / error)
//   - Show selected calendar count + write-back primary
//
// Phase 2 intentionally avoids slot pickers, booking widgets, availability UI —
// those land in Phase 3 once the availability engine ships.
// ════════════════════════════════════════════════════════════════════════════

const STATUS_BADGE = {
  active: { label: 'Active', tone: 'emerald', icon: CheckCircle2 },
  reauth_required: { label: 'Reauth needed', tone: 'amber', icon: AlertTriangle },
  revoked: { label: 'Revoked', tone: 'rose', icon: AlertTriangle },
  expired: { label: 'Expired', tone: 'amber', icon: AlertTriangle },
  error: { label: 'Error', tone: 'rose', icon: AlertTriangle },
};

export default function CalendarConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [providerStatus, setProviderStatus] = useState({ google: false, outlook: false });
  const [loading, setLoading] = useState(true);
  const [websites, setWebsites] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const load = async () => {
    setLoading(true);
    try {
      const [connRes, websiteRes] = await Promise.all([
        listCalendarConnections(),
        getWebsites({ limit: 100 }),
      ]);
      setConnections(connRes.data.connections || []);
      setProviderStatus(connRes.data.providerStatus || { google: false, outlook: false });
      const list = websiteRes.data.data.websites || [];
      setWebsites(list);
      if (!selectedTenant && list.length) setSelectedTenant(list[0]._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Surface OAuth callback status from URL query (set by backend redirect).
  useEffect(() => {
    const status = searchParams.get('schedulerStatus');
    if (!status) return;
    if (status === 'connected') toast.success('Calendar connected');
    else if (status === 'reconnected') toast.success('Calendar reconnected');
    else if (status === 'error') {
      const code = searchParams.get('code');
      toast.error(`OAuth failed: ${code || 'unknown'}`);
    }
    // Clean up URL so a refresh doesn't re-show the toast.
    const next = new URLSearchParams(searchParams);
    next.delete('schedulerStatus');
    next.delete('code');
    next.delete('provider');
    next.delete('connectionId');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleConnectGoogle = async () => {
    if (!selectedTenant) {
      toast.error('Choose a tenant first');
      return;
    }
    try {
      // Hit the connect endpoint via the authenticated XHR path so we send our
      // Bearer token, then follow the URL the backend returns. We can't simply
      // window.location to the connect URL — that path is JWT-protected and a
      // top-level navigation won't carry our Authorization header.
      const res = await api.get('/scheduler/calendar-connections/google/connect', {
        params: { tenant: selectedTenant },
        headers: { Accept: 'application/json' },
      });
      const url = res.data?.data?.url;
      if (!url) throw new Error('Backend did not return an auth URL');
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start Google connect flow');
    }
  };

  const handleRefresh = async (id) => {
    try {
      await api.post(`/scheduler/calendar-connections/${id}/refresh`);
      toast.success('Token refreshed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refresh failed');
    }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm('Disconnect this calendar? Future bookings will not sync until reconnected.')) return;
    try {
      await deleteCalendarConnection(id);
      toast.success('Disconnected');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Disconnect failed');
    }
  };

  const groupedByTenant = useMemo(() => {
    const map = new Map();
    for (const c of connections) {
      const key = c.tenant?._id || c.tenant || 'unscoped';
      if (!map.has(key)) {
        map.set(key, {
          tenantName: c.tenant?.name || 'Unknown tenant',
          tenantSlug: c.tenant?.slug || '',
          items: [],
        });
      }
      map.get(key).items.push(c);
    }
    return Array.from(map.entries());
  }, [connections]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6"
      >
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
            <CalendarIcon size={14} /> Scheduler · Calendar Connections
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
            Connected calendars
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Connect your Google calendar so booking availability respects existing meetings and new bookings sync back automatically. Multi-account supported per tenant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="text-sm rounded-lg border border-border bg-background px-3 py-2"
          >
            <option value="" disabled>Choose tenant…</option>
            {websites.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleConnectGoogle}
            disabled={!providerStatus.google || !selectedTenant}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={!providerStatus.google ? 'Google integration is not configured on this server (GOOGLE_CLIENT_ID missing)' : ''}
          >
            <Plus size={16} /> Connect Google
          </button>
        </div>
      </motion.div>

      {!providerStatus.google && (
        <div className="mb-6 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm flex items-start gap-3">
          <ShieldCheck className="text-amber-500 mt-0.5" size={16} />
          <div>
            <strong>Google integration not configured.</strong> Set
            {' '}<code className="text-xs">GOOGLE_CLIENT_ID</code>,
            {' '}<code className="text-xs">GOOGLE_CLIENT_SECRET</code>,
            {' '}<code className="text-xs">OAUTH_STATE_SECRET</code>, and
            {' '}<code className="text-xs">TOKEN_ENCRYPTION_KEY</code> in the backend env. Add the OAuth redirect URI
            {' '}<code className="text-xs">{apiBase() || window.location.origin}/api/scheduler/calendar-connections/google/callback</code>
            {' '}to your Google Cloud Console OAuth client.
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading connections…</div>
      ) : connections.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <CalendarIcon className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-sm font-medium">No calendars connected yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Pick a tenant above, then click "Connect Google" to start the OAuth flow.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {groupedByTenant.map(([tenantId, group]) => (
            <div key={tenantId}>
              <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
                <Globe size={12} /> {group.tenantName} <span className="text-muted-foreground/60">/{group.tenantSlug}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {group.items.map((c) => <ConnectionCard key={c._id} c={c} onRefresh={handleRefresh} onDisconnect={handleDisconnect} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectionCard({ c, onRefresh, onDisconnect }) {
  const statusMeta = STATUS_BADGE[c.status] || STATUS_BADGE.active;
  const StatusIcon = statusMeta.icon;
  const writeTargets = (c.selectedCalendars || []).filter((s) => s.writeEvents);
  const conflictTargets = (c.selectedCalendars || []).filter((s) => s.checkConflicts);
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold capitalize">{c.provider}</span>
            {c.isPrimary && <Badge>Primary</Badge>}
          </div>
          {c.providerAccountEmail && (
            <div className="flex items-center gap-1.5 mt-1 text-[13px] text-muted-foreground">
              <Mail size={12} /> {c.providerAccountEmail}
            </div>
          )}
          {c.calendarName && (
            <div className="mt-1 text-xs text-muted-foreground truncate">
              Default: {c.calendarName}
            </div>
          )}
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border border-${statusMeta.tone}-500/30 bg-${statusMeta.tone}-500/5 text-${statusMeta.tone}-500`}>
          <StatusIcon size={12} /> {statusMeta.label}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        <div className="rounded-lg border border-border/60 p-2.5">
          <div className="text-muted-foreground">Conflict scan</div>
          <div className="font-medium mt-0.5">
            {conflictTargets.length} calendar{conflictTargets.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="rounded-lg border border-border/60 p-2.5">
          <div className="text-muted-foreground">Write-back</div>
          <div className="font-medium mt-0.5">
            {writeTargets.length} calendar{writeTargets.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {c.status === 'reauth_required' && (
        <div className="mt-3 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-[12px] text-amber-500">
          Google revoked access. Click "Reconnect" below to re-authorize.
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onRefresh(c._id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] hover:bg-muted transition"
        >
          <RefreshCw size={12} /> Refresh
        </button>
        <button
          type="button"
          onClick={() => onDisconnect(c._id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 text-[12px] text-rose-500 hover:bg-rose-500/5 transition"
        >
          <Trash2 size={12} /> Disconnect
        </button>
        {c.status === 'reauth_required' && (
          <a
            href={apiPath(`/api/scheduler/calendar-connections/${c.provider}/connect?tenant=${c.tenant?._id || c.tenant}`)}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-[12px] hover:bg-brand-700 transition"
          >
            Reconnect
          </a>
        )}
      </div>
    </GlassCard>
  );
}
