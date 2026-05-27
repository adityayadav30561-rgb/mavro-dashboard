const { Blog, Website } = require('../models');
const { asyncHandler, ApiResponse, paginate } = require('../utils');
const { pingService, revalidateService } = require('../services');

// ===================================
// Allowed fields for create & update
// Prevents mass assignment vulnerabilities
// ===================================
const ALLOWED_CREATE_FIELDS = [
  'title', 'content', 'excerpt', 'featuredImage',
  'seoTitle', 'seoDescription', 'keywords', 'canonicalUrl', 'ogImage',
  'tags', 'category', 'targetWebsite', 'status', 'scheduledAt',
];

const ALLOWED_UPDATE_FIELDS = [
  ...ALLOWED_CREATE_FIELDS,
  'slug', // Allow manual slug override on update
];

/**
 * Pick only allowed fields from request body
 */
const pickFields = (body, allowedFields) => {
  const filtered = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      filtered[field] = body[field];
    }
  }
  return filtered;
};

// ===================================
// CRUD Operations
// ===================================

/**
 * @desc    Create a new blog post
 * @route   POST /api/blogs
 * @access  Private
 */
const createBlog = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, ALLOWED_CREATE_FIELDS);

  // Verify target website exists and is active
  const website = await Website.findById(data.targetWebsite);
  if (!website) {
    return ApiResponse.error(res, 'Target website not found', 404);
  }
  if (website.status !== 'active') {
    return ApiResponse.error(res, `Cannot create blog — website "${website.name}" is ${website.status}`, 400);
  }

  // Attach author from authenticated user
  data.author = req.user._id;
  data.lastEditedBy = req.user._id;

  // Handle scheduled publishing
  if (data.status === 'scheduled' && !data.scheduledAt) {
    return ApiResponse.error(res, 'scheduledAt is required when status is "scheduled"', 400);
  }

  const blog = await Blog.create(data);

  // Populate references for response
  const populated = await Blog.findById(blog._id)
    .populate('targetWebsite', 'name slug domain')
    .populate('author', 'name email');

  ApiResponse.created(res, { blog: populated }, 'Blog post created successfully');
});

/**
 * @desc    Get all blog posts with advanced filtering, search, and pagination
 * @route   GET /api/blogs
 * @access  Private
 *
 * Query params:
 *   ?targetWebsite=<mongoId>     Filter by website
 *   ?status=draft|published|...  Filter by status
 *   ?search=<term>               Full-text search (title, excerpt, keywords, tags)
 *   ?tag=<tag>                   Filter by tag
 *   ?category=<cat>              Filter by category
 *   ?author=<mongoId>            Filter by author
 *   ?indexingStatus=<status>     Filter by indexing status
 *   ?from=<ISO date>             Published after this date
 *   ?to=<ISO date>               Published before this date
 *   ?sortBy=createdAt|publishedAt|title|readingTime|updatedAt
 *   ?order=asc|desc
 *   ?page=1&limit=20
 */
const getBlogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // ----- Build filter -----
  const filter = {};

  // Website filter
  if (req.query.targetWebsite) {
    filter.targetWebsite = req.query.targetWebsite;
  }

  // Status filter
  if (req.query.status) {
    // Support comma-separated statuses: ?status=draft,published
    const statuses = req.query.status.split(',').map((s) => s.trim());
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }

  // Editorial pipeline status filter (5-col kanban: ideas/drafting/review/scheduled/published)
  if (req.query.editorialStatus) {
    const editorials = req.query.editorialStatus.split(',').map((s) => s.trim());
    filter.editorialStatus = editorials.length === 1 ? editorials[0] : { $in: editorials };
  }

  // Indexing status filter
  if (req.query.indexingStatus) {
    filter.indexingStatus = req.query.indexingStatus;
  }

  // Author filter
  if (req.query.author) {
    filter.author = req.query.author;
  }

  // Tag filter
  if (req.query.tag) {
    filter.tags = { $in: [req.query.tag.toLowerCase()] };
  }

  // Category filter
  if (req.query.category) {
    filter.category = { $regex: req.query.category, $options: 'i' };
  }

  // Date range filter (on publishedAt)
  if (req.query.from || req.query.to) {
    filter.publishedAt = {};
    if (req.query.from) filter.publishedAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.publishedAt.$lte = new Date(req.query.to);
  }

  // Keyword search — searches title, excerpt, keywords, tags
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { title: searchRegex },
      { excerpt: searchRegex },
      { seoTitle: searchRegex },
      { keywords: { $in: [new RegExp(req.query.search, 'i')] } },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } },
    ];
  }

  // ----- Sort -----
  const sortField = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  // Heavy fields are excluded by default for list-view performance.
  // SEO audit + analyzers opt in via ?includeContent=true to retrieve the
  // rendered HTML needed for word-count + heading detection.
  const includeContent = req.query.includeContent === 'true' || req.query.includeContent === '1';
  const selectExpr = includeContent ? '-contentPlainText' : '-content -contentPlainText';

  // ----- Execute query -----
  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate('targetWebsite', 'name slug domain status')
      .populate('author', 'name email')
      .populate('lastEditedBy', 'name email')
      .select(selectExpr)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    Blog.countDocuments(filter),
  ]);

  const pagination = paginate(page, limit, total);

  ApiResponse.paginated(res, { blogs }, pagination, 'Blogs retrieved successfully');
});

/**
 * @desc    Get single blog post (full detail with content)
 * @route   GET /api/blogs/:id
 * @access  Private
 */
const getBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id)
    .populate('targetWebsite', 'name slug domain status sitemapUrl')
    .populate('author', 'name email')
    .populate('lastEditedBy', 'name email');

  if (!blog) return ApiResponse.notFound(res, 'Blog post');
  ApiResponse.success(res, { blog });
});

/**
 * @desc    Update blog post
 * @route   PUT /api/blogs/:id
 * @access  Private
 */
const updateBlog = asyncHandler(async (req, res) => {
  let blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');

  const data = pickFields(req.body, ALLOWED_UPDATE_FIELDS);

  // If changing target website, verify it exists and is active
  if (data.targetWebsite && data.targetWebsite.toString() !== blog.targetWebsite.toString()) {
    const website = await Website.findById(data.targetWebsite);
    if (!website) {
      return ApiResponse.error(res, 'Target website not found', 404);
    }
    if (website.status !== 'active') {
      return ApiResponse.error(res, `Cannot assign to website "${website.name}" — it is ${website.status}`, 400);
    }
  }

  // Track who edited
  data.lastEditedBy = req.user._id;

  // Handle scheduled → published validation
  if (data.status === 'scheduled' && !data.scheduledAt && !blog.scheduledAt) {
    return ApiResponse.error(res, 'scheduledAt is required when status is "scheduled"', 400);
  }

  // Apply updates via Object.assign so Mongoose middleware runs
  Object.assign(blog, data);
  await blog.save();

  // Re-populate for response
  blog = await Blog.findById(blog._id)
    .populate('targetWebsite', 'name slug domain status')
    .populate('author', 'name email')
    .populate('lastEditedBy', 'name email');

  ApiResponse.success(res, { blog }, 'Blog post updated successfully');
});

/**
 * @desc    Delete blog post
 * @route   DELETE /api/blogs/:id
 * @access  Private
 */
const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');

  // Prevent deleting published posts unless superadmin
  if (blog.status === 'published' && req.user.role !== 'superadmin') {
    return ApiResponse.error(
      res,
      'Published blogs can only be deleted by superadmins. Archive it first.',
      403
    );
  }

  await Blog.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, null, 'Blog post deleted successfully');
});

// ===================================
// Publishing & Status
// ===================================

/**
 * @desc    Publish a blog post
 * @route   PATCH /api/blogs/:id/publish
 * @access  Private
 */
const publishBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');

  if (blog.status === 'published') {
    return ApiResponse.error(res, 'Blog is already published', 400);
  }

  // Verify website is active before publishing
  const website = await Website.findById(blog.targetWebsite);
  if (!website || website.status !== 'active') {
    return ApiResponse.error(res, 'Cannot publish — target website is not active', 400);
  }

  blog.status = 'published';
  blog.publishedAt = new Date();
  blog.lastEditedBy = req.user._id;
  logActivity(blog, req.user, 'publish', 'Published');
  await blog.save();

  const populated = await Blog.findById(blog._id)
    .populate('targetWebsite', 'name slug domain')
    .populate('author', 'name email');

  ApiResponse.success(res, { blog: populated }, 'Blog published successfully');

  // Auto-ping search engines (fire-and-forget, non-blocking)
  pingService.onBlogPublished(blog, website).catch((err) => {
    console.error('📡 [AutoPing] Failed:', err.message);
  });

  // Trigger on-demand ISR revalidation on the Spanbix Next.js site
  // (fire-and-forget — must not block; revalidateBlog never rejects)
  revalidateService.revalidateBlog(blog.slug);
});

/**
 * @desc    Unpublish (revert to draft)
 * @route   PATCH /api/blogs/:id/unpublish
 * @access  Private
 */
const unpublishBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');

  if (blog.status === 'draft') {
    return ApiResponse.error(res, 'Blog is already a draft', 400);
  }

  blog.status = 'draft';
  blog.lastEditedBy = req.user._id;
  await blog.save();

  ApiResponse.success(res, { blog }, 'Blog reverted to draft');
});

/**
 * @desc    Update blog status (generic — publish, draft, schedule, archive)
 * @route   PATCH /api/blogs/:id/status
 * @access  Private
 */
const updateBlogStatus = asyncHandler(async (req, res) => {
  const { status, scheduledAt } = req.body;

  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');

  // Validate: publishing requires active website
  if (status === 'published') {
    const website = await Website.findById(blog.targetWebsite);
    if (!website || website.status !== 'active') {
      return ApiResponse.error(res, 'Cannot publish — target website is not active', 400);
    }
  }

  // Validate: scheduling requires future date
  if (status === 'scheduled') {
    if (!scheduledAt) {
      return ApiResponse.error(res, 'scheduledAt is required when scheduling a blog', 400);
    }
    blog.scheduledAt = new Date(scheduledAt);
  }

  blog.status = status;
  blog.lastEditedBy = req.user._id;
  await blog.save();

  const populated = await Blog.findById(blog._id)
    .populate('targetWebsite', 'name slug domain')
    .populate('author', 'name email');

  ApiResponse.success(res, { blog: populated }, `Blog status updated to "${status}"`);
});

// ===================================
// Bulk Operations
// ===================================

/**
 * @desc    Perform bulk actions on multiple blogs
 * @route   POST /api/blogs/bulk
 * @access  Private (admin/superadmin)
 *
 * Body: { blogIds: [...], action: "publish"|"draft"|"archive"|"delete" }
 */
const bulkAction = asyncHandler(async (req, res) => {
  const { blogIds, action } = req.body;

  let result;

  switch (action) {
    case 'publish':
      result = await Blog.updateMany(
        { _id: { $in: blogIds } },
        {
          $set: {
            status: 'published',
            publishedAt: new Date(),
            lastEditedBy: req.user._id,
          },
        }
      );
      break;

    case 'draft':
      result = await Blog.updateMany(
        { _id: { $in: blogIds } },
        {
          $set: { status: 'draft', lastEditedBy: req.user._id },
          $unset: { publishedAt: '' },
        }
      );
      break;

    case 'archive':
      result = await Blog.updateMany(
        { _id: { $in: blogIds } },
        {
          $set: { status: 'archived', lastEditedBy: req.user._id },
        }
      );
      break;

    case 'delete':
      // Only superadmins can bulk delete
      if (req.user.role !== 'superadmin') {
        return ApiResponse.error(res, 'Only superadmins can bulk delete', 403);
      }
      result = await Blog.deleteMany({ _id: { $in: blogIds } });
      break;

    default:
      return ApiResponse.error(res, `Unknown action: ${action}`, 400);
  }

  ApiResponse.success(
    res,
    {
      action,
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || result.deletedCount || 0,
    },
    `Bulk ${action} completed on ${result.modifiedCount || result.deletedCount || 0} blog(s)`
  );
});

