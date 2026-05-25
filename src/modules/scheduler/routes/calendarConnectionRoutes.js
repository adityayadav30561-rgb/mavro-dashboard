const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../../../config');
const router = express.Router();
const {
  listConnections,
  getConnection,
  deleteConnection,
  initGoogleConnect,
  googleCallback,
  listConnectionCalendars,
  updateConnectionPreferences,
  refreshConnection,
} = require('../controllers/calendarConnectionController');
const { protect } = require('../../../middleware');
const { validate, mongoIdParam } = require('../validators');

// ===================================
// OAuth route rate limiter
// ===================================
// Stricter than the global apiLimiter — defeats CSRF spray + accidental
// re-redirect loops. Skipped in non-prod so local testing is friction-free.
const oauthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.OAUTH_RATE_LIMIT_MAX, 10) || 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OAuth attempts — slow down' },
  skip: () => config.env !== 'production',
});

// ─── OAuth callback — UNAUTHENTICATED — must be registered BEFORE protect ───
// Google posts back here with `code` + `state`. Identity = signed state JWT.
router.get('/google/callback', oauthLimiter, googleCallback);

// ─── Everything else is JWT-protected ───
router.use(protect);

// OAuth init — JWT-protected so we know which user/tenant the grant belongs to.
router.get('/google/connect', oauthLimiter, initGoogleConnect);

// CRUD
router.get('/', listConnections);
router.get('/:id', mongoIdParam, validate, getConnection);
router.delete('/:id', mongoIdParam, validate, deleteConnection);
router.delete('/:id/disconnect', mongoIdParam, validate, deleteConnection);

// Calendar listing + preferences + token refresh
router.get('/:id/calendars', mongoIdParam, validate, listConnectionCalendars);
router.patch('/:id/preferences', mongoIdParam, validate, updateConnectionPreferences);
router.post('/:id/refresh', mongoIdParam, validate, refreshConnection);

module.exports = router;
