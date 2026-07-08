// ===================================
// Anomaly Detection Service
// ===================================
// Pure-function detectors over real AnalyticsEvent + Blog + Website data.
// No fake outputs — if a detector can't compute (insufficient data), the
// anomaly is omitted. Returns severity-tagged operational alerts.

const AnalyticsEvent = require('../models/AnalyticsEvent');
const Blog = require('../models/Blog');
const Website = require('../models/Website');
const { resolveRange } = require('./analyticsService');

// ===================================
// Helpers
// ===================================
function pctChange(curr, prev) {
  if (!prev) return curr > 0 ? Infinity : 0;
  return ((curr - prev) / prev) * 100;
}

function anomaly(severity, kind, title, message, recommendation, meta = {}) {
  return { severity, kind, title, message, recommendation, meta };
}

// ===================================
// Detectors
// ===================================

/**
 * 1. Traffic spike — sessions in current window > 2× previous window.
 */
async function detectTrafficSpike(websiteSlug, current, previous) {
  const matchA = { timestamp: { $gte: current[0], $lte: current[1] } };
  const matchB = { timestamp: { $gte: previous[0], $lte: previous[1] } };
  if (websiteSlug && websiteSlug !== 'all') {
    matchA.websiteSlug = websiteSlug;
    matchB.websiteSlug = websiteSlug;
  }
  const [currSessions, prevSessions] = await Promise.all([
    AnalyticsEvent.distinct('sessionId', matchA).then((a) => a.length),
    AnalyticsEvent.distinct('sessionId', matchB).then((a) => a.length),
  ]);
  if (prevSessions < 3 || currSessions < 5) return null;
  if (currSessions < prevSessions * 2) return null;
  const delta = pctChange(currSessions, prevSessions);
  return anomaly(
    'notice',
    'traffic_spike',
    'Traffic spike detected',
    `Sessions surged from ${prevSessions} to ${currSessions} (+${delta.toFixed(0)}%) vs previous window`,
    'Investigate referrer + landing pages to identify the driver. Consider doubling down if the source is organic.',
    { current: currSessions, previous: prevSessions, deltaPct: Number(delta.toFixed(1)) }
  );
}

/**
 * 2. Traffic drop — sessions < 0.5× previous and previous had meaningful volume.
 */
async function detectTrafficDrop(websiteSlug, current, previous) {
  const matchA = { timestamp: { $gte: current[0], $lte: current[1] } };
  const matchB = { timestamp: { $gte: previous[0], $lte: previous[1] } };
  if (websiteSlug && websiteSlug !== 'all') {
    matchA.websiteSlug = websiteSlug;
    matchB.websiteSlug = websiteSlug;
  }
  const [currSessions, prevSessions] = await Promise.all([
    AnalyticsEvent.distinct('sessionId', matchA).then((a) => a.length),
    AnalyticsEvent.distinct('sessionId', matchB).then((a) => a.length),
  ]);
  if (prevSessions < 8) return null;
  if (currSessions >= prevSessions * 0.5) return null;
  const delta = pctChange(currSessions, prevSessions);
  return anomaly(
    'critical',
    'traffic_drop',
    'Traffic drop detected',
    `Sessions fell from ${prevSessions} to ${currSessions} (${delta.toFixed(0)}%) vs previous window`,
    'Check indexing status, recent site changes, and search engine ping logs. Investigate canonical/robots changes.',
    { current: currSessions, previous: prevSessions, deltaPct: Number(delta.toFixed(1)) }
  );
}

/**
 * 3. Conversion drop — leads/visitors ratio fell >30% vs previous.
 */
async function detectConversionDrop(websiteSlug, current, previous) {
  const Lead = require('../models/Lead');

  const matchA = { timestamp: { $gte: current[0], $lte: current[1] } };
  const matchB = { timestamp: { $gte: previous[0], $lte: previous[1] } };
  const leadFilterA = { createdAt: { $gte: current[0], $lte: current[1] } };
  const leadFilterB = { createdAt: { $gte: previous[0], $lte: previous[1] } };
  if (websiteSlug && websiteSlug !== 'all') {
    matchA.websiteSlug = websiteSlug;
    matchB.websiteSlug = websiteSlug;
    const w = await Website.findOne({ slug: websiteSlug }).select('_id').lean();
    if (w) { leadFilterA.website = w._id; leadFilterB.website = w._id; }
  }

  const [currSessions, prevSessions, currLeads, prevLeads] = await Promise.all([
    AnalyticsEvent.distinct('sessionId', matchA).then((a) => a.length),
    AnalyticsEvent.distinct('sessionId', matchB).then((a) => a.length),
    Lead.countDocuments(leadFilterA),
    Lead.countDocuments(leadFilterB),
  ]);

  if (prevSessions < 10 || prevLeads === 0) return null;
  const currRate = currSessions ? (currLeads / currSessions) * 100 : 0;
  const prevRate = (prevLeads / prevSessions) * 100;
  if (prevRate < 0.5) return null;
  if (currRate >= prevRate * 0.7) return null;

  const drop = pctChange(currRate, prevRate);
  return anomaly(
    'critical',
    'conversion_drop',
    'Conversion rate dropped',
    `Lead conversion fell from ${prevRate.toFixed(2)}% to ${currRate.toFixed(2)}% (${drop.toFixed(0)}%)`,
    'Inspect funnel — CTA placement, form friction, recent landing page changes. Re-test conversion path manually.',
    { currRate: Number(currRate.toFixed(2)), prevRate: Number(prevRate.toFixed(2)), deltaPct: Number(drop.toFixed(1)) }
  );
}

