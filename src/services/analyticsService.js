const AnalyticsEvent = require('../models/AnalyticsEvent');
const Lead = require('../models/Lead');

// ===================================
// Range → bucket configuration
// ===================================
// Returns: { current: [from, to], previous: [from, to], bucket: 'hour'|'day'|'month', points: int }
function resolveRange(range = 'week') {
  const now = new Date();
  const end = new Date(now);
  let start, prevStart, prevEnd, bucket;

  switch (range) {
    case 'day': {
      // "Today" = calendar today in server-local time (midnight → now).
      // Previous = full calendar yesterday. Matches user expectation: the
      // "Today" pill should not include events from yesterday.
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      start = todayStart;
      prevStart = yesterdayStart;
      prevEnd = todayStart;
      bucket = 'hour';
      break;
    }
    case 'month': {
      const durationMs = 30 * 24 * 60 * 60 * 1000;
      start = new Date(end.getTime() - durationMs);
      prevEnd = new Date(start.getTime());
      prevStart = new Date(start.getTime() - durationMs);
      bucket = 'day';
      break;
    }
    case 'year': {
      const durationMs = 365 * 24 * 60 * 60 * 1000;
      start = new Date(end.getTime() - durationMs);
      prevEnd = new Date(start.getTime());
      prevStart = new Date(start.getTime() - durationMs);
      bucket = 'month';
      break;
    }
    case 'week':
    default: {
      const durationMs = 7 * 24 * 60 * 60 * 1000;
      start = new Date(end.getTime() - durationMs);
      prevEnd = new Date(start.getTime());
      prevStart = new Date(start.getTime() - durationMs);
      bucket = 'day';
      break;
    }
  }

  return {
    current: [start, end],
    previous: [prevStart, prevEnd],
    bucket,
    range,
  };
}

function pctChange(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Number((((curr - prev) / prev) * 100).toFixed(1));
}

// ===================================
// Match filter builder
// ===================================
function matchFilter(websiteSlug, start, end, eventType) {
  const m = { timestamp: { $gte: start, $lte: end } };
  if (websiteSlug && websiteSlug !== 'all') m.websiteSlug = websiteSlug;
  if (eventType) m.eventType = eventType;
  return m;
}

// ===================================
// Aggregate totals for a window
// ===================================
async function aggregateWindow(websiteSlug, start, end) {
  const baseMatch = matchFilter(websiteSlug, start, end);

  const [eventBuckets, uniqueSessions] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ]),
    AnalyticsEvent.distinct('sessionId', baseMatch),
  ]);

  const totals = {
    page_view: 0,
    blog_view: 0,
    form_submit: 0,
    cta_click: 0,
  };
  for (const row of eventBuckets) {
    if (totals[row._id] !== undefined) totals[row._id] = row.count;
  }

  // Also count real leads created in this window for accuracy
  const leadFilter = { createdAt: { $gte: start, $lte: end } };
  if (websiteSlug && websiteSlug !== 'all') {
    const Website = require('../models/Website');
    const w = await Website.findOne({ slug: websiteSlug }).select('_id').lean();
    if (w) leadFilter.website = w._id;
  }
  const leadsCount = await Lead.countDocuments(leadFilter);

  return {
    pageViews: totals.page_view,
    blogViews: totals.blog_view,
    formSubmits: totals.form_submit,
    ctaClicks: totals.cta_click,
    sessions: uniqueSessions.length,
    leads: leadsCount,
  };
}

// ===================================
// Overview: totals + period-over-period deltas
// ===================================
async function getOverview({ websiteSlug, range = 'week' }) {
  const { current, previous } = resolveRange(range);
  const [curr, prev] = await Promise.all([
    aggregateWindow(websiteSlug, current[0], current[1]),
    aggregateWindow(websiteSlug, previous[0], previous[1]),
  ]);

  const conversionRate = curr.sessions
    ? Number(((curr.leads / curr.sessions) * 100).toFixed(2))
    : 0;
  const prevConv = prev.sessions
    ? Number(((prev.leads / prev.sessions) * 100).toFixed(2))
    : 0;

  return {
    range,
    window: { from: current[0], to: current[1] },
    metrics: {
      visitors: { value: curr.sessions, delta: pctChange(curr.sessions, prev.sessions) },
      pageViews: { value: curr.pageViews, delta: pctChange(curr.pageViews, prev.pageViews) },
      blogViews: { value: curr.blogViews, delta: pctChange(curr.blogViews, prev.blogViews) },
      ctaClicks: { value: curr.ctaClicks, delta: pctChange(curr.ctaClicks, prev.ctaClicks) },
      formSubmits: { value: curr.formSubmits, delta: pctChange(curr.formSubmits, prev.formSubmits) },
      leads: { value: curr.leads, delta: pctChange(curr.leads, prev.leads) },
      conversionRate: { value: conversionRate, delta: Number((conversionRate - prevConv).toFixed(2)) },
    },
  };
}

