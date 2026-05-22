const { Website } = require('../../models');

/**
 * resolveTenantContext — shared lookup used by every /api/ai/* handler.
 *
 * Accepts either an ObjectId (preferred) OR a slug, returns the canonical
 * tenant block ready to splice into a prompt builder via the `tenant`
 * field.
 *
 * The function selects ONLY the fields prompt builders care about so the
 * payload stays small. Missing fields fall back to derived defaults inside
 * `tenantContext.renderTenantBrief`.
 *
 * @param {object} args
 * @param {string} [args.targetWebsite]  - Website ObjectId
 * @param {string} [args.tenantSlug]     - Website slug (fallback)
 * @returns {Promise<{slug:string|null, name:string|null, doc:object|null}>}
 */
async function resolveTenantContext({ targetWebsite, tenantSlug } = {}) {
  const slugIn = (tenantSlug || '').trim() || null;
  let doc = null;
  if (targetWebsite) {
    try {
      doc = await Website.findById(targetWebsite)
        .select('slug name description aiContext seoDefaults')
        .lean();
    } catch {
      /* best-effort tenant context — don't block the AI call on lookup */
    }
  } else if (slugIn) {
    try {
      doc = await Website.findOne({ slug: slugIn })
        .select('slug name description aiContext seoDefaults')
        .lean();
    } catch {
      /* ignore */
    }
  }
  return {
    slug: doc?.slug || slugIn || null,
    name: doc?.name || null,
    doc: doc || null,
  };
}

module.exports = { resolveTenantContext };
