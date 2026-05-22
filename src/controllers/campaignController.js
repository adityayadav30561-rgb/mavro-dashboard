const Campaign = require('../models/Campaign');
const Blog = require('../models/Blog');
const Website = require('../models/Website');
const { asyncHandler, ApiResponse } = require('../utils');

// ===================================
// LIST — GET /api/campaigns?targetWebsite=&status=
// ===================================
const listCampaigns = asyncHandler(async (req, res) => {
  const { targetWebsite, status, websiteSlug } = req.query;
  const filter = {};
  if (targetWebsite && targetWebsite !== 'all') filter.targetWebsite = targetWebsite;
  if (!targetWebsite && websiteSlug && websiteSlug !== 'all') {
    const w = await Website.findOne({ slug: websiteSlug }).select('_id').lean();
    if (w) filter.targetWebsite = w._id;
  }
  if (status) filter.status = status;

  const campaigns = await Campaign.find(filter)
    .populate('targetWebsite', 'name slug')
    .sort({ startDate: 1, createdAt: -1 })
    .lean();

  // Hydrate with progress counts
  const ids = campaigns.map((c) => c._id);
  const counts = await Blog.aggregate([
    { $match: { campaign: { $in: ids } } },
    { $group: { _id: { campaign: '$campaign', status: '$status' }, n: { $sum: 1 } } },
  ]);
  const progress = new Map();
  for (const c of counts) {
    const key = String(c._id.campaign);
    const cur = progress.get(key) || { total: 0, published: 0, scheduled: 0, draft: 0, archived: 0 };
    cur.total += c.n;
    cur[c._id.status] = (cur[c._id.status] || 0) + c.n;
    progress.set(key, cur);
  }

  // Velocity + overdue + risk rollups per campaign
  const trendAgg = await Blog.aggregate([
    { $match: { campaign: { $in: ids } } },
    {
      $group: {
        _id: '$campaign',
        publishedLast30: {
          $sum: { $cond: [
            { $and: [
              { $eq: ['$status', 'published'] },
              { $gte: ['$publishedAt', new Date(Date.now() - 30 * 86400000)] },
            ]},
            1, 0,
          ]},
        },
        overdueDrafts: {
          $sum: { $cond: [
            { $and: [
              { $ne: ['$status', 'published'] },
              { $ne: ['$dueAt', null] },
              { $lt: ['$dueAt', new Date()] },
            ]},
            1, 0,
          ]},
        },
      },
    },
  ]);
  const trends = new Map(trendAgg.map((r) => [String(r._id), r]));

  const now = Date.now();
  const out = campaigns.map((c) => {
    const prog = progress.get(String(c._id)) || { total: 0, published: 0, scheduled: 0, draft: 0, archived: 0 };
    const trend = trends.get(String(c._id)) || { publishedLast30: 0, overdueDrafts: 0 };
    const completion = c.targetBlogCount > 0
      ? Math.min(100, Math.round((prog.published / c.targetBlogCount) * 100))
      : null;
    const daysRemaining = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - now) / 86400000) : null;
    // Risk = behind target + low days remaining
    let risk = 'low';
    if (completion != null && c.endDate) {
      const elapsed = c.startDate ? (now - new Date(c.startDate).getTime()) / 86400000 : null;
      const totalSpan = c.startDate ? (new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86400000 : null;
      const expectedPct = totalSpan ? Math.round(Math.min(100, (elapsed / totalSpan) * 100)) : null;
      if (expectedPct != null && completion < expectedPct - 20) risk = 'high';
      else if (expectedPct != null && completion < expectedPct - 8) risk = 'medium';
    }
    const velocityPerWeek = Number((trend.publishedLast30 / 4).toFixed(1));
    return {
      ...c,
      progress: prog,
      velocity: {
        publishedLast30: trend.publishedLast30,
        publishedPerWeek: velocityPerWeek,
        overdueDrafts: trend.overdueDrafts,
        daysRemaining,
        completionPct: completion,
        risk,
      },
    };
  });
  return ApiResponse.success(res, { campaigns: out });
});

// ===================================
// CREATE — POST /api/campaigns
// ===================================
const createCampaign = asyncHandler(async (req, res) => {
  const {
    name, description, targetWebsite, color, startDate, endDate,
    targetKeywords, targetBlogCount, targetSeoScore, assignedTeam, status,
  } = req.body;
  if (!name?.trim()) return ApiResponse.error(res, 'Campaign name is required', 400);
  if (!targetWebsite) return ApiResponse.error(res, 'targetWebsite is required', 400);
  const website = await Website.findById(targetWebsite).select('_id').lean();
  if (!website) return ApiResponse.error(res, 'Target website not found', 404);
  const campaign = await Campaign.create({
    name: name.trim(),
    description: description || '',
    targetWebsite,
    color: color || 'violet',
    startDate: startDate || null,
    endDate: endDate || null,
    targetKeywords: Array.isArray(targetKeywords) ? targetKeywords : [],
    targetBlogCount: targetBlogCount ?? null,
    targetSeoScore: targetSeoScore ?? null,
    assignedTeam: Array.isArray(assignedTeam) ? assignedTeam : [],
    status: status || 'planned',
    createdBy: req.user?._id,
  });
  return ApiResponse.success(res, { campaign }, 'Campaign created', 201);
});

// ===================================
// SINGLE — GET /api/campaigns/:id
// ===================================
const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('targetWebsite', 'name slug')
    .lean();
  if (!campaign) return ApiResponse.error(res, 'Campaign not found', 404);

  const blogs = await Blog.find({ campaign: campaign._id })
    .select('title slug status workflowStatus publishedAt scheduledAt dueAt updatedAt')
    .sort({ scheduledAt: 1, updatedAt: -1 })
    .lean();
  return ApiResponse.success(res, { campaign: { ...campaign, blogs } });
});

// ===================================
// UPDATE — PUT /api/campaigns/:id
// ===================================
const updateCampaign = asyncHandler(async (req, res) => {
  const allowed = ['name', 'description', 'color', 'startDate', 'endDate', 'targetKeywords', 'targetBlogCount', 'targetSeoScore', 'assignedTeam', 'status'];
  const updates = {};
  for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
  // Disallow targetWebsite reassignment to preserve tenant isolation
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!campaign) return ApiResponse.error(res, 'Campaign not found', 404);
  return ApiResponse.success(res, { campaign }, 'Campaign updated');
});

// ===================================
// DELETE — DELETE /api/campaigns/:id
// ===================================
const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return ApiResponse.error(res, 'Campaign not found', 404);
  // Detach blogs without deleting them
  await Blog.updateMany({ campaign: campaign._id }, { $set: { campaign: null } });
  await Campaign.findByIdAndDelete(campaign._id);
  return ApiResponse.success(res, null, 'Campaign deleted');
});

// ===================================
// ASSIGN BLOGS — POST /api/campaigns/:id/assign-blogs
// body: { blogIds: [] }
// ===================================
const assignBlogs = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).lean();
  if (!campaign) return ApiResponse.error(res, 'Campaign not found', 404);
  const blogIds = Array.isArray(req.body.blogIds) ? req.body.blogIds : [];
  if (!blogIds.length) return ApiResponse.error(res, 'blogIds is required', 400);
  // Tenant guard — only assign blogs from the same tenant
  const result = await Blog.updateMany(
    { _id: { $in: blogIds }, targetWebsite: campaign.targetWebsite },
    { $set: { campaign: campaign._id } },
  );
  return ApiResponse.success(res, { matched: result.matchedCount, modified: result.modifiedCount });
});

module.exports = {
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  assignBlogs,
};
