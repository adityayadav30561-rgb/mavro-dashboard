/**
 * Mavro first-party analytics overlay for the MBR report.
 *
 * WHY: GA4 structurally undercounts (ad-blockers kill gtag, Safari ITP caps
 * cookies, consent mode drops hits). Our first-party beacon posts to the
 * backend origin, which blockers don't filter, so for sites where the Mavro
 * tracker is installed the AnalyticsEvent store is the more complete source
 * for volume metrics (users / sessions / page views / pages / devices).
 *
 * SOURCE POLICY (Option A, decided 2026-07-10):
 *   - Audience volumes, daily trend, top pages, devices → Mavro store when the
 *     window is fully covered by tracking data; GA4 fallback otherwise.
 *   - Geo, acquisition channels/sources, AI referrals, conversions, GSC →
 *     stay GA4/GSC (we don't capture country or paid attribution).
 *   - NEVER max(GA4, ours) — one methodology per window, labeled.
 *
 * METRIC DEFINITIONS (first-party):
 *   users     = distinct sessionId in window (per-tab visitors)
 *   sessions  = burst count: a sessionId's events split on 30-min inactivity
 *               gaps (same model as analyticsService.getEngagement)
 *   pageViews = count of page_view events
 *
 * A window counts as COVERED only if tracking existed before the window
 * started (firstEventAt <= window.start). Partially-covered windows fall back
 * to GA4 — mixing a half-tracked month into an MoM series lies about growth.
 */

const AnalyticsEvent = require('../models/AnalyticsEvent');

const BURST_GAP_MS = 30 * 60 * 1000;

const toStart = (d) => new Date(`${d}T00:00:00.000Z`);
const toEnd = (d) => new Date(`${d}T23:59:59.999Z`);
const ga4Date = (d) => d.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

/** First event timestamp for a tenant — decides window coverage. */
async function getFirstEventAt(websiteSlug) {
  const first = await AnalyticsEvent.findOne({ websiteSlug })
    .sort({ timestamp: 1 })
    .select('timestamp')
    .lean();
  return first?.timestamp || null;
}

/** Burst-count sessions from [ {sessionId, timestamp} ] rows (sorted per sid). */
function countBursts(rows) {
  const bySid = new Map();
  for (const r of rows) {
    if (!bySid.has(r.sessionId)) bySid.set(r.sessionId, []);
    bySid.get(r.sessionId).push(r.timestamp.getTime());
  }
  let bursts = 0;
  for (const times of bySid.values()) {
    times.sort((a, b) => a - b);
    bursts += 1;
    for (let i = 1; i < times.length; i += 1) {
      if (times[i] - times[i - 1] > BURST_GAP_MS) bursts += 1;
    }
  }
  return bursts;
}

/** Audience volumes for one window. */
async function windowOverview(websiteSlug, win) {
  const match = { websiteSlug, timestamp: { $gte: toStart(win.startDate), $lte: toEnd(win.endDate) } };
  const [rows, pageViews] = await Promise.all([
    AnalyticsEvent.find(match).select('sessionId timestamp').lean(),
    AnalyticsEvent.countDocuments({ ...match, eventType: 'page_view' }),
  ]);
  const users = new Set(rows.map((r) => r.sessionId)).size;
  const sessions = countBursts(rows);
  return { users, sessions, pageViews };
}

/** Daily trend for one window → GA4-shaped rows { date: YYYYMMDD, users, sessions, pageViews }. */
async function windowTrend(websiteSlug, win) {
  const match = { websiteSlug, timestamp: { $gte: toStart(win.startDate), $lte: toEnd(win.endDate) } };
  const rows = await AnalyticsEvent.find(match).select('sessionId timestamp eventType').lean();
  // Bucket per UTC day, then burst-count sessions WITHIN each day — sessions
  // must not just mirror distinct users or the two chart lines overlap.
  const byDay = new Map(); // key → { rows: [], pageViews }
  for (const r of rows) {
    const key = ga4Date(r.timestamp);
    if (!byDay.has(key)) byDay.set(key, { rows: [], pageViews: 0 });
    const bucket = byDay.get(key);
    bucket.rows.push(r);
    if (r.eventType === 'page_view') bucket.pageViews += 1;
  }
  // Zero-fill the full window so charts align day-for-day with GA4's output
  const out = [];
  for (let d = toStart(win.startDate); d <= toEnd(win.endDate); d = new Date(d.getTime() + 86400000)) {
    const key = ga4Date(d);
    const bucket = byDay.get(key);
    out.push({
      date: key,
      users: bucket ? new Set(bucket.rows.map((r) => r.sessionId)).size : 0,
      sessions: bucket ? countBursts(bucket.rows) : 0,
      pageViews: bucket ? bucket.pageViews : 0,
    });
  }
  return out;
}

