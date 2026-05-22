// ===================================
// Scheduled Publish Worker
// ===================================
// Polls the Blog collection at a fixed cadence and auto-publishes blogs
// whose `status === 'scheduled'` AND `scheduledAt <= now`.
//
// Design:
//   - Idempotent: only flips blogs whose status is still 'scheduled' at write
//   - Atomic: uses findOneAndUpdate with a status condition to prevent races
//   - Fire-and-forget search-engine pings (do not block the worker loop)
//   - Safe in dev: skips when no MONGO connection
//   - Single-instance assumption (no distributed lock). Add a `claimedBy`
//     field + JobLock collection if Mavro ever scales to multi-instance.

const Blog = require('../models/Blog');
const Website = require('../models/Website');
const pingService = require('./pingService');

const POLL_INTERVAL_MS = 60 * 1000; // 60s
let timerHandle = null;
let isRunning = false;
let lastRunAt = null;

async function runOnce() {
  if (isRunning) return { skipped: true, reason: 'already-running' };
  isRunning = true;
  lastRunAt = new Date();

  const stats = { scanned: 0, published: 0, errors: 0, skippedInactive: 0 };

  try {
    const now = new Date();
    // Cheap discovery scan — uses the {status, scheduledAt} index added on Blog
    const due = await Blog.find({
      status: 'scheduled',
      scheduledAt: { $lte: now },
    })
      .select('_id targetWebsite scheduledAt status')
      .lean();

    stats.scanned = due.length;

    for (const candidate of due) {
      try {
        // Verify website is active before publishing — matches publishBlog
        // controller's invariant
        const website = await Website.findById(candidate.targetWebsite).select('status name slug domain').lean();
        if (!website || website.status !== 'active') {
          stats.skippedInactive++;
          continue;
        }

        // Atomic flip: only proceed if status is still 'scheduled' AND the
        // scheduledAt is still <= now (handles operator-edited reschedules)
        const blog = await Blog.findOneAndUpdate(
          { _id: candidate._id, status: 'scheduled', scheduledAt: { $lte: now } },
          {
            $set: {
              status: 'published',
              workflowStatus: 'published',
              publishedAt: new Date(),
            },
            $push: {
              publishHistory: {
                at: new Date(),
                by: null,
                action: 'auto-publish',
                note: `Auto-published by scheduler at ${new Date().toISOString()}`,
              },
            },
          },
          { new: true }
        );
        if (!blog) continue; // someone else won the race or operator unscheduled

        stats.published++;

        // Fire-and-forget search engine ping
        pingService.onBlogPublished(blog, website).catch((err) => {
          console.error(`[scheduledPublish] ping failed for ${blog.slug}:`, err.message);
        });
      } catch (err) {
        stats.errors++;
        console.error(`[scheduledPublish] error on blog ${candidate._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[scheduledPublish] scan failed:', err.message);
    stats.errors++;
  } finally {
    isRunning = false;
  }

  if (stats.published > 0) {
    console.log(`[scheduledPublish] published ${stats.published}/${stats.scanned} due blog(s)`);
  }
  return stats;
}

function start({ intervalMs = POLL_INTERVAL_MS } = {}) {
  if (timerHandle) return;
  // Kick once on boot (after a small delay to let mongoose connect)
  setTimeout(() => { runOnce().catch(() => {}); }, 5000);
  timerHandle = setInterval(() => { runOnce().catch(() => {}); }, intervalMs);
  console.log(`📅 [scheduledPublish] worker started — polling every ${Math.round(intervalMs / 1000)}s`);
}

function stop() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
    console.log('📅 [scheduledPublish] worker stopped');
  }
}

function status() {
  return {
    running: !!timerHandle,
    inFlight: isRunning,
    lastRunAt,
    intervalMs: POLL_INTERVAL_MS,
  };
}

module.exports = { start, stop, status, runOnce };
