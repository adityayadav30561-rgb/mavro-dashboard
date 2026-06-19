const { Lead, Website } = require('../models');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { asyncHandler, ApiResponse, paginate } = require('../utils');
const { getClientIP } = require('../middleware/spamProtection');

// ===================================
// User-Agent → device classifier (shared with analyticsController logic)
// ===================================
function classifyDevice(ua = '') {
  if (!ua) return 'unknown';
  if (/bot|crawler|spider/i.test(ua)) return 'bot';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// ===================================
// Emit a form_submit AnalyticsEvent tied to a freshly-created Lead.
// Server-authoritative — every Lead.create() produces exactly one event.
// Failures are swallowed so analytics issues never break lead capture.
// ===================================
async function emitFormSubmitEvent({ lead, website, req, body }) {
  try {
    const ua = req.headers['user-agent'] || '';
    const page = (() => {
      try {
        if (body.sourcePage) {
          const u = new URL(body.sourcePage);
          return u.pathname + (u.search || '');
        }
      } catch { /* fallthrough */ }
      return body.sourcePage || '/';
    })();

    await AnalyticsEvent.create({
      websiteSlug: website.slug,
      eventType: 'form_submit',
      page,
      sessionId: (body.sessionId && String(body.sessionId).slice(0, 64)) || `lead_${lead._id}`,
      referrer: body.referrer || req.headers['referer'] || req.headers['referrer'] || null,
      deviceType: classifyDevice(ua),
      userAgent: String(ua).slice(0, 1000),
      ipAddress: req.clientIP || getClientIP(req),
      meta: {
        leadId: String(lead._id),
        formId: body.formId || 'lead-form',
        company: body.company || null,
        sourcePage: body.sourcePage || null,
        utmSource: body.utmSource || null,
        utmMedium: body.utmMedium || null,
        utmCampaign: body.utmCampaign || null,
      },
    });
  } catch (e) {
    // Log but don't fail the lead submission
    console.warn('[analytics] form_submit emission failed:', e.message);
  }
}

// ===================================
// Allowed fields for public submission
// Prevents mass assignment of internal fields
// ===================================
const ALLOWED_SUBMIT_FIELDS = [
  'website', 'name', 'email', 'phone', 'company',
  'message', 'sourcePage', 'referrer',
  'utmSource', 'utmMedium', 'utmCampaign',
  'formId', 'customFields',
];

// Defensive sanitizer for the Mixed customFields object. Strips functions,
// nested objects beyond one level, and oversize string values. Keeps the
// shape predictable so the admin UI can render keys safely.
const sanitizeCustomFields = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== 'string' || k.length === 0 || k.length > 60) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') {
      out[k] = v.slice(0, 1000);
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = v
        .filter((x) => typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean')
        .slice(0, 20)
        .map((x) => (typeof x === 'string' ? x.slice(0, 200) : x));
    }
    // functions, nested objects, etc. silently dropped
  }
  return out;
};

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
// PUBLIC ENDPOINTS
// ===================================

/**
 * @desc    Submit a new lead from any website form
 * @route   POST /api/leads/submit
 * @access  Public
 *
 * This endpoint is called by all Mavro product websites.
 * Spam protection middleware runs before this handler.
 */
const submitLead = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, ALLOWED_SUBMIT_FIELDS);

  // Normalize per-tenant custom fields (Mixed type — must sanitize)
  if (data.customFields !== undefined) {
    data.customFields = sanitizeCustomFields(data.customFields);
  }

  // Verify website exists
  const website = await Website.findById(data.website);
  if (!website) {
    return ApiResponse.error(res, 'Invalid website reference', 400);
  }

  // Attach tracking metadata from request
  data.ipAddress = req.clientIP || getClientIP(req);
  data.userAgent = req.headers['user-agent'] || '';
  if (!data.referrer) {
    data.referrer = req.headers['referer'] || req.headers['referrer'] || '';
  }

  // Apply spam scoring from middleware
  if (req.spamScore !== undefined) {
    data.spamScore = req.spamScore;
    data.spamReasons = req.spamReasons || [];
  }

  // Auto-flag as spam if score is high
  if (req.body._autoSpam) {
    data.isSpam = true;
    data.status = 'spam';
  }

  // Initialize status history
  data.statusHistory = [
    {
      status: data.status || 'new',
      changedAt: new Date(),
      note: 'Lead submitted via website form',
    },
  ];

  const lead = await Lead.create(data);

  // Server-side analytics event — guarantees Lead↔form_submit consistency.
  // Skipped for auto-spam submissions so dashboards don't inflate from bots.
  if (!data.isSpam) {
    await emitFormSubmitEvent({ lead, website, req, body: req.body });
  }

  // Return minimal data to public endpoint (don't expose internal fields)
  ApiResponse.created(
    res,
    {
      id: lead._id,
      message: 'Thank you for your submission',
    },
    'Lead submitted successfully'
  );
});

// ===================================
// ADMIN ENDPOINTS
// ===================================

