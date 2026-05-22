const express = require('express');
const router = express.Router();
const {
  createSeoMetadata,
  getSeoMetadataList,
  getSeoMetadata,
  updateSeoMetadata,
  deleteSeoMetadata,
  getPageSeo,
  getBlogSchema,
  getSeoStats,
} = require('../controllers/seoController');
const {
  protect,
  authorize,
  seoCreateRules,
  seoUpdateRules,
  seoQueryRules,
  mongoIdParam,
  validate,
} = require('../middleware');

// ===================================
// Public Routes (consumed by websites for rendering)
// ===================================

// Get meta tags for a specific page
router.get('/page/:websiteSlug/*', getPageSeo);

// Get blog JSON-LD structured data
router.get('/schema/blog/:websiteSlug/:blogSlug', getBlogSchema);

// ===================================
// Protected Routes (admin panel)
// ===================================
router.use(protect);

// Stats (before /:id)
router.get('/stats', getSeoStats);

// CRUD
router
  .route('/')
  .get(seoQueryRules, validate, getSeoMetadataList)
  .post(seoCreateRules, validate, createSeoMetadata);

router
  .route('/:id')
  .get(mongoIdParam, validate, getSeoMetadata)
  .put(mongoIdParam, seoUpdateRules, validate, updateSeoMetadata)
  .delete(mongoIdParam, validate, authorize('admin', 'superadmin'), deleteSeoMetadata);

module.exports = router;
