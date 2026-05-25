const { Worker, QueueEvents } = require('bullmq');
const config = require('../../../config');
const { QUEUE_NAME, buildConnection, enqueue, JOB_NAMES } = require('../queue');
const handlers = require('./handlers');

// ===================================
// Scheduler worker bootstrap
// ===================================
// Single worker process pulls every job kind off `scheduler-workflows`. Job
// dispatcher routes by `job.name`. Concurrency tunable via env.
//
// Booted lazily from server.js when REDIS_URL is set + SCHEDULER_BOOT_WORKERS
// !== 'false'. In a horizontally-scaled deploy, set SCHEDULER_BOOT_WORKERS=false
// on the web dyno and run `node src/modules/scheduler/workers/standalone.js`
// (Phase 7 will ship a thin entry script).
//
// COMPLETION SWEEP:
//   Runs in-process via setInterval — cheap, no extra dyno needed. Disabled
//   when workers aren't booted.

let workerInstance = null;
let queueEvents = null;
let completionSweepHandle = null;

async function start() {
  if (workerInstance) return workerInstance;
  if (!config.scheduler.redisUrl) {
    // eslint-disable-next-line no-console
    console.warn('[scheduler workers] REDIS_URL not set — workers not started');
    return null;
  }
  if (!config.scheduler.bootWorkers) {
    // eslint-disable-next-line no-console
    console.log('[scheduler workers] SCHEDULER_BOOT_WORKERS=false — skipping worker boot');
    return null;
  }
  const connection = buildConnection();
  if (!connection) return null;

  workerInstance = new Worker(
    QUEUE_NAME,
    async (job) => {
      const handler = handlers[job.name];
      if (!handler) {
        return { skipped: true, reason: `no_handler:${job.name}` };
      }
      return handler(job);
    },
    {
      connection,
      concurrency: parseInt(process.env.SCHEDULER_WORKER_CONCURRENCY, 10) || 4,
      removeOnComplete: { age: 60 * 60 * 24, count: 5000 },
      removeOnFail: { age: 60 * 60 * 24 * 7 },
    }
  );

  workerInstance.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.warn(`[scheduler worker] job ${job?.name} (${job?.id}) failed:`, err.message);
  });
  workerInstance.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('[scheduler worker] worker error:', err.message);
  });

  // QueueEvents — surface stalled jobs without exception spam
  queueEvents = new QueueEvents(QUEUE_NAME, { connection });
  queueEvents.on('stalled', ({ jobId }) => {
    // eslint-disable-next-line no-console
    console.warn(`[scheduler worker] job ${jobId} stalled — will be retried`);
  });

  // Completion sweep — in-process interval, also enqueues so the actual sweep
  // runs inside the worker dispatcher (so log + metrics stay consistent).
  if (config.scheduler.completionSweepIntervalMs > 0) {
    completionSweepHandle = setInterval(() => {
      enqueue(JOB_NAMES.BOOKING_COMPLETION_TRANSITION, {}, {
        jobId: `completion:${Math.floor(Date.now() / config.scheduler.completionSweepIntervalMs)}`,
      }).catch(() => {});
    }, config.scheduler.completionSweepIntervalMs);
    if (completionSweepHandle.unref) completionSweepHandle.unref();
  }

  // eslint-disable-next-line no-console
  console.log(`✅ [scheduler worker] online — queue=${QUEUE_NAME}`);
  return workerInstance;
}

async function stop() {
  if (completionSweepHandle) {
    clearInterval(completionSweepHandle);
    completionSweepHandle = null;
  }
  if (queueEvents) {
    await queueEvents.close().catch(() => {});
    queueEvents = null;
  }
  if (workerInstance) {
    await workerInstance.close().catch(() => {});
    workerInstance = null;
  }
}

module.exports = { start, stop };