/**
 * @desc    Get all leads with advanced filtering, search, and pagination
 * @route   GET /api/leads
 * @access  Private
 *
 * Query params:
 *   ?website=<mongoId>           Filter by website
 *   ?status=new|contacted|...    Filter by status (comma-separated)
 *   ?priority=low|medium|high    Filter by priority
 *   ?isSpam=true|false           Filter spam/non-spam
 *   ?search=<term>               Search name, email, company, phone
 *   ?from=<ISO date>             Created after date
 *   ?to=<ISO date>               Created before date
 *   ?assignedTo=<mongoId>        Filter by assigned admin
 *   ?tag=<tag>                   Filter by tag
 *   ?sortBy=createdAt|name|email|status|priority
 *   ?order=asc|desc
 *   ?page=1&limit=20
 */
const getLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // ----- Build filter -----
  const filter = {};

  // Default: hide spam unless explicitly requested
  if (req.query.isSpam === 'true') {
    filter.isSpam = true;
  } else if (req.query.isSpam === 'false' || !req.query.isSpam) {
    filter.isSpam = { $ne: true };
  }

  // Website filter
  if (req.query.website) {
    filter.website = req.query.website;
  }

  // Status filter (supports comma-separated)
  if (req.query.status) {
    const statuses = req.query.status.split(',').map((s) => s.trim());
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }

  // Priority filter
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  // Assigned to filter
  if (req.query.assignedTo) {
    filter.assignedTo = req.query.assignedTo;
  }

  // Tag filter
  if (req.query.tag) {
    filter.tags = { $in: [req.query.tag.toLowerCase()] };
  }

  // Date range filter
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      // Include the entire 'to' day
      const toDate = new Date(req.query.to);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }

  // Search across name, email, company, phone
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { company: searchRegex },
      { phone: searchRegex },
      { message: searchRegex },
    ];
  }

  // ----- Sort -----
  const sortField = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  // ----- Execute -----
  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate('website', 'name slug domain')
      .populate('assignedTo', 'name email')
      .select('-statusHistory -userAgent -spamReasons -contentPlainText')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  const pagination = paginate(page, limit, total);
  ApiResponse.paginated(res, { leads }, pagination, 'Leads retrieved successfully');
});

/**
 * @desc    Get single lead with full detail
 * @route   GET /api/leads/:id
 * @access  Private
 */
const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('website', 'name slug domain')
    .populate('assignedTo', 'name email')
    .populate('statusHistory.changedBy', 'name email');

  if (!lead) return ApiResponse.notFound(res, 'Lead');
  ApiResponse.success(res, { lead });
});

/**
 * @desc    Update lead (status, priority, assignment, notes, tags)
 * @route   PUT /api/leads/:id
 * @access  Private
 */
const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return ApiResponse.notFound(res, 'Lead');

  const { status, priority, assignedTo, notes, tags } = req.body;

  // Update status with history tracking
  if (status && status !== lead.status) {
    lead.addStatusChange(status, req.user._id, req.body.statusNote || '');
  }

  if (priority) lead.priority = priority;
  if (assignedTo !== undefined) lead.assignedTo = assignedTo || null;
  if (notes !== undefined) lead.notes = notes;
  if (tags) lead.tags = tags;

  // Unmark spam if status explicitly changed away from spam
  if (status && status !== 'spam' && lead.isSpam) {
    lead.isSpam = false;
  }

  await lead.save();

  const populated = await Lead.findById(lead._id)
    .populate('website', 'name slug domain')
    .populate('assignedTo', 'name email');

  ApiResponse.success(res, { lead: populated }, 'Lead updated successfully');
});

/**
 * @desc    Update lead status only (quick action)
 * @route   PATCH /api/leads/:id/status
 * @access  Private
 */
const updateLeadStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const lead = await Lead.findById(req.params.id);
  if (!lead) return ApiResponse.notFound(res, 'Lead');

  if (status === lead.status) {
    return ApiResponse.error(res, `Lead is already "${status}"`, 400);
  }

  lead.addStatusChange(status, req.user._id, note || '');
  await lead.save();

  ApiResponse.success(res, { lead }, `Lead status updated to "${status}"`);
});

/**
 * @desc    Mark lead(s) as spam
 * @route   PATCH /api/leads/mark-spam
 * @access  Private
 */
const markAsSpam = asyncHandler(async (req, res) => {
  const { leadIds } = req.body;

  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return ApiResponse.error(res, 'leadIds must be a non-empty array', 400);
  }

  const leads = await Lead.find({ _id: { $in: leadIds } });

  for (const lead of leads) {
    lead.markAsSpam(req.user._id);
    await lead.save();
  }

  ApiResponse.success(
    res,
    { markedCount: leads.length },
    `${leads.length} lead(s) marked as spam`
  );
});

/**
 * @desc    Delete lead
 * @route   DELETE /api/leads/:id
 * @access  Private (admin/superadmin)
 */
const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) return ApiResponse.notFound(res, 'Lead');
  ApiResponse.success(res, null, 'Lead deleted successfully');
});

/**
 * @desc    Bulk delete leads
 * @route   POST /api/leads/bulk-delete
 * @access  Private (superadmin only)
 */
