const { body, param, query, validationResult } = require('express-validator');

// ===================================
// Scheduler request validators (express-validator chains)
// ===================================
// Mirrors the validation pattern used in src/middleware/validators.js so
// controllers can pipeline-attach rule arrays + a single `validate` runner.
// All chains are placeholders for Phase 1 — full enrichment lands as each
// controller method gets implemented.
//
// Pattern:
//   router.post('/event-types', eventTypeCreateRules, validate, createEventType);
//
// The validate runner short-circuits with a 422 + first-error message so
// downstream controllers can assume req.body / req.query are well-formed.

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(422).json({
    success: false,
    message: errors.array()[0].msg,
    errors: errors.array(),
  });
};

// ----- EventType -----
const eventTypeCreateRules = [
  body('tenant').isMongoId().withMessage('tenant must be a Mongo ObjectId'),
  body('name').isString().trim().notEmpty().withMessage('name is required').isLength({ max: 140 }),
  body('durationMinutes').isInt({ min: 5, max: 1440 }).withMessage('durationMinutes must be 5–1440'),
  body('slotIncrementMinutes').optional().isInt({ min: 5, max: 240 }),
  body('rollingWindowDays').optional().isInt({ min: 1, max: 365 }),
  body('minNoticeHours').optional().isInt({ min: 0 }),
  body('locationType').optional().isIn(['google_meet', 'zoom', 'phone', 'in_person', 'custom']),
];

const eventTypeUpdateRules = [
  param('id').isMongoId(),
  body('name').optional().isString().trim().isLength({ max: 140 }),
  body('durationMinutes').optional().isInt({ min: 5, max: 1440 }),
  body('isActive').optional().isBoolean(),
];

// ----- Booking -----
// Public booking endpoint validators — used by the unauthenticated /api/public/book route.
const publicBookingCreateRules = [
  param('tenantSlug').isString().trim().notEmpty(),
  param('eventSlug').isString().trim().notEmpty(),
  body('inviteeName').isString().trim().notEmpty().isLength({ max: 240 }),
  body('inviteeEmail').isEmail().normalizeEmail().isLength({ max: 320 }),
  body('inviteeTimezone').isString().trim().notEmpty().isLength({ max: 80 }),
  body('startTimeUtc').isISO8601().withMessage('startTimeUtc must be ISO-8601 UTC'),
  body('formAnswers').optional().isArray(),
];

const bookingTokenParamRules = [param('token').isString().trim().isLength({ min: 32, max: 80 })];

// ----- CalendarConnection -----
const calendarConnectionCreateRules = [
  body('tenant').isMongoId(),
  body('provider').isIn(['google', 'outlook']),
  // accessToken + refreshToken are accepted from OAuth callback only — never
  // from a generic API client. The OAuth controller is responsible for
  // sourcing them; this validator simply gates shape.
  body('accessToken').isString().notEmpty(),
  body('refreshToken').isString().notEmpty(),
  body('calendarId').optional().isString(),
];

// ----- Workflow -----
const workflowCreateRules = [
  body('tenant').isMongoId(),
  body('name').isString().trim().notEmpty().isLength({ max: 200 }),
  body('trigger').isIn([
    'booking_created',
    'booking_cancelled',
    'booking_rescheduled',
    'before_meeting',
    'after_meeting',
  ]),
  body('actions').optional().isArray(),
];

// ----- Common -----
const mongoIdParam = [param('id').isMongoId().withMessage('Invalid id')];
const tenantQuery = [query('tenant').optional().isMongoId()];

const eventTypeValidators = require('./eventTypeValidators');
const formAnswerValidator = require('./formAnswerValidator');

module.exports = {
  validate,
  eventTypeCreateRules,
  eventTypeUpdateRules,
  publicBookingCreateRules,
  bookingTokenParamRules,
  calendarConnectionCreateRules,
  workflowCreateRules,
  mongoIdParam,
  tenantQuery,
  ...eventTypeValidators,
  ...formAnswerValidator,
};