// ===================================
// Timeseries: bucketed views + sessions
// ===================================
// $dateTrunc returns UTC-aligned buckets by default. We must mirror that exact
// alignment when generating the empty-fill skeleton on the JS side or
// `byBucket.get(key)` lookups silently miss every aggregated row and the chart
// renders as if no events exist. That was the root cause of "No analytics
// events captured in the selected window yet" appearing despite real events
// being stored.
function alignToBucketUTC(date, bucket) {
  const d = new Date(date.getTime());
  switch (bucket) {
    case 'hour':
      d.setUTCMinutes(0, 0, 0);
      return d;
    case 'month':
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    case 'day':
    default:
      d.setUTCHours(0, 0, 0, 0);
      return d;
  }
}

function stepBucketUTC(date, bucket) {
  const d = new Date(date.getTime());
  if (bucket === 'hour') d.setUTCHours(d.getUTCHours() + 1);
  else if (bucket === 'month') d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function generateBuckets(start, end, bucket) {
  const out = [];
  let cursor = alignToBucketUTC(start, bucket);
  const endTime = end.getTime();
  // Cap at a generous upper bound to avoid infinite loops on malformed range
  for (let i = 0; i < 5000 && cursor.getTime() <= endTime; i++) {
    out.push(new Date(cursor));
    cursor = stepBucketUTC(cursor, bucket);
  }
  return out;
}

function dateTruncStage(bucket) {
  return { $dateTrunc: { date: '$timestamp', unit: bucket } };
}

async function getTimeseries({ websiteSlug, range = 'week' }) {
  const { current, bucket } = resolveRange(range);
  const [start, end] = current;
  const baseMatch = matchFilter(websiteSlug, start, end);

  // Use $facet so unique sessions per bucket and per-eventType counts are
  // computed independently in a single round trip. Sessions are unique by
  // sessionId regardless of how many events that session generated.
  const [facetResult] = await AnalyticsEvent.aggregate([
    { $match: baseMatch },
    {
      $facet: {
        events: [
          {
            $group: {
              _id: { ts: dateTruncStage(bucket), eventType: '$eventType' },
              count: { $sum: 1 },
            },
          },
          { $project: { _id: 0, ts: '$_id.ts', eventType: '$_id.eventType', count: 1 } },
        ],
        sessions: [
          {
            $group: {
              _id: dateTruncStage(bucket),
              sessions: { $addToSet: '$sessionId' },
            },
          },
          { $project: { _id: 0, ts: '$_id', sessions: { $size: '$sessions' } } },
        ],
      },
    },
  ]);

  const byBucket = new Map();
  const getOrInit = (ts) => {
    const key = ts.toISOString();
    if (!byBucket.has(key)) {
      byBucket.set(key, { ts, views: 0, blogViews: 0, ctaClicks: 0, formSubmits: 0, sessions: 0 });
    }
    return byBucket.get(key);
  };

  for (const r of facetResult.events) {
    const b = getOrInit(r.ts);
    if (r.eventType === 'page_view')   b.views      = r.count;
    if (r.eventType === 'blog_view')   b.blogViews  = r.count;
    if (r.eventType === 'cta_click')   b.ctaClicks  = r.count;
    if (r.eventType === 'form_submit') b.formSubmits = r.count;
  }
  for (const r of facetResult.sessions) {
    const b = getOrInit(r.ts);
    b.sessions = r.sessions;
  }

  // Fill every bucket in the window so the chart x-axis is continuous.
  const buckets = generateBuckets(start, end, bucket);
  const series = buckets.map((ts) => {
    const found = byBucket.get(ts.toISOString());
    return found || { ts, views: 0, blogViews: 0, ctaClicks: 0, formSubmits: 0, sessions: 0 };
  });

  // Append any aggregated buckets that fall outside the generated skeleton
  // (defensive — shouldn't happen, but guarantees we never drop real data).
  const skeletonKeys = new Set(buckets.map((b) => b.toISOString()));
  for (const [key, bucketRow] of byBucket.entries()) {
    if (!skeletonKeys.has(key)) series.push(bucketRow);
  }
  series.sort((a, b) => new Date(a.ts) - new Date(b.ts));

  return { range, bucket, series, eventCount: facetResult.events.reduce((s, e) => s + e.count, 0) };
}

// ===================================
// Top pages
// ===================================
async function getTopPages({ websiteSlug, range = 'week', limit = 8 }) {
  const { current } = resolveRange(range);
  const baseMatch = matchFilter(websiteSlug, current[0], current[1], 'page_view');

  const rows = await AnalyticsEvent.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: '$page',
        views: { $sum: 1 },
        sessions: { $addToSet: '$sessionId' },
      },
    },
    { $project: { page: '$_id', _id: 0, views: 1, sessions: { $size: '$sessions' } } },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);
  return rows;
}