// ===================================
// Analytics & Stats
// ===================================

/**
 * @desc    Get blog statistics / dashboard summary
 * @route   GET /api/blogs/stats
 * @access  Private
 */
const getBlogStats = asyncHandler(async (req, res) => {
  // Optional website filter
  const matchFilter = {};
  if (req.query.targetWebsite) {
    const mongoose = require('mongoose');
    matchFilter.targetWebsite = new mongoose.Types.ObjectId(req.query.targetWebsite);
  }

  const [statusBreakdown, websiteBreakdown, indexingBreakdown, totals, recentBlogs] =
    await Promise.all([
      // Blogs by status
      Blog.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Blogs by website
      Blog.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$targetWebsite', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'websites',
            localField: '_id',
            foreignField: '_id',
            as: 'website',
          },
        },
        { $unwind: '$website' },
        {
          $project: {
            _id: 0,
            websiteId: '$_id',
            websiteName: '$website.name',
            websiteSlug: '$website.slug',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Blogs by indexing status
      Blog.aggregate([
        { $match: { ...matchFilter, status: 'published' } },
        { $group: { _id: '$indexingStatus', count: { $sum: 1 } } },
      ]),

      // Total counts
      Promise.all([
        Blog.countDocuments(matchFilter),
        Blog.countDocuments({ ...matchFilter, status: 'published' }),
        Blog.countDocuments({ ...matchFilter, status: 'draft' }),
        Blog.countDocuments({ ...matchFilter, status: 'scheduled' }),
      ]),

      // Last 5 recently created blogs
      Blog.find(matchFilter)
        .select('title slug status targetWebsite createdAt publishedAt')
        .populate('targetWebsite', 'name slug')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

  // Today's published count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const publishedToday = await Blog.countDocuments({
    ...matchFilter,
    status: 'published',
    publishedAt: { $gte: today },
  });

  ApiResponse.success(res, {
    total: totals[0],
    published: totals[1],
    drafts: totals[2],
    scheduled: totals[3],
    publishedToday,
    byStatus: statusBreakdown,
    byWebsite: websiteBreakdown,
    byIndexingStatus: indexingBreakdown,
    recentBlogs,
  });
});

// ===================================
// Public Endpoints
// ===================================

/**
 * @desc    Get published blogs by website slug (public-facing)
 * @route   GET /api/blogs/website/:slug
 * @access  Public
 *
 * Query: ?page=1&limit=10&tag=<tag>&search=<term>
 */
const getBlogsByWebsiteSlug = asyncHandler(async (req, res) => {
  const website = await Website.findOne({ slug: req.params.slug, status: 'active' });
  if (!website) return ApiResponse.notFound(res, 'Website');

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { targetWebsite: website._id, status: 'published' };

  // Public search
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { title: searchRegex },
      { excerpt: searchRegex },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } },
    ];
  }

  // Tag filter
  if (req.query.tag) {
    filter.tags = { $in: [req.query.tag.toLowerCase()] };
  }

  // Category filter
  if (req.query.category) {
    filter.category = { $regex: req.query.category, $options: 'i' };
  }

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .select('title slug excerpt featuredImage seoTitle seoDescription keywords tags category readingTime publishedAt')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Blog.countDocuments(filter),
  ]);

  const pagination = paginate(page, limit, total);
  ApiResponse.paginated(
    res,
    { blogs, website: { name: website.name, slug: website.slug, domain: website.domain } },
    pagination
  );
});

