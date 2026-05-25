const mongoose = require('mongoose');

// ===================================
// Booking — confirmed / cancelled meeting instance
// ===================================
// One row per attempted booking. UTC-only time storage; invitee timezone
// preserved separately for ICS + display. Cancel + reschedule tokens are
// 256-bit base64url generated server-side (utils/tokens.js).
//
// RACE PROTECTION:
//   Partial unique index on (tenant, hostUser, startTimeUtc) where
//   status='confirmed' rejects two confirmed bookings for the same host at
//   the same instant. The booking service catches E11000 and surfaces a
//   structured 409 SLOT_ALREADY_BOOKED response. Cancelled bookings are
//   excluded so the same start time can be rebooked after cancel.
//
// PROVIDER METADATA:
//   `externalEventId` (Google) + `outlookEventId` (Phase 3) live separately
//   to keep cross-provider lookup simple. `providerMetadata` holds the rest
//   of the provider-shaped echo (htmlLink, calendarId, conferenceData). All
//   provider fields are `select:false` so admin lists never leak them.

const formAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormQuestion' },
    labelSnapshot: { type: String, default: '' },
    typeSnapshot: { type: String, default: '' },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true,
    },
    eventType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventType',
      required: true,
      index: true,
    },
    hostUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      index: true,
    },
    // Collective-scheduling attendees beyond the primary host. Engine reads
    // both `hostUser` + `coHosts[]` when computing the availability footprint.
    coHosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }],
    hostSelectionStrategy: {
      type: String,
      enum: ['single_host', 'round_robin', 'collective'],
      default: 'single_host',
    },
    inviteeName: { type: String, required: true, trim: true, maxlength: 240 },
    inviteeEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 320 },
    inviteePhone: { type: String, default: '', trim: true, maxlength: 40 },
    inviteeTimezone: { type: String, required: true, maxlength: 80 },
    startTimeUtc: { type: Date, required: true, index: true },
    endTimeUtc: { type: Date, required: true },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'rescheduled', 'no_show', 'completed'],
      default: 'confirmed',
      index: true,
    },
    locationType: {
      type: String,
      enum: ['google_meet', 'phone', 'in_person', 'custom'],
      default: 'google_meet',
    },
    locationValue: { type: String, default: '' },
    meetingLink: { type: String, default: '' },
    cancelToken: { type: String, required: true, unique: true, select: false },
    rescheduleToken: { type: String, required: true, unique: true, select: false },
    formAnswers: { type: [formAnswerSchema], default: [] },
    cancellationReason: { type: String, default: null, maxlength: 1000 },
    cancelledAt: { type: Date, default: null },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    rescheduledTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    // Booking source — useful for analytics + future webhook signatures.
    source: {
      type: String,
      enum: ['public', 'admin', 'api'],
      default: 'public',
    },
    // Audit fingerprint — the slotHash the engine emitted when this slot was
    // last rendered. Lets us forensically tie a booking back to a rendered
    // slot view if a race investigation is needed.
    slotHash: { type: String, default: null, select: false },
    // External calendar event ids — never exposed via toJSON.
    googleEventId: { type: String, default: null, select: false },
    outlookEventId: { type: String, default: null, select: false },
    providerMetadata: { type: mongoose.Schema.Types.Mixed, default: {}, select: false },
    providerError: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

// Tenant-scoped time range queries
bookingSchema.index({ tenant: 1, hostUser: 1, startTimeUtc: 1 });
bookingSchema.index({ tenant: 1, eventType: 1, startTimeUtc: 1 });
bookingSchema.index({ tenant: 1, status: 1, startTimeUtc: 1 });
bookingSchema.index({ inviteeEmail: 1, startTimeUtc: -1 });

// RACE GUARD — partial unique. Only enforced for status='confirmed' so
// cancelled bookings don't block re-booking the same start time later.
bookingSchema.index(
  { tenant: 1, hostUser: 1, startTimeUtc: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' }, name: 'race_guard_confirmed' }
);

function stripSecrets(doc, ret) {
  delete ret.cancelToken;
  delete ret.rescheduleToken;
  delete ret.googleEventId;
  delete ret.outlookEventId;
  delete ret.providerMetadata;
  delete ret.providerError;
  delete ret.slotHash;
  return ret;
}
bookingSchema.set('toJSON', { transform: stripSecrets });
bookingSchema.set('toObject', { transform: stripSecrets });

module.exports = mongoose.model('Booking', bookingSchema);