// ===================================
// Recent events
// ===================================
async function getRecent({ websiteSlug, limit = 12 }) {
  const filter = {};
  if (websiteSlug && websiteSlug !== 'all') filter.websiteSlug = websiteSlug;
  const events = await AnalyticsEvent.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('eventType page meta deviceType timestamp referrer websiteSlug')
    .lean();
  return events;
}

// ===================================
// Device/referrer breakdown
// ===================================
async function getBreakdown({ websiteSlug, range = 'week' }) {
  const { current } = resolveRange(range);
  const baseMatch = matchFilter(websiteSlug, current[0], current[1]);

  const [devices, referrers] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { ...baseMatch, referrer: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: {
            $ifNull: [{ $arrayElemAt: [{ $split: ['$referrer', '/'] }, 2] }, 'direct'],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  return {
    devices: devices.map((d) => ({ device: d._id || 'unknown', count: d.count })),
    referrers: referrers.map((r) => ({ source: r._id || 'direct', count: r.count })),
  };
}

// ===================================
// Conversion funnel
// ===================================
// 4-stage operational funnel: page_view → cta_click → form_open (proxy: cta_click meta) → form_submit
// We don't track form_open as a discrete event yet — use cta_click as the
// pre-form proxy. When form_open is wired later this fn already accepts it.
async function getFunnel({ websiteSlug, range = 'week' }) {
  const { current } = resolveRange(range);
  const baseMatch = matchFilter(websiteSlug, current[0], current[1]);

  const rows = await AnalyticsEvent.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: '$eventType',
        sessions: { $addToSet: '$sessionId' },
        count: { $sum: 1 },
      },
    },
    { $project: { eventType: '$_id', _id: 0, count: 1, sessions: { $size: '$sessions' } } },
  ]);

  const byType = Object.fromEntries(rows.map((r) => [r.eventType, r]));
  const visitors = await AnalyticsEvent.distinct('sessionId', baseMatch);
  const totalVisitors = visitors.length;

  const stages = [
    { key: 'visitors',     label: 'Visitors',       sessions: totalVisitors,                       count: byType.page_view?.count || 0 },
    { key: 'cta_click',    label: 'CTA Clicked',    sessions: byType.cta_click?.sessions || 0,     count: byType.cta_click?.count || 0 },
    { key: 'form_submit',  label: 'Form Submitted', sessions: byType.form_submit?.sessions || 0,   count: byType.form_submit?.count || 0 },
  ];

  // Compute step conversion rates
  for (let i = 0; i < stages.length; i++) {
    const base = stages[0].sessions || 0;
    stages[i].fromTopPct = base ? Number(((stages[i].sessions / base) * 100).toFixed(1)) : 0;
    stages[i].fromPrevPct = i === 0
      ? 100
      : (stages[i - 1].sessions
          ? Number(((stages[i].sessions / stages[i - 1].sessions) * 100).toFixed(1))
          : 0);
  }

  return { stages };
}

