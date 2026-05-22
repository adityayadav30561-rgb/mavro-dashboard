const { SeoMetadata, Website } = require('../models');
const { asyncHandler, ApiResponse, paginate } = require('../utils');
const { schemaService } = require('../services');

// Allowed fields for mass-assignment protection
const ALLOWED_FIELDS = [
  'website', 'pagePath', 'pageType', 'title', 'description', 'keywords',
  'canonicalUrl', 'ogTitle', 'ogDescription', 'ogImage', 'ogType',
  'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
  'schemaMarkup', 'robotsIndex', 'robotsFollow', 'robotsDirectives',
  'includeInSitemap', 'sitemapPriority', 'sitemapChangefreq', 'isActive',
];

const pickFields = (body, fields) => {
  const filtered = {};
  for (const f of fields) {
    if (body[f] !== undefined) filtered[f] = body[f];
  }
  return filtered;
};

// ===================================
// ADMIN CRUD
// ===================================

/**
 * @desc    Create SEO metadata for a page
 * @route   POST /api/seo
 * @access  Private
 */
const createSeoMetadata = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, ALLOWED_FIELDS);

  // Verify website exists
  const website = await Website.findById(data.website);
  if (!website) return ApiResponse.error(res, 'Website not found', 404);

  // Check for duplicate path
  const existing = await SeoMetadata.findOne({ website: data.website, pagePath: data.pagePath });
  if (existing) {
    return ApiResponse.error(res, `SEO metadata already exists for "${data.pagePath}" on this website`, 409);
  }

  const seo = await SeoMetadata.create(data);
  const populated = await SeoMetadata.findById(seo._id).populate('website', 'name slug domain');
  ApiResponse.created(res, { seo: populated }, 'SEO metadata created successfully');
});

/**
 * @desc    Get all SEO metadata (admin listing)
 * @route   GET /api/seo
 * @access  Private
 *
 * Query: ?website=<id>&pageType=homepage&isActive=true&page=1&limit=20
 */
const getSeoMetadataList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.website) filter.website = req.query.website;
  if (req.query.pageType) filter.pageType = req.query.pageType;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const [entries, total] = await Promise.all([
    SeoMetadata.find(filter)
      .populate('website', 'name slug domain')
      .sort({ website: 1, pagePath: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SeoMetadata.countDocuments(filter),
  ]);

  const pagination = paginate(page, limit, total);
  ApiResponse.paginated(res, { seoEntries: entries }, pagination, 'SEO metadata retrieved');
});

/**
 * @desc    Get single SEO entry
 * @route   GET /api/seo/:id
 * @access  Private
 */
const getSeoMetadata = asyncHandler(async (req, res) => {
  const seo = await SeoMetadata.findById(req.params.id).populate('website', 'name slug domain');
  if (!seo) return ApiResponse.notFound(res, 'SEO metadata');
  ApiResponse.success(res, { seo });
});

/**
 * @desc    Update SEO metadata
 * @route   PUT /api/seo/:id
 * @access  Private
 */
const updateSeoMetadata = asyncHandler(async (req, res) => {
  const seo = await SeoMetadata.findById(req.params.id);
  if (!seo) return ApiResponse.notFound(res, 'SEO metadata');

  const data = pickFields(req.body, ALLOWED_FIELDS);

  // If changing website, verify it exists
  if (data.website && data.website.toString() !== seo.website.toString()) {
    const website = await Website.findById(data.website);
    if (!website) return ApiResponse.error(res, 'Website not found', 404);
  }

  // If changing path, check for duplicate
  if (data.pagePath && data.pagePath !== seo.pagePath) {
    const targetWebsite = data.website || seo.website;
    const existing = await SeoMetadata.findOne({ website: targetWebsite, pagePath: data.pagePath, _id: { $ne: seo._id } });
    if (existing) return ApiResponse.error(res, `SEO metadata already exists for "${data.pagePath}"`, 409);
  }

  Object.assign(seo, data);
  await seo.save();

  const populated = await SeoMetadata.findById(seo._id).populate('website', 'name slug domain');
  ApiResponse.success(res, { seo: populated }, 'SEO metadata updated');
});

/**
 * @desc    Delete SEO metadata
 * @route   DELETE /api/seo/:id
 * @access  Private (admin+)
 */
