const { EventType, Booking, FormQuestion } = require('../models');
const { Website, AdminUser } = require('../../../models');
const { asyncHandler, ApiResponse } = require('../../../utils');
const availabilityEngineService = require('../services/availabilityEngineService');
const bookingService = require('../services/bookingService');
const analytics = require('../utils/analytics');
const { generateIcs } = require('../utils/ics');

// ===================================
// Public booking controller — UNAUTHENTICATED
// ===================================
// Routes mounted at /api/public/book/* and /api/public/bookings/*. Tenant
// scoping comes from URL slug, never the body.

async function resolvePublicTenantAndEvent(tenantSlug, eventSlug) {
  const tenant = await Website.findOne({ slug: tenantSlug, status: 'active' }).select('_id name slug').lean();
  if (!tenant) return { error: { message: 'Tenant not found', status: 404 } };
  const eventType = await EventType.findOne({
    tenant: tenant._id,
    slug: eventSlug,
    isActive: true,
    isPublic: true,
    internalOnly: false,
    deletedAt: null,
  }).lean();
  if (!eventType) return { error: { message: 'Event type not found', status: 404 } };
  return { tenant, eventType };
}

// ----- METADATA -----
const getPublicEventType = asyncHandler(async (req, res) => {
  const { tenantSlug, eventSlug } = req.params;
  const resolved = await resolvePublicTenantAndEvent(tenantSlug, eventSlug);
  if (resolved.error) return ApiResponse.error(res, resolved.error.message, resolved.error.status);
  const questions = await FormQuestion.find({ eventType: resolved.eventType._id })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select('label placeholder helpText type options isRequired sortOrder validationRules')
    .lean();
  const publicEvent = {
    _id: resolved.eventType._id,
    name: resolved.eventType.name,
    slug: resolved.eventType.slug,
    description: resolved.eventType.description,
    color: resolved.eventType.color,
    durationMinutes: resolved.eventType.durationMinutes,
    locationType: resolved.eventType.locationType,
    timezone: resolved.eventType.timezone,
    minNoticeHours: resolved.eventType.minNoticeHours,
    rollingWindowDays: resolved.eventType.rollingWindowDays,
    requireConfirmation: resolved.eventType.requireConfirmation,
    allowReschedule: resolved.eventType.allowReschedule,
    allowCancellation: resolved.eventType.allowCancellation,
    cancellationWindowHours: resolved.eventType.cancellationWindowHours,
  };
  return ApiResponse.success(res, {
    tenant: { name: resolved.tenant.name, slug: resolved.tenant.slug },
    eventType: publicEvent,
    questions,
  });
});

