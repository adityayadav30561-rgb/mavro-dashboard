/**
 * Standalone scheduler worker entry.
 *
 * Run on a dedicated worker dyno (Render worker service / fly machine /
 * Kubernetes pod) when the web process should not also run jobs:
 *   $ node src/workers/scheduler-worker.js
 *
 * Web dyno config:
 *   SCHEDULER_BOOT_WORKERS=false   # web stops booting in-process workers
 *
 * Worker dyno config:
 *   SCHEDULER_BOOT_WORKERS=true    # default; ensure REDIS_URL is set
 *
 * This entry connects to MongoDB (handlers read/write Booking + Execution
 * rows) and boots the BullMQ Worker. Graceful shutdown wired to SIGTERM /
 * SIGINT so the orchestrator can drain in-flight jobs cleanly.
 */

require('dotenv').config();
const connectDB = require('../config/db');
const config = require('../config');
const schedulerWorkers = require('../modules/scheduler/workers');
const schedulerQueue = require('../modules/scheduler/queue');

async function main() {
  if (!config.scheduler.redisUrl) {
    console.error('❌ REDIS_URL not set — standalone worker cannot start');
    process.exit(1);
  }
  await connectDB();
  await schedulerWorkers.start();
  console.log(`✅ Standalone scheduler worker online (pid ${process.pid})`);

  const shutdown = async (signal) => {
    console.log(`\n${signal} received — draining worker…`);
    try { await schedulerWorkers.stop(); } catch (e) { /* noop */ }
    try { await schedulerQueue.close(); } catch (e) { /* noop */ }
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
    } catch (e) { /* noop */ }
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection in worker:', err);
  });
}

main().catch((err) => {
  console.error('Worker boot failed:', err);
  process.exit(1);
});
