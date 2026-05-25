import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { DateTime } from 'luxon';
import {
  Zap, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Activity, RotateCcw, ExternalLink,
} from 'lucide-react';
import { GlassCard } from '@/components/cyber/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { getWebsites } from '@/api/websites';
import {
  listExecutions,
  replayExecution,
  listWebhookDeliveries,
  retryWebhookDelivery,
} from '../api/scheduler';

// ════════════════════════════════════════════════════════════════════════════
// WorkflowHistoryPage — execution audit + replay + webhook delivery viewer
// ════════════════════════════════════════════════════════════════════════════

const STATUS_META = {
  queued:    { tone: 'slate',  label: 'Queued',    icon: Activity },
  running:   { tone: 'amber',  label: 'Running',   icon: Activity },
  succeeded: { tone: 'emerald', label: 'Succeeded', icon: CheckCircle2 },
  failed:    { tone: 'rose',   label: 'Failed',    icon: XCircle },
  skipped:   { tone: 'slate',  label: 'Skipped',   icon: AlertTriangle },
};
const WEBHOOK_STATUS = {
  pending:     { tone: 'amber',  label: 'Pending' },
  delivered:   { tone: 'emerald', label: 'Delivered' },
  failed:      { tone: 'rose',   label: 'Failed' },
  invalid_url: { tone: 'rose',   label: 'Invalid URL' },
};

export default function WorkflowHistoryPage() {
  const [tab, setTab] = useState('executions');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [websites, setWebsites] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tenantFilter !== 'all') params.tenant = tenantFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const [eRes, wRes, wsRes] = await Promise.all([
        tab === 'executions' ? listExecutions(params) : Promise.resolve({ data: { executions: [] } }),
        tab === 'webhooks' ? listWebhookDeliveries(params) : Promise.resolve({ data: { deliveries: [] } }),
        websites.length ? Promise.resolve(null) : getWebsites({ limit: 100 }),
      ]);
      setExecutions(eRes.data.executions || []);
      setDeliveries(wRes.data.deliveries || []);
      if (wsRes) setWebsites(wsRes.data.data.websites || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab, tenantFilter, statusFilter]);

  const handleReplay = async (id) => {
    try {
      await replayExecution(id);
      toast.success('Replay queued');
      setTimeout(load, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Replay failed');
    }
  };

  const handleRetryWebhook = async (id) => {
    try {
      await retryWebhookDelivery(id);
      toast.success('Webhook retry queued');
      setTimeout(load, 500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
            <Zap size={14} /> Scheduler · Workflow History
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Workflow operations</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Recent automation runs. Replay failed jobs without re-firing the original trigger.
          </p>
        </div>
        <button type="button" onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-xs hover:bg-muted transition">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-1 mb-4 border-b border-border">
        <TabButton active={tab === 'executions'} onClick={() => setTab('executions')}>Executions</TabButton>
        <TabButton active={tab === 'webhooks'} onClick={() => setTab('webhooks')}>Webhook deliveries</TabButton>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <select value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2">
          <option value="all">All tenants</option>
          {websites.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm rounded-lg border border-border bg-background px-3 py-2">
          <option value="all">Any status</option>
          {tab === 'executions'
            ? Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)
            : Object.entries(WEBHOOK_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : tab === 'executions' ? (
        <ExecutionsList items={executions} onReplay={handleReplay} />
      ) : (
        <WebhooksList items={deliveries} onRetry={handleRetryWebhook} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${active ? 'border-brand-500 text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
      {children}
    </button>
  );
}

function ExecutionsList({ items, onReplay }) {
  if (items.length === 0) {
    return <GlassCard className="p-10 text-center text-sm text-muted-foreground">No executions yet.</GlassCard>;
  }
  return (
    <div className="space-y-2">
      {items.map((e) => {
        const meta = STATUS_META[e.status] || STATUS_META.queued;
        const StatusIcon = meta.icon;
        return (
          <div key={e._id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
            <div className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border border-${meta.tone}-500/30 bg-${meta.tone}-500/5 text-${meta.tone}-500`}>
              <StatusIcon size={12} /> {meta.label}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium truncate">{e.workflow?.name || '(built-in)'}</span>
                <span className="text-muted-foreground text-xs">{e.actionType}</span>
                {e.attempts > 1 && <Badge>retry {e.attempts}</Badge>}
              </div>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                {e.booking?.inviteeEmail && <span className="truncate">{e.booking.inviteeEmail}</span>}
                {e.trigger && <span>· {e.trigger}</span>}
                {e.createdAt && <span>· {DateTime.fromISO(e.createdAt).toRelative()}</span>}
                {typeof e.durationMs === 'number' && <span>· {e.durationMs}ms</span>}
              </div>
              {e.error && <div className="mt-1 text-[11px] text-rose-500 truncate" title={e.error}>{e.error}</div>}
            </div>
            {e.workflow && e.booking && e.status === 'failed' && (
              <button type="button" onClick={() => onReplay(e._id)}
                className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-muted transition">
                <RotateCcw size={11} /> Replay
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WebhooksList({ items, onRetry }) {
  if (items.length === 0) {
    return <GlassCard className="p-10 text-center text-sm text-muted-foreground">No webhook deliveries yet.</GlassCard>;
  }
  return (
    <div className="space-y-2">
      {items.map((d) => {
        const meta = WEBHOOK_STATUS[d.status] || WEBHOOK_STATUS.pending;
        return (
          <div key={d._id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
            <div className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border border-${meta.tone}-500/30 bg-${meta.tone}-500/5 text-${meta.tone}-500`}>
              {meta.label}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate flex items-center gap-1.5">
                {d.url}
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" title="Open target">
                  <ExternalLink size={11} />
                </a>
              </div>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                {d.workflow?.name && <span>{d.workflow.name}</span>}
                {d.trigger && <span>· {d.trigger}</span>}
                {d.httpStatus != null && <span>· HTTP {d.httpStatus}</span>}
                {d.createdAt && <span>· {DateTime.fromISO(d.createdAt).toRelative()}</span>}
              </div>
              {d.lastError && <div className="mt-1 text-[11px] text-rose-500 truncate" title={d.lastError}>{d.lastError}</div>}
            </div>
            {d.status === 'failed' && (
              <button type="button" onClick={() => onRetry(d._id)}
                className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-muted transition">
                <RotateCcw size={11} /> Retry
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