// ----- SLOTS -----
const getPublicSlots = asyncHandler(async (req, res) => {
  const { tenantSlug, eventSlug } = req.params;
  const { start, end, timezone } = req.query;
  if (!start || !end) return ApiResponse.error(res, 'start and end query params required', 422);
  const resolved = await resolvePublicTenantAndEvent(tenantSlug, eventSlug);
  if (resolved.error) return ApiResponse.error(res, resolved.error.message, resolved.error.status);
  try {
    const result = await availabilityEngineService.computeAvailableSlots({
      eventTypeId: resolved.eventType._id,
      rangeStartUtc: new Date(start),
      rangeEndUtc: new Date(end),
      inviteeTimezone: timezone || undefined,
    });
    analytics.emit({
      action: 'scheduler_slots_viewed',
      tenantId: resolved.tenant._id,
      userId: null,
      meta: {
        eventTypeId: String(resolved.eventType._id),
        eventSlug,
        slotCount: result.slots.length,
        timezone: result.guestZone,
      },
    });
    return ApiResponse.success(res, {
      tenant: { name: resolved.tenant.name, slug: resolved.tenant.slug },
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return ApiResponse.error(res, err.message, status);
  }
});

// ----- CREATE BOOKING -----
const createPublicBooking = asyncHandler(async (req, res) => {
  const { tenantSlug, eventSlug } = req.params;
  const resolved = await resolvePublicTenantAndEvent(tenantSlug, eventSlug);
  if (resolved.error) return ApiResponse.error(res, resolved.error.message, resolved.error.status);
  try {
    const { booking, tokens, providerWrote, providerError } = await bookingService.createBooking({
      tenant: { _id: resolved.tenant._id },
      eventType: resolved.eventType,
      payload: req.body,
      source: 'public',
    });
    return ApiResponse.success(
      res,
      {
        bookingId: booking._id,
        startUtc: booking.startTimeUtc,
        endUtc: booking.endTimeUtc,
        inviteeTimezone: booking.inviteeTimezone,
        inviteeName: booking.inviteeName,
        inviteeEmail: booking.inviteeEmail,
        locationType: booking.locationType,
        locationValue: booking.locationValue,
        meetingLink: booking.meetingLink,
        cancelToken: tokens.cancelToken,
        rescheduleToken: tokens.rescheduleToken,
        providerWrote,
        providerError: providerError || null,
      },
      'Booking confirmed',
      201
    );
  } catch (err) {
    const status = err.statusCode || 500;
    const code = err.code || null;
    return res.status(status).json({
      success: false,
      message: err.message || 'Booking failed',
      code,
    });
  }
});

// ----- TOKEN LOOKUP (cancel + reschedule) -----
const resolveBookingByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const booking = await Booking.findOne({
    $or: [{ cancelToken: token }, { rescheduleToken: token }],
  })
    .select('+cancelToken +rescheduleToken')
    .populate('eventType', 'name slug durationMinutes locationType allowReschedule allowCancellation cancellationWindowHours')
    .populate('tenant', 'name slug')
    .lean();
  if (!booking) return ApiResponse.error(res, 'Invalid or expired token', 404);
  const mode = booking.cancelToken === token ? 'cancel' : 'reschedule';
  delete booking.cancelToken;
  delete booking.rescheduleToken;
  return ApiResponse.success(res, { booking, mode });
});

const cancelByToken = asyncHandler(async (req, res) => {
  try {
    const { booking, alreadyCancelled } = await bookingService.cancelBooking({
      token: req.params.token,
      reason: req.body?.reason,
      source: 'public',
    });
    return ApiResponse.success(res, {
      bookingId: booking._id,
      status: booking.status,
      alreadyCancelled: !!alreadyCancelled,
    }, alreadyCancelled ? 'Already cancelled' : 'Booking cancelled');
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Cancel failed',
      code: err.code || null,
    });
  }
});

const rescheduleByToken = asyncHandler(async (req, res) => {
  try {
    const { booking, tokens } = await bookingService.rescheduleBooking({
      token: req.params.token,
      newStartUtc: req.body.startUtc,
      newEndUtc: req.body.endUtc,
      hash: req.body.hash,
      source: 'public',
    });
    return ApiResponse.success(res, {
      bookingId: booking._id,
      startUtc: booking.startTimeUtc,
      endUtc: booking.endTimeUtc,
      meetingLink: booking.meetingLink,
      cancelToken: tokens.cancelToken,
      rescheduleToken: tokens.rescheduleToken,
    }, 'Booking rescheduled');
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Reschedule failed',
      code: err.code || null,
    });
  }
});

// ----- ICS DOWNLOAD -----
const downloadIcs = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ cancelToken: req.params.token })
    .select('+cancelToken')
    .populate('eventType', 'name description')
    .lean();
  if (!booking) return ApiResponse.error(res, 'Invalid token', 404);
  // Best-effort organizer lookup
  const host = await AdminUser.findById(booking.hostUser).select('name email').lean();
  const ics = generateIcs({
    uid: `mavro-booking-${booking._id}`,
    startUtc: booking.startTimeUtc,
    endUtc: booking.endTimeUtc,
    summary: booking.eventType ? `${booking.eventType.name} — ${booking.inviteeName}` : 'Booking',
    description: booking.eventType ? booking.eventType.description : '',
    location: booking.locationType === 'in_person' ? booking.locationValue : '',
    meetingLink: booking.meetingLink || '',
    organizerEmail: host?.email,
    organizerName: host?.name,
    attendeeEmail: booking.inviteeEmail,
    attendeeName: booking.inviteeName,
    status: booking.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
  });
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="booking-${booking._id}.ics"`);
  return res.send(ics);
});

module.exports = {
  getPublicEventType,
  getPublicSlots,
  createPublicBooking,
  resolveBookingByToken,
  cancelByToken,
  rescheduleByToken,
  downloadIcs,
};
