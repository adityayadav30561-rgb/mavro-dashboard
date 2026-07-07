const AnalyticsEvent = require('../models/AnalyticsEvent');
const { analyticsService } = require('../services');
const { asyncHandler, ApiResponse } = require('../utils');

const ALLOWED_EVENTS = AnalyticsEvent.ALLOWED_EVENTS;
const ALLOWED_RANGES = ['day', 'week', 'month', 'year'];
const ALLOWED_DEVICES = ['desktop', 'tablet', 'mobile', 'bot', 'unknown'];

// ===================================
// User-Agent parsing — lightweight, no external dep
// ===================================
function parseUA(ua = '') {
  if (!ua) return { browser: null, os: null, device: 'unknown' };

  const u = String(ua).toLowerCase();
  let device = 'desktop';
  if (/bot|crawler|spider|crawling/i.test(ua)) device = 'bot';
  else if (/tablet|ipad/.test(u)) device = 'tablet';
  else if (/mobi|android|iphone|ipod|webos|blackberry|opera mini|iemobile/.test(u)) device = 'mobile';

  let browser = null;
  if (u.includes('edg/')) browser = 'Edge';
  else if (u.includes('chrome/') && !u.includes('chromium')) browser = 'Chrome';
  else if (u.includes('firefox/')) browser = 'Firefox';
  else if (u.includes('safari/') && !u.includes('chrome')) browser = 'Safari';
  else if (u.includes('opera') || u.includes('opr/')) browser = 'Opera';

  let os = null;
  if (u.includes('windows')) os = 'Windows';
  else if (u.includes('mac os')) os = 'macOS';
  else if (u.includes('android')) os = 'Android';
  else if (u.includes('iphone') || u.includes('ipad')) os = 'iOS';
  else if (u.includes('linux')) os = 'Linux';

  return { browser, os, device };
}

function getClientIp(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip ||
    null
  );
}

// ===================================
// POST /api/analytics/track — public ingestion
// Accepts JSON body or sendBeacon Blob (text/plain).
// ===================================
const trackEvent = asyncHandler(async (req, res) => {
  // sendBeacon submits a Blob with Content-Type: application/json by default,
  // but some browsers fall back to text/plain. Parse defensively.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const eventType = String(body.eventType || '').trim();
  if (!ALLOWED_EVENTS.includes(eventType)) {
    return ApiResponse.error(res, 'Invalid eventType', 400);
  }

  const websiteSlug = String(body.websiteSlug || '').trim().toLowerCase();
  if (!websiteSlug || websiteSlug.length > 100) {
    return ApiResponse.error(res, 'websiteSlug required', 400);
  }

  const page = String(body.page || '/').slice(0, 500);
  const sessionId = String(body.sessionId || '').trim().slice(0, 64);
  if (!sessionId) return ApiResponse.error(res, 'sessionId required', 400);

  const referrer = body.referrer ? String(body.referrer).slice(0, 1000) : null;
  const ua = req.headers['user-agent'] || body.userAgent || '';
  const parsed = parseUA(ua);
  const deviceType = ALLOWED_DEVICES.includes(body.deviceType) ? body.deviceType : parsed.device;

  const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};

  // Drop bot traffic from the table to keep aggregations clean
  if (parsed.device === 'bot') {
    return ApiResponse.success(res, { recorded: false, reason: 'bot' });
  }

  await AnalyticsEvent.create({
    websiteSlug,
    eventType,
    page,
    sessionId,
    referrer,
    deviceType,
    browser: parsed.browser,
    os: parsed.os,
    userAgent: String(ua).slice(0, 1000),
    ipAddress: getClientIp(req),
    meta,
  });

  return ApiResponse.success(res, { recorded: true });
});

// ===================================
// GET /api/analytics/overview
// ===================================
const getOverview = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const data = await analyticsService.getOverview({ websiteSlug, range });
  return ApiResponse.success(res, data);
});

// ===================================
// GET /api/analytics/timeseries
// ===================================
const getTimeseries = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const data = await analyticsService.getTimeseries({ websiteSlug, range });
  return ApiResponse.success(res, data);
});

// ===================================
// GET /api/analytics/top-pages
// ===================================
const getTopPages = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
  const data = await analyticsService.getTopPages({ websiteSlug, range, limit });
  return ApiResponse.success(res, { pages: data });
});

// ===================================
// GET /api/analytics/recent
// ===================================
const getRecent = asyncHandler(async (req, res) => {
  const websiteSlug = req.query.websiteSlug || 'all';
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  const data = await analyticsService.getRecent({ websiteSlug, limit });
  return ApiResponse.success(res, { events: data });
});

// ===================================
// GET /api/analytics/breakdown
// ===================================
const getBreakdown = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const data = await analyticsService.getBreakdown({ websiteSlug, range });
  return ApiResponse.success(res, data);
});

