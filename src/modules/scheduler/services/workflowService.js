const { Workflow, Booking, EventType } = require('../models');
const { enqueue, JOB_NAMES } = require('../queue');
const config = require('../../../config');
const analytics = require('../utils/analytics');

// ===================================
// workflowService — booking lifecycle automation
// ===================================
// dispatch(trigger, ctx) is called from bookingService after every lifecycle
// event. Three layers fire:
//
//   1. Built-in defaults — always run regardless of admin-configured workflows:
//        booking_created     → confirmation email immediately + reminder T-60min
//        booking_cancelled   → cancellation email immediately
//        booking_rescheduled → reschedule email immediately (+ reminder)
//      Default reminder offset = config.scheduler.defaultReminderMinutesBefore.
//
//   2. Admin Workflow rows matching (tenant, trigger, status='active',
//      (eventType IS NULL OR eventType = ctx.eventTypeId)) push their action
//      chain onto the queue with cumulative delay.
//
//   3. Phase 7+ — SMS / Slack / CRM step types plug in by adding entries to
//      the queue's WORKFLOW_ACTION handler. No changes to dispatch().
//
// JOB IDEMPOTENCY:
//   Job IDs are deterministic — `${trigger}:${bookingId}:${stepIdx}` for
//   workflow actions, `${kind}:${bookingId}` for built-ins. BullMQ rejects
//   duplicate jobId so re-dispatch from a retried bookingService call doesn't
//   double-send.

const TRIGGERS = Object.freeze({
  BOOKING_CREATED: 'booking_created',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_RESCHEDULED: 'booking_rescheduled',
  BOOKING_COMPLETED: 'booking_completed',
  BEFORE_MEETING: 'before_meeting',
  AFTER_MEETING: 'after_meeting',
});

function defaultReminderDelay({ booking }) {
  const reminderMinutesBefore = config.scheduler.defaultReminderMinutesBefore || 60;
  const startMs = new Date(booking.startTimeUtc).getTime();
  const fireAt = startMs - reminderMinutesBefore * 60 * 1000;
  const now = Date.now();
  // Don't schedule reminders that would fire in the past.
  return Math.max(0, fireAt - now);
}

async function fireBuiltIns({ trigger, ctx }) {
  const { booking, reason } = ctx;
  if (!booking) return;
  const bookingId = String(booking._id);

  if (trigger === TRIGGERS.BOOKING_CREATED) {
    await enqueue(
      JOB_NAMES.BOOKING_CONFIRMATION_EMAIL,
      { bookingId },
      { jobId: `confirmation:${bookingId}` }
    );
    const delay = defaultReminderDelay({ booking });
    if (delay > 0) {
      await enqueue(
        JOB_NAMES.BOOKING_REMINDER_EMAIL,
        { bookingId, kind: 'hour_before' },
        { jobId: `reminder:hour_before:${bookingId}`, delay }
      );
    }
  } else if (trigger === TRIGGERS.BOOKING_CANCELLED) {
    await enqueue(
      JOB_NAMES.BOOKING_CANCELLATION_EMAIL,
      { bookingId, reason: reason || null },
      { jobId: `cancellation:${bookingId}:${Date.now()}` }
    );
  } else if (trigger === TRIGGERS.BOOKING_RESCHEDULED) {
    await enqueue(
      JOB_NAMES.BOOKING_RESCHEDULE_EMAIL,
      { bookingId },
      { jobId: `reschedule:${bookingId}` }
    );
    const delay = defaultReminderDelay({ booking });
    if (delay > 0) {
      await enqueue(
        JOB_NAMES.BOOKING_REMINDER_EMAIL,
        { bookingId, kind: 'hour_before' },
        { jobId: `reminder:hour_before:${bookingId}`, delay }
      );
    }
  }
}

async function fireConfiguredWorkflows({ trigger, ctx }) {
  const { booking } = ctx;
  if (!booking) return [];
  const workflows = await Workflow.find({
    tenant: booking.tenant,
    status: 'active',
    trigger,
    $or: [{ eventType: null }, { eventType: booking.eventType }],
  }).lean();

  const dispatched = [];
  for (const wf of workflows) {
    let cumulativeDelay = 0;
    for (let i = 0; i < (wf.actions || []).length; i++) {
      const step = wf.actions[i];
      if (!step || step.isActive === false) continue;
      cumulativeDelay += (step.delayMinutes || 0) * 60 * 1000;
      if (step.type === 'wait') continue; // wait is implicit via cumulativeDelay
      await enqueue(
        JOB_NAMES.WORKFLOW_ACTION,
        {
          workflowId: String(wf._id),
          stepIndex: i,
          step,
          bookingId: String(booking._id),
          trigger,
        },
        {
          jobId: `wf:${wf._id}:${booking._id}:${i}`,
          delay: cumulativeDelay,
        }
      );
      dispatched.push({ workflowId: wf._id, stepIndex: i, type: step.type, delayMs: cumulativeDelay });
    }
    // Increment runCount + lastRunAt — eventually-consistent counter
    Workflow.updateOne({ _id: wf._id }, { $inc: { runCount: 1 }, $set: { lastRunAt: new Date() } }).catch(() => {});
  }
  return dispatched;
}

/**
 * Public dispatch. Best-effort — never throws into the booking flow caller.
 */
async function dispatch(trigger, ctx = {}) {
  try {
    if (!Object.values(TRIGGERS).includes(trigger)) return { matched: 0, queued: 0 };
    await fireBuiltIns({ trigger, ctx });
    const configured = await fireConfiguredWorkflows({ trigger, ctx });
    analytics.emit({
      action: 'workflow_executed',
      tenantId: ctx.booking ? ctx.booking.tenant : null,
      userId: null,
      meta: {
        trigger,
        bookingId: ctx.booking ? String(ctx.booking._id) : null,
        configuredCount: configured.length,
      },
    });
    return { matched: configured.length, queued: configured.length };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[workflowService.dispatch] failed:', err.message);
    return { matched: 0, queued: 0, error: err.message };
  }
}

module.exports = {
  dispatch,
  TRIGGERS,
};
