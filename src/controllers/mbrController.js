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
const MbrItem = require('../models/MbrItem');
const Blog = require('../models/Blog');
const { asyncHandler, ApiResponse } = require('../utils');
const ga4Service = require('../services/google/ga4Service');
const gscService = require('../services/google/gscService');
const { getSources, getSource, getHostScope } = require('../services/google/mbrSources');
const { MBR_SECTIONS, sectionByKey } = require('../config/mbrSections');
const mbrExportService = require('../services/mbrExportService');

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
  const sources = getSources().map((s) => ({
    key: s.key,
    label: s.label,
    ga4: Boolean(s.ga4PropertyId) && ga4Service.isConfigured(s.ga4PropertyId),
    gsc: Boolean(s.gscSiteUrl) && gscService.isConfigured(s.gscSiteUrl),
  }));
  return ApiResponse.success(res, {
    sources,
    // legacy shape (first source) for older clients
    ga4: sources[0]?.ga4 || false,
    gsc: sources[0]?.gsc || false,
  });
});

// ===================================
// GET /api/mbr/ga4?month=YYYY-MM | ?start=&end=
// ===================================
const getGa4Report = asyncHandler(async (req, res) => {
  const source = getSource(req.query.source);
  if (!source?.ga4PropertyId || !ga4Service.isConfigured(source.ga4PropertyId)) {
    return ApiResponse.error(res, `GA4 not configured for source "${source?.key || 'unknown'}" (MBR_SOURCES / GA4_PROPERTY_ID / GOOGLE_SERVICE_ACCOUNT_JSON)`, 503);
  }
  const ranges = resolveRanges(req.query);
  const cacheKey = `ga4:v2:${source.key}:${ranges.current.startDate}:${ranges.current.endDate}`;

  const cached = cacheGet(cacheKey);
  if (cached) return ApiResponse.success(res, { ...cached, cached: true });

  const report = await ga4Service.getMbrReport(ranges, source.ga4PropertyId, getHostScope(source), source.label);
  const payload = { ranges, source: source.key, ...report };
  cacheSet(cacheKey, payload);
  return ApiResponse.success(res, payload);
});

// ===================================
// GET /api/mbr/gsc?month=YYYY-MM | ?start=&end=
// ===================================
const getGscReport = asyncHandler(async (req, res) => {
  const source = getSource(req.query.source);
  if (!source?.gscSiteUrl || !gscService.isConfigured(source.gscSiteUrl)) {
    return ApiResponse.error(res, `Search Console not configured for source "${source?.key || 'unknown'}" (MBR_SOURCES / GSC_SITE_URL)`, 503);
  }
  const ranges = resolveRanges(req.query);
  const cacheKey = `gsc:${source.key}:${ranges.current.startDate}:${ranges.current.endDate}`;

  const cached = cacheGet(cacheKey);
  if (cached) return ApiResponse.success(res, { ...cached, cached: true });

  const report = await gscService.getMbrReport(ranges, source.gscSiteUrl);
  const payload = { ranges, source: source.key, ...report };
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

// ===================================
// GET /api/mbr/sections — manual workstream definitions (for the tiles UI)
// ===================================
const getSections = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { sections: MBR_SECTIONS });
});

// ===================================
// Manual items CRUD — /api/mbr/items
// ===================================
const periodOf = (query) => {
  const ranges = resolveRanges(query);
  return ranges.current.startDate.slice(0, 7); // 'YYYY-MM' of range start
};

const listItems = asyncHandler(async (req, res) => {
  const period = String(req.query.period || periodOf(req.query));
  if (!/^\d{4}-\d{2}$/.test(period)) return ApiResponse.error(res, 'Invalid period', 400);
  const items = await MbrItem.find({ period }).sort({ section: 1, order: 1, createdAt: 1 }).lean();
  return ApiResponse.success(res, { period, items });
});

const sanitizeItemData = (sectionKey, data) => {
  const def = sectionByKey(sectionKey);
  if (!def) return null;
  const out = {};
  def.columns.forEach((c) => {
    const v = data?.[c.key];
    if (v != null) out[c.key] = String(v).slice(0, 2000);
  });
  return out;
};

const createItem = asyncHandler(async (req, res) => {
  const { section, period, data } = req.body || {};
  if (!sectionByKey(section)) return ApiResponse.error(res, 'Unknown section', 400);
  if (!/^\d{4}-\d{2}$/.test(String(period || ''))) return ApiResponse.error(res, 'Invalid period (YYYY-MM)', 400);
  const clean = sanitizeItemData(section, data);
  const last = await MbrItem.findOne({ section, period }).sort({ order: -1 }).select('order').lean();
  const item = await MbrItem.create({
    section,
    period,
    data: clean,
    order: (last?.order || 0) + 1,
    createdBy: req.user?._id || null,
  });
  return ApiResponse.created(res, { item });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await MbrItem.findById(req.params.id);
  if (!item) return ApiResponse.error(res, 'Item not found', 404);
  const clean = sanitizeItemData(item.section, req.body?.data);
  item.data = clean;
  await item.save();
  return ApiResponse.success(res, { item });
});

const deleteItem = asyncHandler(async (req, res) => {
  const item = await MbrItem.findByIdAndDelete(req.params.id);
  if (!item) return ApiResponse.error(res, 'Item not found', 404);
  return ApiResponse.success(res, { deleted: true });
});

// ===================================
// GET /api/mbr/blogs — published blogs in range + all-time views
// ===================================
const getBlogsReport = asyncHandler(async (req, res) => {
  const ranges = resolveRanges(req.query);
  const start = new Date(`${ranges.current.startDate}T00:00:00Z`);
  const end = new Date(`${ranges.current.endDate}T23:59:59.999Z`);

  const blogs = await Blog.find({ status: 'published', publishedAt: { $gte: start, $lte: end } })
    .populate('targetWebsite', 'name slug')
    .select('title slug publishedAt targetWebsite')
    .sort({ publishedAt: -1 })
    .lean();

  const pageCounts = await AnalyticsEvent.aggregate([
    { $match: { eventType: { $in: ['page_view', 'blog_view'] }, page: /\/blog\// } },
    { $group: { _id: '$page', count: { $sum: 1 } } },
  ]);
  const viewsForSlug = (slug) => {
    let total = 0;
    for (const p of pageCounts) {
      const path = String(p._id).split('?')[0].replace(/\/$/, '');
      if (path.endsWith(`/blog/${slug}`)) total += p.count;
    }
    return total;
  };

  return ApiResponse.success(res, {
    ranges,
    blogs: blogs.map((b) => ({
      title: b.title,
      slug: b.slug,
      tenant: b.targetWebsite?.name || b.targetWebsite?.slug || '—',
      publishedAt: b.publishedAt,
      views: viewsForSlug(b.slug),
    })),
  });
});

// ===================================
// GET /api/mbr/export — combined multi-sheet Excel download
// ===================================
const exportWorkbook = asyncHandler(async (req, res) => {
  const ranges = resolveRanges(req.query);
  const period = ranges.current.startDate.slice(0, 7);

  const wb = await mbrExportService.buildWorkbook(ranges, period);

  const filename = `MBR_${ranges.label.replace(/[^\w.-]+/g, '_')}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
});

module.exports = {
  getStatus,
  getGa4Report,
  getGscReport,
  getButtonBreakdown,
  getSections,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  getBlogsReport,
  exportWorkbook,
};
