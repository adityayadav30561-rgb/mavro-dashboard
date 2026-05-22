/**
 * Website Context Middleware
 *
 * Detects the website context for multi-tenant operations.
 * Ensures users can only access data for their assigned websites.
 *
 * Usage patterns:
 *   requireWebsite       — Requires websiteId in body/query/params, validates access
 *   scopeToWebsites      — Auto-scopes queries to user's assigned websites
 *   resolveWebsiteSlug   — Resolves a website from a slug parameter
 *   requirePermission    — Checks granular permission (role + website access)
 */

const { Website } = require('../models');

/**
 * Require a website context (from body.website, body.targetWebsite, query.website, or params.websiteId)
 * Validates that:
 *   1. The website exists
 *   2. The user has access to it
 *
 * Attaches req.websiteContext with the resolved website document.
 */
const requireWebsite = async (req, res, next) => {
  try {
    const websiteId =
      req.body.website ||
      req.body.targetWebsite ||
      req.query.website ||
      req.query.targetWebsite ||
      req.params.websiteId;

    if (!websiteId) {
      return res.status(400).json({
        success: false,
        message: 'Website context is required',
      });
    }

    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    // Check user access
    if (!req.user.hasWebsiteAccess(websiteId)) {
      return res.status(403).json({
        success: false,
        message: `You do not have access to "${website.name}"`,
      });
    }

    req.websiteContext = website;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Scope database queries to the user's assigned websites.
 *
 * For superadmins: no filter applied (access to all)
 * For others: attaches req.websiteFilter with { $in: [...ids] }
 *
 * Controllers should use req.websiteFilter in their queries:
 *   if (req.websiteFilter) filter.targetWebsite = req.websiteFilter;
 *   // or
 *   if (req.websiteFilter) filter.website = req.websiteFilter;
 */
const scopeToWebsites = (req, res, next) => {
  const accessibleIds = req.user.getAccessibleWebsiteIds();

  if (accessibleIds === null) {
    // superadmin — no filter
    req.websiteFilter = null;
  } else if (accessibleIds.length === 0) {
    // User with no assigned websites — return empty results
    req.websiteFilter = { $in: [] };
  } else {
    req.websiteFilter = { $in: accessibleIds };
  }

  next();
};

/**
 * Resolve a website from the :websiteSlug URL parameter.
 * Attaches req.websiteContext.
 * Does NOT check user access (use for public endpoints).
 */
const resolveWebsiteSlug = async (req, res, next) => {
  try {
    const slug = req.params.websiteSlug || req.params.slug;
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Website slug is required',
      });
    }

    const website = await Website.findOne({ slug });
    if (!website) {
      return res.status(404).json({
        success: false,
        message: `Website "${slug}" not found`,
      });
    }

    req.websiteContext = website;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check granular permission — combines role check + website access.
 *
 * Usage:
 *   router.post('/blogs', requirePermission('create_blog'), createBlog);
 *
 * If a websiteId is present in the request, it also verifies website access.
 *
 * @param {string} action - Permission name from AdminUser.can()
 */
const requirePermission = (action) => {
  return (req, res, next) => {
    // Check role-based permission
    if (!req.user.can(action)) {
      return res.status(403).json({
        success: false,
        message: `Your role "${req.user.role}" does not have "${action}" permission`,
      });
    }

    // If there's a website context, check access
    const websiteId =
      req.body.website ||
      req.body.targetWebsite ||
      req.query.website ||
      req.query.targetWebsite ||
      req.params.websiteId;

    if (websiteId && !req.user.hasWebsiteAccess(websiteId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this website',
      });
    }

    next();
  };
};

/**
 * Auto-detect website from request origin/referer
 * For public API endpoints called from website frontends
 * Tries to match the origin domain to a website record
 */
const detectWebsiteFromOrigin = async (req, res, next) => {
  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (!origin) return next();

    // Extract domain from origin URL
    let domain;
    try {
      const url = new URL(origin);
      domain = url.hostname;
    } catch {
      return next();
    }

    // Try to find website by domain
    const website = await Website.findOne({
      $or: [
        { domain },
        { domain: `www.${domain}` },
        { domain: domain.replace(/^www\./, '') },
      ],
      status: 'active',
    });

    if (website) {
      req.websiteContext = website;
    }

    next();
  } catch (error) {
    // Non-blocking — don't fail if detection fails
    next();
  }
};

module.exports = {
  requireWebsite,
  scopeToWebsites,
  resolveWebsiteSlug,
  requirePermission,
  detectWebsiteFromOrigin,
};