// ===================================
// GET /api/analytics/_debug
// Operator-facing diagnostic — counts, last events, current window, ranges.
// ===================================
const getDebug = asyncHandler(async (req, res) => {
  const AnalyticsEventModel = require('../models/AnalyticsEvent');
  const websiteSlug = req.query.websiteSlug || 'all';
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';

  const baseFilter = websiteSlug === 'all' ? {} : { websiteSlug };

  const [total, byType, distinctSessions, distinctSlugs, lastEvents] = await Promise.all([
    AnalyticsEventModel.countDocuments(baseFilter),
    AnalyticsEventModel.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$eventType', count: { $sum: 1 }, last: { $max: '$timestamp' }, first: { $min: '$timestamp' } } },
    ]),
    AnalyticsEventModel.distinct('sessionId', baseFilter),
    AnalyticsEventModel.distinct('websiteSlug'),
    AnalyticsEventModel.find(baseFilter)
      .sort({ timestamp: -1 })
      .limit(10)
      .select('eventType page sessionId timestamp websiteSlug referrer deviceType')
      .lean(),
  ]);

  const { resolveRange, getTimeseries, getOverview } = require('../services/analyticsService');
  const windowInfo = resolveRange(range);
  const inWindow = await AnalyticsEventModel.countDocuments({
    ...baseFilter,
    timestamp: { $gte: windowInfo.current[0], $lte: windowInfo.current[1] },
  });

  const timeseries = await getTimeseries({ websiteSlug, range });
  const overview = await getOverview({ websiteSlug, range });

  return ApiResponse.success(res, {
    serverNowUTC: new Date().toISOString(),
    storage: {
      totalEvents: total,
      distinctSessions: distinctSessions.length,
      distinctSlugs,
      byType,
      lastEvents,
    },
    window: {
      range,
      current: { from: windowInfo.current[0], to: windowInfo.current[1] },
      previous: { from: windowInfo.previous[0], to: windowInfo.previous[1] },
      eventsInWindow: inWindow,
      bucket: windowInfo.bucket,
    },
    overview,
    timeseriesPreview: {
      eventCount: timeseries.eventCount,
      bucketCount: timeseries.series.length,
      firstBucket: timeseries.series[0],
      lastBucket: timeseries.series[timeseries.series.length - 1],
      nonZeroBuckets: timeseries.series.filter((s) => s.views || s.sessions).length,
    },
  });
});

// ===================================
// Extension endpoints for /analytics page
// ===================================
const getFunnel = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const data = await analyticsService.getFunnel({ websiteSlug, range });
  return ApiResponse.success(res, data);
});

const getTenantComparison = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const data = await analyticsService.getTenantComparison({ range });
  return ApiResponse.success(res, data);
});

const getTopBlogs = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const data = await analyticsService.getTopBlogs({ websiteSlug, range, limit });
  return ApiResponse.success(res, { blogs: data });
});

const getContentPerformance = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
  const data = await analyticsService.getContentPerformance({ websiteSlug, range, limit });
  return ApiResponse.success(res, { blogs: data });
});

const getRealtime = asyncHandler(async (req, res) => {
  const websiteSlug = req.query.websiteSlug || 'all';
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const minutes = Math.min(parseInt(req.query.minutes, 10) || 30, 1440);
  const data = await analyticsService.getRealtime({ websiteSlug, limit, minutes });
  return ApiResponse.success(res, data);
});

const getLandingPages = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
  const data = await analyticsService.getLandingPages({ websiteSlug, range, limit });
  return ApiResponse.success(res, { pages: data });
});

const getExitPages = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
  const data = await analyticsService.getExitPages({ websiteSlug, range, limit });
  return ApiResponse.success(res, { pages: data });
});

const getEngagement = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const data = await analyticsService.getEngagement({ websiteSlug, range });
  return ApiResponse.success(res, data);
});

// ===================================
// Phase 2.0 — Behavior Intelligence + Anomaly Detection
// ===================================
const getReturningVisitors = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const data = await analyticsService.getReturningVisitors({ websiteSlug, range });
  return ApiResponse.success(res, data);
});

const getPageConversion = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
  const data = await analyticsService.getPageConversion({ websiteSlug, range, limit });
  return ApiResponse.success(res, { pages: data });
});

const getPageBounce = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
  const data = await analyticsService.getPageBounce({ websiteSlug, range, limit });
  return ApiResponse.success(res, { pages: data });
});

const getAnomalies = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'week';
  const websiteSlug = req.query.websiteSlug || 'all';
  const { anomalyService } = require('../services');
  const data = await anomalyService.getAnomalies({ websiteSlug, range });
  return ApiResponse.success(res, data);
});

const getBlogTrends = asyncHandler(async (req, res) => {
  const range = ALLOWED_RANGES.includes(req.query.range) ? req.query.range : 'month';
  const websiteSlug = req.query.websiteSlug || 'all';
  const data = await analyticsService.getBlogTrends({ websiteSlug, range });
  return ApiResponse.success(res, { blogs: data });
});

// ===================================
// GET /api/analytics/pulse — real system-status signals for the dashboard.
// Replaces the old hardcoded "LIVE" list: actual last-ingest age + today's
// event count. API reachability is implied by the request succeeding.
// ===================================
const getPulse = asyncHandler(async (req, res) => {
  const [last, todayCount] = await Promise.all([
    AnalyticsEvent.findOne().sort({ timestamp: -1 }).select('timestamp eventType websiteSlug').lean(),
    AnalyticsEvent.countDocuments({
      timestamp: { $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) },
    }),
  ]);

  const minutesAgo = last ? Math.round((Date.now() - new Date(last.timestamp).getTime()) / 60000) : null;

  return ApiResponse.success(res, {
    lastEventAt: last?.timestamp || null,
    lastEventType: last?.eventType || null,
    lastEventTenant: last?.websiteSlug || null,
    minutesAgo,
    eventsToday: todayCount,
  });
});

module.exports = {
  trackEvent,
  getOverview,
  getTimeseries,
  getTopPages,
  getRecent,
  getBreakdown,
  getDebug,
  getFunnel,
  getTenantComparison,
  getTopBlogs,
  getContentPerformance,
  getRealtime,
  getLandingPages,
  getExitPages,
  getEngagement,
  getReturningVisitors,
  getPageConversion,
  getPageBounce,
  getAnomalies,
  getBlogTrends,
  getPulse,
};