// ===================================
// Tenant comparison
// ===================================
async function getTenantComparison({ range = 'week' }) {
  const Website = require('../models/Website');
  const Lead = require('../models/Lead');
  const { current, previous } = resolveRange(range);
  const websites = await Website.find({ status: 'active' }).select('_id name slug branding wordpressUrl').lean();

  const results = await Promise.all(websites.map(async (w) => {
    const baseMatch = { websiteSlug: w.slug, timestamp: { $gte: current[0], $lte: current[1] } };
    const prevMatch = { websiteSlug: w.slug, timestamp: { $gte: previous[0], $lte: previous[1] } };

    const [
      sessionsArr, pvCount, ctaCount, fsCount,
      prevSessionsArr,
      leadCount,
    ] = await Promise.all([
      AnalyticsEvent.distinct('sessionId', baseMatch),
      AnalyticsEvent.countDocuments({ ...baseMatch, eventType: 'page_view' }),
      AnalyticsEvent.countDocuments({ ...baseMatch, eventType: 'cta_click' }),
      AnalyticsEvent.countDocuments({ ...baseMatch, eventType: 'form_submit' }),
      AnalyticsEvent.distinct('sessionId', prevMatch),
      Lead.countDocuments({ website: w._id, createdAt: { $gte: current[0], $lte: current[1] } }),
    ]);

    const sessions = sessionsArr.length;
    const prevSessions = prevSessionsArr.length;
    const conversionRate = sessions ? Number(((leadCount / sessions) * 100).toFixed(2)) : 0;
    const sessionsDelta = pctChange(sessions, prevSessions);

    // Top page for tenant (within current window)
    const topPageRow = await AnalyticsEvent.aggregate([
      { $match: { ...baseMatch, eventType: 'page_view' } },
      { $group: { _id: '$page', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 1 },
    ]);
    const topPage = topPageRow[0]?._id || null;

    return {
      _id: w._id,
      slug: w.slug,
      name: w.name,
      branding: w.branding,
      wordpressUrl: w.wordpressUrl || '',
      sessions,
      pageViews: pvCount,
      ctaClicks: ctaCount,
      formSubmits: fsCount,
      leads: leadCount,
      conversionRate,
      sessionsDelta,
      topPage,
    };
  }));

  return { tenants: results };
}

// ===================================
// Top blogs (by blog_view events)
// ===================================
async function getTopBlogs({ websiteSlug, range = 'week', limit = 10 }) {
  const Blog = require('../models/Blog');
  const { current } = resolveRange(range);
  const baseMatch = matchFilter(websiteSlug, current[0], current[1], 'blog_view');

  const rows = await AnalyticsEvent.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: '$meta.blogSlug',
        views: { $sum: 1 },
        sessions: { $addToSet: '$sessionId' },
        lastViewed: { $max: '$timestamp' },
      },
    },
    { $match: { _id: { $ne: null } } },
    { $project: { blogSlug: '$_id', _id: 0, views: 1, sessions: { $size: '$sessions' }, lastViewed: 1 } },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);

  // Hydrate with Blog metadata
  const slugs = rows.map((r) => r.blogSlug);
  const blogs = await Blog.find({ slug: { $in: slugs } })
    .select('title slug status readingTime publishedAt targetWebsite seoTitle category')
    .populate('targetWebsite', 'name slug')
    .lean();
  const blogMap = new Map(blogs.map((b) => [b.slug, b]));

  return rows.map((r) => ({
    ...r,
    blog: blogMap.get(r.blogSlug) || null,
  }));
}

// ===================================
// Content performance — combines Blog corpus with analytics
// ===================================
async function getContentPerformance({ websiteSlug, range = 'week', limit = 25 }) {
  const Blog = require('../models/Blog');
  const Website = require('../models/Website');
  const { current } = resolveRange(range);

  const blogFilter = { status: 'published' };
  if (websiteSlug && websiteSlug !== 'all') {
    const w = await Website.findOne({ slug: websiteSlug }).select('_id').lean();
    if (w) blogFilter.targetWebsite = w._id;
  }

  const blogs = await Blog.find(blogFilter)
    .select('title slug status readingTime publishedAt updatedAt targetWebsite category')
    .populate('targetWebsite', 'name slug')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  const slugs = blogs.map((b) => b.slug);
  const eventMatch = {
    eventType: 'blog_view',
    'meta.blogSlug': { $in: slugs },
    timestamp: { $gte: current[0], $lte: current[1] },
  };
  if (websiteSlug && websiteSlug !== 'all') eventMatch.websiteSlug = websiteSlug;

  const rows = await AnalyticsEvent.aggregate([
    { $match: eventMatch },
    {
      $group: {
        _id: '$meta.blogSlug',
        views: { $sum: 1 },
        sessions: { $addToSet: '$sessionId' },
      },
    },
    { $project: { blogSlug: '$_id', _id: 0, views: 1, sessions: { $size: '$sessions' } } },
  ]);
  const stats = new Map(rows.map((r) => [r.blogSlug, r]));

  const now = Date.now();
  return blogs.map((b) => {
    const s = stats.get(b.slug) || { views: 0, sessions: 0 };
    const ageDays = b.publishedAt ? Math.floor((now - new Date(b.publishedAt).getTime()) / 86400000) : null;
    const updatedDays = b.updatedAt ? Math.floor((now - new Date(b.updatedAt).getTime()) / 86400000) : null;
    return {
      _id: b._id,
      title: b.title,
      slug: b.slug,
      category: b.category,
      readingTime: b.readingTime || 0,
      tenant: b.targetWebsite?.name || '—',
      tenantSlug: b.targetWebsite?.slug,
      publishedAt: b.publishedAt,
      ageDays,
      updatedDays,
      views: s.views,
      sessions: s.sessions,
      isStale: updatedDays != null && updatedDays > 180,
    };
  });
}

