const mongoose = require('mongoose');
const slugify = require('slugify');

// ===================================
// EventType — bookable meeting template
// ===================================
// One EventType = one bookable meeting kind (e.g. "30-min Discovery Call").
// Public booking resolves via (tenant.slug, eventType.slug). The slug is
// unique per (tenant, soft-delete bucket) — see compound index below.
//
// SECTIONS:
//   Core              — name, slug, description, color, durationMinutes
//   Meeting           — locationType, locationValue
//   Restrictions      — minNoticeHours, rollingWindowDays, slotIncrementMinutes, dailyCap
//   Buffers           — bufferBeforeMinutes, bufferAfterMinutes
//   Availability      — timezone, availability[], overrideDates[], blackoutDates[]
//   Booking controls  — requireConfirmation, allowReschedule, allowCancellation, cancellationWindowHours
//   Visibility        — isActive, isPublic, internalOnly
//   Ownership         — tenant, owner, createdBy
//   Team              — isTeamEvent, hostSelectionStrategy, teamMembers[]
//   Soft delete       — deletedAt (queries filter `deletedAt: null` by default)

const availabilityWindowSchema = new mongoose.Schema(
  {
    start: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    end: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  },
  { _id: false }
);

const availabilityDaySchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    windows: { type: [availabilityWindowSchema], default: [] },
  },
  { _id: false }
);

// Date-specific override — e.g. "On 2026-06-15 I'm only available 14:00-16:00".
// Wins over the weekly recurrence on that date. If `windows: []` the date is
// treated as a full-day override (no availability that day).
const overrideDateSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD in event timezone
    windows: { type: [availabilityWindowSchema], default: [] },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const eventTypeSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'tenant is required'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: [true, 'owner is required'],
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, lowercase: true, index: true },
    description: { type: String, default: '', maxlength: 2000 },
    color: { type: String, default: 'violet', maxlength: 24 },
    durationMinutes: { type: Number, required: true, min: 5, max: 1440 },

    // ── Meeting ──
    locationType: {
      type: String,
      enum: ['google_meet', 'phone', 'in_person', 'custom'],
      default: 'google_meet',
    },
    locationValue: { type: String, default: '', maxlength: 1000 },

    // ── Restrictions ──
    bufferBeforeMinutes: { type: Number, default: 0, min: 0, max: 240 },
    bufferAfterMinutes: { type: Number, default: 0, min: 0, max: 240 },
    minNoticeHours: { type: Number, default: 4, min: 0 },
    dailyCap: { type: Number, default: null, min: 0 },
    rollingWindowDays: { type: Number, default: 60, min: 1, max: 365 },
    slotIncrementMinutes: { type: Number, default: 30, min: 5, max: 240 },

    // ── Availability ──
    timezone: { type: String, default: 'UTC', maxlength: 80 },
    availability: { type: [availabilityDaySchema], default: [] },
    overrideDates: { type: [overrideDateSchema], default: [] },
    blackoutDates: { type: [String], default: [] }, // YYYY-MM-DD strings

    // ── Booking controls ──
    requireConfirmation: { type: Boolean, default: false },
    allowReschedule: { type: Boolean, default: true },
    allowCancellation: { type: Boolean, default: true },
    cancellationWindowHours: { type: Number, default: 4, min: 0 },

    // ── Visibility ──
    isActive: { type: Boolean, default: true, index: true },
    isPublic: { type: Boolean, default: true },
    internalOnly: { type: Boolean, default: false },

    // ── Team scheduling (Phase 4+) ──
    isTeamEvent: { type: Boolean, default: false },
    hostSelectionStrategy: {
      type: String,
      enum: ['single_host', 'round_robin', 'collective', 'load_balanced', 'manual', null],
      default: 'single_host',
    },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }],

    // ── Soft delete ──
    deletedAt: { type: Date, default: null, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true }
);

// Soft-delete-aware unique slug: only enforced when deletedAt is null.
// Lets us "release" a slug for reuse after archival without dropping data.
eventTypeSchema.index(
  { tenant: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
eventTypeSchema.index({ tenant: 1, owner: 1, isActive: 1, deletedAt: 1 });

eventTypeSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('EventType', eventTypeSchema);
