import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe, FileText, BookOpen, Users, ArrowRight, Zap,
  Rss, TrendingUp, TrendingDown, Eye, MousePointerClick, Activity,
  ExternalLink, Smartphone, Laptop, Tablet, Bot, HelpCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

import { GlassCard, GlassPanel } from '@/components/cyber/GlassCard';
import MetricOrb from '@/components/cyber/MetricOrb';
import ActivityRail from '@/components/cyber/ActivityRail';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { getWebsites } from '@/api/websites';
import { getBlogs } from '@/api/blogs';
import { getBlogStats } from '@/api/blogs';
import { getLeads } from '@/api/leads';
import { getLeadStats } from '@/api/leads';
import { useTenant } from '@/context/TenantContext';
import {
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getAnalyticsTopPages,
  getAnalyticsBreakdown,
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
    <div className="inline-flex items-center p-1 rounded-xl bg-card/60 backdrop-blur-xl border border-border/70">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={cn(
            'relative px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-lg transition-colors',
            value === r.key
              ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/40'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
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

const DEVICE_ICON = { desktop: Laptop, mobile: Smartphone, tablet: Tablet, bot: Bot, unknown: HelpCircle };

export default function Dashboard() {
  const { selected: tenantSlug, selectedWebsite, websites: allWebsites } = useTenant();
  const [range, setRange] = useState('week');
  const [stats, setStats] = useState({ websites: 0, blogs: 0, published: 0 });
  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [breakdown, setBreakdown] = useState({ devices: [], referrers: [] });
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
      getAnalyticsTopPages({ range, limit: 6 }),
      getAnalyticsBreakdown({ range }),
    ])
      .then(([ov, ts, tp, bk]) => {
        if (cancelled) return;
        setOverview(ov.data?.data || null);
        setSeries(ts.data?.data?.series || []);
        setTopPages(tp.data?.data?.pages || []);
        setBreakdown(bk.data?.data || { devices: [], referrers: [] });
      })
      .catch((e) => console.error('Analytics fetch failed:', e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [range, tenantSlug]);

  const chartData = useMemo(
    () => series.map((s) => ({ ts: s.ts, views: s.views, sessions: s.sessions })),
    [series]
  );

  const m = overview?.metrics || {};
  const deviceMax = breakdown.devices.reduce((max, d) => Math.max(max, d.count), 0) || 1;

  const activityItems = [
    ...recentBlogs.slice(0, 3).map((b) => ({
      type: 'publish',
      action: 'Published',
      target: b.title,
      website: b.targetWebsite?.name,
      time: new Date(b.createdAt).toLocaleDateString(),
    })),
    ...recentLeads.slice(0, 3).map((l) => ({
      type: 'lead',
      action: 'New lead',
      target: l.name,
      website: l.website?.name,
      time: new Date(l.createdAt).toLocaleDateString(),
    })),
  ];

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
          SECOND ROW — Top Pages + Activity + Devices
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── Top Pages (5 cols) ── */}
        <div className="lg:col-span-5">
          <GlassPanel title="Top Pages" caption="Traffic Sources" delay={0.3}>
            <div className="max-h-[300px] overflow-y-auto pr-1 -mr-1 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
              {topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 py-8 text-center">No tracked page views yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {topPages.map((p, i) => {
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

        {/* ── Publishing & Lead Feed (4 cols) ── */}
        <div className="lg:col-span-4">
          <GlassPanel title="Publishing Feed" caption="Activity" delay={0.35}>
            <div className="max-h-[300px] overflow-y-auto pr-1 -mr-1 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
              {activityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 py-6 text-center">No recent activity</p>
              ) : (
                <ActivityRail items={activityItems} />
              )}
            </div>
          </GlassPanel>
        </div>

        {/* ── Devices breakdown (3 cols) ── */}
        <div className="lg:col-span-3">
          <GlassCard className="p-5" glow="cyan" delay={0.4}>
            <p className="text-caption text-cyan-400/60 mb-4">Device Mix</p>
            {breakdown.devices.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 text-center py-4">No device data</p>
            ) : (
              <div className="space-y-2.5">
                {breakdown.devices.map((d) => {
                  const Icon = DEVICE_ICON[d.device] || HelpCircle;
                  const pct = ((d.count / deviceMax) * 100).toFixed(0);
                  return (
                    <div key={d.device}>
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="flex items-center gap-1.5 capitalize">
                          <Icon size={12} className="text-violet-400" />
                          {d.device}
                        </span>
                        <span className="font-mono text-muted-foreground">{d.count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-foreground/[0.06] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top referrers */}
            {breakdown.referrers.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border/60">
                <p className="text-caption text-amber-400/60 mb-3">Top Referrers</p>
                <ul className="space-y-1.5">
                  {breakdown.referrers.slice(0, 4).map((r) => (
                    <li key={r.source} className="flex items-center justify-between text-[12px]">
                      <span className="truncate flex items-center gap-1.5">
                        <ExternalLink size={10} className="text-muted-foreground/60 flex-shrink-0" />
                        {r.source}
                      </span>
                      <span className="font-mono text-muted-foreground">{r.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          THIRD ROW — Recent content + system status
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <GlassCard delay={0.45}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div>
                <p className="text-caption text-emerald-400/60">Content</p>
                <h3 className="text-title mt-1">Recent Publications</h3>
              </div>
              <Link to="/blogs" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="px-2 pb-3">
              {recentBlogs.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 py-8 text-center">No published content yet</p>
              ) : (
                recentBlogs.slice(0, 4).map((blog, i) => (
                  <motion.div
                    key={blog._id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/[0.03] transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText size={14} className="text-violet-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-violet-300 transition-colors">{blog.title}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                        {blog.targetWebsite?.name || '—'} · {new Date(blog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={blog.status === 'published' ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      {blog.status}
                    </Badge>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-5">
          <GlassCard className="p-5" glow="violet" delay={0.5}>
            <p className="text-caption text-violet-400/60 mb-3">System Status</p>
            <div className="space-y-3">
              {[
                { label: 'Analytics Ingestion', status: 'live' },
                { label: 'Sitemap Generation', status: 'live' },
                { label: 'Robots.txt Serving', status: 'live' },
                { label: 'Search Engine Ping', status: 'live' },
                { label: 'Lead Capture API', status: 'live' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_hsl(95_35%_45%/0.6)]" />
                    <span className="text-[10px] font-medium text-emerald-400/80">LIVE</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                to="/leads"
                className="group flex items-center justify-between mb-3 hover:text-foreground transition-colors"
              >
                <span className="text-caption text-amber-400/60 group-hover:text-amber-400 transition-colors">Lead Intelligence</span>
                <ArrowRight size={12} className="text-amber-400/40 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
              {recentLeads.length === 0 ? (
                <Link
                  to="/leads"
                  className="block text-xs text-muted-foreground/50 hover:text-muted-foreground text-center py-3 transition-colors"
                >
                  No leads captured · view all →
                </Link>
              ) : (
                <>
                  {recentLeads.slice(0, 3).map((lead, i) => (
                    <Link
                      key={lead._id}
                      to="/leads"
                      className="block"
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 + i * 0.06 }}
                        className="flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-md hover:bg-foreground/[0.04] transition-colors cursor-pointer group"
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center flex-shrink-0">
                          <Users size={10} className="text-amber-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate group-hover:text-amber-300 transition-colors">{lead.name}</p>
                          <p className="text-[10px] text-muted-foreground/60 truncate">{lead.email}</p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                  <Link
                    to="/leads"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400/80 hover:text-amber-400 transition-colors"
                  >
                    View all leads <ArrowRight size={10} />
                  </Link>
                </>
              )}
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