/**
 * @desc    Get single published blog by website slug + blog slug (public-facing)
 * @route   GET /api/blogs/website/:websiteSlug/:blogSlug
 * @access  Public
 */
const getPublicBlog = asyncHandler(async (req, res) => {
  const website = await Website.findOne({ slug: req.params.websiteSlug, status: 'active' });
  if (!website) return ApiResponse.notFound(res, 'Website');

  const blog = await Blog.findOne({
    slug: req.params.blogSlug,
    targetWebsite: website._id,
    status: 'published',
  })
    .select('-contentPlainText -indexingStatus -lastIndexedAt -lastEditedBy -version')
    .populate('author', 'name')
    .lean();

  if (!blog) return ApiResponse.notFound(res, 'Blog post');

  ApiResponse.success(res, {
    blog,
    website: { name: website.name, slug: website.slug, domain: website.domain },
  });
});

// ===================================
// Reschedule — move scheduledAt without changing status semantics if
// already scheduled. If currently draft, switch status to 'scheduled'.
// ===================================
const rescheduleBlog = asyncHandler(async (req, res) => {
  const { scheduledAt } = req.body;
  if (!scheduledAt) return ApiResponse.error(res, 'scheduledAt is required', 400);
  const dt = new Date(scheduledAt);
  if (Number.isNaN(dt.getTime())) return ApiResponse.error(res, 'Invalid scheduledAt', 400);

  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');
  if (blog.status === 'archived') return ApiResponse.error(res, 'Cannot reschedule archived blog', 400);

  const prevAt = blog.scheduledAt;
  blog.scheduledAt = dt;
  // If we're scheduling a draft → flip to scheduled. If already published,
  // do not touch status — caller would have to explicitly unpublish first.
  if (blog.status === 'draft') {
    blog.status = 'scheduled';
    blog.workflowStatus = 'scheduled';
  }
  blog.lastEditedBy = req.user?._id || null;
  blog.publishHistory = blog.publishHistory || [];
  blog.publishHistory.push({
    at: new Date(),
    by: req.user?._id || null,
    action: prevAt ? 'reschedule' : 'schedule',
    note: dt.toISOString(),
  });
  await blog.save();
  return ApiResponse.success(res, { blog }, 'Blog rescheduled');
});

// ===================================
// Workflow status — editorial pipeline transition. Supports BOTH the legacy
// 8-state workflowStatus enum AND the 5-state editorialStatus enum used by
// the rebuilt /calendar pipeline. Caller can send either; controller maps
// to both fields and bridges to publish-state `status` so the public site
// reflects reality.
// ===================================
const ALLOWED_WORKFLOW = ['idea','outline','draft','review','scheduled','published','updating','archived'];
const ALLOWED_EDITORIAL = ['ideas','drafting','review','scheduled','published'];

// Map 5-col editorial → legacy 8-col workflow (for the workflowStatus field)
function toLegacyWorkflow(editorial) {
  switch (editorial) {
    case 'ideas':     return 'idea';
    case 'drafting':  return 'draft';
    case 'review':    return 'review';
    case 'scheduled': return 'scheduled';
    case 'published': return 'published';
    default:          return 'draft';
  }
}
function toEditorial(legacy) {
  switch (legacy) {
    case 'idea': case 'outline':  return 'ideas';
    case 'draft':                  return 'drafting';
    case 'review':                 return 'review';
    case 'scheduled':              return 'scheduled';
    case 'published': case 'updating': return 'published';
    case 'archived':               return null; // hidden
    default:                       return 'drafting';
  }
}

