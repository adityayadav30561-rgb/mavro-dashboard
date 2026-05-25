const crypto = require('crypto');

// ===================================
// Slot fingerprint — race-safe handoff between availability + booking
// ===================================
// Each computed slot carries a deterministic hash derived from
// (eventTypeId, hostUserId, startUtcEpoch, endUtcEpoch). When Phase 5 wires
// booking creation, the client returns the hash alongside the booking payload
// and the booking service:
//   1. Recomputes the hash from the requested time range.
//   2. Verifies it matches what was rendered.
//   3. Re-runs availability check at write time.
// Defeats two race classes:
//   - Client posts stale slot after the grid was refreshed.
//   - Two clients race-book the same slot — second hits a unique index on
//     (hostUser, startUtcEpoch) once Phase 5 adds the partial unique index
//     on Booking.

const SLOT_HASH_SECRET_BUFFER = Buffer.from('mavro-scheduler-slot-v1');

function slotHash({ eventTypeId, hostUserId, startUtc, endUtc }) {
  const parts = [
    String(eventTypeId || ''),
    String(hostUserId || ''),
    new Date(startUtc).getTime(),
    new Date(endUtc).getTime(),
  ];
  const h = crypto.createHmac('sha256', SLOT_HASH_SECRET_BUFFER);
  h.update(parts.join('|'));
  return h.digest('base64url').slice(0, 22); // ~128 bits, URL-safe
}

function verifySlotHash(expectedHash, payload) {
  const actual = slotHash(payload);
  if (typeof expectedHash !== 'string' || actual.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expectedHash));
}

module.exports = { slotHash, verifySlotHash };
