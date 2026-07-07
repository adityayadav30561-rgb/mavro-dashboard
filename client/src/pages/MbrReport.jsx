import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Users, UserPlus, Eye, Clock, Activity, TrendingUp, TrendingDown,
  Phone, MessageCircle, MousePointerClick, FileDown, Send, Sparkles,
  Search as SearchIcon, Globe, MonitorSmartphone, MapPin, Loader2,
  AlertTriangle, RefreshCw, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMbrStatus, getMbrGa4, getMbrGsc, getMbrButtons } from '@/api/mbr';
import GeoMap from '@/components/mbr/GeoMap';

// Series palette — validated (dataviz six checks, light + dark surfaces).
// Color follows the entity, fixed assignment, never cycled.
const C = {
  violet: '#8349df', // users / calls / primary series
  cyan: '#109ec2',   // sessions / leads
  green: '#1da578',  // whatsapp / third series
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const nf = new Intl.NumberFormat('en-IN');
const fmtNum = (n) => nf.format(Math.round(n || 0));

function fmtDuration(sec) {
  if (!sec || sec < 1) return '0s';
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

function deltaPct(current, previous) {
  if (previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function fmtGa4Date(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtIsoDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function lastMonths(count = 13) {
  const now = new Date();
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ value, label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Small primitives
// ---------------------------------------------------------------------------
function Trend({ delta }) {
  if (delta == null || Number.isNaN(delta)) return null;
  const positive = delta >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-semibold',
      positive ? 'text-emerald-400' : 'text-rose-400'
    )}>
      <Icon size={10} />
      {positive ? '+' : ''}{delta}%
    </span>
  );
}

function StatTile({ icon: Icon, label, value, delta, hint, i = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.04 }}
      className="relative rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-4 overflow-hidden hover:border-border transition-all"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="w-8 h-8 rounded-xl bg-foreground/[0.04] border border-border flex items-center justify-center">
          <Icon size={14} className="text-violet-400" />
        </div>
        <Trend delta={delta} />
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      {hint && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{hint}</p>}
    </motion.div>
  );
}

function Card({ title, caption, icon: Icon, children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden', className)}
    >
      <div className="px-5 py-4 border-b border-border/60">
        <p className="text-caption text-violet-400/70">{caption}</p>
        <h3 className="text-title mt-1 flex items-center gap-2">
          {Icon && <Icon size={14} className="text-violet-400" />}
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mt-8 mb-3">
      {children}
    </h2>
  );
}

function ChartTip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-popover/95 backdrop-blur-xl border border-border px-3 py-2 text-[11px] shadow-xl">
      <p className="font-semibold mb-1.5">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-2 font-mono font-semibold text-foreground">{fmtNum(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// Horizontal magnitude rows — identity lives in the row label, single hue fill.
function BarRows({ rows, max }) {
  const top = max || Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="px-5 py-4 space-y-2.5">
      {rows.length === 0 && <EmptyNote />}
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="truncate pr-3">{r.label}</span>
            <span className="font-mono font-semibold">{fmtNum(r.value)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (r.value / top) * 100)}%`, background: C.violet }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DataTable({ columns, rows, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border/60">
            {columns.map((c, i) => (
              <th key={c} className={cn('px-5 py-2.5 font-medium whitespace-nowrap', i > 0 && 'text-right')}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-5 py-6 text-center text-muted-foreground">No data in this window</td></tr>
          )}
          {rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}

const Td = ({ children, right, mono, className }) => (
  <td className={cn('px-5 py-2', right && 'text-right', mono && 'font-mono', className)}>{children}</td>
);

function EmptyNote({ text = 'No data in this window' }) {
  return <p className="py-6 text-center text-[11px] text-muted-foreground">{text}</p>;
}

function NotConfiguredCard({ what, detail }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
      <AlertTriangle size={20} className="mx-auto text-amber-400 mb-2" />
      <p className="text-sm font-semibold">{what} not connected</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{detail}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MbrReport() {
  const months = useMemo(() => lastMonths(13), []);
  const [month, setMonth] = useState(months[0].value);
  const [status, setStatus] = useState(null);
  const [ga4, setGa4] = useState(null);
  const [gsc, setGsc] = useState(null);
  const [buttons, setButtons] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const params = { month };
      const errs = {};

      const [st, g4, gs, bt] = await Promise.allSettled([
        getMbrStatus(),
        getMbrGa4(params),
        getMbrGsc(params),
        getMbrButtons(params),
      ]);
      if (!alive) return;

      setStatus(st.status === 'fulfilled' ? st.value.data?.data : null);

      if (g4.status === 'fulfilled') setGa4(g4.value.data?.data || null);
      else { setGa4(null); errs.ga4 = g4.reason?.response?.data?.message || g4.reason?.message; }

      if (gs.status === 'fulfilled') setGsc(gs.value.data?.data || null);
      else { setGsc(null); errs.gsc = gs.reason?.response?.data?.message || gs.reason?.message; }

      if (bt.status === 'fulfilled') setButtons(bt.value.data?.data || null);
      else setButtons(null);

      setErrors(errs);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [month, refreshTick]);

  const ov = ga4?.overview;
  const ai = ga4?.aiReferrals;
  const events = ga4?.events || {};

  const trendData = useMemo(
    () => (ga4?.trend || []).map((r) => ({ date: r.date, Users: r.users, Sessions: r.sessions })),
    [ga4]
  );

  // Pivot the event daily trend into one row per date, fixed entity → color.
  const eventTrendData = useMemo(() => {
    const byDate = new Map();
    (ga4?.eventTrend || []).forEach((r) => {
      if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date, Calls: 0, WhatsApp: 0, Leads: 0 });
      const row = byDate.get(r.date);
      if (r.event === 'call_click') row.Calls += r.count;
      if (r.event === 'whatsapp_click') row.WhatsApp += r.count;
      if (r.event === 'generate_lead' || r.event === 'form_submit') row.Leads += r.count;
    });
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [ga4]);

  const gscTrendData = useMemo(
    () => (gsc?.trend || []).map((r) => ({ date: r.date, Clicks: r.clicks })),
    [gsc]
  );

  const eventTiles = [
    { key: 'call_click', icon: Phone, label: 'Call clicks' },
    { key: 'whatsapp_click', icon: MessageCircle, label: 'WhatsApp clicks' },
    { key: 'cta_click', icon: MousePointerClick, label: 'CTA clicks' },
    { key: 'form_submit', icon: Send, label: 'Form submits' },
    { key: 'generate_lead', icon: Activity, label: 'LP leads' },
    { key: 'file_download', icon: FileDown, label: 'Brochure downloads' },
  ];

  const monthLabel = months.find((m) => m.value === month)?.label || month;

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-caption text-violet-400/70">Monthly Business Review</p>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <BarChart3 size={18} className="text-violet-400" />
            Growth Report
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            GA4 + Search Console + Mavro events · vs previous month · GSC data lags ~2–3 days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 rounded-xl bg-card border border-border px-3 text-xs font-medium outline-none focus:border-violet-500/50"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <button
            onClick={() => setRefreshTick((t) => t + 1)}
            className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center hover:border-violet-500/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={cn('text-muted-foreground', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Pulling {monthLabel} from Google…</span>
        </div>
      )}

      {!loading && !ga4 && (
        <NotConfiguredCard
          what="Google Analytics 4"
          detail={errors.ga4 || 'Set GOOGLE_SERVICE_ACCOUNT_JSON + GA4_PROPERTY_ID on the backend, grant the service account Viewer access on the GA4 property, then refresh.'}
        />
      )}

      {!loading && ga4 && (
        <>
          {/* ============ AUDIENCE ============ */}
          <SectionHeading>Audience — {monthLabel}</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatTile i={0} icon={Users} label="Total users" value={fmtNum(ov.current.users)} delta={deltaPct(ov.current.users, ov.previous.users)} />
            <StatTile i={1} icon={UserPlus} label="New users" value={fmtNum(ov.current.newUsers)} delta={deltaPct(ov.current.newUsers, ov.previous.newUsers)} />
            <StatTile i={2} icon={Activity} label="Sessions" value={fmtNum(ov.current.sessions)} delta={deltaPct(ov.current.sessions, ov.previous.sessions)} />
            <StatTile i={3} icon={Eye} label="Page views" value={fmtNum(ov.current.pageViews)} delta={deltaPct(ov.current.pageViews, ov.previous.pageViews)} />
            <StatTile i={4} icon={TrendingUp} label="Engagement rate" value={`${Math.round(ov.current.engagementRate * 100)}%`} delta={deltaPct(ov.current.engagementRate, ov.previous.engagementRate)} />
            <StatTile i={5} icon={Clock} label="Avg time / user" value={fmtDuration(ov.current.avgEngagementSec)} delta={deltaPct(ov.current.avgEngagementSec, ov.previous.avgEngagementSec)} />
          </div>

          <div className="mt-3">
            <Card caption="Daily" title="Users & Sessions" icon={Activity}>
              <div className="px-5 pt-3 flex gap-4">
                <LegendDot color={C.violet} label="Users" />
                <LegendDot color={C.cyan} label="Sessions" />
              </div>
              <div className="px-2 pb-4 pt-1 h-[240px]">
                {trendData.length === 0 ? <EmptyNote /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mbrUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.violet} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={C.violet} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="mbrSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.cyan} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                      <XAxis dataKey="date" tickFormatter={fmtGa4Date} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={28} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                      <Tooltip content={<ChartTip labelFormatter={fmtGa4Date} />} />
                      <Area type="monotone" dataKey="Users" stroke={C.violet} strokeWidth={2} fill="url(#mbrUsers)" dot={false} activeDot={{ r: 4, fill: C.violet, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="Sessions" stroke={C.cyan} strokeWidth={2} fill="url(#mbrSessions)" dot={false} activeDot={{ r: 4, fill: C.cyan, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* ============ ACQUISITION ============ */}
          <SectionHeading>Acquisition</SectionHeading>
          <div className="grid lg:grid-cols-3 gap-3">
            <Card caption="Channels" title="Where traffic comes from" icon={Globe}>
              <BarRows rows={(ga4.channels || []).map((c) => ({ label: c.channel, value: c.sessions }))} />
            </Card>
            <Card caption="Sources" title="Top sources" icon={Globe}>
              <DataTable
                columns={['Source', 'Sessions', 'Users']}
                rows={(ga4.sources || []).slice(0, 10)}
                renderRow={(r) => (
                  <tr key={r.source} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                    <Td className="truncate max-w-[160px]">{r.source}</Td>
                    <Td right mono>{fmtNum(r.sessions)}</Td>
                    <Td right mono>{fmtNum(r.users)}</Td>
                  </tr>
                )}
              />
            </Card>
            <Card caption="GEO scoreboard" title="AI assistant traffic" icon={Sparkles}>
              <div className="px-5 py-4">
                <div className="flex items-end gap-3">
                  <p className="text-2xl font-bold">{fmtNum(ai?.currentSessions)}</p>
                  <Trend delta={deltaPct(ai?.currentSessions, ai?.previousSessions)} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
                  sessions from ChatGPT, Perplexity, Gemini, Copilot…
                </p>
                {(ai?.sources || []).length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/70">No AI-referred sessions this month yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {ai.sources.slice(0, 8).map((s) => (
                      <div key={s.source} className="flex items-center justify-between text-[11px]">
                        <span className="truncate pr-3">{s.source}</span>
                        <span className="font-mono font-semibold">{fmtNum(s.sessions)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ============ CONVERSIONS ============ */}
          <SectionHeading>Conversion actions</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {eventTiles.map((t, i) => {
              const e = events[t.key] || { current: 0, previous: 0 };
              return (
                <StatTile key={t.key} i={i} icon={t.icon} label={t.label} value={fmtNum(e.current)} delta={deltaPct(e.current, e.previous)} />
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-3 mt-3">
            <Card caption="Daily" title="Contact intent trend" icon={Phone}>
              <div className="px-5 pt-3 flex gap-4">
                <LegendDot color={C.violet} label="Calls" />
                <LegendDot color={C.green} label="WhatsApp" />
                <LegendDot color={C.cyan} label="Leads" />
              </div>
              <div className="px-2 pb-4 pt-1 h-[220px]">
                {eventTrendData.length === 0 ? <EmptyNote /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={eventTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                      <XAxis dataKey="date" tickFormatter={fmtGa4Date} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={28} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                      <Tooltip content={<ChartTip labelFormatter={fmtGa4Date} />} />
                      <Area type="monotone" dataKey="Calls" stroke={C.violet} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: C.violet, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="WhatsApp" stroke={C.green} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: C.green, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="Leads" stroke={C.cyan} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: C.cyan, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card caption="Downloads" title="Brochures by file" icon={FileDown}>
              <BarRows rows={(ga4.fileDownloads || []).slice(0, 8).map((f) => ({ label: f.file, value: f.count }))} />
            </Card>
          </div>

          {buttons && (buttons.byButton?.length > 0 || buttons.byLocation?.length > 0) && (
            <div className="grid lg:grid-cols-2 gap-3 mt-3">
              <Card caption="Mavro events" title="Clicks by button" icon={MousePointerClick}>
                <DataTable
                  columns={['Button', 'Type', 'Clicks']}
                  rows={(buttons.byButton || []).slice(0, 12)}
                  renderRow={(r, idx) => (
                    <tr key={`${r.eventType}-${r.label}-${idx}`} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                      <Td className="truncate max-w-[200px]">{r.label}</Td>
                      <Td right><span className="text-muted-foreground">{r.eventType.replace('_click', '')}</span></Td>
                      <Td right mono>{fmtNum(r.count)}</Td>
                    </tr>
                  )}
                />
              </Card>
              <Card caption="Mavro events" title="Clicks by page location" icon={MapPin}>
                <DataTable
                  columns={['Location', 'Type', 'Clicks']}
                  rows={(buttons.byLocation || []).slice(0, 12)}
                  renderRow={(r, idx) => (
                    <tr key={`${r.eventType}-${r.location}-${idx}`} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                      <Td>{r.location}</Td>
                      <Td right><span className="text-muted-foreground">{r.eventType.replace('_click', '')}</span></Td>
                      <Td right mono>{fmtNum(r.count)}</Td>
                    </tr>
                  )}
                />
              </Card>
            </div>
          )}

          {/* ============ CONTENT ============ */}
          <SectionHeading>Content</SectionHeading>
          <Card caption="Pages" title="Top pages" icon={Eye}>
            <DataTable
              columns={['Page', 'Views', 'Users', 'Avg time']}
              rows={(ga4.topPages || []).slice(0, 12)}
              renderRow={(r) => (
                <tr key={r.path} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                  <Td className="truncate max-w-[280px] font-mono text-[10px]">{r.path}</Td>
                  <Td right mono>{fmtNum(r.views)}</Td>
                  <Td right mono>{fmtNum(r.users)}</Td>
                  <Td right mono>{fmtDuration(r.avgEngagementSec)}</Td>
                </tr>
              )}
            />
          </Card>

          {/* ============ SEARCH ============ */}
          <SectionHeading>Google Search</SectionHeading>
          {!gsc ? (
            <NotConfiguredCard
              what="Search Console"
              detail={errors.gsc || 'Set GSC_SITE_URL on the backend and add the service account under Search Console → Settings → Users and permissions.'}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile i={0} icon={MousePointerClick} label="Clicks from Google" value={fmtNum(gsc.totals.current.clicks)} delta={deltaPct(gsc.totals.current.clicks, gsc.totals.previous.clicks)} />
                <StatTile i={1} icon={Eye} label="Impressions" value={fmtNum(gsc.totals.current.impressions)} delta={deltaPct(gsc.totals.current.impressions, gsc.totals.previous.impressions)} />
                <StatTile i={2} icon={TrendingUp} label="CTR" value={`${(gsc.totals.current.ctr * 100).toFixed(1)}%`} delta={deltaPct(gsc.totals.current.ctr, gsc.totals.previous.ctr)} />
                <StatTile i={3} icon={SearchIcon} label="Avg position" value={gsc.totals.current.position || '—'} delta={gsc.totals.previous.position ? -deltaPct(gsc.totals.current.position, gsc.totals.previous.position) : null} hint="lower is better" />
              </div>

              <div className="grid lg:grid-cols-2 gap-3 mt-3">
                <Card caption="Daily" title="Search clicks" icon={SearchIcon}>
                  <div className="px-2 pb-4 pt-3 h-[220px]">
                    {gscTrendData.length === 0 ? <EmptyNote /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={gscTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="mbrGsc" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.violet} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={C.violet} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                          <XAxis dataKey="date" tickFormatter={fmtIsoDate} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={28} />
                          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                          <Tooltip content={<ChartTip labelFormatter={fmtIsoDate} />} />
                          <Area type="monotone" dataKey="Clicks" stroke={C.violet} strokeWidth={2} fill="url(#mbrGsc)" dot={false} activeDot={{ r: 4, fill: C.violet, strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>

                <Card caption="Queries" title="Top search queries" icon={SearchIcon}>
                  <DataTable
                    columns={['Query', 'Clicks', 'Impr.', 'Pos.']}
                    rows={(gsc.topQueries || []).slice(0, 10)}
                    renderRow={(r) => (
                      <tr key={r.query} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                        <Td className="truncate max-w-[220px]">{r.query}</Td>
                        <Td right mono>{fmtNum(r.clicks)}</Td>
                        <Td right mono>{fmtNum(r.impressions)}</Td>
                        <Td right mono>{r.position}</Td>
                      </tr>
                    )}
                  />
                </Card>
              </div>

              <div className="mt-3">
                <Card caption="Pages" title="Top pages in Google" icon={Globe}>
                  <DataTable
                    columns={['Page', 'Clicks', 'Impr.', 'CTR', 'Pos.']}
                    rows={(gsc.topPages || []).slice(0, 10)}
                    renderRow={(r) => (
                      <tr key={r.page} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                        <Td className="truncate max-w-[300px] font-mono text-[10px]">{r.page.replace(/^https?:\/\/[^/]+/, '') || '/'}</Td>
                        <Td right mono>{fmtNum(r.clicks)}</Td>
                        <Td right mono>{fmtNum(r.impressions)}</Td>
                        <Td right mono>{`${(r.ctr * 100).toFixed(1)}%`}</Td>
                        <Td right mono>{r.position}</Td>
                      </tr>
                    )}
                  />
                </Card>
              </div>
            </>
          )}

          {/* ============ AUDIENCE DETAIL ============ */}
          <SectionHeading>Audience detail</SectionHeading>
          <div className="grid lg:grid-cols-3 gap-3">
            <Card caption="Geography" title="Users by country" icon={Globe} className="lg:col-span-2">
              <GeoMap countries={ga4.countries || []} />
            </Card>
            <Card caption="Geography" title="Top cities" icon={MapPin}>
              <DataTable
                columns={['City', 'Users', 'Sessions']}
                rows={(ga4.geo || []).filter((r) => r.city && r.city !== '(not set)').slice(0, 9)}
                renderRow={(r, idx) => (
                  <tr key={`${r.city}-${idx}`} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                    <Td>
                      {r.city}
                      <span className="text-muted-foreground/60 ml-1.5 text-[10px]">{r.country}</span>
                    </Td>
                    <Td right mono>{fmtNum(r.users)}</Td>
                    <Td right mono>{fmtNum(r.sessions)}</Td>
                  </tr>
                )}
              />
            </Card>
          </div>
          <div className="grid lg:grid-cols-3 gap-3 mt-3 pb-8">
            <Card caption="Devices" title="Device split" icon={MonitorSmartphone}>
              <BarRows rows={(ga4.devices || []).map((d) => ({ label: d.device, value: d.users }))} />
            </Card>
            <Card caption="Geography" title="Top countries" icon={Globe} className="lg:col-span-2">
              <DataTable
                columns={['Country', 'Users', 'Sessions', 'Share']}
                rows={(ga4.countries || []).filter((c) => c.country && c.country !== '(not set)').slice(0, 8)}
                renderRow={(r, idx) => {
                  const total = (ga4.countries || []).reduce((s, c) => s + c.users, 0) || 1;
                  return (
                    <tr key={`${r.country}-${idx}`} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                      <Td>{r.country}</Td>
                      <Td right mono>{fmtNum(r.users)}</Td>
                      <Td right mono>{fmtNum(r.sessions)}</Td>
                      <Td right mono>{`${Math.round((r.users / total) * 100)}%`}</Td>
                    </tr>
                  );
                }}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
