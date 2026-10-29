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
 * GAP DAYS: days in a window the tracker could not have recorded — before the
 * install day, or inside a known outage (config/trackingOutages.js). A window
 * with no gap days is pure Mavro; one with some is a 'blend' (GA4's daily rows
 * fill the gap days, Mavro the rest); one that is all gap days is pure GA4.
 * Our own events on outage days are ignored so a half-recorded day never
 * stands in for a full one.
 */

const AnalyticsEvent = require('../models/AnalyticsEvent');
const { TRACKING_OUTAGES } = require('../config/trackingOutages');

const BURST_GAP_MS = 30 * 60 * 1000;

const toStart = (d) => new Date(`${d}T00:00:00.000Z`);
const toEnd = (d) => new Date(`${d}T23:59:59.999Z`);
const ga4Date = (d) => d.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

/** Outages overlapping a window, clipped to it. */
function outagesIn(win) {
  return TRACKING_OUTAGES
    .filter((o) => o.from <= win.endDate && o.to >= win.startDate)
    .map((o) => ({
      ...o,
      from: o.from < win.startDate ? win.startDate : o.from,
      to: o.to > win.endDate ? win.endDate : o.to,
    }));
}

/** Event filter for a window, minus outage days. */
function windowMatch(websiteSlug, win, extra = {}) {
  const match = { websiteSlug, timestamp: { $gte: toStart(win.startDate), $lte: toEnd(win.endDate) }, ...extra };
  const outs = outagesIn(win);
  if (outs.length) match.$nor = outs.map((o) => ({ timestamp: { $gte: toStart(o.from), $lte: toEnd(o.to) } }));
  return match;
}

/** Gap days (YYYYMMDD) in a window + the window's day count. */
function gapDaysIn(win, installDay) {
  const outs = outagesIn(win);
  const days = new Set();
  let total = 0;
  for (let d = toStart(win.startDate); d <= toEnd(win.endDate); d = new Date(d.getTime() + 86400000)) {
    total += 1;
    const iso = d.toISOString().slice(0, 10);
    if (iso < installDay || outs.some((o) => iso >= o.from && iso <= o.to)) days.add(iso.replace(/-/g, ''));
  }
  return { days, total };
}

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
  const match = windowMatch(websiteSlug, win);
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
  const match = windowMatch(websiteSlug, win);
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
    { $match: windowMatch(websiteSlug, win, { eventType: 'page_view' }) },
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
  const rows = await AnalyticsEvent.find(
    windowMatch(websiteSlug, win, { deviceType: { $nin: [null, 'bot', 'unknown'] } })
  ).select('sessionId timestamp deviceType').lean();
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

  // Coverage is judged by DAY, not timestamp — a range starting on the
  // install date is fully covered even though the first event landed at
  // 10:23, not midnight.
  const installDay = firstEventAt.toISOString().slice(0, 10);
  const coverage = {};
  const gapDays = {};
  for (const [key, win] of Object.entries(windows)) {
    const { days, total } = gapDaysIn(win, installDay);
    gapDays[key] = days;
    if (days.size === 0) coverage[key] = 'full';
    else if (days.size < total) coverage[key] = 'partial';
    else coverage[key] = 'none';
  }
  const covered = {};
  for (const key of Object.keys(windows)) covered[key] = coverage[key] !== 'none';
  // partialFrom drives the "(since 8 Jul)" caption — only when the current
  // window straddles the install day, not when its gap is an outage.
  const partialFrom = covered.current && installDay > windows.current.startDate ? firstEventAt : null;

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
    installDay,
    partialFrom,
    coverage,
    covered,
    gapDays,
    outages: outagesIn(windows.current),
    overview,
    trend,
    trendCompare: { current: trend, previous: trendPrevFull, previous2: trendPrev2 },
    topPages,
    devices,
  };
}

/**
 * Merge the first-party overlay into a GA4 MBR report (source policy Option
 * A, 2026-07-10). Shared by the /mbr page and the Excel export so both show
 * the same numbers.
 *
 * Volume metrics come from our AnalyticsEvent store per covered window; GA4
 * stays for uncovered windows and for everything we don't capture (geo,
 * channels, AI referrals, conversions). GA4's audience numbers are preserved
 * in `ga4Reported` so the UI can show the gap — that delta is the ad-blocker /
 * consent loss rate, worth seeing.
 *
 * @param {object} report  ga4Service.getMbrReport() output (not mutated)
 * @returns {Promise<object>} the merged payload (the report itself when the
 *   tenant has no tracking data)
 */
