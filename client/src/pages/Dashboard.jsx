import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe, FileText, BookOpen, Users, ArrowRight, Zap,
  Rss, TrendingUp, TrendingDown, Eye, MousePointerClick, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

import { GlassCard, GlassPanel } from '@/components/cyber/GlassCard';
import MetricOrb from '@/components/cyber/MetricOrb';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import IndexTabs from '@/components/ui/IndexTabs';
import { cn } from '@/lib/utils';

import { getWebsites } from '@/api/websites';
import { getBlogs } from '@/api/blogs';
import { getBlogStats } from '@/api/blogs';
import { getLeads } from '@/api/leads';
import { getLeadStats } from '@/api/leads';
import { getMbrStatus } from '@/api/mbr';
import { useTenant } from '@/context/TenantContext';
import {
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getAnalyticsTopPages,
  getAnalyticsPulse,
} from '@/api/analytics';

// ===================================
// Range filter
// ===================================
const RANGES = [
  { key: 'day',   label: 'Day' },
  { key: 'week',  label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year',  label: 'Year' },
];

function RangeFilter({ value, onChange }) {
  return (
    <IndexTabs
      tabs={RANGES.map((r) => ({ value: r.key, label: r.label }))}
      value={value}
      onChange={onChange}
    />
  );
}

// ===================================
// Trend pill
// ===================================
function TrendPill({ delta, unit = '%' }) {
  if (delta == null || Number.isNaN(delta)) return null;
  const positive = delta >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] font-semibold',
      positive ? 'text-emerald-400' : 'text-rose-400'
    )}>
      <Icon size={11} />
      {positive ? '+' : ''}{delta}{unit}
    </span>
  );
}

// ===================================
// Tick formatting per range
// ===================================
function formatTick(ts, range) {
  const d = new Date(ts);
  if (range === 'day') return d.toLocaleTimeString(undefined, { hour: '2-digit', hour12: false });
  if (range === 'year') return d.toLocaleDateString(undefined, { month: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function customTooltip(range) {
  return ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-elevated rounded-lg px-3 py-2 text-xs">
        <p className="font-semibold mb-1">{formatTick(label, range)}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="capitalize">{p.name}</span>
            <span className="font-mono font-semibold ml-2">{p.value}</span>
          </p>
        ))}
      </div>
    );
  };
}

