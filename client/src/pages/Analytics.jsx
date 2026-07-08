import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import AnalyticsFilters from '@/components/analytics/AnalyticsFilters';
import AnalyticsOverview from '@/components/analytics/AnalyticsOverview';
import TrafficTimeline from '@/components/analytics/TrafficTimeline';
import ConversionFunnels from '@/components/analytics/ConversionFunnels';
import TenantComparison from '@/components/analytics/TenantComparison';
import RealtimeEventFeed from '@/components/analytics/RealtimeEventFeed';
import ContentPerformance from '@/components/analytics/ContentPerformance';
import TrafficIntelligence from '@/components/analytics/TrafficIntelligence';
import SeoTelemetry from '@/components/analytics/SeoTelemetry';
import OperationalInsights, { generateInsights } from '@/components/analytics/OperationalInsights';
import AnomalyAlerts from '@/components/analytics/AnomalyAlerts';
import BehaviorIntelligence from '@/components/analytics/BehaviorIntelligence';

import {
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getAnalyticsFunnel,
  getAnalyticsTenantComparison,
  getAnalyticsTopBlogs,
  getAnalyticsContentPerformance,
  getAnalyticsRealtime,
  getAnalyticsLandingPages,
  getAnalyticsExitPages,
  getAnalyticsEngagement,
  getAnalyticsReturning,
  getAnalyticsPageConversion,
  getAnalyticsPageBounce,
  getAnalyticsAnomalies,
} from '@/api/analytics';
import { getBlogs, getWordpressBlogs } from '@/api/blogs';

const REALTIME_POLL_MS = 15000;