const deleteSeoMetadata = asyncHandler(async (req, res) => {
  const seo = await SeoMetadata.findByIdAndDelete(req.params.id);
  if (!seo) return ApiResponse.notFound(res, 'SEO metadata');
  ApiResponse.success(res, null, 'SEO metadata deleted');
});

// ===================================
// PUBLIC API (for website rendering)
// ===================================

/**
 * @desc    Get SEO metadata for a specific page (public)
 * @route   GET /api/seo/page/:websiteSlug/*pagePath
 * @access  Public
 *
 * Returns full meta tags + structured data for rendering in <head>
 */
const getPageSeo = asyncHandler(async (req, res) => {
  const { websiteSlug } = req.params;
  const pagePath = '/' + (req.params[0] || '');

  const website = await Website.findOne({ slug: websiteSlug });
  if (!website) return ApiResponse.error(res, 'Website not found', 404);

  // Find SEO entry for this page
  const seo = await SeoMetadata.findOne({ website: website._id, pagePath, isActive: true });

  if (!seo) {
    // Return website defaults if no specific entry
    return ApiResponse.success(res, {
      metaTags: {
        title: website.seoDefaults?.title || website.name,
        description: website.seoDefaults?.description || '',
        canonical: `https://${website.domain}${pagePath}`,
        robots: 'index, follow',
        openGraph: {
          title: website.seoDefaults?.title || website.name,
          description: website.seoDefaults?.description || '',
          image: website.seoDefaults?.ogImage || '',
          url: `https://${website.domain}${pagePath}`,
          type: 'website',
        },
        twitter: { card: 'summary_large_image' },
        schema: null,
        keywords: website.seoDefaults?.keywords || [],
      },
      source: 'website_defaults',
    });
  }

  ApiResponse.success(res, {
    metaTags: seo.toMetaTags(website.domain),
    source: 'page_specific',
  });
});

/**
 * @desc    Get blog JSON-LD structured data (public)
 * @route   GET /api/seo/schema/blog/:websiteSlug/:blogSlug
 * @access  Public
 */
const getBlogSchema = asyncHandler(async (req, res) => {
  const { websiteSlug, blogSlug } = req.params;

  const website = await Website.findOne({ slug: websiteSlug });
  if (!website) return ApiResponse.error(res, 'Website not found', 404);

  const { Blog } = require('../models');
  const blog = await Blog.findOne({
    slug: blogSlug,
    targetWebsite: website._id,
    status: 'published',
  }).populate('author', 'name email');

  if (!blog) return ApiResponse.error(res, 'Blog not found', 404);

  const schemas = schemaService.generateBlogPageSchemas(blog, website);

  ApiResponse.success(res, { schemas });
});

/**
 * @desc    Get SEO overview stats
 * @route   GET /api/seo/stats
 * @access  Private
 */
const getSeoStats = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.website) filter.website = req.query.website;

  const [total, byPageType, byWebsite, noindexCount, notInSitemap] = await Promise.all([
    SeoMetadata.countDocuments({ ...filter, isActive: true }),
    SeoMetadata.aggregate([
      { $match: { ...filter, isActive: true } },
      { $group: { _id: '$pageType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    SeoMetadata.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$website', count: { $sum: 1 } } },
      {
        $lookup: { from: 'websites', localField: '_id', foreignField: '_id', as: 'site' },
      },
      { $unwind: '$site' },
      {
        $project: {
          _id: 0, websiteId: '$_id', websiteName: '$site.name',
          websiteSlug: '$site.slug', count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]),
    SeoMetadata.countDocuments({ ...filter, robotsIndex: false, isActive: true }),
    SeoMetadata.countDocuments({ ...filter, includeInSitemap: false, isActive: true }),
  ]);

  // Count pages missing SEO fields
  const missingTitle = await SeoMetadata.countDocuments({ ...filter, isActive: true, $or: [{ title: '' }, { title: null }] });
  const missingDescription = await SeoMetadata.countDocuments({ ...filter, isActive: true, $or: [{ description: '' }, { description: null }] });

  ApiResponse.success(res, {
    total,
    noindexPages: noindexCount,
    excludedFromSitemap: notInSitemap,
    missingTitle,
    missingDescription,
    byPageType,
    byWebsite,
  });
});

module.exports = {
  createSeoMetadata,
  getSeoMetadataList,
  getSeoMetadata,
  updateSeoMetadata,
  deleteSeoMetadata,
  getPageSeo,
  getBlogSchema,
  getSeoStats,
};
