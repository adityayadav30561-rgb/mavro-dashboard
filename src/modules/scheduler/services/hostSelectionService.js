const { Booking } = require('../models');

// ===================================
// hostSelectionService — round-robin + collective picker
// ===================================
// Pure host-selection logic. Slot computation calls into here per slot
// candidate during multi-host availability passes.
//
// ROUND ROBIN STRATEGY:
//   Deterministic, stateless. For each candidate host pool, count confirmed
//   bookings in the last 14 days. Pick the host with the lowest count; tie
//   break on host ObjectId (ascending) so concurrent picks at the same
//   millisecond converge on the same answer. Defeats starvation because the
//   least-loaded host always wins next round.
//
// COLLECTIVE STRATEGY:
//   Returns the full host pool. Caller intersects each host's free windows.
//   Selection is "all hosts agree" — there is no rotation; every host is
//   recorded on the resulting Booking via `coHosts[]`.

const ROUND_ROBIN_WINDOW_DAYS = 14;

function hostsForEventType(eventType) {
  const pool = (eventType.teamMembers || []).map((h) => (h._id ? String(h._id) : String(h)));
  if (eventType.owner && !pool.includes(String(eventType.owner))) {
    pool.push(String(eventType.owner));
  }
  return Array.from(new Set(pool));
}

async function bookingLoadByHost({ tenantId, hostIds, windowDays = ROUND_ROBIN_WINDOW_DAYS }) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const rows = await Booking.aggregate([
    {
      $match: {
        tenant: typeof tenantId === 'string' || tenantId instanceof String
          ? tenantId
          : tenantId,
        status: 'confirmed',
        startTimeUtc: { $gte: since },
      },
    },
    { $group: { _id: '$hostUser', n: { $sum: 1 } } },
  ]);
  const load = new Map();
  for (const id of hostIds) load.set(String(id), 0);
  for (const r of rows) {
    if (load.has(String(r._id))) load.set(String(r._id), r.n);
  }
  return load;
}

/**
 * Deterministic next-host pick by lowest load with stable tiebreak.
 */
function pickRoundRobinHost({ hostIds, loadMap }) {
  if (!hostIds.length) return null;
  const sorted = [...hostIds].sort((a, b) => {
    const la = loadMap.get(String(a)) || 0;
    const lb = loadMap.get(String(b)) || 0;
    if (la !== lb) return la - lb;
    return String(a) < String(b) ? -1 : 1;
  });
  return sorted[0];
}

/**
 * Intersect two arrays of UTC ranges → free intersection (UNION of busy
 * subtracted from each side already by upstream). For collective scheduling
 * we ALREADY have the per-host busy mask — collective free time is the
 * intersection of each host's free time.
 *
 * Input: array of arrays of busy ranges (already merged + buffer-padded).
 * Output: a single merged busy mask covering ANY host being busy.
 * (Subtracting that from candidate windows gives the collective free time.)
 */
function unionBusyAcrossHosts(busyArrays) {
  const flat = [];
  for (const arr of busyArrays) {
    for (const r of arr) flat.push({ startUtc: r.startUtc, endUtc: r.endUtc });
  }
  return flat;
}

module.exports = {
  hostsForEventType,
  bookingLoadByHost,
  pickRoundRobinHost,
  unionBusyAcrossHosts,
  ROUND_ROBIN_WINDOW_DAYS,
};