// ===================================
// Realtime feed — last N minutes / events
// ===================================
async function getRealtime({ websiteSlug, limit = 20, minutes = 30 }) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  const filter = { timestamp: { $gte: since } };
  if (websiteSlug && websiteSlug !== 'all') filter.websiteSlug = websiteSlug;

  const [events, activeSessions] = await Promise.all([
    AnalyticsEvent.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('eventType page meta deviceType timestamp referrer websiteSlug')
      .lean(),
    AnalyticsEvent.distinct('sessionId', { timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, ...(websiteSlug && websiteSlug !== 'all' ? { websiteSlug } : {}) }),
  ]);

  return {
    activeNow: activeSessions.length,
    sinceMinutes: minutes,
    events,
  };
}

// ===================================
// Geo/page exit attempts — top exit pages (last event for each session)
// ===================================
async function getExitPages({ websiteSlug, range = 'week', limit = 8 }) {
  const { current } = resolveRange(range);
  const baseMatch = matchFilter(websiteSlug, current[0], current[1], 'page_view');

  // For each session, find the latest page_view; group by page
  const rows = await AnalyticsEvent.aggregate([
    { $match: baseMatch },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$sessionId', exitPage: { $first: '$page' } } },
    { $group: { _id: '$exitPage', exits: { $sum: 1 } } },
    { $project: { page: '$_id', _id: 0, exits: 1 } },
    { $sort: { exits: -1 } },
    { $limit: limit },
  ]);
  return rows;
}

// ===================================
// Landing pages — first page_view per session
// ===================================
async function getLandingPages({ websiteSlug, range = 'week', limit = 8 }) {
  const { current } = resolveRange(range);
  const baseMatch = matchFilter(websiteSlug, current[0], current[1], 'page_view');

  const rows = await AnalyticsEvent.aggregate([
    { $match: baseMatch },
    { $sort: { timestamp: 1 } },
    { $group: { _id: '$sessionId', landingPage: { $first: '$page' } } },
    { $group: { _id: '$landingPage', landings: { $sum: 1 } } },
    { $project: { page: '$_id', _id: 0, landings: 1 } },
    { $sort: { landings: -1 } },
    { $limit: limit },
  ]);
  return rows;
}

