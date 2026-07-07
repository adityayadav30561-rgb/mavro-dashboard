import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import {
  Search, FileText, Globe, Rss, ExternalLink, RefreshCw, Radar,
  ShieldCheck, AlertTriangle, AlertCircle, Info, CheckCircle2, Loader2,
  Hash, Image as ImageIcon, Link2, FileSearch, Clock, ChevronDown,
  Sparkles, BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { GlassCard, GlassPanel } from '@/components/cyber/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

import { getWebsites } from '@/api/websites';
import { getBlogs } from '@/api/blogs';
import { getSeoStats, getSitemapStats, pingSearchEngines } from '@/api/seo';
import {
  auditCorpus, SEVERITY, SEVERITIES, CATEGORIES, CATEGORY_LABELS,
  CATEGORY_WEIGHTS, gradeLetter, interpretation,
} from '@/lib/seoHealth';
import { gradeFromFlesch } from '@/lib/seoReadability';
import { analyzeLinkGraph } from '@/lib/linkGraphIntel';
import LinkGraph from '@/components/seo/LinkGraph';
import OrphanPanel from '@/components/seo/OrphanPanel';
import LinkingQualityCard from '@/components/seo/LinkingQualityCard';
import InfoPopover from '@/components/analytics/InfoPopover';
import { getSeoInfo, SEO_INFO } from '@/lib/seoCopy';
import { analyzeCorpusDecay, buildTrendsBySlug } from '@/lib/contentDecay';
import ContentDecayPanel from '@/components/seo/ContentDecayPanel';
import DecayQueueCard from '@/components/seo/DecayQueueCard';
import DecayAlertsStrip from '@/components/seo/DecayAlertsStrip';
import { getAnalyticsBlogTrends } from '@/api/analytics';
import { useNavigate } from 'react-router-dom';
import TopicalClusterPanel from '@/components/seo/TopicalClusterPanel';
import AiSiteIntelligencePanel from '@/components/seo/AiSiteIntelligencePanel';

// ===================================
// Helpers
// ===================================
function ringTone(score) {
  if (score >= 90) return 'hsl(95 35% 45%)';   // A — emerald
  if (score >= 80) return 'hsl(188 45% 55%)';   // B — cyan
  if (score >= 70) return 'hsl(36 72% 55%)';    // C — amber
  if (score >= 60) return 'hsl(28 85% 55%)';    // D — orange
  return                  'hsl(352 55% 60%)';   // F — rose
}

function publicUrlFromDomain(domain) {
  if (!domain) return null;
  const trimmed = domain.trim().replace(/^https?:\/\//, '');
  if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) return `http://${trimmed}`;
  return `https://${trimmed}`;
}

// sitemap.xml / robots.txt are served at the root of the website's own public
// domain (the Next SSR site proxies the backend there). Derive from the stored
// domain so the URL matches the Search Console property — domain `spanbix.com`
// → `https://spanbix.com/sitemap.xml`. www 301s to apex at the Vercel domain
// layer. The old window.location + :5000 form produced
// https://mavro-dashboard.vercel.app:5000/... on Vercel — broken.
function sitemapXmlUrl(domain) {
  const base = publicUrlFromDomain(domain);
  return base ? `${base}/sitemap.xml` : '';
}

function robotsTxtUrl(domain) {
  const base = publicUrlFromDomain(domain);
  return base ? `${base}/robots.txt` : '';
}

const severityIcon = {
  critical: AlertCircle,
  warning:  AlertTriangle,
  notice:   Info,
};

// ===================================
// Main page
// ===================================
export default function SeoEngine() {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [selected, setSelected] = useState('all'); // 'all' or websiteId
  const [loading, setLoading] = useState(true);
  const [blogsByWebsite, setBlogsByWebsite] = useState({}); // { [websiteId]: blogs[] }
  const [sitemapStats, setSitemapStats] = useState({});     // { [websiteId]: {blogUrls, staticUrls, totalUrls} }
  const [seoStats, setSeoStats] = useState(null);
  const [pingingSlug, setPingingSlug] = useState(null);
  const [blogTrendsBySlug, setBlogTrendsBySlug] = useState(new Map());
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Load tenants once
  useEffect(() => {
    (async () => {
      try {
        const res = await getWebsites({ limit: 100 });
        const list = res.data?.data?.websites || [];
        setWebsites(list);
      } catch { toast.error('Failed to load websites'); }
    })();
  }, []);

  // Load corpus + per-tenant sitemap stats whenever website list resolves
  useEffect(() => {
    if (!websites.length) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [blogResults, sitemapResults, statsRes] = await Promise.all([
          Promise.all(websites.map((w) =>
            // Backend caps limit at 100 (blogQueryRules); audit fits comfortably
            // for current scale. Add pagination loop here if corpus grows beyond.
            // includeContent=true is required so word-count + heading audits
            // operate on the rendered HTML (default list view strips content
            // for performance).
            getBlogs({ targetWebsite: w._id, limit: 100, includeContent: true })
              .then((r) => [w._id, r.data?.data?.blogs || []])
              .catch((err) => {
                console.warn(`[SEO] blog corpus fetch failed for ${w.slug}:`, err?.response?.data || err?.message);
                return [w._id, []];
              })
          )),
          Promise.all(websites.map((w) =>
            getSitemapStats(w._id)
              .then((r) => [w._id, r.data?.data || null])
              .catch(() => [w._id, null])
          )),
          getSeoStats().catch(() => null),
        ]);
        if (cancelled) return;
        setBlogsByWebsite(Object.fromEntries(blogResults));
        setSitemapStats(Object.fromEntries(sitemapResults));
        setSeoStats(statsRes?.data?.data || null);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [websites]);

  // Scope corpus to selected tenant
  const scopedBlogs = useMemo(() => {
    if (selected === 'all') {
      return Object.values(blogsByWebsite).flat();
    }
    return blogsByWebsite[selected] || [];
  }, [selected, blogsByWebsite]);

  const scopedSitemap = useMemo(() => {
    if (selected === 'all') {
      const agg = Object.values(sitemapStats).filter(Boolean).reduce((a, s) => ({
        blogUrls:   a.blogUrls   + (s.blogUrls   || 0),
        staticUrls: a.staticUrls + (s.staticUrls || 0),
        totalUrls:  a.totalUrls  + (s.totalUrls  || 0),
      }), { blogUrls: 0, staticUrls: 0, totalUrls: 0 });
      return agg;
    }
    return sitemapStats[selected] || { blogUrls: 0, staticUrls: 0, totalUrls: 0 };
  }, [selected, sitemapStats]);

  const audit = useMemo(() => auditCorpus(scopedBlogs), [scopedBlogs]);

  // Cross-corpus internal-linking intelligence (graph + clusters + orphans + score)
  const linkIntel = useMemo(() => analyzeLinkGraph(scopedBlogs), [scopedBlogs]);

  const scopedWebsites = selected === 'all' ? websites : websites.filter((w) => w._id === selected);
  const selectedSlug = selected === 'all' ? 'all' : (websites.find((w) => w._id === selected)?.slug || 'all');

  // Fetch per-blog trend deltas whenever the tenant scope changes.
  // Used by the Content Decay engine for engagement-trend signals.
  useEffect(() => {
    let cancelled = false;
    setTrendsLoading(true);
    getAnalyticsBlogTrends({ websiteSlug: selectedSlug, range: 'month' })
      .then((r) => {
        if (cancelled) return;
        const arr = r?.data?.data?.blogs || [];
        setBlogTrendsBySlug(buildTrendsBySlug(arr));
      })
      .catch(() => { if (!cancelled) setBlogTrendsBySlug(new Map()); })
      .finally(() => { if (!cancelled) setTrendsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedSlug]);

  // Content decay analysis — combines audit corpus + trend deltas + link graph
  const decay = useMemo(() => analyzeCorpusDecay({
    auditCorpusResult: audit,
    trendsBySlug: blogTrendsBySlug,
    graphByBlogId: linkIntel.graph.byId,
  }), [audit, blogTrendsBySlug, linkIntel.graph]);

  // ===================================
  // Actions
  // ===================================
  const onPing = async (slug) => {
    setPingingSlug(slug);
    try {
      await pingSearchEngines(slug);
      toast.success(`Pinged search engines for ${slug}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Ping failed');
    } finally { setPingingSlug(null); }
  };

  const refreshAll = () => {
    if (websites.length) setWebsites([...websites]); // re-trigger effect
  };

  // ===================================
  // Render
  // ===================================
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"
      >
        <div>
          <p className="text-caption text-violet-400/80 mb-2">Search Operations Center</p>
          <h1 className="text-display">SEO Engine</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Multi-tenant SEO intelligence · sitemap operations · indexing telemetry · content audit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TenantSelector websites={websites} value={selected} onChange={setSelected} />
          <button
            onClick={refreshAll}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold bg-card/70 backdrop-blur-xl border border-border/70 hover:bg-card hover:border-border transition-all"
            title="Refresh"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}

      {!loading && (
        <>
          {/* ═══════════════════════════════════════════
              SECTION 1 — OVERVIEW
              ═══════════════════════════════════════════ */}
          <SectionHeader caption="Overview" title="Weighted SEO Audit · Operational Telemetry" infoKey="section_overview" />
          <GlassCard className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Score + grade + interpretation column */}
              <div className="lg:col-span-3 flex flex-col items-center">
                <div className="relative min-h-[220px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <RadialBarChart innerRadius="76%" outerRadius="100%" data={[{ value: audit.totals.overall }]} startAngle={210} endAngle={-30}>
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={20} fill={ringTone(audit.totals.overall)} background={{ fill: 'hsl(var(--muted) / 0.25)' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[2.6rem] font-bold font-mono tracking-tight leading-none" style={{ color: ringTone(audit.totals.overall) }}>
                      {audit.totals.overall}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: ringTone(audit.totals.overall) }}>
                      Grade <span className="text-base font-bold font-mono">{audit.totals.grade.letter}</span>
                    </span>
                  </div>
                </div>
                <InterpretationBadge interp={audit.totals.interpretation} />
              </div>

              {/* Category bars + tiles */}
              <div className="lg:col-span-9 space-y-4">
                {/* Category breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {CATEGORIES.map((cat) => (
                    <CategoryBar
                      key={cat}
                      label={CATEGORY_LABELS[cat]}
                      weight={Math.round(CATEGORY_WEIGHTS[cat] * 100)}
                      score={audit.totals.categoryScores[cat]}
                      infoKey={`category_${cat}`}
                    />
                  ))}
                </div>

                {/* Operational tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <OverviewTile icon={Hash}         label="Indexed Pages"        value={scopedSitemap.totalUrls}                accent="text-violet-400" infoKey="indexed_pages" />
                  <OverviewTile icon={FileText}     label="Published Blogs"      value={audit.totals.published}                 accent="text-cyan-400" infoKey="published_blogs" />
                  <OverviewTile icon={FileSearch}   label="Avg Content Length"   value={`${audit.totals.avgWordCount}w`}        accent="text-amber-400" infoKey="avg_content_length" />
                  <OverviewTile icon={BadgeCheck}   label="Readability (Flesch)" value={audit.totals.avgReadability}            accent="text-emerald-400" infoKey="readability_avg" infoCtx={{ score: audit.totals.avgReadability }} />
                  <OverviewTile icon={Rss}          label="Sitemap Status"       value={scopedSitemap.totalUrls > 0 ? 'Live' : 'Empty'} accent={scopedSitemap.totalUrls > 0 ? 'text-emerald-400' : 'text-amber-400'} infoKey="sitemap_status" />
                  <OverviewTile icon={AlertCircle}  label="Critical"             value={audit.totals.critical}                  accent="text-rose-400" infoKey="critical_count" />
                  <OverviewTile icon={AlertTriangle} label="Warnings"            value={audit.totals.warnings}                  accent="text-amber-400" infoKey="warning_count" />
                  <OverviewTile icon={Info}         label="Notices"              value={audit.totals.notices}                   accent="text-cyan-400" infoKey="notice_count" />
                </div>
              </div>
            </div>

            {/* Score explanation footer */}
            <div className="mt-5 pt-4 border-t border-border/60 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-mono text-muted-foreground">
              <span className="font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Score formula</span>
              {CATEGORIES.map((cat) => (
                <span key={cat} className="inline-flex items-center gap-1">
                  <span className="text-foreground/70">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-violet-400">{Math.round(CATEGORY_WEIGHTS[cat] * 100)}%</span>
                </span>
              ))}
              <span className="ml-auto inline-flex items-center gap-2 text-[10px] text-muted-foreground/70">
                Caps: &lt;100w → 35 · &lt;300w → 55 · &lt;700w → 75
              </span>
            </div>
          </GlassCard>

          {/* ═══════════════════════════════════════════
              CONTENT-DOMINANT INSIGHTS — strengths / weaknesses / hard fails
              ═══════════════════════════════════════════ */}
          <InsightsPanel audit={audit} />

          {/* ═══════════════════════════════════════════
              AI SITE INTELLIGENCE — strategic command surface (Phase 4.1)
              Tenant-scoped only. Deterministic signals from the audit +
              linkGraph + decay engines feed the prompt as ground truth so
              the AI interprets rather than re-scores.
              ═══════════════════════════════════════════ */}
          {selected !== 'all' && (
            <AiSiteIntelligencePanel
              targetWebsite={selected}
              tenantSlug={selectedSlug}
              tenantName={websites.find((w) => w._id === selected)?.name}
              deterministic={{
                avgSeoScore: audit?.corpusOverall ?? null,
                linkGraph: {
                  orphanCount: linkIntel?.orphans?.length ?? 0,
                  clusterCount: linkIntel?.clusters?.length ?? 0,
                  qualityScore: linkIntel?.quality?.score ?? null,
                },
                decay: {
                  criticalCount: (decay?.items || []).filter((d) => d.state === 'critical').length,
                  decliningCount: (decay?.items || []).filter((d) => d.state === 'declining').length,
                  agingCount: (decay?.items || []).filter((d) => d.state === 'aging').length,
                },
              }}
            />
          )}

          {/* ═══════════════════════════════════════════
              CONTENT RELATIONSHIP INTELLIGENCE — graph + clusters + orphans
              ═══════════════════════════════════════════ */}
          <SectionHeader caption="Internal Linking" title="Content Relationship Intelligence" infoKey="section_internal_linking" />
          <LinkingQualityCard quality={linkIntel.quality} />
          <LinkGraph graph={linkIntel.graph} clusters={linkIntel.clusters} quality={linkIntel.quality} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <OrphanPanel orphans={linkIntel.orphans} />
            <TopicalClusterPanel clusters={linkIntel.clusters} graph={linkIntel.graph} />
          </div>

          {/* ═══════════════════════════════════════════
              CONTENT DECAY MONITORING
              ═══════════════════════════════════════════ */}
          <SectionHeader caption="Content Decay" title="Content Decay Monitoring" infoKey="section_decay" />
          <DecayAlertsStrip alerts={decay.alerts} />
          <ContentDecayPanel decay={decay} loading={trendsLoading} />
          <DecayQueueCard queue={decay.queue} onEdit={(id) => navigate(`/blogs/${id}/edit`)} />

          {/* ═══════════════════════════════════════════
              SECTION 2 — SITEMAP OPERATIONS
              ═══════════════════════════════════════════ */}
          <SectionHeader caption="Sitemap Operations" title="Indexable Surfaces Per Tenant" infoKey="section_sitemap" />
          <div className="grid lg:grid-cols-2 gap-5">
            {scopedWebsites.map((w) => {
              const s = sitemapStats[w._id] || { blogUrls: 0, staticUrls: 0, totalUrls: 0 };
              const xml = sitemapXmlUrl(w.domain);
              return (
                <GlassCard key={w._id} className="p-6" delay={0.1}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-caption text-cyan-400/70">{w.slug}</p>
                      <h3 className="text-title mt-1">{w.name}</h3>
                    </div>
                    <Badge variant="success" className="text-[10px] uppercase">live</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <SubStat label="Blog URLs"   value={s.blogUrls}   color="text-violet-400" />
                    <SubStat label="Static URLs" value={s.staticUrls} color="text-cyan-400" />
                    <SubStat label="Total URLs"  value={s.totalUrls}  color="text-emerald-400" />
                  </div>

                  <a
                    href={xml}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-foreground/[0.03] border border-border/60 hover:bg-foreground/[0.06] transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Rss size={12} className="text-cyan-400 flex-shrink-0" />
                      <span className="text-[11.5px] font-mono truncate">{xml}</span>
                    </div>
                    <ExternalLink size={11} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </a>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={xml}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-violet-500/15 border border-violet-500/40 text-violet-300 hover:bg-violet-500/25 transition-colors"
                    >
                      <ExternalLink size={11} /> Open Sitemap
                    </a>
                    <button
                      onClick={refreshAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-foreground/[0.04] border border-border/70 hover:bg-foreground/[0.06] hover:border-border transition-colors"
                    >
                      <RefreshCw size={11} /> Regenerate
                    </button>
                    <button
                      onClick={() => onPing(w.slug)}
                      disabled={pingingSlug === w.slug}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-60 transition-colors"
                    >
                      {pingingSlug === w.slug
                        ? <><Loader2 size={11} className="animate-spin" /> Pinging…</>
                        : <><Radar size={11} /> Ping Engines</>}
                    </button>
                    <a
                      href={xml}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-foreground/[0.04] border border-border/70 hover:bg-foreground/[0.06] transition-colors"
                    >
                      <ShieldCheck size={11} /> Validate XML
                    </a>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════
              SECTION 3 — METADATA COVERAGE
              ═══════════════════════════════════════════ */}
          <SectionHeader caption="Metadata Coverage" title="SEO Field Completion" infoKey="section_metadata" />
          <GlassCard className="p-6 md:p-7">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CoverageBar label="SEO Title"       icon={Hash}        have={audit.totals.coverage.seoTitle}       total={audit.totals.posts} color="violet"  infoKey="coverage_seo_title" />
              <CoverageBar label="Meta Description" icon={FileText}   have={audit.totals.coverage.seoDescription} total={audit.totals.posts} color="cyan"    infoKey="coverage_meta_desc" />
              <CoverageBar label="OG Image"         icon={ImageIcon}  have={audit.totals.coverage.ogImage}        total={audit.totals.posts} color="emerald" infoKey="coverage_og_image" />
              <CoverageBar label="Canonical URL"    icon={Link2}      have={audit.totals.coverage.canonical}      total={audit.totals.posts} color="amber"   infoKey="coverage_canonical" />
            </div>
            {seoStats && (
              <div className="mt-6 pt-5 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="SeoMetadata rows"    value={seoStats.total ?? 0}             tone="text-violet-400" />
                <MiniStat label="Noindex pages"       value={seoStats.noindexPages ?? 0}      tone="text-rose-400" />
                <MiniStat label="Excluded from sitemap" value={seoStats.excludedFromSitemap ?? 0} tone="text-amber-400" />
                <MiniStat label="Missing meta titles" value={seoStats.missingTitle ?? 0}      tone="text-cyan-400" />
              </div>
            )}
          </GlassCard>

          {/* ═══════════════════════════════════════════
              SECTION 4 — SEO HEALTH WARNINGS
              ═══════════════════════════════════════════ */}
          <SectionHeader caption="SEO Health" title="Issues Requiring Operator Attention" infoKey="section_health" />
          <GlassCard className="p-0 overflow-hidden">
            <HealthList audits={audit.audits} />
          </GlassCard>

          {/* ═══════════════════════════════════════════
              SECTION 5 — CONTENT INTELLIGENCE
              ═══════════════════════════════════════════ */}
          <SectionHeader caption="Content Intelligence" title="Per-Blog Operational Readiness" infoKey="section_content_intel" />
          <GlassCard className="p-0 overflow-hidden">
            <ContentTable audits={audit.audits} websites={websites} />
          </GlassCard>

          {/* ═══════════════════════════════════════════
              SECTION 6 — ROBOTS & INDEXING
              ═══════════════════════════════════════════ */}
          <SectionHeader caption="Robots & Indexing" title="Crawl Directives" infoKey="section_robots" />
          <div className="grid lg:grid-cols-2 gap-5">
            {scopedWebsites.map((w) => (
              <GlassCard key={`r-${w._id}`} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-caption text-amber-400/70">{w.slug}</p>
                    <h3 className="text-title mt-1">robots.txt</h3>
                  </div>
                  <Badge variant="success" className="text-[10px] uppercase">serving</Badge>
                </div>
                <a
                  href={robotsTxtUrl(w.domain)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-foreground/[0.03] border border-border/60 hover:bg-foreground/[0.06] transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck size={12} className="text-amber-400 flex-shrink-0" />
                    <span className="text-[11.5px] font-mono truncate">{robotsTxtUrl(w.domain)}</span>
                  </div>
                  <ExternalLink size={11} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </a>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <RobotStat label="Allow"        value="all crawlers" tone="text-emerald-400" />
                  <RobotStat label="Disallow"     value="/admin/, /api/" tone="text-rose-400" />
                  <RobotStat label="Sitemap"      value="auto-linked"    tone="text-violet-400" />
                  <RobotStat label="Crawl-delay"  value="not set"        tone="text-muted-foreground" />
                </div>
              </GlassCard>
            ))}
          </div>

          {/* ═══════════════════════════════════════════
              FUTURE: GSC / BING integration placeholders
              ═══════════════════════════════════════════ */}
          <SectionHeader caption="External Search Intelligence" title="Future Integrations" infoKey="section_future" />
          <div className="grid sm:grid-cols-2 gap-5">
            <IntegrationCard
              name="Google Search Console"
              status="Not connected"
              hook="GET /api/seo/gsc/summary/:websiteId"
              description="Impressions, clicks, CTR, average position — pulled directly from GSC once OAuth is wired."
              icon={Sparkles}
            />
            <IntegrationCard
              name="Bing Webmaster Tools"
              status="Not connected"
              hook="GET /api/seo/bing/summary/:websiteId"
              description="Crawl errors, keyword data, and Bing index status. Endpoint is reserved and call-site is plug-ready."
              icon={Sparkles}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ===================================
// Sub-components
// ===================================
function SectionHeader({ caption, title, infoKey }) {
  const info = infoKey ? getSeoInfo(infoKey) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="flex items-end justify-between"
    >
      <div>
        <p className="text-caption text-violet-400/70">{caption}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {info && <InfoPopover title={info.title} text={info.text} size={12} />}
        </div>
      </div>
      <span className="h-px flex-1 ml-6 bg-gradient-to-r from-border via-border/30 to-transparent" />
    </motion.div>
  );
}

function TenantSelector({ websites, value, onChange }) {
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-8 pr-9 py-2 rounded-xl text-[12px] font-semibold bg-card/70 backdrop-blur-xl border border-border/70 hover:border-border focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
      >
        <option value="all">All Properties</option>
        {websites.map((w) => (
          <option key={w._id} value={w._id}>{w.name}</option>
        ))}
      </select>
      <Globe size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-violet-400" />
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function InterpretationBadge({ interp }) {
  const tones = {
    emerald: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    cyan:    'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
    amber:   'bg-amber-500/15 border-amber-500/40 text-amber-300',
    orange:  'bg-orange-500/15 border-orange-500/40 text-orange-300',
    rose:    'bg-rose-500/15 border-rose-500/40 text-rose-300',
  };
  return (
    <span className={cn(
      'mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] border',
      tones[interp.tone] || tones.rose
    )}>
      {interp.band}
    </span>
  );
}

function InsightsPanel({ audit }) {
  const blogs = audit.audits;
  if (!blogs.length) return null;

  // Aggregate top strengths / weaknesses across corpus
  const strengthCount = {};
  const weaknessCount = {};
  for (const a of blogs) {
    for (const s of a.insights.topStrengths) strengthCount[s.label] = (strengthCount[s.label] || 0) + 1;
    for (const w of a.insights.topWeaknesses) weaknessCount[w.label] = (weaknessCount[w.label] || 0) + 1;
  }
  const topStrengths = Object.entries(strengthCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topWeaknesses = Object.entries(weaknessCount).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Hard-fail roster — blogs with overall < 40
  const hardFails = blogs
    .filter((a) => a.overall < 40)
    .sort((a, b) => a.overall - b.overall);

  // Thin-content corpus rate
  const thinCount = blogs.filter((a) => a.wordCount < 300).length;
  const thinRate  = blogs.length ? Math.round((thinCount / blogs.length) * 100) : 0;

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Why your score */}
      <GlassCard className="p-6">
        <p className="text-caption text-violet-400/70 mb-1">Why this score</p>
        <h3 className="text-title mb-3">Score Interpretation</h3>
        <ul className="space-y-2 text-[12.5px]">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Weighted overall</span>
            <span className="font-mono font-bold" style={{ color: ringTone(audit.totals.overall) }}>{audit.totals.overall}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Band</span>
            <span className="font-semibold">{audit.totals.interpretation.band}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Content-thin posts</span>
            <span className={cn('font-mono font-semibold', thinRate >= 50 ? 'text-rose-400' : thinRate > 0 ? 'text-amber-400' : 'text-emerald-400')}>
              {thinCount} / {blogs.length} ({thinRate}%)
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Avg word count</span>
            <span className="font-mono font-semibold">{audit.totals.avgWordCount}w</span>
          </li>
        </ul>
        <p className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground/80 leading-relaxed">
          Scores apply hard caps when content depth is missing. Below 100 words: max 35. 100–300 words: max 55. Metadata cannot rescue thin content.
        </p>
      </GlassCard>

      {/* Strengths */}
      <GlassCard className="p-6">
        <p className="text-caption text-emerald-400/70 mb-1">Working well</p>
        <h3 className="text-title mb-3">Dominant Strengths</h3>
        {topStrengths.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No category currently scoring above 90 across the corpus.</p>
        ) : (
          <ul className="space-y-2">
            {topStrengths.map(([label, count]) => (
              <li key={label} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">{count} post{count > 1 ? 's' : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {/* Weaknesses */}
      <GlassCard className="p-6">
        <p className="text-caption text-rose-400/70 mb-1">Holding the score down</p>
        <h3 className="text-title mb-3">Dominant Weaknesses</h3>
        {topWeaknesses.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No category currently scoring below 50 across the corpus.</p>
        ) : (
          <ul className="space-y-2">
            {topWeaknesses.map(([label, count]) => (
              <li key={label} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_hsl(352_55%_60%/0.7)]" />
                  {label}
                </span>
                <span className="text-[10px] font-mono text-rose-400">{count} post{count > 1 ? 's' : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {/* Hard-fail roster */}
      {hardFails.length > 0 && (
        <GlassCard className="lg:col-span-3 p-6 border-rose-500/40 bg-rose-500/[0.04]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-caption text-rose-400">Critical roster</p>
              <h3 className="text-title mt-1">Blogs Failing Operationally ({hardFails.length})</h3>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">Score &lt; 40</span>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hardFails.slice(0, 9).map((a) => (
              <li key={a.blog._id} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold truncate">{a.blog.title}</p>
                  <span className="font-mono font-bold text-rose-400 text-base flex-shrink-0">{a.overall}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300">{a.wordCount}w</span>
                  <span className="px-1.5 py-0.5 rounded bg-foreground/[0.05]">cap {a.cap}</span>
                  <span className="px-1.5 py-0.5 rounded bg-foreground/[0.05]">grade {a.grade.letter}</span>
                </div>
                {a.insights.topWeaknesses.length > 0 && (
                  <p className="mt-2 text-[11px] text-muted-foreground truncate">
                    ↳ {a.insights.topWeaknesses.map((w) => w.label).join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}

function CategoryBar({ label, weight, score, infoKey }) {
  const tone = ringTone(score);
  const info = infoKey ? getSeoInfo(infoKey) : null;
  return (
    <div className="p-3 rounded-xl bg-foreground/[0.03] border border-border/60">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">{label}</span>
          {info && <InfoPopover title={info.title} text={info.text} size={10} />}
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/70 flex-shrink-0">{weight}%</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold font-mono tabular-nums" style={{ color: tone }}>{score}</span>
        <span className="text-[9px] font-mono text-muted-foreground/60">/ 100</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-foreground/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full"
          style={{ background: tone }}
        />
      </div>
    </div>
  );
}

function OverviewTile({ icon: Icon, label, value, accent, infoKey, infoCtx }) {
  const info = infoKey ? getSeoInfo(infoKey, infoCtx) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl bg-foreground/[0.03] border border-border/60 p-4 hover:border-border transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon size={14} className={accent} />
        {info && <InfoPopover title={info.title} text={info.text} size={11} />}
      </div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="text-xl font-bold font-mono mt-0.5 tabular-nums">{value}</p>
    </motion.div>
  );
}

function SubStat({ label, value, color }) {
  return (
    <div className="rounded-lg bg-foreground/[0.03] border border-border/60 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={cn('text-base font-bold font-mono mt-0.5', color)}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={cn('text-base font-bold font-mono mt-0.5', tone)}>{value}</p>
    </div>
  );
}

function CoverageBar({ label, icon: Icon, have, total, color, infoKey }) {
  const pct = total ? Math.round((have / total) * 100) : 0;
  const info = infoKey ? getSeoInfo(infoKey) : null;
  const ringTones = {
    violet:  'bg-violet-500',
    cyan:    'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber:   'bg-amber-500',
  };
  const iconTones = {
    violet:  'text-violet-400',
    cyan:    'text-cyan-400',
    emerald: 'text-emerald-400',
    amber:   'text-amber-400',
  };
  return (
    <div className="p-4 rounded-xl bg-foreground/[0.03] border border-border/60">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={13} className={iconTones[color]} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
          {info && <InfoPopover title={info.title} text={info.text} size={10} />}
        </div>
        <span className={cn('text-xs font-bold font-mono', iconTones[color])}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={cn('h-full', ringTones[color])}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground font-mono">{have} / {total} posts</p>
    </div>
  );
}

function HealthList({ audits }) {
  const [filterSev, setFilterSev] = useState('all');     // all|critical|warning|notice
  const [filterCat, setFilterCat] = useState('all');     // all|<category>

  // Flatten issues with blog context
  const all = audits.flatMap((a) => a.issues.map((it) => ({ ...it, blog: a.blog })));

  // Severity counts (unfiltered)
  const sevCount = {
    critical: all.filter((i) => i.severity === 'critical').length,
    warning:  all.filter((i) => i.severity === 'warning').length,
    notice:   all.filter((i) => i.severity === 'notice').length,
  };

  const filtered = all
    .filter((i) => filterSev === 'all' || i.severity === filterSev)
    .filter((i) => filterCat === 'all' || i.category === filterCat)
    .sort((a, b) => (SEVERITY[b.severity].weight - SEVERITY[a.severity].weight)
                  || (b.penalty - a.penalty));

  return (
    <>
      {/* Filter bar */}
      <div className="px-5 py-3 border-b border-border/60 bg-foreground/[0.02] flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mr-1 inline-flex items-center gap-1">
          Severity
        </span>
        {['all', ...SEVERITIES].map((s) => {
          const sevInfo = s !== 'all' ? getSeoInfo(`severity_${s}`) : null;
          return (
            <span key={s} className="inline-flex items-center gap-0.5">
              <FilterPill active={filterSev === s} onClick={() => setFilterSev(s)} tone={
                s === 'critical' ? 'rose' : s === 'warning' ? 'amber' : s === 'notice' ? 'cyan' : 'neutral'
              }>
                {s === 'all' ? `All (${all.length})` : `${s} (${sevCount[s] || 0})`}
              </FilterPill>
              {sevInfo && <InfoPopover title={sevInfo.title} text={sevInfo.text} size={10} />}
            </span>
          );
        })}
        <span className="mx-2 h-3 w-px bg-border/60" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mr-2">Category</span>
        <FilterPill active={filterCat === 'all'} onClick={() => setFilterCat('all')}>All</FilterPill>
        {CATEGORIES.map((cat) => (
          <FilterPill key={cat} active={filterCat === cat} onClick={() => setFilterCat(cat)}>
            {CATEGORY_LABELS[cat]}
          </FilterPill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-3" />
          <p className="text-sm font-semibold">No matching issues</p>
          <p className="mt-1 text-xs text-muted-foreground">Adjust filters above or celebrate — every audited blog passes this slice.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 max-h-[640px] overflow-y-auto">
          {filtered.slice(0, 60).map((it, i) => {
            const Icon = severityIcon[it.severity];
            const toneText = {
              critical: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
              warning:  'text-amber-400 bg-amber-500/10 border-amber-500/30',
              notice:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
            }[it.severity];
            return (
              <motion.li
                key={`${it.code}-${it.blog._id}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="px-5 py-3 flex items-start gap-3 hover:bg-foreground/[0.025] transition-colors"
              >
                <span className={cn('flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border', toneText)}>
                  <Icon size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold truncate">{it.message}</p>
                    {(() => {
                      const issueInfo = getSeoInfo('issue', { code: it.code });
                      return issueInfo && <InfoPopover title={issueInfo.title} text={issueInfo.text} size={11} />;
                    })()}
                    <span className={cn('text-[9px] uppercase tracking-[0.18em] font-bold px-1.5 py-0.5 rounded', toneText)}>{it.severity}</span>
                    <span className="text-[9px] uppercase tracking-[0.18em] font-semibold px-1.5 py-0.5 rounded bg-foreground/[0.04] border border-border/60 text-muted-foreground">
                      {CATEGORY_LABELS[it.category]}
                    </span>
                    <span className="text-[10px] font-mono text-rose-400/70">−{it.penalty}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground truncate mt-0.5">↳ {it.blog.title}</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">{it.fix}</p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function FilterPill({ active, onClick, children, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-border/70 text-muted-foreground',
    rose:    'border-rose-500/40 text-rose-400',
    amber:   'border-amber-500/40 text-amber-400',
    cyan:    'border-cyan-500/40 text-cyan-400',
  };
  const activeTones = {
    neutral: 'bg-foreground/[0.06] text-foreground border-border',
    rose:    'bg-rose-500/20 border-rose-500/60 text-rose-300',
    amber:   'bg-amber-500/20 border-amber-500/60 text-amber-300',
    cyan:    'bg-cyan-500/20 border-cyan-500/60 text-cyan-300',
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.14em] border transition-all',
        active ? activeTones[tone] : tones[tone],
        'hover:border-border'
      )}
    >
      {children}
    </button>
  );
}

function ContentTable({ audits, websites }) {
  const [sortKey, setSortKey] = useState('overall');
  const [sortDir, setSortDir] = useState('asc');

  const websiteName = (id) => websites.find((w) => w._id === id)?.name || '—';

  const rows = useMemo(() => {
    const arr = [...audits];
    arr.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case 'title':       av = a.blog.title?.toLowerCase() || ''; bv = b.blog.title?.toLowerCase() || ''; break;
        case 'words':       av = a.wordCount; bv = b.wordCount; break;
        case 'readability': av = a.readability.flesch; bv = b.readability.flesch; break;
        case 'metadata':    av = a.byCategory.metadata.score; bv = b.byCategory.metadata.score; break;
        case 'content':     av = a.byCategory.content.score;  bv = b.byCategory.content.score;  break;
        case 'technical':   av = a.byCategory.technical.score; bv = b.byCategory.technical.score; break;
        case 'ux':          av = a.byCategory.ux.score;       bv = b.byCategory.ux.score;       break;
        case 'freshness':   av = a.byCategory.freshness.score; bv = b.byCategory.freshness.score; break;
        case 'status':      av = a.blog.status; bv = b.blog.status; break;
        case 'overall':
        default:            av = a.overall; bv = b.overall; break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return arr;
  }, [audits, sortKey, sortDir]);

  const setSort = (k) => {
    if (k === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };

  if (audits.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText size={28} className="mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm font-semibold">No blog content yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Publish blogs from the dashboard to see content intelligence here.</p>
      </div>
    );
  }

  const Th = ({ k, children, align = 'left', title, infoKey }) => {
    const info = infoKey ? getSeoInfo(infoKey) : null;
    return (
      <th
        title={title}
        className={cn(
          'select-none px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors',
          align === 'right' ? 'text-right' : 'text-left'
        )}
      >
        <span className={cn('inline-flex items-center gap-1', align === 'right' && 'justify-end')}>
          <span onClick={() => setSort(k)} className="cursor-pointer inline-flex items-center gap-1">
            {children}
            {sortKey === k && <span className="text-violet-400">{sortDir === 'asc' ? '↑' : '↓'}</span>}
          </span>
          {info && <InfoPopover title={info.title} text={info.text} size={9} />}
        </span>
      </th>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-foreground/[0.025] border-b border-border/60">
          <tr>
            <Th k="title">Title</Th>
            <Th k="words"       align="right" infoKey="col_words">Words</Th>
            <Th k="readability" align="right" title="Flesch reading ease" infoKey="col_flesch">Read</Th>
            <Th k="metadata"    align="right" title="Metadata Quality 20%" infoKey="col_meta">Meta</Th>
            <Th k="content"     align="right" title="Content Quality 45%" infoKey="col_content">Cont</Th>
            <Th k="technical"   align="right" title="Technical SEO 15%" infoKey="col_tech">Tech</Th>
            <Th k="ux"          align="right" title="UX / Readability 10%" infoKey="col_ux">UX</Th>
            <Th k="freshness"   align="right" title="Operational Freshness 10%" infoKey="col_fresh">Fresh</Th>
            <Th k="status">Status</Th>
            <Th k="overall"     align="right" infoKey="seo_score">SEO Score</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.slice(0, 30).map((a) => {
            const fleschGrade = gradeFromFlesch(a.readability.flesch);
            return (
              <tr key={a.blog._id} className="hover:bg-foreground/[0.025] transition-colors">
                <td className="px-3 py-3 max-w-[280px]">
                  <p className="text-sm font-medium truncate">{a.blog.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{websiteName(a.blog.targetWebsite?._id || a.blog.targetWebsite)}</p>
                </td>
                <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums">{a.wordCount}</td>
                <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums">
                  <span className={cn(
                    'inline-flex items-center justify-end gap-1',
                    fleschGrade.tone === 'rose'    && 'text-rose-400',
                    fleschGrade.tone === 'amber'   && 'text-amber-400',
                    fleschGrade.tone === 'cyan'    && 'text-cyan-400',
                    fleschGrade.tone === 'emerald' && 'text-emerald-400',
                  )} title={fleschGrade.band}>
                    {a.readability.flesch}
                  </span>
                </td>
                <SubScoreCell value={a.byCategory.metadata.score} />
                <SubScoreCell value={a.byCategory.content.score} />
                <SubScoreCell value={a.byCategory.technical.score} />
                <SubScoreCell value={a.byCategory.ux.score} />
                <SubScoreCell value={a.byCategory.freshness.score} />
                <td className="px-3 py-3">
                  <Badge variant={a.blog.status === 'published' ? 'success' : 'secondary'} className="text-[10px] uppercase">
                    {a.blog.status}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right">
                  <span
                    className="inline-flex items-center justify-end gap-1.5 font-mono font-bold text-[13px]"
                    style={{ color: ringTone(a.overall) }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: ringTone(a.overall) }} />
                    {a.overall}
                    <span className="ml-1 text-[10px] uppercase tracking-[0.18em]">{a.grade.letter}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SubScoreCell({ value }) {
  return (
    <td className="px-3 py-3 text-right">
      <span
        className="inline-flex items-center justify-end font-mono text-[12px] tabular-nums font-semibold"
        style={{ color: ringTone(value) }}
      >
        {value}
      </span>
    </td>
  );
}

function RobotStat({ label, value, tone }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-foreground/[0.03] border border-border/60">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={cn('text-[12px] font-mono mt-0.5', tone)}>{value}</p>
    </div>
  );
}

function IntegrationCard({ name, status, hook, description, icon: Icon }) {
  return (
    <div className="relative p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, hsl(14 73% 60% / 0.25), transparent 70%)' }}
      />
      <div className="relative flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight">{name}</h3>
            <Badge variant="secondary" className="text-[10px] uppercase">{status}</Badge>
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{description}</p>
          <p className="mt-3 text-[10px] font-mono text-cyan-400/80">
            Reserved hook · {hook}
          </p>
        </div>
      </div>
    </div>
  );
}
