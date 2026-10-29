/**
 * Known first-party tracking outages — days the Mavro tracker could not
 * record because the backend was down (inclusive, UTC dates).
 *
 * The MBR overlay treats these days exactly like the pre-install days: GA4's
 * daily rows fill them, the window is labelled 'blend', and our own events
 * on these days are ignored (partial days would otherwise undercount).
 * Shared by every tenant because every tracker posts to the same backend.
 *
 * Add an entry only for a verified outage — this is the one place the report
 * swaps methodology for a date range.
 */
const TRACKING_OUTAGES = [
  {
    from: '2026-10-17',
    to: '2026-10-29',
    reason: 'Render free-tier suspension: the API returned 503 until it moved to mavro-api.onrender.com',
  },
];

module.exports = { TRACKING_OUTAGES };
