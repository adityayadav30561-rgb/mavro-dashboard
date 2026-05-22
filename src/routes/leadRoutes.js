const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
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
} = require('../controllers/leadController');
const {
  protect,
  authorize,
  leadSubmitRules,
  leadUpdateRules,
  leadStatusRules,
  leadBulkRules,
  leadQueryRules,
  mongoIdParam,
  validate,
  spamProtection,
} = require('../middleware');

// ===================================
// Lead-specific rate limiter (public submission)
// Stricter than the global limiter
// ===================================
const leadSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 submissions per IP per 15 minutes
  message: {
    success: false,
    message: 'Too many form submissions. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use real client IP even behind proxies
    return (
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.ip
    );
  },
});

// ===================================
// PUBLIC ROUTES
// ===================================

/**
 * POST /api/leads/submit
 * Public lead submission endpoint used by all Mavro websites
 *
 * Pipeline: Rate Limit → Spam Protection (6 layers) → Validation → Controller
 */
router.post(
  '/submit',
  leadSubmitLimiter,
  ...spamProtection,
  leadSubmitRules,
  validate,
  submitLead
);

// Backward compat: POST /api/leads also accepts submissions
router.post(
  '/',
  leadSubmitLimiter,
  ...spamProtection,
  leadSubmitRules,
  validate,
  submitLead
);

// ===================================
// PROTECTED ROUTES (auth required)
// ===================================
router.use(protect);

// ----- Stats & Export (must be before /:id to avoid conflict) -----
router.get('/stats', getLeadStats);
router.get('/export', authorize('admin', 'superadmin'), exportLeads);

// ----- Bulk operations -----
router.patch('/mark-spam', leadBulkRules, validate, markAsSpam);
router.post('/bulk-delete', authorize('superadmin'), leadBulkRules, validate, bulkDeleteLeads);

// ----- List leads -----
router.get('/', leadQueryRules, validate, getLeads);

// ----- Single lead operations -----
router
  .route('/:id')
  .get(mongoIdParam, validate, getLead)
  .put(mongoIdParam, leadUpdateRules, validate, updateLead)
  .delete(mongoIdParam, validate, authorize('admin', 'superadmin'), deleteLead);

// ----- Quick status update -----
router.patch('/:id/status', mongoIdParam, leadStatusRules, validate, updateLeadStatus);

module.exports = router;