// Real status row for the System Pulse card — green when healthy, amber when
// degraded, red when broken. No hardcoded LIVEs; every state is measured.
function PulseRow({ label, ok, warn = false, state, detail }) {
  const tone = ok && !warn ? 'text-emerald-400' : warn ? 'text-amber-400' : 'text-rose-400';
  const dot = ok && !warn ? 'bg-emerald-400' : warn ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="flex items-center justify-between py-1">
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        {detail && <span className="text-[10px] text-muted-foreground/60 ml-2">{detail}</span>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className={cn('w-2 h-2 rounded-full', dot)} />
        <span className={cn('text-[10px] font-semibold font-mono', tone)}>{state}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { selected: tenantSlug, selectedWebsite, websites: allWebsites } = useTenant();
  const [range, setRange] = useState('week');
  const [stats, setStats] = useState({ websites: 0, blogs: 0, published: 0 });
  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [pulse, setPulse] = useState(undefined); // undefined=loading, null=API down
  const [mbrSources, setMbrSources] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial + tenant-scoped fetch for headline counts + recent blogs/leads
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (tenantSlug === 'all') {
          // Cross-tenant: use existing stats endpoints
          const [blogRes, leadRes] = await Promise.all([
            getBlogStats(),
            getLeadStats(),
          ]);
          if (cancelled) return;
          const blogData = blogRes.data.data;
          const leadData = leadRes.data.data;
          setStats({
            websites: allWebsites.length,
            blogs: blogData.total || 0,
            published: blogData.published || 0,
          });
          setRecentBlogs(blogData.recentBlogs || []);
          setRecentLeads(leadData.recentLeads || []);
        } else if (selectedWebsite) {
          // Tenant-scoped: fetch blogs + leads filtered by website id
          const websiteId = selectedWebsite._id;
          const [blogList, leadList, blogStatsRes] = await Promise.all([
            getBlogs({ targetWebsite: websiteId, limit: 5, sortBy: 'createdAt', order: 'desc' }),
            getLeads({ website: websiteId, limit: 5, sortBy: 'createdAt', order: 'desc' }),
            getBlogStats({ targetWebsite: websiteId }).catch(() => null),
          ]);
          if (cancelled) return;
          const blogStats = blogStatsRes?.data?.data || {};
          setStats({
            websites: 1,
            blogs: blogStats.total ?? blogList?.data?.pagination?.total ?? 0,
            published: blogStats.published ?? 0,
          });
          setRecentBlogs(blogList?.data?.data?.blogs || []);
          setRecentLeads(leadList?.data?.data?.leads || []);
        }
      } catch (e) {
        console.error('Dashboard load error:', e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [tenantSlug, selectedWebsite, allWebsites]);

  // Re-fetch analytics on range or tenant change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const analyticsParams = { range };
    if (tenantSlug !== 'all') analyticsParams.websiteSlug = tenantSlug;
    Promise.all([
      getAnalyticsOverview(analyticsParams),
      getAnalyticsTimeseries(analyticsParams),
      getAnalyticsTopPages({ range, limit: 5 }),
    ])
      .then(([ov, ts, tp]) => {
        if (cancelled) return;
        setOverview(ov.data?.data || null);
        setSeries(ts.data?.data?.series || []);
        setTopPages(tp.data?.data?.pages || []);
      })
      .catch((e) => console.error('Analytics fetch failed:', e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [range, tenantSlug]);

  // System pulse — real signals, fetched once per visit
  useEffect(() => {
    let cancelled = false;
    getAnalyticsPulse()
      .then((r) => { if (!cancelled) setPulse(r.data?.data || null); })
      .catch(() => { if (!cancelled) setPulse(null); });
    getMbrStatus()
      .then((r) => { if (!cancelled) setMbrSources(r.data?.data?.sources || []); })
      .catch(() => { if (!cancelled) setMbrSources([]); });
    return () => { cancelled = true; };
  }, []);

  const chartData = useMemo(
    () => series.map((s) => ({ ts: s.ts, views: s.views, sessions: s.sessions })),
    [series]
  );

  const m = overview?.metrics || {};

  // Blogs + leads interleaved chronologically — the one Activity feed
  const activityItems = [
    ...recentBlogs.slice(0, 4).map((b) => ({
      type: 'blog',
      id: b._id,
      target: b.title,
      website: b.targetWebsite?.name,
      status: b.status,
      at: b.createdAt,
    })),
    ...recentLeads.slice(0, 3).map((l) => ({
      type: 'lead',
      id: l._id,
      target: l.name || l.email,
      website: l.website?.name,
      at: l.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .map((i) => ({ ...i, time: new Date(i.at).toLocaleDateString() }));

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════
          COMMAND HEADER
          ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <p className="text-caption text-violet-400/80 mb-2">Operations Console</p>
          <h1 className="text-display"><span className="hand-circle">Command Center</span></h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {tenantSlug === 'all'
              ? `Real-time analytics across ${stats.websites} ${stats.websites === 1 ? 'property' : 'properties'}`
              : `Scoped to ${selectedWebsite?.name || tenantSlug}`} · {range} window
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RangeFilter value={range} onChange={setRange} />
          <Link to="/blogs/new">
            <Button size="sm" className="gap-2 glow-violet">
              <Zap size={14} /> Quick Publish
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          METRIC ORBS — REAL ANALYTICS
          ═══════════════════════════════════════════ */}
      <GlassCard className="p-6 md:p-8" delay={0.1}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <MetricOrb
            value={m.visitors?.value ?? 0}
            label="Visitors"
            sublabel={<TrendPill delta={m.visitors?.delta} />}
            icon={Users}
            color="violet"
            delay={0.15}
          />
          <MetricOrb
            value={m.pageViews?.value ?? 0}
            label="Page Views"
            sublabel={<TrendPill delta={m.pageViews?.delta} />}
            icon={Eye}
            color="cyan"
            delay={0.2}
          />
          <MetricOrb
            value={m.blogViews?.value ?? 0}
            label="Blog Views"
            sublabel={<TrendPill delta={m.blogViews?.delta} />}
            icon={BookOpen}
            color="emerald"
            delay={0.25}
          />
          <MetricOrb
            value={m.leads?.value ?? 0}
            label="Leads"
            sublabel={<TrendPill delta={m.leads?.delta} />}
            icon={Activity}
            color="amber"
            delay={0.3}
          />
        </div>
      </GlassCard>

      {/* ═══════════════════════════════════════════
          ASYMMETRIC GRID — TRAFFIC + CONVERSIONS
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── LEFT: Traffic Analytics (8 cols) ── */}
        <div className="lg:col-span-8">
          <GlassCard delay={0.2}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div>
                <p className="text-caption text-cyan-400/60">Performance</p>
                <h3 className="text-title mt-1">Traffic & Sessions</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500" /> Views
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Sessions
                </span>
              </div>
            </div>
            <div className="px-2 pb-4 h-[260px]">
              {loading && chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading…</div>
              ) : chartData.every((p) => p.views === 0 && p.sessions === 0) ? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  No analytics events captured in the selected window yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(14, 73%, 58%)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(14, 73%, 58%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(188, 45%, 56%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(188, 45%, 56%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                    <XAxis
                      dataKey="ts"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => formatTick(v, range)}
                      minTickGap={28}
                    />
                    <YAxis hide />
                    <Tooltip content={customTooltip(range)} />
                    <Area type="monotone" dataKey="views" stroke="hsl(14, 73%, 58%)" fill="url(#gViews)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'hsl(14, 73%, 58%)', strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="sessions" stroke="hsl(188, 45%, 56%)" fill="url(#gSessions)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'hsl(188, 45%, 56%)', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </div>

        {/* ── RIGHT: Conversion + CTAs (4 cols) ── */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="p-5" glow="violet" delay={0.25}>
            <p className="text-caption text-violet-400/60 mb-4">Conversion Engine</p>
            <div className="space-y-4">
              <KpiRow
                icon={MousePointerClick}
                label="CTA Clicks"
                value={m.ctaClicks?.value ?? 0}
                delta={m.ctaClicks?.delta}
                color="violet"
              />
              <KpiRow
                icon={FileText}
                label="Form Submits"
                value={m.formSubmits?.value ?? 0}
                delta={m.formSubmits?.delta}
                color="cyan"
              />
              <KpiRow
                icon={Activity}
                label="Conv. Rate"
                value={`${m.conversionRate?.value ?? 0}%`}
                delta={m.conversionRate?.delta}
                unit=" pt"
                color="emerald"
              />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SECOND ROW — Top Pages + Activity + System Pulse
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── Top Pages (4 cols, top 5) ── */}
        <div className="lg:col-span-4">
          <GlassPanel title="Top Pages" caption="Traffic Sources" delay={0.3}>
            <div className="max-h-[300px] overflow-y-auto pr-1 -mr-1 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
              {topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 py-8 text-center">No tracked page views yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {topPages.slice(0, 5).map((p, i) => {
                    const max = topPages[0].views;
                    const pct = max ? (p.views / max) * 100 : 0;
                    return (
                      <motion.li
                        key={p.page}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                        className="relative px-3 py-2.5 rounded-lg overflow-hidden group hover:bg-foreground/[0.03] transition-colors"
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500/12 to-violet-500/0 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative flex items-center gap-3">
                          <span className="text-[11px] font-mono text-muted-foreground/60 w-6">{String(i + 1).padStart(2, '0')}</span>
                          <span className="text-sm font-medium truncate flex-1">{p.page}</span>
                          <span className="text-xs text-muted-foreground font-mono">{p.sessions}</span>
                          <span className="text-sm font-mono font-semibold tabular-nums w-12 text-right">{p.views}</span>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>
          </GlassPanel>
        </div>

        {/* ── Activity (4 cols) — blogs + leads, chronological ── */}
        <div className="lg:col-span-4">
          <GlassCard delay={0.35}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div>
                <p className="text-caption text-emerald-400/60">Activity</p>
                <h3 className="text-title mt-1">Latest across everything</h3>
              </div>
              <Link to="/blogs" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="px-2 pb-3 max-h-[300px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
              {activityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 py-8 text-center">No recent activity</p>
              ) : (
                activityItems.map((item, i) => (
                  <Link key={`${item.type}-${item.id}`} to={item.type === 'lead' ? '/leads' : '/blogs'} className="block">
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/[0.03] transition-colors group"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-border bg-foreground/[0.03]'
                      )}>
                        {item.type === 'lead'
                          ? <Users size={13} className="text-rose-400" />
                          : <FileText size={13} className="text-emerald-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.target}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                          {item.website || '—'} · {item.time}
                        </p>
                      </div>
                      {item.type === 'lead'
                        ? <span className="stamp text-rose-400 text-[8.5px]">Lead</span>
                        : <Badge variant={item.status || 'draft'} className="text-[8.5px]">{item.status}</Badge>}
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* ── System Pulse (4 cols) — real checks, no hardcoded LIVE ── */}
        <div className="lg:col-span-4">
          <GlassCard className="p-5" delay={0.4}>
            <p className="text-caption text-violet-400/60 mb-4">System Pulse</p>
            <div className="space-y-3">
              {/* API — reaching this means the fetch round-tripped */}
              <PulseRow
                label="Admin API"
                ok={pulse !== undefined}
                state={pulse === null ? 'DOWN' : pulse === undefined ? '…' : 'LIVE'}
              />
              {/* Analytics ingestion — age of the newest event */}
              <PulseRow
                label="Analytics ingestion"
                ok={pulse?.minutesAgo != null && pulse.minutesAgo < 24 * 60}
                warn={pulse?.minutesAgo != null && pulse.minutesAgo >= 120 && pulse.minutesAgo < 24 * 60}
                state={
                  pulse?.minutesAgo == null
                    ? 'NO EVENTS'
                    : pulse.minutesAgo < 60
                      ? `${pulse.minutesAgo}m ago`
                      : `${Math.round(pulse.minutesAgo / 60)}h ago`
                }
                detail={pulse?.eventsToday != null ? `${pulse.eventsToday} events today` : null}
              />
              {/* Google integrations per MBR source */}
              {(mbrSources || []).map((s) => (
                <PulseRow
                  key={s.key}
                  label={`${s.label} · GA4 + Search Console`}
                  ok={s.ga4 && s.gsc}
                  warn={s.ga4 !== s.gsc}
                  state={s.ga4 && s.gsc ? 'CONNECTED' : s.ga4 || s.gsc ? 'PARTIAL' : 'NOT SET'}
                />
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-4">
              <Link to="/leads" className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400/90 hover:text-rose-400 transition-colors">
                Leads <ArrowRight size={10} />
              </Link>
              <Link to="/mbr" className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-400/90 hover:text-violet-400 transition-colors">
                MBR Report <ArrowRight size={10} />
              </Link>
              <Link to="/analytics" className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400/90 hover:text-cyan-400 transition-colors">
                Analytics <ArrowRight size={10} />
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>

    </div>
  );
}

function KpiRow({ icon: Icon, label, value, delta, unit, color = 'violet' }) {
  const tone = {
    violet:  'text-violet-400 bg-violet-500/10 border-violet-500/30',
    cyan:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  }[color] || '';
  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0', tone)}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-xl font-bold font-mono tabular-nums">{value}</p>
          <TrendPill delta={delta} unit={unit || '%'} />
        </div>
      </div>
    </div>
  );
}
