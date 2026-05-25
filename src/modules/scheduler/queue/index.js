const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../../../config');

// ===================================
// BullMQ queue — lazy singleton with graceful degradation
// ===================================
// One queue: `scheduler-workflows`. All scheduler async work rides this queue
// keyed by job `name` (e.g. 'booking_confirmation_email', 'provider_retry').
//
// REDIS DEGRADATION:
//   - If REDIS_URL is unset, `getQueue()` returns null. All callers MUST
//     null-check; the public surface (`enqueue`) silently no-ops + logs a
//     warning. This lets local dev + Render free-tier (no Redis add-on) run
//     booking creation end-to-end without crashing.
//   - Connection failures during normal operation surface via the worker
//     stalled-job handler — main thread booking flow never sees them.
//
// CONCURRENCY:
//   Single queue + multiple worker instances scale horizontally. BullMQ
//   guarantees one delivery per job via Redis BRPOPLPUSH. Job names route to
//   handlers via the worker dispatcher (see workers/index.js).

const QUEUE_NAME = 'scheduler-workflows';

const JOB_NAMES = Object.freeze({
  BOOKING_CONFIRMATION_EMAIL: 'booking_confirmation_email',
  BOOKING_REMINDER_EMAIL: 'booking_reminder_email',
  BOOKING_CANCELLATION_EMAIL: 'booking_cancellation_email',
  BOOKING_RESCHEDULE_EMAIL: 'booking_reschedule_email',
  PROVIDER_RETRY: 'provider_retry',
  WEBHOOK_DELIVERY: 'webhook_delivery',
  WORKFLOW_ACTION: 'workflow_action',
  BOOKING_COMPLETION_TRANSITION: 'booking_completion_transition',
});

let queueInstance = null;
let connectionInstance = null;
let initWarned = false;

function buildConnection() {
  if (connectionInstance) return connectionInstance;
  if (!config.scheduler.redisUrl) return null;
  // BullMQ wants `maxRetriesPerRequest: null` on the connection so it can
  // implement its own retry semantics. `enableReadyCheck: false` avoids
  // false-positive errors on Render's managed Redis cold-start.
  connectionInstance = new IORedis(config.scheduler.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  connectionInstance.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('[scheduler queue] redis error:', err.message);
  });
  return connectionInstance;
}

function getQueue() {
  if (queueInstance) return queueInstance;
  const connection = buildConnection();
  if (!connection) {
    if (!initWarned) {
      // eslint-disable-next-line no-console
      console.warn('[scheduler queue] REDIS_URL not set — queue disabled (dispatch is a no-op)');
      initWarned = true;
    }
    return null;
  }
  queueInstance = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { age: 60 * 60 * 24, count: 5000 }, // 1d / 5k
      removeOnFail: { age: 60 * 60 * 24 * 7 },              // 7d retained for ops
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    },
  });
  return queueInstance;
}

/**
 * Public enqueue API. Safe to call from anywhere — silently no-ops when
 * Redis isn't configured.
 *
 * @param {string} name     — JOB_NAMES.*
 * @param {object} payload  — job-specific payload
 * @param {object} opts     — BullMQ job options (delay, attempts override, jobId, ...)
 */
async function enqueue(name, payload, opts = {}) {
  const queue = getQueue();
  if (!queue) return { queued: false, reason: 'redis_disabled' };
  const job = await queue.add(name, payload, opts);
  return { queued: true, jobId: job.id };
}

async function close() {
  if (queueInstance) {
    await queueInstance.close().catch(() => {});
    queueInstance = null;
  }
  if (connectionInstance) {
    await connectionInstance.quit().catch(() => {});
    connectionInstance = null;
  }
}

module.exports = {
  QUEUE_NAME,
  JOB_NAMES,
  getQueue,
  buildConnection,
  enqueue,
  close,
};