/**
 * 4. Bounce spike — burst-session bounce % current > 1.5× previous (using engagement calc).
 */
async function detectBounceSpike(websiteSlug, current, previous) {
  const calc = async (window) => {
    const match = { timestamp: { $gte: window[0], $lte: window[1] } };
    if (websiteSlug && websiteSlug !== 'all') match.websiteSlug = websiteSlug;
    const rows = await AnalyticsEvent.aggregate([
      { $match: match },
      { $sort: { sessionId: 1, timestamp: 1 } },
      { $group: { _id: '$sessionId', events: { $push: { ts: '$timestamp', t: '$eventType' } } } },
    ]);
    const INACTIVITY_MS = 30 * 60 * 1000;
    let totalBursts = 0, bounces = 0;
    for (const row of rows) {
      const evs = row.events;
      if (!evs.length) continue;
      let burstPages = evs[0].t === 'page_view' ? 1 : 0;
      for (let i = 1; i < evs.length; i++) {
        const gap = new Date(evs[i].ts).getTime() - new Date(evs[i - 1].ts).getTime();
        if (gap > INACTIVITY_MS) {
          totalBursts++;
          if (burstPages <= 1) bounces++;
          burstPages = 0;
        }
        if (evs[i].t === 'page_view') burstPages++;
      }
      totalBursts++;
      if (burstPages <= 1) bounces++;
    }
    return totalBursts ? (bounces / totalBursts) * 100 : 0;
  };

  const [currBounce, prevBounce] = await Promise.all([calc(current), calc(previous)]);
  if (prevBounce === 0 || prevBounce < 10) return null;
  if (currBounce < prevBounce * 1.5) return null;

  return anomaly(
    'warning',
    'bounce_spike',
    'Bounce rate spike',
    `Bounce rate jumped from ${prevBounce.toFixed(1)}% to ${currBounce.toFixed(1)}%`,
    'Audit top landing pages — page load speed, above-the-fold messaging, mobile rendering.',
    { current: Number(currBounce.toFixed(1)), previous: Number(prevBounce.toFixed(1)) }
  );
}

/**
 * Published-corpus lookup that respects the tenant's blog source.
 * WordPress-backed tenants (Website.wordpressUrl) keep their blogs in
 * WordPress, not the Mavro Blog collection — counting the Blog collection
 * for them produced the false "No published blogs found" stale alert.
 * Returns { count, latestPublishedAt } from whichever source is canonical.
 */
async function publishedCorpusInfo(w) {
  if (w.wordpressUrl) {
    try {
      const { wordpressBlogService } = require('./index');
      const blogs = await wordpressBlogService.getWordpressBlogs(w.wordpressUrl, w._id);
      let latest = null;
      for (const b of blogs) {
        const d = b.publishedAt ? new Date(b.publishedAt) : null;
        if (d && (!latest || d > latest)) latest = d;
      }
      return { count: blogs.length, latestPublishedAt: latest };
    } catch {
      // WP unreachable — return null so callers skip rather than false-alert
      return null;
    }
  }
  const latestBlog = await Blog.findOne({ targetWebsite: w._id, status: 'published' })
    .sort({ publishedAt: -1 })
    .select('publishedAt')
    .lean();
  const count = await Blog.countDocuments({ targetWebsite: w._id, status: 'published' });
  return { count, latestPublishedAt: latestBlog?.publishedAt ? new Date(latestBlog.publishedAt) : null };
}

/**
 * 5. Inactive tenant — zero events in last 7d but has published blogs.
 * Scoped: enumerates all tenants only when websiteSlug === 'all'; a specific
 * tenant scope checks that tenant alone (no cross-tenant noise on a scoped view).
 */
