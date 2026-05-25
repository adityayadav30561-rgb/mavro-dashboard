const { Booking, EventType, FormQuestion, CalendarConnection } = require('../models');
const availabilityEngineService = require('./availabilityEngineService');
const calendarProviderService = require('./calendarProviderService');
const { ProviderAuthError, ProviderTransientError } = require('../providers');
const {
  generateBookingTokenPair,
  isValidIanaTimezone,
  toUtcDate,
  utcToWallClock,
  verifySlotHash,
} = require('../utils');
const { validateFormAnswers } = require('../validators/formAnswerValidator');
const analytics = require('../utils/analytics');
const workflowService = require('./workflowService');
const { enqueue, JOB_NAMES } = require('../queue');
const config = require('../../../config');

// ===================================
// bookingService — transactional booking core
// ===================================
// One service, three lifecycle ops: createBooking / cancelBooking /
// rescheduleBooking. Everything that mutates Booking state runs through here.
//
// CREATION FLOW:
//   1. Load event type (active + public + !internalOnly + !deletedAt)
//   2. validateBookingPayload — required fields, timezone, time sanity
//   3. verifySlotHash (timing-safe HMAC compare)
//   4. verifySlotStillAvailable — re-run engine for the tight pad
//   5. Validate intake form answers against FormQuestion list
//   6. Generate cancel + reschedule tokens
//   7. Booking.create — partial unique index on (tenant, hostUser, startTimeUtc,
//      status:'confirmed') makes the second racer get E11000 → 409
//   8. Side-effect: calendarProviderService.createExternalEvent (Google).
//      DB write is the source of truth — if Google fails the booking is
//      preserved with providerError so the slot stays held; admin retry
//      lands in Phase 6.
//   9. Emit booking_created analytics (booking_failed on early-flow failure)
//  10. Return confirmation payload (no provider tokens, no metadata leakage)
//
// CANCEL: idempotent, accepts cancelToken. Optional best-effort delete from
// Google (the calendar event might already be gone). Emits booking_cancelled.
//
// RESCHEDULE: load by rescheduleToken → run createBooking with new time →
// cancel old booking → cross-link via rescheduledFrom / rescheduledTo. Same
// race protection: if the new slot is taken, original booking stays untouched.

class BookingError extends Error {
  constructor(message, { statusCode = 400, code = 'BOOKING_ERROR' } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'BookingError';
  }
}

function validateBookingPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new BookingError('Invalid payload');
  const requiredStrings = ['inviteeName', 'inviteeEmail', 'inviteeTimezone'];
  for (const f of requiredStrings) {
    if (typeof payload[f] !== 'string' || !payload[f].trim()) {
      throw new BookingError(`${f} is required`, { statusCode: 422 });
    }
  }
  if (!payload.startUtc || !payload.endUtc) {
    throw new BookingError('startUtc and endUtc are required', { statusCode: 422 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.inviteeEmail)) {
    throw new BookingError('Invalid inviteeEmail', { statusCode: 422 });
  }
  if (!isValidIanaTimezone(payload.inviteeTimezone)) {
    throw new BookingError(`Invalid inviteeTimezone: ${payload.inviteeTimezone}`, { statusCode: 422 });
  }
  const start = toUtcDate(payload.startUtc);
  const end = toUtcDate(payload.endUtc);
  if (end <= start) throw new BookingError('endUtc must be after startUtc', { statusCode: 422 });
  return { start, end };
}

async function loadEventTypeForBooking({ tenantId, eventTypeId, eventSlug }) {
  const filter = { isActive: true, isPublic: true, internalOnly: false, deletedAt: null };
  if (tenantId) filter.tenant = tenantId;
  if (eventTypeId) filter._id = eventTypeId;
  if (eventSlug) filter.slug = eventSlug;
  const ev = await EventType.findOne(filter).lean();
  if (!ev) throw new BookingError('Event type not found or not bookable', { statusCode: 404, code: 'EVENT_NOT_FOUND' });
  return ev;
}

