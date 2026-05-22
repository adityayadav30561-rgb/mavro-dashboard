const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  health,
  test,
  modelTest,
  routeTest,
  recent,
  generateBlogTitles,
  generateBlogMetaDescriptions,
  generateBlogFaqs,
  generateSiteIntelligence,
} = require('../controllers/aiController');

const router = express.Router();

// Every AI route requires an authenticated admin. AI is backend-only —
// never expose API keys or unmediated provider access to the client.
router.use(protect);

// Health + recent request log — any authenticated admin
router.get('/health', health);
router.get('/recent', recent);

// Direct test prompt — restricted to higher-trust roles to limit accidental
// burn of provider quota during early infrastructure rollout.
router.post('/test', authorize('superadmin', 'admin', 'seo_manager'), test);

// Bypass-routing test against a single registry model.
router.post('/model-test', authorize('superadmin', 'admin', 'seo_manager'), modelTest);

// Exercise the full routing + fallback chain for a feature.
router.post('/route-test', authorize('superadmin', 'admin', 'seo_manager'), routeTest);

// Editorial AI endpoints
// Title + meta-description suggestions for the blog editor cockpit.
// Auth-only; rate-limited via the shared /api/ai bucket mounted in app.js.
router.post('/blog/titles', generateBlogTitles);
router.post('/blog/meta-descriptions', generateBlogMetaDescriptions);
router.post('/blog/faqs', generateBlogFaqs);

// Site-wide SEO intelligence — tenant-scoped strategic analysis.
// Role-gated because each call hits a larger AI prompt and is meant for
// SEO managers and above, not casual editors.
router.post(
  '/seo/site-intelligence',
  authorize('superadmin', 'admin', 'seo_manager'),
  generateSiteIntelligence
);

module.exports = router;
