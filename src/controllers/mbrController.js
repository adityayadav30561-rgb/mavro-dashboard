/**
 * MBR (Monthly Business Review) controller.
 *
 * Pulls Google-side data (GA4 Data API + Search Console) through the
 * service-account layer in services/google/, plus button-level click detail
 * from our own AnalyticsEvent collection (which stores full event meta that
 * GA4 only keeps behind registered custom dimensions).
 *
 * Date model:
 *   ?month=YYYY-MM        → current = that calendar month (end clamped to today),
 *                           previous = the full prior calendar month
 *   ?start=&end=          → custom range; previous = same-length window
 *                           immediately preceding
 *
 * Responses are cached in-memory for 1 hour per (endpoint, range) — MBR data
 * changes slowly and GA4/GSC quotas are hourly.
 */

const AnalyticsEvent = require('../models/AnalyticsEvent');
const { asyncHandler, ApiResponse } = require('../utils');
const ga4Service = require('../services/google/ga4Service');
const gscService = require('../services/google/gscService');

// ===================================
// In-memory response cache
// ===================================
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  cache.delete(key);
  return null;
}

function cacheSet(key, value) {
  // Bounded: MBR ranges are few, but guard against param-spray growth
  if (cache.size > 200) cache.clear();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ===================================
// Date-range resolution
// ===================================
const fmt = (d) => d.toISOString().slice(0, 10);

function resolveRanges(query) {
  const today = new Date();
  const todayStr = fmt(today);

  const monthParam = String(query.month || '').trim();
  if (/^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number);
    const monthStart = new Date(Date.UTC(y, m - 1, 1));
    const monthEnd = new Date(Date.UTC(y, m, 0)); // last day of month
    const curEnd = fmt(monthEnd) < todayStr ? fmt(monthEnd) : todayStr;
    const prevStart = new Date(Date.UTC(y, m - 2, 1));
    const prevEnd = new Date(Date.UTC(y, m - 1, 0));
    // Partial current month (month-to-date) → clamp previous to the same
    // day-count so MoM deltas compare like-for-like, not MTD vs full month.
    const curDays = Math.round((new Date(`${curEnd}T00:00:00Z`) - monthStart) / 86400000) + 1;
    const prevEndClamped = new Date(Math.min(prevEnd.getTime(), prevStart.getTime() + (curDays - 1) * 86400000));
    return {
      current: { startDate: fmt(monthStart), endDate: curEnd },
      previous: { startDate: fmt(prevStart), endDate: fmt(prevEndClamped) },
      label: monthParam,
    };
  }

  const startParam = String(query.start || '').trim();
  const endParam = String(query.end || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(startParam) && /^\d{4}-\d{2}-\d{2}$/.test(endParam) && startParam <= endParam) {
    const start = new Date(`${startParam}T00:00:00Z`);
    const end = new Date(`${endParam}T00:00:00Z`);
    const days = Math.round((end - start) / 86400000) + 1;
    const prevEnd = new Date(start.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);
    return {
      current: { startDate: startParam, endDate: endParam <= todayStr ? endParam : todayStr },
      previous: { startDate: fmt(prevStart), endDate: fmt(prevEnd) },
      label: `${startParam}..${endParam}`,
    };
  }

  // Default: current calendar month (delegates to the month branch above,
  // which clamps to today + aligns the previous window to the same day-count)
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  return resolveRanges({ month: `${y}-${String(m + 1).padStart(2, '0')}` });
}

// ===================================
// GET /api/mbr/status
// ===================================
const getStatus = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, {
    ga4: ga4Service.isConfigured(),
    gsc: gscService.isConfigured(),
    propertyId: ga4Service.isConfigured() ? process.env.GA4_PROPERTY_ID : null,
    siteUrl: gscService.isConfigured() ? process.env.GSC_SITE_URL : null,
  });
});

// ===================================
// GET /api/mbr/ga4?month=YYYY-MM | ?start=&end=
// ===================================
const getGa4Report = asyncHandler(async (req, res) => {
  if (!ga4Service.isConfigured()) {
    return ApiResponse.error(res, 'GA4 not configured (GA4_PROPERTY_ID / GOOGLE_SERVICE_ACCOUNT_JSON)', 503);
  }
  const ranges = resolveRanges(req.query);
  const cacheKey = `ga4:${ranges.current.startDate}:${ranges.current.endDate}`;

  const cached = cacheGet(cacheKey);
  if (cached) return ApiResponse.success(res, { ...cached, cached: true });

  const report = await ga4Service.getMbrReport(ranges);
  const payload = { ranges, ...report };
  cacheSet(cacheKey, payload);
  return ApiResponse.success(res, payload);
});

// ===================================
// GET /api/mbr/gsc?month=YYYY-MM | ?start=&end=
// ===================================
const getGscReport = asyncHandler(async (req, res) => {
  if (!gscService.isConfigured()) {
    return ApiResponse.error(res, 'Search Console not configured (GSC_SITE_URL / GOOGLE_SERVICE_ACCOUNT_JSON)', 503);
  }
  const ranges = resolveRanges(req.query);
  const cacheKey = `gsc:${ranges.current.startDate}:${ranges.current.endDate}`;

  const cached = cacheGet(cacheKey);
  if (cached) return ApiResponse.success(res, { ...cached, cached: true });

  const report = await gscService.getMbrReport(ranges);
  const payload = { ranges, ...report };
  cacheSet(cacheKey, payload);
  return ApiResponse.success(res, payload);
});

// ===================================
// GET /api/mbr/buttons?month=YYYY-MM&websiteSlug=spanbix
//
// Button-level click detail from our own event store. GA4 gives event
// totals; this gives per-button (meta.cta / meta.ctaName) and per-location
// (meta.location) breakdowns — no GA4 custom dimensions required.
// ===================================
const getButtonBreakdown = asyncHandler(async (req, res) => {
  const ranges = resolveRanges(req.query);
  const websiteSlug = String(req.query.websiteSlug || 'spanbix').trim().toLowerCase();

  const start = new Date(`${ranges.current.startDate}T00:00:00Z`);
  const end = new Date(`${ranges.current.endDate}T23:59:59.999Z`);

  const match = {
    websiteSlug,
    eventType: { $in: ['cta_click', 'call_click', 'whatsapp_click'] },
    timestamp: { $gte: start, $lte: end },
  };

  const [byButton, byLocation] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            eventType: '$eventType',
            label: { $ifNull: ['$meta.cta', { $ifNull: ['$meta.ctaName', '(unlabeled)'] }] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 40 },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { ...match, 'meta.location': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { eventType: '$eventType', location: '$meta.location' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 40 },
    ]),
  ]);

  return ApiResponse.success(res, {
    ranges,
    websiteSlug,
    byButton: byButton.map((r) => ({
      eventType: r._id.eventType,
      label: String(r._id.label),
      count: r.count,
    })),
    byLocation: byLocation.map((r) => ({
      eventType: r._id.eventType,
      location: String(r._id.location),
      count: r.count,
    })),
  });
});

module.exports = { getStatus, getGa4Report, getGscReport, getButtonBreakdown };
