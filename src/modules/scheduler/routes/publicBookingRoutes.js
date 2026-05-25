const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../../../config');
const router = express.Router();
const {
  getPublicEventType,
  getPublicSlots,
  createPublicBooking,
  resolveBookingByToken,
  cancelByToken,
  rescheduleByToken,
  downloadIcs,
} = require('../controllers/publicBookingController');
const {
  getPublicForm,
  evaluatePublicForm,
} = require('../controllers/routingFormController');
const {
  validate,
  publicBookingCreateRules,
  bookingTokenParamRules,
} = require('../validators');

// ===================================
// Public scheduler routes — NO AUTH MIDDLEWARE
// ===================================
// Tenant + event slug come from URL params, NEVER from the body. Each route
// group has its own rate limiter so slot-enumeration abuse doesn't lock out
// legitimate booking submissions, and vice versa.

const slotsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.SCHEDULER_SLOTS_RATE_MAX, 10) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many availability requests — slow down' },
  skip: () => config.env !== 'production',
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.SCHEDULER_BOOKING_RATE_MAX, 10) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many booking attempts — slow down' },
  skip: () => config.env !== 'production',
});

router.get('/book/:tenantSlug/:eventSlug', getPublicEventType);
router.get('/book/:tenantSlug/:eventSlug/slots', slotsLimiter, getPublicSlots);
router.post('/book/:tenantSlug/:eventSlug', bookingLimiter, publicBookingCreateRules, validate, createPublicBooking);

router.get('/bookings/:token', bookingTokenParamRules, validate, resolveBookingByToken);
router.get('/bookings/:token/ics', bookingTokenParamRules, validate, downloadIcs);
router.post('/bookings/:token/cancel', bookingLimiter, bookingTokenParamRules, validate, cancelByToken);
router.post('/bookings/:token/reschedule', bookingLimiter, bookingTokenParamRules, validate, rescheduleByToken);

// Routing form public surface
router.get('/routing/:slug', getPublicForm);
router.post('/routing/:slug/evaluate', bookingLimiter, evaluatePublicForm);

module.exports = router;
