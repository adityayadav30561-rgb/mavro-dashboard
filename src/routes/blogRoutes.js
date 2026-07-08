const express = require('express');
const multer = require('multer');
const router = express.Router();
const { importDocx } = require('../controllers/docxImportController');

const docxUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB cap
});
const {
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
  getWordpressCorpus,
} = require('../controllers/blogController');
const {
  protect,
  authorize,
  blogCreateRules,
  blogUpdateRules,
  blogStatusRules,
  blogBulkRules,
  blogQueryRules,
  mongoIdParam,
  validate,
} = require('../middleware');
const { asyncHandler } = require('../utils');
const { indexingService } = require('../services');

// ===================================
// Public Routes (no auth required)
// ===================================

// Get published blogs for a website (by website slug)
router.get('/website/:slug', getBlogsByWebsiteSlug);

// Get single published blog (by website slug + blog slug)
router.get('/website/:websiteSlug/:blogSlug', getPublicBlog);

// ===================================
// Protected Routes (auth required)
// ===================================
router.use(protect);

// ----- Stats (must be before /:id to avoid conflict) -----
router.get('/stats', getBlogStats);

// ----- Activity feed (must be before /:id to avoid conflict) -----
router.get('/activity', getActivityFeed);

// ----- DOCX import (must be before /:id to avoid conflict) -----
router.post('/import-docx', docxUpload.single('file'), importDocx);

// ----- WordPress-backed tenant corpus (must be before /:id) -----
// Feeds the SEO Engine for tenants whose blogs live in an external WordPress
// install (Website.wordpressUrl set — currently SaiSatwik).
router.get('/wordpress/:websiteSlug', getWordpressCorpus);

// ----- Bulk operations -----
router.post('/bulk', authorize('admin', 'superadmin'), blogBulkRules, validate, bulkAction);

// ----- CRUD -----
router
  .route('/')
  .get(blogQueryRules, validate, getBlogs)
  .post(blogCreateRules, validate, createBlog);

router
  .route('/:id')
  .get(mongoIdParam, validate, getBlog)
  .put(mongoIdParam, blogUpdateRules, validate, updateBlog)
  .delete(mongoIdParam, validate, deleteBlog);

// ----- Publishing Lifecycle -----
router.patch('/:id/status', mongoIdParam, blogStatusRules, validate, updateBlogStatus);
router.patch('/:id/publish', mongoIdParam, validate, publishBlog);
router.patch('/:id/unpublish', mongoIdParam, validate, unpublishBlog);

// ----- Editorial: reschedule + workflow transitions -----
router.patch('/:id/schedule', mongoIdParam, validate, rescheduleBlog);
router.patch('/:id/workflow', mongoIdParam, validate, updateWorkflowStatus);

// ----- Editorial: ownership + approval -----
router.patch('/:id/assign',            mongoIdParam, validate, assignBlog);
router.patch('/:id/approve',           mongoIdParam, validate, approveBlog);
router.patch('/:id/request-revision',  mongoIdParam, validate, requestRevisionBlog);
router.patch('/:id/reject',            mongoIdParam, validate, rejectBlog);

// ----- Google Indexing -----
router.post(
  '/:id/index',
  mongoIdParam,
  validate,
  asyncHandler(async (req, res) => {
    const result = await indexingService.submitBlogForIndexing(req.params.id);
    res.status(200).json({ success: true, data: result });
  })
);

module.exports = router;
