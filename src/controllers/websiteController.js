const { Website, Blog, Lead } = require('../models');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { asyncHandler, ApiResponse, paginate } = require('../utils');

/**
 * @desc    Create a new website
 * @route   POST /api/websites
 * @access  Private
 */
const createWebsite = asyncHandler(async (req, res) => {
  const website = await Website.create(req.body);
  ApiResponse.created(res, { website }, 'Website created successfully');
});

/**
 * @desc    Get all websites
 * @route   GET /api/websites
 * @access  Private
 */
const getWebsites = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const skip = (page - 1) * limit;

  // Filters
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { domain: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [websites, total] = await Promise.all([
    Website.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Website.countDocuments(filter),
  ]);

  const pagination = paginate(page, limit, total);
  ApiResponse.paginated(res, { websites }, pagination);
});

/**
 * @desc    Get single website by ID
 * @route   GET /api/websites/:id
 * @access  Private
 */
const getWebsite = asyncHandler(async (req, res) => {
  const website = await Website.findById(req.params.id);
  if (!website) return ApiResponse.notFound(res, 'Website');
  ApiResponse.success(res, { website });
});

/**
 * @desc    Update website
 * @route   PUT /api/websites/:id
 * @access  Private
 */
const updateWebsite = asyncHandler(async (req, res) => {
  const website = await Website.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!website) return ApiResponse.notFound(res, 'Website');
  ApiResponse.success(res, { website }, 'Website updated successfully');
});

/**
 * @desc    Delete website + cascade dependent data
 * @route   DELETE /api/websites/:id
 * @access  Private (superadmin only)
 *
 * Cascades blogs/leads/analytics tied to the tenant so the dashboard does
 * not orphan references. Safe for empty or populated tenants.
 */
const deleteWebsite = asyncHandler(async (req, res) => {
  const website = await Website.findById(req.params.id);
  if (!website) return ApiResponse.notFound(res, 'Website');

  const [blogsDeleted, leadsDeleted, analyticsDeleted] = await Promise.all([
    Blog.deleteMany({ targetWebsite: website._id }),
    Lead.deleteMany({ website: website._id }),
    AnalyticsEvent.deleteMany({ websiteSlug: website.slug }),
  ]);

  await Website.findByIdAndDelete(website._id);

  ApiResponse.success(
    res,
    {
      removed: {
        website: { _id: website._id, name: website.name, slug: website.slug },
        blogs: blogsDeleted.deletedCount || 0,
        leads: leadsDeleted.deletedCount || 0,
        analyticsEvents: analyticsDeleted.deletedCount || 0,
      },
    },
    'Website and dependent data deleted'
  );
});

/**
 * @desc    One-shot cleanup — removes legacy Mavro demo tenants (Fleet/
 *          Inventory/Transport + HRMS + Ticket Management). Only Spanbix and
 *          SaiSatwik are live tenants (July 2026).
 * @route   POST /api/websites/_cleanup-demo
 * @access  Private (superadmin only)
 *
 * Body (optional):
 *   { dryRun: true }  → returns what would be removed without mutating
 */
const cleanupDemo = asyncHandler(async (req, res) => {
  const dryRun = !!req.body?.dryRun;

  const demoSlugs = [
    'mavro-fleet-management',
    'mavro-inventory-management',
    'mavro-transport-management',
    // HRMS + Tickets retired July 2026 — their public sites were removed from
    // the Vite bundle; the tenant rows (and dependent blogs/leads/events) go
    // through the same cascade.
    'mavro-hrms',
    'mavro-ticket-management',
  ];

  const localhostDomains = {};

  // Identify demo tenants
  const demoTenants = await Website.find({ slug: { $in: demoSlugs } }).lean();

  // Tally dependent data for each demo tenant before mutation
  const inventory = [];
  for (const t of demoTenants) {
    const [blogCount, leadCount, eventCount] = await Promise.all([
      Blog.countDocuments({ targetWebsite: t._id }),
      Lead.countDocuments({ website: t._id }),
      AnalyticsEvent.countDocuments({ websiteSlug: t.slug }),
    ]);
    inventory.push({
      name: t.name,
      slug: t.slug,
      _id: t._id,
      counts: { blogs: blogCount, leads: leadCount, analyticsEvents: eventCount },
    });
  }

  // Inspect localhost domain updates (preview vs apply)
  const liveTenants = await Website.find({ slug: { $in: Object.keys(localhostDomains) } });
  const updatesPreview = liveTenants.map((t) => ({
    slug: t.slug,
    currentDomain: t.domain,
    nextDomain: localhostDomains[t.slug],
    willChange: t.domain !== localhostDomains[t.slug],
  }));

  if (dryRun) {
    return ApiResponse.success(res, {
      mode: 'dry-run',
      toDelete: inventory,
      toUpdate: updatesPreview,
    });
  }

  // Execute: cascade-delete demo tenants
  const deletionLog = [];
  for (const t of demoTenants) {
    const [blogs, leads, events] = await Promise.all([
      Blog.deleteMany({ targetWebsite: t._id }),
      Lead.deleteMany({ website: t._id }),
      AnalyticsEvent.deleteMany({ websiteSlug: t.slug }),
    ]);
    await Website.findByIdAndDelete(t._id);
    deletionLog.push({
      slug: t.slug,
      removed: {
        blogs: blogs.deletedCount || 0,
        leads: leads.deletedCount || 0,
        analyticsEvents: events.deletedCount || 0,
      },
    });
  }

  // Apply localhost domain rewrites
  const updateLog = [];
  for (const t of liveTenants) {
    const nextDomain = localhostDomains[t.slug];
    if (t.domain !== nextDomain) {
      const prev = t.domain;
      t.domain = nextDomain;
      await t.save();
      updateLog.push({ slug: t.slug, previousDomain: prev, newDomain: nextDomain });
    }
  }

  ApiResponse.success(res, {
    mode: 'applied',
    deleted: deletionLog,
    updated: updateLog,
  }, 'Cleanup complete');
});

module.exports = {
  createWebsite,
  getWebsites,
  getWebsite,
  updateWebsite,
  deleteWebsite,
  cleanupDemo,
};