const bulkDeleteLeads = asyncHandler(async (req, res) => {
  const { leadIds } = req.body;

  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return ApiResponse.error(res, 'leadIds must be a non-empty array', 400);
  }

  const result = await Lead.deleteMany({ _id: { $in: leadIds } });

  ApiResponse.success(
    res,
    { deletedCount: result.deletedCount },
    `${result.deletedCount} lead(s) deleted`
  );
});

// ===================================
// ANALYTICS & STATS
// ===================================

/**
 * @desc    Get comprehensive lead analytics
 * @route   GET /api/leads/stats
 * @access  Private
 *
 * Optional filter: ?website=<mongoId>&from=<date>&to=<date>
 */
const getLeadStats = asyncHandler(async (req, res) => {
  // Build optional match filter
  const matchFilter = { isSpam: { $ne: true } }; // Exclude spam from stats
  if (req.query.website) {
    const mongoose = require('mongoose');
    matchFilter.website = new mongoose.Types.ObjectId(req.query.website);
  }
  if (req.query.from || req.query.to) {
    matchFilter.createdAt = {};
    if (req.query.from) matchFilter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      toDate.setHours(23, 59, 59, 999);
      matchFilter.createdAt.$lte = toDate;
    }
  }

  const [
    statusBreakdown,
    websiteBreakdown,
    priorityBreakdown,
    dailyTrend,
    totalLeads,
    spamCount,
    recentLeads,
  ] = await Promise.all([
    // ---- Leads by status ----
    Lead.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // ---- Leads by website (with website names) ----
    Lead.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$website',
          total: { $sum: 1 },
          newCount: {
            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] },
          },
          contactedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] },
          },
          convertedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'websites',
          localField: '_id',
          foreignField: '_id',
          as: 'websiteInfo',
        },
      },
      { $unwind: '$websiteInfo' },
      {
        $project: {
          _id: 0,
          websiteId: '$_id',
          websiteName: '$websiteInfo.name',
          websiteSlug: '$websiteInfo.slug',
          total: 1,
          newCount: 1,
          contactedCount: 1,
          convertedCount: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$total', 0] },
              {
                $multiply: [
                  { $divide: ['$convertedCount', '$total'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { total: -1 } },
    ]),

    // ---- Leads by priority ----
    Lead.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // ---- Daily trend (last 30 days) ----
    Lead.aggregate([
      {
        $match: {
          ...matchFilter,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // ---- Total leads ----
    Lead.countDocuments(matchFilter),

    // ---- Spam count ----
    Lead.countDocuments({ isSpam: true }),

    // ---- Recent 10 leads ----
    Lead.find(matchFilter)
      .select('name email company website status priority createdAt')
      .populate('website', 'name slug')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  // ---- Today's leads ----
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLeads = await Lead.countDocuments({
    ...matchFilter,
    createdAt: { $gte: today },
  });

  // ---- This week's leads ----
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeekLeads = await Lead.countDocuments({
    ...matchFilter,
    createdAt: { $gte: weekStart },
  });

  // ---- This month's leads ----
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonthLeads = await Lead.countDocuments({
    ...matchFilter,
    createdAt: { $gte: monthStart },
  });

  ApiResponse.success(res, {
    overview: {
      total: totalLeads,
      today: todayLeads,
      thisWeek: thisWeekLeads,
      thisMonth: thisMonthLeads,
      spam: spamCount,
    },
    byStatus: statusBreakdown,
    byWebsite: websiteBreakdown,
    byPriority: priorityBreakdown,
    dailyTrend,
    recentLeads,
  });
});

/**
 * @desc    Export leads (returns all matching leads for CSV/Excel export)
 * @route   GET /api/leads/export
 * @access  Private (admin/superadmin)
 *
 * Supports same filters as GET /api/leads but returns ALL matching (no pagination)
 */
const exportLeads = asyncHandler(async (req, res) => {
  // Build filter (same logic as getLeads)
  const filter = { isSpam: { $ne: true } };

  if (req.query.website) filter.website = req.query.website;
  if (req.query.status) {
    const statuses = req.query.status.split(',').map((s) => s.trim());
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { company: searchRegex },
    ];
  }

  const leads = await Lead.find(filter)
    .populate('website', 'name domain')
    .select('name email phone company message sourcePage website status priority createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // Transform for export
  const exportData = leads.map((lead) => ({
    name: lead.name,
    email: lead.email,
    phone: lead.phone || '',
    company: lead.company || '',
    message: lead.message || '',
    sourcePage: lead.sourcePage || '',
    website: lead.website ? lead.website.name : '',
    domain: lead.website ? lead.website.domain : '',
    status: lead.status,
    priority: lead.priority,
    submittedAt: lead.createdAt,
  }));

  ApiResponse.success(
    res,
    { leads: exportData, count: exportData.length },
    'Leads exported successfully'
  );
});

module.exports = {
  submitLead,
  getLeads,
  getLead,
  updateLead,
  updateLeadStatus,
  markAsSpam,
  deleteLead,
  bulkDeleteLeads,
  getLeadStats,
  exportLeads,
};
