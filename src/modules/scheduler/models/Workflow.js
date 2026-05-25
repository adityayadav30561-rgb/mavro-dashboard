const mongoose = require('mongoose');

// ===================================
// Workflow — automation foundation (NO execution engine in Phase 1)
// ===================================
// Defines an automation that fires on a booking lifecycle event. Schema only —
// the execution layer (BullMQ worker + step dispatcher) lands in Phase 3 once
// availability + booking flows are stable.
//
// trigger:
//   - booking_created
//   - booking_cancelled
//   - booking_rescheduled
//   - before_meeting (offset in minutes — e.g. 60min before start)
//   - after_meeting  (offset in minutes — e.g. 1440min after end)
//
// actions:
//   Ordered list of step definitions. Each step has a `type` (send_email,
//   send_sms, webhook, ...) and a `config` blob whose shape is action-type
//   specific. Validated by services/workflowService at execution time.
//
// Schema is intentionally future-proof: status, lastRunAt, runCount left in
// place so the Phase 3 worker can stamp them without a migration.

const workflowStepSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['send_email', 'send_sms', 'send_slack', 'webhook', 'create_lead', 'tag_invitee'],
      required: true,
    },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Optional delay relative to the triggering event (minutes). 0 = immediate.
    delayMinutes: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true,
    },
    // Optional — scope to a single event type. When null, applies to every
    // event type in the tenant.
    eventType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventType',
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    trigger: {
      type: String,
      enum: [
        'booking_created',
        'booking_cancelled',
        'booking_rescheduled',
        'before_meeting',
        'after_meeting',
      ],
      required: true,
      index: true,
    },
    // Offset minutes — meaningful only for before_meeting / after_meeting triggers
    triggerOffsetMinutes: { type: Number, default: 0 },
    actions: { type: [workflowStepSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft',
      index: true,
    },
    // Phase 3 execution telemetry — schema reserved
    lastRunAt: { type: Date, default: null },
    runCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true }
);

workflowSchema.index({ tenant: 1, trigger: 1, status: 1 });

module.exports = mongoose.model('Workflow', workflowSchema);
