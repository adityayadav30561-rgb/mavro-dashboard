const express = require('express');
const router = express.Router();
const {
  createWebsite,
  getWebsites,
  getWebsite,
  updateWebsite,
  deleteWebsite,
  cleanupDemo,
} = require('../controllers/websiteController');
const Website = require('../models/Website');
const {
  protect,
  authorize,
  websiteRules,
  mongoIdParam,
  paginationRules,
  validate,
} = require('../middleware');
const { asyncHandler, ApiResponse } = require('../utils');

// ===================================
// PUBLIC ROUTES (no auth)
// ===================================
// Lightweight website lookup by slug — used by public marketing sites
// to resolve their tenant identity for lead submission and SEO.
router.get(
  '/public/:slug',
  asyncHandler(async (req, res) => {
    const website = await Website.findOne(
      { slug: req.params.slug, status: 'active' },
      { _id: 1, name: 1, slug: 1, domain: 1, description: 1, branding: 1 }
    ).lean();
    if (!website) return ApiResponse.notFound(res, 'Website');
    return ApiResponse.success(res, { website });
  })
);

// ===================================
// PROTECTED ROUTES (auth required)
// ===================================
router.use(protect);

// One-shot cleanup of seeded demo tenants + localhost domain rewrites.
// Superadmin-only. Supports { dryRun: true } body for preview.
router.post('/_cleanup-demo', authorize('superadmin'), cleanupDemo);

router
  .route('/')
  .get(paginationRules, validate, getWebsites)
  .post(websiteRules, validate, createWebsite);

router
  .route('/:id')
  .get(mongoIdParam, validate, getWebsite)
  .put(mongoIdParam, validate, updateWebsite)
  .delete(mongoIdParam, validate, authorize('superadmin'), deleteWebsite);

module.exports = router;
