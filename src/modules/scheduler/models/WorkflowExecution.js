const mongoose = require('mongoose');

// ===================================
// WorkflowExecution — per-action audit row
// ===================================
// One row per (workflow, step, booking, attempt). Worker handlers write here
// at the start + end of each action so admins can see what fired, when, and
// why. Also the source-of-truth for the Replay control: admin clicks Replay
// → controller re-enqueues a job carrying the original step config + a new
// jobId derived from the execution id.
//
// Retention: 90 days via TTL. Past that, raw rows expire and analytics
// rollups (Phase 8 reporting) take over.

const workflowExecutionSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', default: null, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
    trigger: { type: String, default: null, index: true },
    stepIndex: { type: Number, default: 0 },
    actionType: {
      type: String,
      enum: ['send_email', 'send_sms', 'send_slack', 'webhook', 'create_lead', 'tag_invitee', 'builtin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'succeeded', 'failed', 'skipped'],
      default: 'queued',
      index: true,
    },
    attempts: { type: Number, default: 1 },
    durationMs: { type: Number, default: null },
    error: { type: String, default: null, maxlength: 1000 },
    payloadSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
    jobId: { type: String, default: null, index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

workflowExecutionSchema.index({ tenant: 1, createdAt: -1 });
workflowExecutionSchema.index({ tenant: 1, status: 1, createdAt: -1 });
// TTL — auto-prune at 90 days
workflowExecutionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('WorkflowExecution', workflowExecutionSchema);
