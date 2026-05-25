const { AnalyticsEvent, Website } = require('../../../models');

// ===================================
// Scheduler analytics emit helper
// ===================================
// Bridges scheduler lifecycle events onto the existing AnalyticsEvent model.
// The AnalyticsEvent enum is constrained to {page_view, blog_view, form_submit,
// cta_click} — scheduler events ride on `cta_click` with an explicit
// `meta.action` discriminator so the dashboard can later filter / group by it
// without a schema migration.
//
// Emit is best-effort: failures never propagate to OAuth or booking flows.

async function emit({ action, tenantId, userId, meta = {} }) {
  try {
    let websiteSlug = 'unknown';
    if (tenantId) {
      const w = await Website.findById(tenantId).select('slug').lean();
      if (w && w.slug) websiteSlug = w.slug;
    }
    await AnalyticsEvent.create({
      websiteSlug,
      eventType: 'cta_click',
      page: '/scheduler/calendar-connections',
      sessionId: `scheduler-${userId || 'system'}`,
      meta: {
        scope: 'scheduler',
        action,
        userId: userId ? String(userId) : null,
        tenantId: tenantId ? String(tenantId) : null,
        ...meta,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[scheduler analytics] emit failed:', err.message);
  }
}

module.exports = { emit };
