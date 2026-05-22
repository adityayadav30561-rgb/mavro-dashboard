const { validationResult, body, param, query } = require('express-validator');

/**
 * Process validation results and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// ===================================
// Auth Validators
// ===================================
const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'editor'])
    .withMessage('Invalid role'),
];

// ===================================
// Website Validators
// ===================================
const websiteRules = [
  body('name').trim().notEmpty().withMessage('Website name is required'),
  body('domain').trim().notEmpty().withMessage('Domain is required'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Invalid status'),
];

// ===================================
// Blog Validators
// ===================================

/**
 * Rules for creating a new blog post (all required fields enforced)
 */
const blogCreateRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Blog title is required')
    .isLength({ max: 250 })
    .withMessage('Title cannot exceed 250 characters'),
  body('content')
    .notEmpty()
    .withMessage('Blog content is required'),
  body('targetWebsite')
    .isMongoId()
    .withMessage('Valid target website ID is required'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled', 'archived'])
    .withMessage('Status must be one of: draft, published, scheduled, archived'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt cannot exceed 500 characters'),
  body('featuredImage')
    .optional()
    .trim(),
  body('category')
    .optional()
    .trim(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be a string with max 50 characters'),
  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  body('keywords.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 80 })
    .withMessage('Each keyword must be a string with max 80 characters'),
  body('seoTitle')
    .optional()
    .trim()
    .isLength({ max: 70 })
    .withMessage('SEO title should not exceed 70 characters'),
  body('seoDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('SEO description should not exceed 160 characters'),
  body('canonicalUrl')
    .optional()
    .trim(),
  body('ogImage')
    .optional()
    .trim(),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
];

/**
 * Rules for updating a blog post (all fields optional — partial update)
 */
const blogUpdateRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty if provided')
    .isLength({ max: 250 })
    .withMessage('Title cannot exceed 250 characters'),
  body('content')
    .optional()
    .notEmpty()
    .withMessage('Content cannot be empty if provided'),
  body('targetWebsite')
    .optional()
    .isMongoId()
    .withMessage('Valid target website ID is required'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled', 'archived'])
    .withMessage('Status must be one of: draft, published, scheduled, archived'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt cannot exceed 500 characters'),
  body('featuredImage')
    .optional()
    .trim(),
  body('category')
    .optional()
    .trim(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .trim(),
  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  body('keywords.*')
    .optional()
    .isString()
    .trim(),
  body('seoTitle')
    .optional()
    .trim()
    .isLength({ max: 70 })
    .withMessage('SEO title should not exceed 70 characters'),
  body('seoDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('SEO description should not exceed 160 characters'),
  body('canonicalUrl')
    .optional()
    .trim(),
  body('ogImage')
    .optional()
    .trim(),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO 8601 date'),
];

/**
 * Rules for changing blog status
 */
const blogStatusRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['draft', 'published', 'scheduled', 'archived'])
    .withMessage('Status must be one of: draft, published, scheduled, archived'),
  body('scheduledAt')
    .if(body('status').equals('scheduled'))
    .notEmpty()
    .withMessage('scheduledAt is required when status is scheduled')
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
];

/**
 * Rules for bulk blog operations
 */
const blogBulkRules = [
  body('blogIds')
    .isArray({ min: 1 })
    .withMessage('blogIds must be a non-empty array'),
  body('blogIds.*')
    .isMongoId()
    .withMessage('Each blog ID must be a valid MongoDB ObjectId'),
  body('action')
    .isIn(['publish', 'draft', 'archive', 'delete'])
    .withMessage('Action must be one of: publish, draft, archive, delete'),
];

/**
 * Query validation for blog listing
 */
const blogQueryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('targetWebsite')
    .optional()
    .isMongoId()
    .withMessage('targetWebsite must be a valid MongoDB ID'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled', 'archived'])
    .withMessage('Invalid status filter'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'publishedAt', 'title', 'readingTime'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
];

// Keep backward compat alias
const blogRules = blogCreateRules;

// ===================================
// Lead Validators
// ===================================

/**
 * Rules for public lead submission (POST /api/leads/submit)
 */
const leadSubmitRules = [
  body('website')
    .isMongoId()
    .withMessage('Valid website ID is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.\-']+$/)
    .withMessage('Name contains invalid characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email is too long'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number is too long'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),
  body('sourcePage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Source page URL is too long'),
  body('referrer')
    .optional()
    .trim(),
  body('utmSource')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('utmMedium')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('utmCampaign')
    .optional()
    .trim()
    .isLength({ max: 100 }),
];

// Backward compat alias
const leadRules = leadSubmitRules;

/**
 * Rules for admin lead update (PUT /api/leads/:id)
 */
const leadUpdateRules = [
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'converted', 'closed', 'spam'])
    .withMessage('Invalid lead status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('assignedTo')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('assignedTo must be a valid admin user ID'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes cannot exceed 5000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be max 50 characters'),
  body('statusNote')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Status note cannot exceed 500 characters'),
];

/**
 * Rules for quick status update (PATCH /api/leads/:id/status)
 */
const leadStatusRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['new', 'contacted', 'qualified', 'converted', 'closed', 'spam'])
    .withMessage('Invalid lead status'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters'),
];

/**
 * Rules for bulk spam marking
 */
const leadBulkRules = [
  body('leadIds')
    .isArray({ min: 1 })
    .withMessage('leadIds must be a non-empty array'),
  body('leadIds.*')
    .isMongoId()
    .withMessage('Each lead ID must be a valid MongoDB ObjectId'),
];

/**
 * Query validation for lead listing
 */
const leadQueryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('website')
    .optional()
    .isMongoId()
    .withMessage('website must be a valid MongoDB ID'),
  query('status')
    .optional()
    .custom((value) => {
      const valid = ['new', 'contacted', 'qualified', 'converted', 'closed', 'spam'];
      const statuses = value.split(',').map((s) => s.trim());
      for (const s of statuses) {
        if (!valid.includes(s)) throw new Error(`Invalid status: ${s}`);
      }
      return true;
    }),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority filter'),
  query('isSpam')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isSpam must be true or false'),
  query('from')
    .optional()
    .isISO8601()
    .withMessage('from must be a valid date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('to must be a valid date'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'name', 'email', 'status', 'priority'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
];

// ===================================
// SEO Metadata Validators
// ===================================

/**
 * Rules for creating SEO metadata
 */
const seoCreateRules = [
  body('website')
    .isMongoId()
    .withMessage('Valid website ID is required'),
  body('pagePath')
    .trim()
    .notEmpty()
    .withMessage('Page path is required')
    .matches(/^\//)
    .withMessage('Page path must start with /'),
  body('pageType')
    .optional()
    .isIn(['homepage', 'landing', 'service', 'product', 'blog_index', 'contact', 'about', 'pricing', 'custom'])
    .withMessage('Invalid page type'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 70 })
    .withMessage('Title should not exceed 70 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Description should not exceed 160 characters'),
  body('ogTitle')
    .optional()
    .trim()
    .isLength({ max: 95 }),
  body('ogDescription')
    .optional()
    .trim()
    .isLength({ max: 200 }),
  body('ogType')
    .optional()
    .isIn(['website', 'article', 'product', 'profile']),
  body('twitterCard')
    .optional()
    .isIn(['summary', 'summary_large_image', 'app', 'player']),
  body('robotsIndex')
    .optional()
    .isBoolean(),
  body('robotsFollow')
    .optional()
    .isBoolean(),
  body('includeInSitemap')
    .optional()
    .isBoolean(),
  body('sitemapPriority')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Sitemap priority must be between 0 and 1'),
  body('sitemapChangefreq')
    .optional()
    .isIn(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']),
];

/**
 * Rules for updating SEO metadata (all optional)
 */
const seoUpdateRules = [
  body('pagePath')
    .optional()
    .trim()
    .matches(/^\//)
    .withMessage('Page path must start with /'),
  body('pageType')
    .optional()
    .isIn(['homepage', 'landing', 'service', 'product', 'blog_index', 'contact', 'about', 'pricing', 'custom']),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 70 }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 160 }),
  body('robotsIndex')
    .optional()
    .isBoolean(),
  body('robotsFollow')
    .optional()
    .isBoolean(),
  body('includeInSitemap')
    .optional()
    .isBoolean(),
  body('sitemapPriority')
    .optional()
    .isFloat({ min: 0, max: 1 }),
  body('sitemapChangefreq')
    .optional()
    .isIn(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']),
];

/**
 * Query rules for SEO listing
 */
const seoQueryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }),
  query('website')
    .optional()
    .isMongoId(),
  query('pageType')
    .optional()
    .isIn(['homepage', 'landing', 'service', 'product', 'blog_index', 'contact', 'about', 'pricing', 'custom']),
  query('isActive')
    .optional()
    .isIn(['true', 'false']),
];

// ===================================
// Common Validators
// ===================================
const mongoIdParam = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];

const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  validate,
  loginRules,
  registerRules,
  websiteRules,
  blogRules,
  blogCreateRules,
  blogUpdateRules,
  blogStatusRules,
  blogBulkRules,
  blogQueryRules,
  leadRules,
  leadSubmitRules,
  leadUpdateRules,
  leadStatusRules,
  leadBulkRules,
  leadQueryRules,
  seoCreateRules,
  seoUpdateRules,
  seoQueryRules,
  mongoIdParam,
  paginationRules,
};

