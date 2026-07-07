const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  trackEvent,
  getOverview,
  getTimeseries,
  getTopPages,
  getRecent,
  getBreakdown,
  getDebug,
  getFunnel,
  getTenantComparison,
  getTopBlogs,
  getContentPerformance,
  getRealtime,
  getLandingPages,
  getExitPages,
  getEngagement,
  getReturningVisitors,
  getPageConversion,
  getPageBounce,
  getAnomalies,
  getBlogTrends,
  getPulse,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware');

// ===================================
// Public ingestion rate-limit
// ===================================
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,            // 1 minute window
  max: 60,                         // 60 events per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many analytics events' },
  keyGenerator: (req) =>
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip,
});

// Accept sendBeacon Blob payloads — Content-Type may be text/plain or application/json
const beaconBodyParser = express.text({ type: ['text/plain', 'application/json'], limit: '8kb' });

// ===================================
// PUBLIC: ingestion endpoint
// ===================================
router.post(
  '/track',
  trackLimiter,
  beaconBodyParser,
  trackEvent
);

// ===================================
// PROTECTED: dashboard read endpoints
// ===================================
router.use(protect);

router.get('/overview',           getOverview);
router.get('/timeseries',         getTimeseries);
router.get('/top-pages',          getTopPages);
router.get('/recent',             getRecent);
router.get('/breakdown',          getBreakdown);
router.get('/funnel',             getFunnel);
router.get('/tenant-comparison',  getTenantComparison);
router.get('/top-blogs',          getTopBlogs);
router.get('/content-performance', getContentPerformance);
router.get('/realtime',           getRealtime);
router.get('/landing-pages',      getLandingPages);
router.get('/exit-pages',         getExitPages);
router.get('/engagement',         getEngagement);
router.get('/returning',          getReturningVisitors);
router.get('/page-conversion',    getPageConversion);
router.get('/page-bounce',        getPageBounce);
router.get('/anomalies',          getAnomalies);
router.get('/blog-trends',        getBlogTrends);
router.get('/pulse',              getPulse);
router.get('/_debug',             getDebug);

module.exports = router;