// ===================================
// Engagement: pages per session + avg session duration
// ===================================
async function getEngagement({ websiteSlug, range = 'week' }) {
  const { current } = resolveRange(range);
  const baseMatch = matchFilter(websiteSlug, current[0], current[1]);

  // Pull each sessionId's full timeline. SessionStorage-backed IDs persist
  // across an entire tab lifetime including idle hours, so a single sessionId
  // can span many distinct visits. Industry-standard fix: split into "bursts"
  // separated by 30+ minutes of inactivity. Each burst counts as one session
  // for engagement metrics (avg session duration, pages/session, bounce).
  const rows = await AnalyticsEvent.aggregate([
    { $match: baseMatch },
    { $sort: { sessionId: 1, timestamp: 1 } },
    {
      $group: {
        _id: '$sessionId',
        events: { $push: { ts: '$timestamp', t: '$eventType' } },
      },
    },
  ]);

  const INACTIVITY_MS = 30 * 60 * 1000;
  let totalBursts = 0;
  let totalDurationMs = 0;
  let totalPages = 0;
  let bounces = 0;

  for (const row of rows) {
    const events = row.events;
    if (!events.length) continue;

    let burstStart = new Date(events[0].ts).getTime();
    let burstEnd   = burstStart;
    let burstPages = events[0].t === 'page_view' ? 1 : 0;

    const flushBurst = () => {
      totalBursts++;
      totalDurationMs += (burstEnd - burstStart);
      totalPages += burstPages;
      if (burstPages <= 1) bounces++;
    };

    for (let i = 1; i < events.length; i++) {
      const prevTs = new Date(events[i - 1].ts).getTime();
      const currTs = new Date(events[i].ts).getTime();
      if ((currTs - prevTs) > INACTIVITY_MS) {
        flushBurst();
        burstStart = currTs;
        burstPages = 0;
      }
      burstEnd = currTs;
      if (events[i].t === 'page_view') burstPages++;
    }
    flushBurst();
  }

  if (totalBursts === 0) {
    return { sessions: 0, avgPagesPerSession: 0, avgSessionDurationSec: 0, bouncePct: 0 };
  }

  const avgDurSec = (totalDurationMs / totalBursts) / 1000;
  const avgPages = totalPages / totalBursts;
  const bouncePct = (bounces / totalBursts) * 100;

  return {
    sessions: totalBursts,
    avgPagesPerSession: Number(avgPages.toFixed(2)),
    avgSessionDurationSec: Number(avgDurSec.toFixed(0)),
    bouncePct: Number(bouncePct.toFixed(1)),
  };
}

// ===================================
// Returning visitor % — sessions in BOTH current AND previous windows
// ===================================
async function getReturningVisitors({ websiteSlug, range = 'week' }) {
  const { current, previous } = resolveRange(range);
  const matchA = { timestamp: { $gte: current[0], $lte: current[1] } };
  const matchB = { timestamp: { $gte: previous[0], $lte: previous[1] } };
  if (websiteSlug && websiteSlug !== 'all') {
    matchA.websiteSlug = websiteSlug;
    matchB.websiteSlug = websiteSlug;
  }
  const [currIds, prevIds] = await Promise.all([
    AnalyticsEvent.distinct('sessionId', matchA),
    AnalyticsEvent.distinct('sessionId', matchB),
  ]);
  const prevSet = new Set(prevIds);
  const returning = currIds.filter((id) => prevSet.has(id)).length;
  const total = currIds.length;
  const pct = total ? Number(((returning / total) * 100).toFixed(1)) : 0;
  return { total, returning, returningPct: pct };
}

// ===================================
// Per-page conversion — % of sessions visiting page that submit a form
// ===================================
async function getPageConversion({ websiteSlug, range = 'week', limit = 8 }) {
  const { current } = resolveRange(range);
  const match = { timestamp: { $gte: current[0], $lte: current[1] } };
  if (websiteSlug && websiteSlug !== 'all') match.websiteSlug = websiteSlug;

  const events = await AnalyticsEvent.find(match)
    .select('eventType page sessionId')
    .lean();

  const submittedSessions = new Set();
  for (const e of events) if (e.eventType === 'form_submit') submittedSessions.add(e.sessionId);

  const pageToSessions = new Map();
  for (const e of events) {
    if (e.eventType !== 'page_view' && e.eventType !== 'blog_view') continue;
    if (!pageToSessions.has(e.page)) pageToSessions.set(e.page, new Set());
    pageToSessions.get(e.page).add(e.sessionId);
  }

  const rows = [];
  for (const [page, sessions] of pageToSessions.entries()) {
    if (sessions.size < 2) continue;
    let converted = 0;
    for (const sid of sessions) if (submittedSessions.has(sid)) converted++;
    rows.push({
      page,
      sessions: sessions.size,
      conversions: converted,
      conversionRate: Number(((converted / sessions.size) * 100).toFixed(2)),
    });
  }

  rows.sort((a, b) => b.conversionRate - a.conversionRate || b.sessions - a.sessions);
  return rows.slice(0, limit);
}