/** Top pages for one window → GA4-shaped rows { path, views, users, avgEngagementSec:null }. */
async function windowTopPages(websiteSlug, win, limit = 15) {
  const rows = await AnalyticsEvent.aggregate([
    {
      $match: {
        websiteSlug,
        eventType: 'page_view',
        timestamp: { $gte: toStart(win.startDate), $lte: toEnd(win.endDate) },
      },
    },
    {
      $group: {
        _id: '$page',
        views: { $sum: 1 },
        sids: { $addToSet: '$sessionId' },
      },
    },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({
    path: String(r._id).split('?')[0],
    views: r.views,
    users: r.sids.length,
    avgEngagementSec: null, // engagement duration is a GA4-only concept here
  }));
}

/** Devices for one window → GA4-shaped rows { device, users, sessions }. */
async function windowDevices(websiteSlug, win) {
  const rows = await AnalyticsEvent.find({
    websiteSlug,
    timestamp: { $gte: toStart(win.startDate), $lte: toEnd(win.endDate) },
    deviceType: { $nin: [null, 'bot', 'unknown'] },
  }).select('sessionId timestamp deviceType').lean();
  const byDevice = new Map();
  for (const r of rows) {
    if (!byDevice.has(r.deviceType)) byDevice.set(r.deviceType, []);
    byDevice.get(r.deviceType).push(r);
  }
  return [...byDevice.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([device, deviceRows]) => ({
      device,
      users: new Set(deviceRows.map((r) => r.sessionId)).size,
      sessions: countBursts(deviceRows),
    }));
}

/**
 * Build the full overlay for a tenant across the 4 MBR windows.
 * Returns null when the tenant has no tracking data at all.
 */
async function getOverlay(websiteSlug, ranges) {
  const firstEventAt = await getFirstEventAt(websiteSlug);
  if (!firstEventAt) return null;

  const windows = {
    current: ranges.current,
    previous: ranges.previous,
    previousFull: ranges.previousFull || ranges.previous,
    previous2: ranges.previous2,
  };

  const covered = {};
  for (const [key, win] of Object.entries(windows)) {
    covered[key] = firstEventAt <= toStart(win.startDate);
  }
  // CURRENT window relaxation (user decision 2026-07-10): if tracking started
  // mid-window, still use Mavro data for the current period and surface
  // `partialFrom` so the UI can caption "since <date>". Once a new month
  // starts after the install date, partialFrom disappears automatically.
  // Historical windows stay strict — GA4 fallback, no mixed series.
  let partialFrom = null;
  if (!covered.current && firstEventAt <= toEnd(windows.current.endDate)) {
    covered.current = true;
    partialFrom = firstEventAt;
  }

  const overview = {};
  for (const [key, win] of Object.entries(windows)) {
    overview[key] = covered[key] ? await windowOverview(websiteSlug, win) : null;
  }

  const trend = covered.current ? await windowTrend(websiteSlug, windows.current) : null;
  const trendPrevFull = covered.previousFull ? await windowTrend(websiteSlug, windows.previousFull) : null;
  const trendPrev2 = covered.previous2 ? await windowTrend(websiteSlug, windows.previous2) : null;
  const topPages = covered.current ? await windowTopPages(websiteSlug, windows.current) : null;
  const devices = covered.current ? await windowDevices(websiteSlug, windows.current) : null;

  return {
    firstEventAt,
    partialFrom,
    covered,
    overview,
    trend,
    trendCompare: { current: trend, previous: trendPrevFull, previous2: trendPrev2 },
    topPages,
    devices,
  };
}

module.exports = { getOverlay };