async function verifySlotStillAvailable({ eventTypeId, startUtc, endUtc, inviteeTimezone, nowUtc }) {
  const bookable = await availabilityEngineService.isSlotStillBookable({
    eventTypeId,
    startUtc,
    endUtc,
    inviteeTimezone,
    nowUtc,
  });
  if (!bookable) {
    throw new BookingError('Slot is no longer available', {
      statusCode: 409,
      code: 'SLOT_UNAVAILABLE',
    });
  }
}

async function pickPrimaryConnectionForHost({ tenantId, hostUserId }) {
  // For Phase 5 we use the host's primary connection (or first active one).
  // Phase 4+ team scheduling will compute the actual host before this point.
  return CalendarConnection.findOne({
    tenant: tenantId,
    user: hostUserId,
    status: 'active',
    isPrimary: true,
  })
    .select('+accessToken +refreshToken +tokenExpiry selectedCalendars calendarId')
    .lean()
    .then(
      (c) =>
        c ||
        CalendarConnection.findOne({
          tenant: tenantId,
          user: hostUserId,
          status: 'active',
        })
          .select('+accessToken +refreshToken +tokenExpiry selectedCalendars calendarId')
          .lean()
    );
}

function pickWriteCalendarId(connection) {
  if (!connection) return null;
  const writePrimary = (connection.selectedCalendars || []).find((c) => c.writeEvents && c.isPrimary);
  if (writePrimary) return writePrimary.calendarId;
  const anyWrite = (connection.selectedCalendars || []).find((c) => c.writeEvents);
  if (anyWrite) return anyWrite.calendarId;
  return connection.calendarId || 'primary';
}

// Best-effort provider write — never throws. Caller decides what to do with
// the result. We never roll back the booking because of provider failure;
// the booking row is the source of truth and the provider event is the side
// effect.
async function tryWriteProviderEvent({ eventType, booking }) {
  try {
    const conn = await pickPrimaryConnectionForHost({
      tenantId: booking.tenant,
      hostUserId: booking.hostUser,
    });
    if (!conn) return { wrote: false, reason: 'no_active_connection' };
    const calendarId = pickWriteCalendarId(conn);
    const payload = {
      summary: `${eventType.name} — ${booking.inviteeName}`,
      description: eventType.description || '',
      startUtc: booking.startTimeUtc,
      endUtc: booking.endTimeUtc,
      attendees: [{ email: booking.inviteeEmail, displayName: booking.inviteeName }],
      locationType: booking.locationType || eventType.locationType,
      locationValue: booking.locationValue || eventType.locationValue,
    };
    const result = await calendarProviderService.createExternalEvent({
      connectionId: conn._id,
      calendarId,
      payload,
    });
    return { wrote: true, result, calendarId };
  } catch (err) {
    const code = err instanceof ProviderAuthError
      ? 'PROVIDER_AUTH'
      : err instanceof ProviderTransientError
      ? 'PROVIDER_TRANSIENT'
      : 'PROVIDER_UNKNOWN';
    // Never throw — provider failure becomes a soft state on the booking.
    return { wrote: false, reason: code, errorMessage: err.message };
  }
}

