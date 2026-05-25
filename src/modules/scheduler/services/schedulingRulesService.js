// ===================================
// schedulingRulesService — policy enforcement (Phase 4)
// ===================================
// Pure functions. No I/O. The availability engine wires the data in, this
// service decides whether a candidate slot survives. Same module also exposes
// the busy-range normalizer so the engine doesn't have to know about merge
// edge cases (overlap, adjacency, sort order).
//
// Every function is O(n log n) or better — slot computation must stay snappy
// for 30-day grids with 30 connected calendars + hundreds of bookings.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// ---------- Min notice ----------

/**
 * Earliest UTC moment a slot can start, given a `minNoticeHours` rule and
 * the caller-perceived "now". Pure — `nowUtc` defaults to Date.now() but is
 * injectable for tests.
 */
function enforceMinNotice({ minNoticeHours = 0, nowUtc = new Date() } = {}) {
  const now = nowUtc instanceof Date ? nowUtc.getTime() : new Date(nowUtc).getTime();
  return new Date(now + (minNoticeHours || 0) * HOUR_MS);
}

// ---------- Rolling window ----------

/**
 * Latest UTC moment a slot can end, given `rollingWindowDays`. Inclusive
 * upper bound for the slot grid generator.
 */
function enforceRollingWindow({ rollingWindowDays = 60, nowUtc = new Date() } = {}) {
  const now = nowUtc instanceof Date ? nowUtc.getTime() : new Date(nowUtc).getTime();
  return new Date(now + rollingWindowDays * DAY_MS);
}

// ---------- Daily cap ----------

/**
 * Count confirmed bookings per UTC calendar day in `ianaZone` and return a
 * Map<YYYY-MM-DD, count>. Caller compares against `dailyCap`.
 */
function bookingsPerDay({ bookings = [], ianaZone = 'UTC' } = {}) {
  const { DateTime } = require('luxon');
  const counts = new Map();
  for (const b of bookings) {
    if (!b.startTimeUtc) continue;
    const key = DateTime.fromJSDate(new Date(b.startTimeUtc)).setZone(ianaZone).toFormat('yyyy-LL-dd');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/**
 * Returns true if this date in `ianaZone` is still under the dailyCap.
 * `dailyCap === null/undefined/0` means unlimited.
 */
function isUnderDailyCap({ dateStr, dailyCap, perDayCounts }) {
  if (!dailyCap || dailyCap <= 0) return true;
  const current = perDayCounts.get(dateStr) || 0;
  return current < dailyCap;
}

// ---------- Busy-range normalization + merge ----------

/**
 * Normalize a mixed array of busy ranges to UTC `[{startUtc, endUtc}]`,
 * drop zero-length / inverted entries, sort by start, and merge overlapping
 * + adjacent ranges. O(n log n).
 */
function normalizeBusyRanges(ranges = []) {
  if (!Array.isArray(ranges) || !ranges.length) return [];
  const clean = [];
  for (const r of ranges) {
    if (!r || (!r.startUtc && !r.start) || (!r.endUtc && !r.end)) continue;
    const s = new Date(r.startUtc || r.start).getTime();
    const e = new Date(r.endUtc || r.end).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) continue;
    clean.push({ s, e });
  }
  if (!clean.length) return [];
  clean.sort((a, b) => a.s - b.s);
  const merged = [clean[0]];
  for (let i = 1; i < clean.length; i++) {
    const last = merged[merged.length - 1];
    const cur = clean[i];
    if (cur.s <= last.e) {
      // overlap or touch — extend
      if (cur.e > last.e) last.e = cur.e;
    } else {
      merged.push(cur);
    }
  }
  return merged.map((m) => ({ startUtc: new Date(m.s), endUtc: new Date(m.e) }));
}

/**
 * Pad every busy range by `bufferBefore` (before start) and `bufferAfter`
 * (after end), then re-merge. Padding bakes buffer requirements into the
 * busy mask so the slot iterator can do plain overlap checks.
 */
function enforceBuffers({ busyRanges = [], bufferBeforeMinutes = 0, bufferAfterMinutes = 0 } = {}) {
  if (!bufferBeforeMinutes && !bufferAfterMinutes) return normalizeBusyRanges(busyRanges);
  const padded = busyRanges.map((r) => ({
    startUtc: new Date(new Date(r.startUtc).getTime() - bufferBeforeMinutes * 60 * 1000),
    endUtc: new Date(new Date(r.endUtc).getTime() + bufferAfterMinutes * 60 * 1000),
  }));
  return normalizeBusyRanges(padded);
}

// ---------- Overlap check ----------

/**
 * Binary-search the sorted merged busy ranges for any overlap with
 * `[candidateStart, candidateEnd)`. Returns true on conflict.
 */
function overlapsBusy({ candidateStart, candidateEnd, mergedBusy }) {
  if (!mergedBusy.length) return false;
  const cs = candidateStart instanceof Date ? candidateStart.getTime() : candidateStart;
  const ce = candidateEnd instanceof Date ? candidateEnd.getTime() : candidateEnd;
  // Binary search for the first busy range with endUtc > candidateStart
  let lo = 0;
  let hi = mergedBusy.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (mergedBusy[mid].endUtc.getTime() <= cs) lo = mid + 1;
    else hi = mid;
  }
  const candidate = mergedBusy[lo];
  if (!candidate) return false;
  // Overlap iff candidate.startUtc < ce
  return candidate.startUtc.getTime() < ce && candidate.endUtc.getTime() > cs;
}

module.exports = {
  enforceMinNotice,
  enforceRollingWindow,
  bookingsPerDay,
  isUnderDailyCap,
  normalizeBusyRanges,
  enforceBuffers,
  overlapsBusy,
};