function logActivity(blog, user, type, message, meta = {}) {
  blog.activityLog = blog.activityLog || [];
  blog.activityLog.push({
    at: new Date(),
    by: user?._id || null,
    type,
    message,
    meta,
  });
  if (blog.activityLog.length > 200) {
    // Cap embedded log to prevent unbounded growth
    blog.activityLog = blog.activityLog.slice(-200);
  }
}
const updateWorkflowStatus = asyncHandler(async (req, res) => {
  const { workflowStatus, editorialStatus, note } = req.body;

  // Accept either the legacy 8-state or new 5-state input. Normalize to both.
  let nextEditorial, nextLegacy;
  if (editorialStatus) {
    if (!ALLOWED_EDITORIAL.includes(editorialStatus)) {
      return ApiResponse.error(res, `editorialStatus must be one of ${ALLOWED_EDITORIAL.join(', ')}`, 400);
    }
    nextEditorial = editorialStatus;
    nextLegacy = toLegacyWorkflow(editorialStatus);
  } else if (workflowStatus) {
    if (!ALLOWED_WORKFLOW.includes(workflowStatus)) {
      return ApiResponse.error(res, `workflowStatus must be one of ${ALLOWED_WORKFLOW.join(', ')}`, 400);
    }
    nextLegacy = workflowStatus;
    nextEditorial = toEditorial(workflowStatus);
  } else {
    return ApiResponse.error(res, 'editorialStatus or workflowStatus is required', 400);
  }

  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');

  const prevLegacy = blog.workflowStatus;
  const prevEditorial = blog.editorialStatus;
  blog.workflowStatus = nextLegacy;
  if (nextEditorial) blog.editorialStatus = nextEditorial;
  blog.workflowHistory = blog.workflowHistory || [];
  blog.workflowHistory.push({ from: prevLegacy, to: nextLegacy, at: new Date(), by: req.user?._id || null });
  logActivity(blog, req.user, 'workflow', `Moved ${prevEditorial || prevLegacy} → ${nextEditorial || nextLegacy}`, { from: prevEditorial, to: nextEditorial });

  // Use legacy enum for bridge logic below (existing rules already cover all targets)
  const workflowStatusForBridge = nextLegacy;

  // Bridge editorial workflow → publish-state. Every workflow target maps
  // to a publish-state outcome so the site never lies about visibility.
  blog.publishHistory = blog.publishHistory || [];
  const wasPublished = blog.status === 'published';
  let becamePublished = false;

  if (workflowStatusForBridge === 'published') {
    if (!wasPublished) {
      const website = await Website.findById(blog.targetWebsite);
      if (!website || website.status !== 'active') {
        return ApiResponse.error(res, 'Cannot publish — target website is not active', 400);
      }
      blog.status = 'published';
      blog.publishedAt = blog.publishedAt || new Date();
      blog.publishHistory.push({ at: new Date(), by: req.user?._id || null, action: 'publish', note: note || 'via workflow' });
      becamePublished = true;
    }
  } else if (workflowStatusForBridge === 'archived') {
    if (blog.status !== 'archived') {
      if (wasPublished) {
        blog.publishHistory.push({ at: new Date(), by: req.user?._id || null, action: 'unpublish', note: note || 'via workflow → archived' });
      }
      blog.status = 'archived';
    }
  } else if (workflowStatusForBridge === 'scheduled') {
    // Moving INTO scheduled column from any state — take the post offline,
    // set scheduled status, and ensure scheduledAt is populated. If operator
    // did not set scheduledAt elsewhere, default to +24h so the worker has
    // something concrete to wait on.
    if (wasPublished) {
      blog.publishHistory.push({ at: new Date(), by: req.user?._id || null, action: 'unpublish', note: note || 'via workflow → scheduled' });
    }
    blog.status = 'scheduled';
    if (!blog.scheduledAt || new Date(blog.scheduledAt).getTime() < Date.now()) {
      blog.scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      blog.publishHistory.push({ at: new Date(), by: req.user?._id || null, action: 'reschedule', note: 'auto-set scheduledAt to +24h (via workflow)' });
    }
  } else if (['idea', 'outline', 'draft', 'review'].includes(workflowStatusForBridge)) {
    // Pre-publish workflow states — content should not be live.
    if (wasPublished) {
      blog.publishHistory.push({ at: new Date(), by: req.user?._id || null, action: 'unpublish', note: note || `via workflow → ${workflowStatus}` });
    }
    if (blog.status !== 'draft') {
      blog.status = 'draft';
      // Keep publishedAt for historical reference; do not clear so we know it
      // was previously live. Public queries filter on status, so this is safe.
    }
  } else if (workflowStatusForBridge === 'updating') {
    // "Updating" = operator is actively revising. Keep the post live during
    // edit so the public site is not disrupted. Flag isUpdating for UI.
    blog.isUpdating = true;
  }

  blog.lastEditedBy = req.user?._id || null;
  await blog.save();

  // On-demand ISR revalidation when the Kanban move actually published the post
  // (fire-and-forget — must not block; revalidateBlog never rejects)
  if (becamePublished) {
    revalidateService.revalidateBlog(blog.slug);
  }

  return ApiResponse.success(res, { blog }, 'Workflow status updated');
});