async function tryDeleteProviderEvent({ connectionId, calendarId, externalEventId }) {
  if (!connectionId || !externalEventId) return { ok: false, reason: 'missing_ids' };
  try {
    await calendarProviderService.deleteExternalEvent({
      connectionId,
      calendarId: calendarId || 'primary',
      externalEventId,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message || 'unknown' };
  }
}

// ----- CREATE -----
async function createBooking({ tenant, eventType, payload, source = 'public' }) {
  if (!tenant || !tenant._id) throw new BookingError('tenant required', { statusCode: 400 });
  if (!eventType || !eventType._id) throw new BookingError('eventType required', { statusCode: 400 });

  const { start, end } = validateBookingPayload(payload);

  // Duration sanity — must match event type
  const expectedMs = (eventType.durationMinutes || 0) * 60 * 1000;
  const actualMs = end.getTime() - start.getTime();
  if (expectedMs && Math.abs(actualMs - expectedMs) > 60 * 1000) {
    throw new BookingError(
      `Slot duration ${Math.round(actualMs / 60000)}m does not match event ${eventType.durationMinutes}m`,
      { statusCode: 422 }
    );
  }

  // Resolve assigned host(s) for team scheduling. Slot grid carries assignedHostId
  // (round_robin / single_host) or assignedHostIds (collective).
  const strategy = eventType.hostSelectionStrategy || 'single_host';
  let primaryHostId = String(eventType.owner);
  let coHosts = [];
  if (strategy === 'round_robin' && payload.assignedHostId) {
    primaryHostId = String(payload.assignedHostId);
  } else if (strategy === 'collective' && Array.isArray(payload.assignedHostIds) && payload.assignedHostIds.length) {
    primaryHostId = String(payload.assignedHostIds[0]);
    coHosts = payload.assignedHostIds.slice(1).map(String);
  }

  // Slot hash verification — bind to the assigned host pool, matching the engine's hash
  if (payload.hash) {
    const hashHostId = strategy === 'collective' && payload.assignedHostIds
      ? payload.assignedHostIds.map(String).join(',')
      : primaryHostId;
    const ok = verifySlotHash(payload.hash, {
      eventTypeId: String(eventType._id),
      hostUserId: hashHostId,
      startUtc: start,
      endUtc: end,
    });
    if (!ok) throw new BookingError('Slot hash mismatch', { statusCode: 409, code: 'STALE_SLOT' });
  }

  // Re-run availability — closes the gap between rendered grid + submit
  await verifySlotStillAvailable({
    eventTypeId: eventType._id,
    startUtc: start,
    endUtc: end,
    inviteeTimezone: payload.inviteeTimezone,
  });

  // Intake form validation
  const questions = await FormQuestion.find({ eventType: eventType._id })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  const validation = validateFormAnswers({ questions, answers: payload.formAnswers });
  if (!validation.ok) throw new BookingError(validation.error, { statusCode: 422, code: 'FORM_INVALID' });

  // Persist — partial unique index catches double-booking races
  const tokens = generateBookingTokenPair();
  let booking;
  try {
    booking = await Booking.create({
      tenant: tenant._id,
      eventType: eventType._id,
      hostUser: primaryHostId,
      coHosts,
      hostSelectionStrategy: strategy,
      inviteeName: payload.inviteeName.trim(),
      inviteeEmail: payload.inviteeEmail.trim().toLowerCase(),
      inviteePhone: typeof payload.inviteePhone === 'string' ? payload.inviteePhone.trim() : '',
      inviteeTimezone: payload.inviteeTimezone,
      startTimeUtc: start,
      endTimeUtc: end,
      status: 'confirmed',
      locationType: eventType.locationType,
      locationValue: eventType.locationValue,
      formAnswers: validation.normalized,
      cancelToken: tokens.cancelToken,
      rescheduleToken: tokens.rescheduleToken,
      source,
      slotHash: payload.hash || null,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      analytics.emit({
        action: 'booking_slot_conflict',
        tenantId: tenant._id,
        userId: null,
        meta: { eventTypeId: String(eventType._id), startUtc: start.toISOString() },
      });
      throw new BookingError('That slot was just booked by someone else', {
        statusCode: 409,
        code: 'SLOT_ALREADY_BOOKED',
      });
    }
    analytics.emit({
      action: 'booking_failed',
      tenantId: tenant._id,
      userId: null,
      meta: { eventTypeId: String(eventType._id), reason: 'persist_failed', message: err.message },
    });
    throw err;
  }

  // Side effect: provider write
  const writeResult = await tryWriteProviderEvent({ eventType, booking });
  if (writeResult.wrote) {
    booking.googleEventId = writeResult.result.externalEventId || null;
    booking.meetingLink = writeResult.result.meetingLink || booking.meetingLink;
    booking.providerMetadata = {
      provider: 'google',
      calendarId: writeResult.calendarId,
      htmlLink: writeResult.result.htmlLink || null,
    };
    booking.providerError = null;
    await booking.save();
  } else {
    booking.providerError = writeResult.reason
      ? `${writeResult.reason}${writeResult.errorMessage ? ': ' + writeResult.errorMessage : ''}`.slice(0, 500)
      : 'unknown';
    await booking.save();
  }

  analytics.emit({
    action: 'booking_created',
    tenantId: tenant._id,
    userId: null,
    meta: {
      eventTypeId: String(eventType._id),
      bookingId: String(booking._id),
      providerWrote: writeResult.wrote,
    },
  });

  // Workflow dispatch (built-in + admin-configured). Best-effort.
  await workflowService.dispatch(workflowService.TRIGGERS.BOOKING_CREATED, { booking, eventType });

  // Schedule provider retry if the live write failed
  if (!writeResult.wrote) {
    await enqueue(
      JOB_NAMES.PROVIDER_RETRY,
      { bookingId: String(booking._id) },
      {
        jobId: `provider_retry:${booking._id}`,
        attempts: config.scheduler.providerRetryMaxAttempts,
        backoff: { type: 'exponential', delay: config.scheduler.providerRetryInitialDelayMs },
        delay: config.scheduler.providerRetryInitialDelayMs,
      }
    );
  }

  return {
    booking,
    tokens, // raw tokens for confirmation URL building — caller decides what to surface
    providerWrote: writeResult.wrote,
    providerError: writeResult.wrote ? null : writeResult.reason,
  };
}

// ----- CANCEL -----
async function cancelBooking({ token, reason = '', source = 'public' }) {
  const booking = await Booking.findOne({ cancelToken: token })
    .select('+cancelToken +googleEventId +providerMetadata');
  if (!booking) throw new BookingError('Invalid cancel token', { statusCode: 404, code: 'INVALID_TOKEN' });
  if (booking.status === 'cancelled') {
    return { booking, alreadyCancelled: true };
  }
  // Cancellation window enforcement — admin-source bypasses (hosts can always cancel).
  if (source !== 'admin') {
    const eventTypeWindow = await EventType.findById(booking.eventType)
      .select('cancellationWindowHours allowCancellation').lean();
    if (eventTypeWindow) {
      if (eventTypeWindow.allowCancellation === false) {
        throw new BookingError('Cancellations are disabled for this event type', {
          statusCode: 403, code: 'CANCELLATION_DISABLED',
        });
      }
      const windowHours = eventTypeWindow.cancellationWindowHours;
      if (typeof windowHours === 'number' && windowHours > 0) {
        const cutoff = new Date(booking.startTimeUtc).getTime() - windowHours * 60 * 60 * 1000;
        if (Date.now() > cutoff) {
          throw new BookingError(
            `Cancellation window has closed — must cancel at least ${windowHours} hours before the start time`,
            { statusCode: 403, code: 'CANCELLATION_WINDOW_CLOSED' }
          );
        }
      }
    }
  }
  // Best-effort provider delete
  let providerDeleted = { ok: false, reason: 'skipped' };
  if (booking.googleEventId) {
    const conn = await pickPrimaryConnectionForHost({ tenantId: booking.tenant, hostUserId: booking.hostUser });
    providerDeleted = await tryDeleteProviderEvent({
      connectionId: conn ? conn._id : null,
      calendarId: booking.providerMetadata ? booking.providerMetadata.calendarId : null,
      externalEventId: booking.googleEventId,
    });
  }
  booking.status = 'cancelled';
  booking.cancellationReason = reason ? String(reason).slice(0, 1000) : 'Cancelled by invitee';
  booking.cancelledAt = new Date();
  await booking.save();

  analytics.emit({
    action: 'booking_cancelled',
    tenantId: booking.tenant,
    userId: null,
    meta: { bookingId: String(booking._id), source, providerDeleted: providerDeleted.ok },
  });

  // Workflow dispatch (built-in cancellation email + admin workflows)
  const eventType = await EventType.findById(booking.eventType).lean();
  await workflowService.dispatch(workflowService.TRIGGERS.BOOKING_CANCELLED, {
    booking,
    eventType,
    reason: booking.cancellationReason,
  });

  return { booking, providerDeleted };
}

// ----- RESCHEDULE -----
async function rescheduleBooking({ token, newStartUtc, newEndUtc, hash, source = 'public' }) {
  const original = await Booking.findOne({ rescheduleToken: token })
    .select('+rescheduleToken +cancelToken +googleEventId +providerMetadata');
  if (!original) throw new BookingError('Invalid reschedule token', { statusCode: 404, code: 'INVALID_TOKEN' });
  if (original.status === 'cancelled') {
    throw new BookingError('Booking is already cancelled — cannot reschedule', { statusCode: 410 });
  }
  if (original.status === 'rescheduled') {
    throw new BookingError('Booking was already rescheduled', { statusCode: 410 });
  }

  const eventType = await EventType.findById(original.eventType).lean();
  if (!eventType || eventType.deletedAt || !eventType.isActive) {
    throw new BookingError('Event type no longer bookable', { statusCode: 410 });
  }
  if (eventType.allowReschedule === false) {
    throw new BookingError('Reschedule is disabled for this event type', { statusCode: 403 });
  }
  if (source !== 'admin') {
    const windowHours = eventType.cancellationWindowHours;
    if (typeof windowHours === 'number' && windowHours > 0) {
      const cutoff = new Date(original.startTimeUtc).getTime() - windowHours * 60 * 60 * 1000;
      if (Date.now() > cutoff) {
        throw new BookingError(
          `Reschedule window has closed — must reschedule at least ${windowHours} hours before the original start time`,
          { statusCode: 403, code: 'RESCHEDULE_WINDOW_CLOSED' }
        );
      }
    }
  }

  // Build a new booking via createBooking — same race protection applies
  const tenantDoc = { _id: original.tenant };
  const created = await createBooking({
    tenant: tenantDoc,
    eventType,
    source,
    payload: {
      startUtc: newStartUtc,
      endUtc: newEndUtc,
      hash,
      inviteeName: original.inviteeName,
      inviteeEmail: original.inviteeEmail,
      inviteeTimezone: original.inviteeTimezone,
      formAnswers: original.formAnswers.map((a) => ({
        questionId: a.questionId,
        value: a.value,
      })),
    },
  });

  // Cross-link + cancel the original
  created.booking.rescheduledFrom = original._id;
  await created.booking.save();

  // Best-effort delete original provider event
  if (original.googleEventId) {
    const conn = await pickPrimaryConnectionForHost({ tenantId: original.tenant, hostUserId: original.hostUser });
    await tryDeleteProviderEvent({
      connectionId: conn ? conn._id : null,
      calendarId: original.providerMetadata ? original.providerMetadata.calendarId : null,
      externalEventId: original.googleEventId,
    });
  }
  original.status = 'rescheduled';
  original.rescheduledTo = created.booking._id;
  original.cancelledAt = new Date();
  await original.save();

  analytics.emit({
    action: 'booking_rescheduled',
    tenantId: original.tenant,
    userId: null,
    meta: { fromBookingId: String(original._id), toBookingId: String(created.booking._id) },
  });

  // Workflow dispatch — booking_rescheduled fires reschedule email + new reminder
  await workflowService.dispatch(workflowService.TRIGGERS.BOOKING_RESCHEDULED, {
    booking: created.booking,
    eventType,
  });

  return { booking: created.booking, tokens: created.tokens, original };
}

module.exports = {
  createBooking,
  cancelBooking,
  rescheduleBooking,
  validateBookingPayload,
  verifySlotStillAvailable,
  loadEventTypeForBooking,
  BookingError,
};
