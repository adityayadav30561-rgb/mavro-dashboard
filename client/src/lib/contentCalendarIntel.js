// ===================================
// Content Calendar Intelligence
// ===================================
// Pure-function helpers powering the /calendar page:
//   - Month grid layout (week-aligned)
//   - Bucket blogs by day (publish or scheduled day)
//   - Velocity tracking (published / scheduled cadence)
//   - Editorial deadline / SLA detection
//   - Operational planning recommendations
//
// All inputs are tenant-scoped by the caller. No fetches, no React.

// ---- Date utilities (UTC-aware) ----------------------------------------
export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function endOfMonth(d) {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  x.setHours(23, 59, 59, 999);
  return x;
}
export function isSameDay(a, b) {
  if (!a || !b) return false;
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}
export function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

// ---- Month grid (week-aligned 6×7) -------------------------------------
// Returns 42-cell array starting from the Sunday before the first of the
// month and ending on the Saturday after the last of the month.
export function buildMonthGrid(anchor) {
  const first = startOfMonth(anchor);
  const dow = first.getDay(); // 0 = Sun
  const gridStart = addDays(first, -dow);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

// ---- Bucket blogs by relevant date -------------------------------------
// "Relevant date" = scheduledAt if scheduled, publishedAt if published,
// dueAt if has a deadline, else updatedAt. Always returns a Map<dayKey, blogs[]>
export function bucketBlogsByDay(blogs) {
  const map = new Map();
  for (const b of blogs || []) {
    const rel = pickRelevantDate(b);
    if (!rel) continue;
    const key = dayKey(rel);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(b);
  }
  return map;
}
function pickRelevantDate(b) {
  if (b.scheduledAt) return b.scheduledAt;
  if (b.publishedAt) return b.publishedAt;
  if (b.dueAt) return b.dueAt;
  return b.updatedAt || null;
}

// ---- Velocity tracking --------------------------------------------------
// Given a corpus of blogs and a window in days, compute:
//   - publishedInWindow
//   - scheduledInWindow (forward window)
//   - daily cadence (avg blogs/day published)
//   - longest publishing streak (consecutive days with at least one publish)
//   - days since last publish
export function computeVelocity(blogs, { lookbackDays = 30 } = {}) {
  const now = Date.now();
  const cutoff = now - lookbackDays * 86400000;
  const published = (blogs || []).filter((b) => b.status === 'published' && b.publishedAt);
  const inWindow  = published.filter((b) => new Date(b.publishedAt).getTime() >= cutoff);

  const scheduled = (blogs || []).filter((b) => b.status === 'scheduled' && b.scheduledAt);
  const scheduledForward = scheduled.filter((b) => new Date(b.scheduledAt).getTime() >= now);

  // Daily cadence
  const cadence = inWindow.length / Math.max(1, lookbackDays);

  // Streak: walk backwards day by day, increment while at least one publish exists
  const daySet = new Set(published.map((b) => dayKey(b.publishedAt)));
  let streak = 0;
  let cursor = new Date();
  // Allow today empty — start checking from yesterday so a quiet day doesn't break a real streak
  cursor.setHours(0, 0, 0, 0);
  while (daySet.has(dayKey(cursor)) || streak === 0 && isSameDay(cursor, new Date())) {
    if (daySet.has(dayKey(cursor))) {
      streak++;
      cursor = addDays(cursor, -1);
    } else if (streak === 0) {
      // Allow today's no-publish without breaking
      cursor = addDays(cursor, -1);
      if (!daySet.has(dayKey(cursor))) break;
    } else break;
    if (streak > 365) break;
  }

  // Days since last publish
  const latest = published.reduce((m, b) => Math.max(m, new Date(b.publishedAt).getTime()), 0);
  const daysSinceLastPublish = latest ? Math.floor((now - latest) / 86400000) : null;

  return {
    lookbackDays,
    publishedInWindow: inWindow.length,
    scheduledForward: scheduledForward.length,
    cadencePerDay: Number(cadence.toFixed(2)),
    cadencePerWeek: Number((cadence * 7).toFixed(1)),
    streak,
    daysSinceLastPublish,
    totalPublished: published.length,
  };
}

// ---- Deadline / SLA detection ------------------------------------------
// Returns operator-actionable signals: overdue drafts, stale reviews, missed
// publish windows.
export function detectDeadlines(blogs) {
  const now = Date.now();
  const overdueDrafts   = [];
  const staleReviews    = [];
  const missedPublishes = [];

  for (const b of blogs || []) {
    if (b.workflowStatus === 'draft' && b.dueAt && new Date(b.dueAt).getTime() < now) {
      overdueDrafts.push(b);
    }
    if (b.workflowStatus === 'review') {
      const ref = b.updatedAt ? new Date(b.updatedAt).getTime() : now;
      const daysInReview = Math.floor((now - ref) / 86400000);
      if (daysInReview >= 3) staleReviews.push({ ...b, daysInReview });
    }
    if (b.status === 'scheduled' && b.scheduledAt && new Date(b.scheduledAt).getTime() < now) {
      // Should have auto-published — flag for operator attention
      missedPublishes.push(b);
    }
  }

  return { overdueDrafts, staleReviews, missedPublishes };
}

// ---- Planning recommendations ------------------------------------------
// Surface operator guidance like:
//   - "No blogs scheduled for next 7 days"
//   - "HRMS tenant publishing cadence dropped 60%"
//   - "Campaign X behind target — 2/8 published"
//
// All recommendations have severity + actionable message. Pure heuristics.
export function buildPlanningRecommendations(blogs, { campaigns = [], byTenant = null } = {}) {
  const recs = [];
  const now = Date.now();

  const scheduledForward = (blogs || []).filter((b) => b.status === 'scheduled' && b.scheduledAt && new Date(b.scheduledAt).getTime() >= now);
  const next7 = scheduledForward.filter((b) => new Date(b.scheduledAt).getTime() <= now + 7 * 86400000);
  const next30 = scheduledForward.filter((b) => new Date(b.scheduledAt).getTime() <= now + 30 * 86400000);

  if (next7.length === 0) {
    recs.push({
      severity: 'warning',
      code: 'no_schedule_next_week',
      message: 'No blogs scheduled in the next 7 days — publishing cadence at risk.',
    });
  } else if (next7.length === 1) {
    recs.push({
      severity: 'notice',
      code: 'thin_schedule_next_week',
      message: `Only 1 blog scheduled this week — consider queuing 2–3 more for consistency.`,
    });
  }

  if (next30.length < 4) {
    recs.push({
      severity: 'notice',
      code: 'thin_schedule_next_month',
      message: `Only ${next30.length} blogs scheduled in the next 30 days — target 1+ per week minimum.`,
    });
  }

  // Per-tenant cadence drift
  if (byTenant && typeof byTenant === 'object') {
    for (const [tenantName, tenantBlogs] of Object.entries(byTenant)) {
      const v = computeVelocity(tenantBlogs);
      if (v.daysSinceLastPublish != null && v.daysSinceLastPublish > 21) {
        recs.push({
          severity: 'warning',
          code: 'tenant_quiet',
          message: `${tenantName} has not published in ${v.daysSinceLastPublish} days — momentum decaying.`,
        });
      }
      if (v.cadencePerWeek < 0.5 && v.totalPublished > 0) {
        recs.push({
          severity: 'notice',
          code: 'tenant_low_cadence',
          message: `${tenantName} is publishing < 1 blog every 2 weeks — below recommended cadence.`,
        });
      }
    }
  }

  // Campaign progress checks
  for (const c of campaigns || []) {
    if (c.status === 'active' && c.targetBlogCount && c.progress) {
      const completed = c.progress.published || 0;
      const total = c.targetBlogCount;
      const pct = total ? Math.round((completed / total) * 100) : 0;
      if (pct < 50 && c.endDate && new Date(c.endDate).getTime() < now + 14 * 86400000) {
        recs.push({
          severity: 'warning',
          code: 'campaign_behind',
          message: `Campaign "${c.name}" — ${completed}/${total} published, deadline in <2 weeks.`,
        });
      } else if (pct < 100 && c.endDate && new Date(c.endDate).getTime() < now) {
        recs.push({
          severity: 'critical',
          code: 'campaign_overdue',
          message: `Campaign "${c.name}" ended with ${completed}/${total} published — close or extend.`,
        });
      }
    }
  }

  return recs;
}

// ---- Editorial health score (0–100) ------------------------------------
// One number that summarizes how on-top-of-it the editorial operation is.
// Inputs: velocity, deadlines, planning. Higher = healthier.
export function computeEditorialHealth({ velocity, deadlines, planning }) {
  let score = 100;
  // Cadence
  if (velocity.cadencePerWeek === 0) score -= 25;
  else if (velocity.cadencePerWeek < 1) score -= 15;
  else if (velocity.cadencePerWeek < 2) score -= 5;

  // Forward pipeline
  if (velocity.scheduledForward === 0) score -= 20;
  else if (velocity.scheduledForward < 3) score -= 10;

  // Deadline issues
  score -= Math.min(20, (deadlines.overdueDrafts.length * 5));
  score -= Math.min(15, (deadlines.staleReviews.length * 5));
  score -= Math.min(20, (deadlines.missedPublishes.length * 8));

  // Planning warnings
  const criticalRecs = (planning || []).filter((r) => r.severity === 'critical').length;
  const warningRecs  = (planning || []).filter((r) => r.severity === 'warning').length;
  score -= criticalRecs * 8 + warningRecs * 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ---- Utility: group blogs by tenant -------------------------------------
export function groupBlogsByTenant(blogs) {
  const map = {};
  for (const b of blogs || []) {
    const name = b.targetWebsite?.name || b.targetWebsite || '—';
    if (!map[name]) map[name] = [];
    map[name].push(b);
  }
  return map;
}
