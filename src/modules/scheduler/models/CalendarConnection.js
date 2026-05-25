const mongoose = require('mongoose');

// ===================================
// CalendarConnection — external calendar OAuth integration
// ===================================
// One row = one OAuth grant for one external calendar account (e.g. one
// Google account) on behalf of one Mavro user inside one tenant.
//
// SECURITY:
//   - accessToken + refreshToken are stored encrypted at rest via the
//     scheduler's AES-256-GCM helper (utils/encryption.js). The ciphertext
//     envelope is `v1:<iv>:<tag>:<ciphertext>`. Encryption + decryption is
//     performed at the service layer (calendarProviderService) — the schema
//     stores raw ciphertext strings and treats them as opaque.
//   - Both token paths are `select: false`. Default queries never return
//     them. Even authenticated admin queries (lean + non-lean) strip them
//     via the toJSON / toObject transforms below.
//   - `lastError` is also stripped from JSON because it can contain provider
//     diagnostics that aren't useful to clients.
//
// MULTI-CALENDAR SUPPORT:
//   A single connection represents one OAuth account. The user can hold
//   multiple accounts (e.g. personal + work Google). For each connection
//   we additionally track per-calendar selection on `selectedCalendars`:
//
//     selectedCalendars: [{
//       calendarId,
//       name,
//       timezone,
//       checkConflicts, // include in availability busy-merge
//       writeEvents,    // create bookings on this calendar
//       isPrimary,      // primary write-back target for this connection
//     }]
//
//   Exactly one of the user's connections holds the global `isPrimary: true`
//   flag (enforced via partial unique index) — that connection's primary
//   selectedCalendar receives write-back for confirmed bookings.

const selectedCalendarSchema = new mongoose.Schema(
  {
    calendarId: { type: String, required: true },
    name: { type: String, default: '' },
    timezone: { type: String, default: null },
    checkConflicts: { type: Boolean, default: true },
    writeEvents: { type: Boolean, default: false },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const calendarConnectionSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'tenant is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: [true, 'user is required'],
      index: true,
    },
    provider: {
      type: String,
      enum: ['google', 'outlook'],
      required: true,
    },
    // Encrypted at rest. Format: v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
    accessToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    tokenExpiry: { type: Date, select: false },
    scopesGranted: { type: [String], default: [], select: false },
    // Provider-side identity for this OAuth grant — used to dedupe reconnects
    // of the same account and to label the connection in the dashboard.
    providerAccountId: { type: String, default: null, index: true },
    providerAccountEmail: { type: String, default: null },
    // Primary calendar metadata captured during the OAuth handshake — handy
    // for showing "Connected: Google Calendar — alice@gmail.com (UTC)" without
    // a follow-up API call.
    calendarId: { type: String, default: '' },
    calendarName: { type: String, default: '' },
    // Per-calendar selection (see schema docs above)
    selectedCalendars: { type: [selectedCalendarSchema], default: [] },
    // Backward-compatible flags from Phase 1 — still used by availability engine.
    checkConflicts: { type: Boolean, default: true },
    writeEvents: { type: Boolean, default: true },
    isPrimary: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'reauth_required', 'revoked', 'error', 'expired'],
      default: 'active',
      index: true,
    },
    lastSyncedAt: { type: Date, default: null },
    lastError: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

// Lookup index — find all connections for (tenant, user, provider)
calendarConnectionSchema.index({ tenant: 1, user: 1, provider: 1 });

// Dedup: same Google account can't be connected twice per (tenant, user).
// Partial — only enforced when providerAccountId is non-null.
calendarConnectionSchema.index(
  { tenant: 1, user: 1, provider: 1, providerAccountId: 1 },
  { unique: true, partialFilterExpression: { providerAccountId: { $type: 'string' } } }
);

// Exactly one primary per (tenant, user, provider).
calendarConnectionSchema.index(
  { tenant: 1, user: 1, provider: 1, isPrimary: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } }
);

function stripSecrets(doc, ret) {
  delete ret.accessToken;
  delete ret.refreshToken;
  delete ret.tokenExpiry;
  delete ret.scopesGranted;
  delete ret.lastError;
  return ret;
}
calendarConnectionSchema.set('toJSON', { transform: stripSecrets });
calendarConnectionSchema.set('toObject', { transform: stripSecrets });

module.exports = mongoose.model('CalendarConnection', calendarConnectionSchema);