async function applyOverlay(report, websiteSlug, ranges) {
  const overlay = await getOverlay(websiteSlug, ranges);
  if (!overlay) return report;

  const payload = {
    ...report,
    overview: { ...report.overview },
    trendCompare: { ...report.trendCompare },
  };
  // Keep GA4's audience for the secondary line before overwriting
  payload.ga4Reported = {
    current: { ...report.overview.current },
    previous: { ...report.overview.previous },
    previousFull: { ...report.overview.previousFull },
    previous2: { ...report.overview.previous2 },
  };
  payload.audienceSource = {};
  for (const win of ['current', 'previous', 'previousFull', 'previous2']) {
    const m = overlay.overview[win];
    if (m) {
      payload.overview[win] = {
        ...payload.overview[win], // GA4-only fields survive (newUsers, engagement)
        users: m.users,
        sessions: m.sessions,
        pageViews: m.pageViews,
      };
      payload.audienceSource[win] = 'mavro';
    } else {
      payload.audienceSource[win] = 'ga4';
    }
  }
  if (overlay.trend) {
    payload.trend = overlay.trend;
    payload.trendSource = 'mavro';
    payload.trendCompare = {
      current: overlay.trendCompare.current || payload.trendCompare.current,
      previous: overlay.trendCompare.previous || payload.trendCompare.previous,
      previous2: overlay.trendCompare.previous2 || payload.trendCompare.previous2,
    };
    payload.trendCompareSource = {
      current: overlay.trendCompare.current ? 'mavro' : 'ga4',
      previous: overlay.trendCompare.previous ? 'mavro' : 'ga4',
      previous2: overlay.trendCompare.previous2 ? 'mavro' : 'ga4',
    };
  } else {
    payload.trendSource = 'ga4';
  }
  if (overlay.topPages) {
    payload.topPages = overlay.topPages;
    payload.pagesSource = 'mavro';
  } else {
    payload.pagesSource = 'ga4';
  }
  if (overlay.devices) {
    payload.devices = overlay.devices;
    payload.devicesSource = 'mavro';
  } else {
    payload.devicesSource = 'ga4';
  }
  payload.mavroFirstEventAt = overlay.firstEventAt;
  payload.mavroPartialFrom = overlay.partialFrom || null;
  payload.mavroOutages = overlay.outages;

  // ── Blend (user decisions 2026-07-17, extended to outages 2026-10-29):
  // any window with gap days stitches GA4's daily rows for those days with
  // Mavro for the rest — totals never silently drop untracked days, and the
  // trend chart never flatlines at zero across them. Fully-covered windows
  // stay pure Mavro, fully-uncovered windows stay pure GA4.
  const byRange = report.trendByRange || {};
  const gapSum = (rows, k) => rows.reduce((acc, r) => acc + (Number(r[k]) || 0), 0);
  for (const win of ['current', 'previous', 'previousFull', 'previous2']) {
    if (overlay.coverage[win] !== 'partial') continue;
    const gapRows = (byRange[win] || []).filter((r) => overlay.gapDays[win].has(r.date));
    if (!gapRows.length) continue;
    // Daily-user sums can double-count cross-day returners, but for the gap
    // days it's the only GA4-daily signal available.
    payload.overview[win] = {
      ...payload.overview[win],
      users: gapSum(gapRows, 'users') + (overlay.overview[win]?.users || 0),
      sessions: gapSum(gapRows, 'sessions') + (overlay.overview[win]?.sessions || 0),
      pageViews: gapSum(gapRows, 'pageViews') + (overlay.overview[win]?.pageViews || 0),
    };
    payload.audienceSource[win] = 'blend';
  }
  // Stitch the daily series the same way (GA4 rows on gap days, Mavro rows
  // on the rest), kept in date order.
  const stitch = (ga4Rows, mavroRows, gap) => ([
    ...(ga4Rows || []).filter((r) => gap.has(r.date)),
    ...(mavroRows || []).filter((r) => !gap.has(r.date)),
  ].sort((a, b) => a.date.localeCompare(b.date)));
  if (overlay.coverage.current === 'partial' && overlay.trend) {
    payload.trend = stitch(byRange.current, overlay.trend, overlay.gapDays.current);
    payload.trendSource = 'blend';
  }
  const compareWinFor = { current: 'current', previous: 'previousFull', previous2: 'previous2' };
  for (const [cmpKey, winKey] of Object.entries(compareWinFor)) {
    if (overlay.coverage[winKey] === 'partial' && overlay.trendCompare[cmpKey]) {
      payload.trendCompare[cmpKey] = stitch(byRange[winKey], overlay.trendCompare[cmpKey], overlay.gapDays[winKey]);
      payload.trendCompareSource[cmpKey] = 'blend';
    }
  }
  return payload;
}

module.exports = { getOverlay, applyOverlay };