export default function Analytics() {
  const [range, setRange] = useState('week');
  const [websiteSlug, setWebsiteSlug] = useState('all');
  const [refreshTick, setRefreshTick] = useState(0);

  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState({ series: [] });
  const [funnel, setFunnel] = useState({ stages: [] });
  const [tenantComparison, setTenantComparison] = useState({ tenants: [] });
  const [topBlogs, setTopBlogs] = useState([]);
  const [contentPerformance, setContentPerformance] = useState([]);
  const [realtime, setRealtime] = useState({ events: [], activeNow: 0 });
  const [landingPages, setLandingPages] = useState([]);
  const [exitPages, setExitPages] = useState([]);
  const [engagement, setEngagement] = useState(null);
  const [returning, setReturning] = useState(null);
  const [pageConversion, setPageConversion] = useState([]);
  const [pageBounce, setPageBounce] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [blogCorpusWithContent, setBlogCorpusWithContent] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===================================
  // Main analytics fetch
  // ===================================
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = { range };
    if (websiteSlug !== 'all') params.websiteSlug = websiteSlug;

    Promise.all([
      getAnalyticsOverview(params),
      getAnalyticsTimeseries(params),
      getAnalyticsFunnel(params),
      getAnalyticsTenantComparison({ range }),
      getAnalyticsTopBlogs({ ...params, limit: 8 }),
      getAnalyticsContentPerformance({ ...params, limit: 25 }),
      getAnalyticsLandingPages({ ...params, limit: 6 }),
      getAnalyticsExitPages({ ...params, limit: 6 }),
      getAnalyticsEngagement(params),
      getAnalyticsReturning(params),
      getAnalyticsPageConversion({ ...params, limit: 6 }),
      getAnalyticsPageBounce({ ...params, limit: 6 }),
      getAnalyticsAnomalies(params),
    ])
      .then(([ov, ts, fn, tc, tb, cp, lp, ep, eg, rv, pc, pb, an]) => {
        if (cancelled) return;
        setOverview(ov.data?.data || null);
        setTimeseries(ts.data?.data || { series: [] });
        setFunnel(fn.data?.data || { stages: [] });
        setTenantComparison(tc.data?.data || { tenants: [] });
        setTopBlogs(tb.data?.data?.blogs || []);
        setContentPerformance(cp.data?.data?.blogs || []);
        setLandingPages(lp.data?.data?.pages || []);
        setExitPages(ep.data?.data?.pages || []);
        setEngagement(eg.data?.data || null);
        setReturning(rv.data?.data || null);
        setPageConversion(pc.data?.data?.pages || []);
        setPageBounce(pb.data?.data?.pages || []);
        setAnomalies(an.data?.data?.anomalies || []);
      })
      .catch((e) => console.error('[analytics] main fetch failed', e))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [range, websiteSlug, refreshTick]);

  // ===================================
  // Realtime polling — 15s tick
  // ===================================
  useEffect(() => {
    let cancelled = false;
    const fetchRealtime = () => {
      const p = websiteSlug !== 'all' ? { websiteSlug, limit: 20, minutes: 30 } : { limit: 20, minutes: 30 };
      getAnalyticsRealtime(p)
        .then((r) => {
          if (cancelled) return;
          setRealtime(r.data?.data || { events: [], activeNow: 0 });
        })
        .catch(() => {});
    };
    fetchRealtime();
    const t = setInterval(fetchRealtime, REALTIME_POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [websiteSlug, refreshTick]);

  // ===================================
  // Blog corpus with content (for SEO Telemetry audit)
  // ===================================
  useEffect(() => {
    let cancelled = false;
    const params = { limit: 100, includeContent: true };
    // Resolve targetWebsite from slug if scoped
    const tenant = tenantComparison.tenants?.find((t) => t.slug === websiteSlug);
    if (tenant) params.targetWebsite = tenant._id;
    if (websiteSlug !== 'all' && !tenant) return;
    // WordPress-backed tenants (Website.wordpressUrl set — SaiSatwik) pull the
    // corpus via the WP adapter so SEO telemetry audits the live WP posts.
    const fetchCorpus = tenant?.wordpressUrl
      ? getWordpressBlogs(tenant.slug)
      : getBlogs(params);
    fetchCorpus
      .then((r) => {
        if (cancelled) return;
        setBlogCorpusWithContent(r.data?.data?.blogs || []);
      })
      .catch(() => !cancelled && setBlogCorpusWithContent([]));
    return () => { cancelled = true; };
  }, [websiteSlug, refreshTick, tenantComparison]);

  const insights = useMemo(
    () => generateInsights({
      tenantComparison,
      contentPerformance,
      overview,
      engagement,
      funnel,
    }),
    [tenantComparison, contentPerformance, overview, engagement, funnel]
  );

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"
      >
        <div>
          <p className="text-caption text-cyan-400/80 mb-2">Operational Telemetry</p>
          <h1 className="text-display">Analytics Intelligence</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Multi-tenant traffic, conversion, content, and SEO telemetry — derived from real events only
          </p>
        </div>
        <AnalyticsFilters
          range={range}
          onRangeChange={setRange}
          websiteSlug={websiteSlug}
          onWebsiteChange={setWebsiteSlug}
          onRefresh={refresh}
          liveCount={realtime?.activeNow}
        />
      </motion.div>

      {loading && !overview ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          {/* Tile row */}
          <AnalyticsOverview overview={overview} engagement={engagement} returning={returning} />

          {/* Anomaly Detection — surfaces critical operational events */}
          <AnomalyAlerts anomalies={anomalies} />

          {/* Operational insights — narrative observations */}
          <OperationalInsights insights={insights} />

          {/* Traffic timeline + Funnel */}
          <div className="grid lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <TrafficTimeline series={timeseries.series} range={range} />
            </div>
            <div className="lg:col-span-4">
              <ConversionFunnels funnel={funnel} />
            </div>
          </div>

          {/* Traffic intelligence (3 lists) */}
          <TrafficIntelligence
            landingPages={landingPages}
            exitPages={exitPages}
            topBlogs={topBlogs}
          />

          {/* Behavior intelligence — best converting + highest bounce pages */}
          <BehaviorIntelligence
            pageConversion={pageConversion}
            pageBounce={pageBounce}
          />

          {/* Tenant comparison */}
          {websiteSlug === 'all' && (
            <TenantComparison tenants={tenantComparison.tenants} />
          )}

          {/* Content performance + Realtime feed side-by-side */}
          <div className="grid lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <ContentPerformance blogs={contentPerformance} />
            </div>
            <div className="lg:col-span-5">
              <RealtimeEventFeed realtime={realtime} />
            </div>
          </div>

          {/* SEO telemetry rollup */}
          <SeoTelemetry
            contentPerformance={contentPerformance}
            blogsWithContent={blogCorpusWithContent}
          />
        </>
      )}
    </div>
  );
}