// ===================================
// Assign — set assignedTo / reviewer / priority / dueAt / completionPercentage
// PATCH /api/blogs/:id/assign
// ===================================
const assignBlog = asyncHandler(async (req, res) => {
  const { assignedTo, reviewer, seoReviewer, dueAt, priority, completionPercentage } = req.body;
  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');

  const changes = [];
  if (assignedTo !== undefined) {
    if (String(blog.assignedTo) !== String(assignedTo)) {
      changes.push(`Assigned to ${assignedTo || 'unassigned'}`);
      blog.assignedTo = assignedTo || null;
    }
  }
  if (reviewer !== undefined) {
    if (String(blog.reviewer) !== String(reviewer)) {
      changes.push(`Reviewer ${reviewer || 'cleared'}`);
      blog.reviewer = reviewer || null;
    }
  }
  if (seoReviewer !== undefined) {
    blog.seoReviewer = seoReviewer || null;
    changes.push('SEO reviewer updated');
  }
  if (dueAt !== undefined) {
    blog.dueAt = dueAt ? new Date(dueAt) : null;
    changes.push(`Due date ${blog.dueAt ? blog.dueAt.toISOString() : 'cleared'}`);
  }
  if (priority !== undefined && ['low','medium','high','urgent'].includes(priority)) {
    if (blog.priority !== priority) {
      changes.push(`Priority → ${priority}`);
      blog.priority = priority;
    }
  }
  if (completionPercentage !== undefined) {
    const v = Math.max(0, Math.min(100, Number(completionPercentage) || 0));
    if (blog.completionPercentage !== v) {
      changes.push(`Progress → ${v}%`);
      blog.completionPercentage = v;
    }
  }
  if (changes.length) logActivity(blog, req.user, 'assign', changes.join(' · '));
  blog.lastEditedBy = req.user?._id || null;
  await blog.save();
  return ApiResponse.success(res, { blog }, 'Blog assignment updated');
});

// ===================================
// Approval workflow
// PATCH /api/blogs/:id/approve            — approve content
// PATCH /api/blogs/:id/request-revision   — return to drafting w/ note
// PATCH /api/blogs/:id/reject             — reject + archive
// ===================================
const approveBlog = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');
  blog.approvedAt = new Date();
  blog.approvedBy = req.user?._id || null;
  blog.lastReviewedAt = new Date();
  blog.reviewNotes = blog.reviewNotes || [];
  blog.reviewNotes.push({ at: new Date(), by: req.user?._id || null, action: 'approve', note: note || '' });
  // Approved content moves out of "review" stage. Operator then decides
  // scheduled vs published explicitly.
  if (blog.editorialStatus === 'review') {
    blog.editorialStatus = blog.scheduledAt ? 'scheduled' : 'drafting';
    blog.workflowStatus = blog.scheduledAt ? 'scheduled' : 'draft';
    if (blog.scheduledAt && blog.status === 'draft') blog.status = 'scheduled';
  }
  logActivity(blog, req.user, 'approve', `Approved${note ? `: ${note}` : ''}`);
  await blog.save();
  return ApiResponse.success(res, { blog }, 'Blog approved');
});