// ===================================
// Per-page bounce — % of landing-on-page sessions that bounce
// ===================================
async function getPageBounce({ websiteSlug, range = 'week', limit = 8 }) {
  const { current } = resolveRange(range);
  const match = { timestamp: { $gte: current[0], $lte: current[1] } };
  if (websiteSlug && websiteSlug !== 'all') match.websiteSlug = websiteSlug;

  const rows = await AnalyticsEvent.aggregate([
    { $match: { ...match, eventType: 'page_view' } },
    { $sort: { sessionId: 1, timestamp: 1 } },
    {
      $group: {
        _id: '$sessionId',
        firstPage: { $first: '$page' },
        count: { $sum: 1 },
      },
    },
  ]);

  const pageStats = new Map();
  for (const row of rows) {
    if (!row.firstPage) continue;
    if (!pageStats.has(row.firstPage)) pageStats.set(row.firstPage, { visits: 0, bounces: 0 });
    const s = pageStats.get(row.firstPage);
    s.visits++;
    if (row.count <= 1) s.bounces++;
  }

  const out = [];
  for (const [page, s] of pageStats.entries()) {
    if (s.visits < 2) continue;
    out.push({
      page,
      visits: s.visits,
      bounces: s.bounces,
      bouncePct: Number(((s.bounces / s.visits) * 100).toFixed(1)),
    });
  }

  out.sort((a, b) => b.bouncePct - a.bouncePct || b.visits - a.visits);
  return out.slice(0, limit);
}

// ===================================
// Per-blog trend deltas — current vs previous window
// ===================================
// Returns one row per published blog with current + previous-window view
// counts and session counts. Used by the Content Decay engine to detect
// engagement decline.
//
// Multi-tenant: when websiteSlug is provided, blogs are scoped via Website
// → Blog.targetWebsite + events filtered by websiteSlug at the $match stage.
async function getBlogTrends({ websiteSlug, range = 'month' }) {
  const Blog = require('../models/Blog');
  const Website = require('../models/Website');
  const { current, previous } = resolveRange(range);

  const blogFilter = { status: 'published' };
  if (websiteSlug && websiteSlug !== 'all') {
    const w = await Website.findOne({ slug: websiteSlug }).select('_id').lean();
    if (w) blogFilter.targetWebsite = w._id;
  }

  const blogs = await Blog.find(blogFilter)
    .select('title slug status publishedAt updatedAt targetWebsite')
    .populate('targetWebsite', 'name slug')
    .lean();

  const slugs = blogs.map((b) => b.slug);
  if (!slugs.length) return [];

  const aggregate = async (start, end) => {
    const match = {
      eventType: 'blog_view',
      'meta.blogSlug': { $in: slugs },
      timestamp: { $gte: start, $lte: end },
    };
    if (websiteSlug && websiteSlug !== 'all') match.websiteSlug = websiteSlug;

    const rows = await AnalyticsEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$meta.blogSlug',
          views: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      { $project: { blogSlug: '$_id', _id: 0, views: 1, sessions: { $size: '$sessions' } } },
    ]);
    return new Map(rows.map((r) => [r.blogSlug, r]));
  };

  const [currMap, prevMap] = await Promise.all([
    aggregate(current[0], current[1]),
    aggregate(previous[0], previous[1]),
  ]);

  const now = Date.now();
  return blogs.map((b) => {
    const c = currMap.get(b.slug) || { views: 0, sessions: 0 };
    const p = prevMap.get(b.slug) || { views: 0, sessions: 0 };
    const ageDays = b.publishedAt ? Math.floor((now - new Date(b.publishedAt).getTime()) / 86400000) : null;
    const updatedDays = b.updatedAt ? Math.floor((now - new Date(b.updatedAt).getTime()) / 86400000) : null;
    return {
      _id: b._id,
      title: b.title,
      slug: b.slug,
      tenant: b.targetWebsite?.name || '—',
      tenantSlug: b.targetWebsite?.slug || null,
      publishedAt: b.publishedAt,
      updatedAt: b.updatedAt,
      ageDays,
      updatedDays,
      current: { views: c.views, sessions: c.sessions },
      previous: { views: p.views, sessions: p.sessions },
      viewsDeltaPct: pctChange(c.views, p.views),
      sessionsDeltaPct: pctChange(c.sessions, p.sessions),
    };
  });
}

module.exports = {
  resolveRange,
  getOverview,
  getTimeseries,
  getTopPages,
  getRecent,
  getBreakdown,
  // Extensions for /analytics
  getFunnel,
  getTenantComparison,
  getTopBlogs,
  getContentPerformance,
  getRealtime,
  getExitPages,
  getLandingPages,
  getEngagement,
  // Phase 2.0 behavior intelligence
  getReturningVisitors,
  getPageConversion,
  getPageBounce,
  // Content decay
  getBlogTrends,
};