async function detectInactiveTenants(websiteSlug = 'all') {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const filter = { status: 'active' };
  if (websiteSlug && websiteSlug !== 'all') filter.slug = websiteSlug;
  const websites = await Website.find(filter).select('_id name slug wordpressUrl').lean();

  const out = [];
  for (const w of websites) {
    const [eventCount, corpus] = await Promise.all([
      AnalyticsEvent.countDocuments({ websiteSlug: w.slug, timestamp: { $gte: sevenDaysAgo } }),
      publishedCorpusInfo(w),
    ]);
    if (!corpus) continue; // WP unreachable — skip, no false positives
    const publishedCount = corpus.count;
    if (eventCount === 0 && publishedCount > 0) {
      out.push(anomaly(
        'warning',
        'inactive_tenant',
        `${w.name} has zero traffic`,
        `${publishedCount} published ${publishedCount === 1 ? 'post' : 'posts'} but no analytics events in last 7 days`,
        'Verify tracking script is live + sitemap submitted + indexing status. Consider syndication push.',
        { slug: w.slug, publishedBlogs: publishedCount }
      ));
    }
  }
  return out;
}

/**
 * 6. Stale tenant — no recent blog publishes >30 days.
 * Scoped like detectInactiveTenants; WordPress-backed tenants read their
 * real publish dates from the WP corpus (via publishedCorpusInfo).
 */
async function detectStaleTenants(websiteSlug = 'all') {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const filter = { status: 'active' };
  if (websiteSlug && websiteSlug !== 'all') filter.slug = websiteSlug;
  const websites = await Website.find(filter).select('_id name slug updatedAt wordpressUrl').lean();

  const out = [];
  for (const w of websites) {
    const corpus = await publishedCorpusInfo(w);
    if (!corpus) continue; // WP unreachable — skip, no false positives
    const latest = corpus.latestPublishedAt;
    if (!latest || new Date(latest) < thirtyDaysAgo) {
      const days = latest ? Math.floor((Date.now() - new Date(latest).getTime()) / 86400000) : null;
      out.push(anomaly(
        'notice',
        'stale_tenant',
        `${w.name} hasn't published recently`,
        latest
          ? `Last blog published ${days} days ago`
          : 'No published blogs found',
        'Schedule a content cadence — at least one publication every 14 days keeps organic momentum.',
        { slug: w.slug, daysSinceLastPublish: days }
      ));
    }
  }
  return out;
}

/**
 * 7. Declining blog — top blog losing >50% trailing-window views vs previous.
 */
async function detectDecliningBlogs(websiteSlug, current, previous) {
  const matchA = { eventType: 'blog_view', timestamp: { $gte: current[0], $lte: current[1] } };
  const matchB = { eventType: 'blog_view', timestamp: { $gte: previous[0], $lte: previous[1] } };
  if (websiteSlug && websiteSlug !== 'all') {
    matchA.websiteSlug = websiteSlug;
    matchB.websiteSlug = websiteSlug;
  }

  const [currRows, prevRows] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: matchA },
      { $group: { _id: '$meta.blogSlug', views: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: matchB },
      { $group: { _id: '$meta.blogSlug', views: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
    ]),
  ]);

  const prevMap = new Map(prevRows.map((r) => [r._id, r.views]));
  const out = [];
  for (const row of currRows) {
    const prev = prevMap.get(row._id) || 0;
    if (prev < 5) continue;
    if (row.views >= prev * 0.5) continue;
    const blog = await Blog.findOne({ slug: row._id }).select('title slug targetWebsite').populate('targetWebsite', 'name').lean();
    out.push(anomaly(
      'warning',
      'declining_blog',
      `Blog views declining: ${blog?.title || row._id}`,
      `Views fell from ${prev} to ${row.views} (${pctChange(row.views, prev).toFixed(0)}%) vs previous window`,
      'Refresh content, update internal links, or boost via social syndication.',
      { slug: row._id, current: row.views, previous: prev, tenant: blog?.targetWebsite?.name || null }
    ));
  }
  return out;
}

// ===================================
// Top-level orchestrator
// ===================================
async function getAnomalies({ websiteSlug = 'all', range = 'week' } = {}) {
  const { current, previous } = resolveRange(range);

  const results = await Promise.all([
    detectTrafficSpike(websiteSlug, current, previous),
    detectTrafficDrop(websiteSlug, current, previous),
    detectConversionDrop(websiteSlug, current, previous),
    detectBounceSpike(websiteSlug, current, previous),
    detectInactiveTenants(websiteSlug),
    detectStaleTenants(websiteSlug),
    detectDecliningBlogs(websiteSlug, current, previous),
  ]);

  const flat = results.flat().filter(Boolean);
  // Sort by severity then alphabetically
  const order = { critical: 0, warning: 1, notice: 2 };
  flat.sort((a, b) => (order[a.severity] - order[b.severity]) || a.kind.localeCompare(b.kind));
  return { range, websiteSlug, anomalies: flat };
}

module.exports = { getAnomalies };