const requestRevisionBlog = asyncHandler(async (req, res) => {
  const { note } = req.body;
  if (!note?.trim()) return ApiResponse.error(res, 'Revision note is required', 400);
  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');
  blog.reviewNotes = blog.reviewNotes || [];
  blog.reviewNotes.push({ at: new Date(), by: req.user?._id || null, action: 'request-revision', note });
  blog.lastReviewedAt = new Date();
  blog.editorialStatus = 'drafting';
  blog.workflowStatus = 'draft';
  if (blog.status === 'published') blog.status = 'draft';
  logActivity(blog, req.user, 'request-revision', `Revisions requested: ${note}`);
  await blog.save();
  return ApiResponse.success(res, { blog }, 'Revisions requested');
});

// ===================================
// Activity feed — flatten per-blog activityLog across the tenant corpus
// GET /api/blogs/activity?targetWebsite=&limit=&since=
// ===================================
const getActivityFeed = asyncHandler(async (req, res) => {
  const { targetWebsite, since } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

  const filter = {};
  if (targetWebsite && targetWebsite !== 'all') filter.targetWebsite = targetWebsite;

  const blogs = await Blog.find(filter)
    .select('title slug activityLog targetWebsite')
    .populate('targetWebsite', 'name slug')
    .lean();

  const sinceMs = since ? new Date(since).getTime() : 0;
  const flat = [];
  for (const b of blogs) {
    for (const a of (b.activityLog || [])) {
      const t = a.at ? new Date(a.at).getTime() : 0;
      if (sinceMs && t < sinceMs) continue;
      flat.push({
        at: a.at,
        by: a.by,
        type: a.type,
        message: a.message,
        meta: a.meta || {},
        blog: { _id: b._id, title: b.title, slug: b.slug, tenant: b.targetWebsite?.name || null, tenantSlug: b.targetWebsite?.slug || null },
      });
    }
  }
  flat.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // Hydrate `by` with admin user names
  const userIds = [...new Set(flat.map((f) => f.by).filter(Boolean).map(String))];
  let usersById = new Map();
  if (userIds.length) {
    const AdminUser = require('../models/AdminUser');
    const users = await AdminUser.find({ _id: { $in: userIds } }).select('name email role').lean();
    usersById = new Map(users.map((u) => [String(u._id), u]));
  }
  const hydrated = flat.slice(0, limit).map((f) => ({
    ...f,
    actor: f.by ? usersById.get(String(f.by)) || null : null,
  }));

  return ApiResponse.success(res, { events: hydrated });
});

const rejectBlog = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const blog = await Blog.findById(req.params.id);
  if (!blog) return ApiResponse.notFound(res, 'Blog post');
  blog.reviewNotes = blog.reviewNotes || [];
  blog.reviewNotes.push({ at: new Date(), by: req.user?._id || null, action: 'reject', note: note || '' });
  blog.lastReviewedAt = new Date();
  blog.status = 'archived';
  blog.workflowStatus = 'archived';
  // editorialStatus left untouched — archived is hidden in the 5-col kanban
  logActivity(blog, req.user, 'reject', `Rejected${note ? `: ${note}` : ''}`);
  await blog.save();
  return ApiResponse.success(res, { blog }, 'Blog rejected');
});

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
  updateBlogStatus,
  bulkAction,
  getBlogStats,
  getBlogsByWebsiteSlug,
  getPublicBlog,
  rescheduleBlog,
  updateWorkflowStatus,
  assignBlog,
  approveBlog,
  requestRevisionBlog,
  rejectBlog,
  getActivityFeed,
};
