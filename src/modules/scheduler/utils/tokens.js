const crypto = require('crypto');

// ===================================
// Booking token helpers
// ===================================
// Cancel + reschedule tokens are 32 random bytes encoded as base64url. That's
// 256 bits of entropy → 2^256 search space → unguessable.
//
// We use base64url (RFC 4648 §5) instead of hex so the URL stays short
// (43 chars vs 64) and is safe to embed in route params + email links without
// percent-encoding.
//
// Node 16+ exposes `base64url` directly on Buffer.toString — replace the
// manual transform if/when the runtime minimum bumps.

const TOKEN_BYTES = 32;

function generateBookingToken() {
  const buf = crypto.randomBytes(TOKEN_BYTES);
  // base64url manually — replace +/= with -_ and strip padding
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateBookingTokenPair() {
  return {
    cancelToken: generateBookingToken(),
    rescheduleToken: generateBookingToken(),
  };
}

// Constant-time comparison helper — for any future token comparison
// path that doesn't rely on a Mongo unique-index lookup.
function safeTokenEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  generateBookingToken,
  generateBookingTokenPair,
  safeTokenEquals,
};
