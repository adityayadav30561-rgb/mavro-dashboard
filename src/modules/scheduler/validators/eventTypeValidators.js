const { isValidIanaTimezone } = require('../utils/timezone');

// ===================================
// EventType domain validators
// ===================================
// Pure functions called by the eventTypeController BEFORE persistence.
// Centralized here so the same checks fire on create, update, and duplicate.
// Each function returns either `null` (ok) or a string error message — the
// controller surfaces the first non-null result as a 422.

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return h * 60 + m;
}

function validateWindowsNoOverlap(windows = []) {
  if (!Array.isArray(windows)) return 'windows must be an array';
  // Validate shape first
  for (const w of windows) {
    if (!w || !HHMM.test(w.start) || !HHMM.test(w.end)) return 'window times must be HH:mm';
    const s = hhmmToMinutes(w.start);
    const e = hhmmToMinutes(w.end);
    if (e <= s) return `window end ${w.end} must be after start ${w.start}`;
  }
  // Sort by start, then check adjacency
  const sorted = [...windows].sort((a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start));
  for (let i = 1; i < sorted.length; i++) {
    if (hhmmToMinutes(sorted[i].start) < hhmmToMinutes(sorted[i - 1].end)) {
      return `availability windows overlap (${sorted[i - 1].start}-${sorted[i - 1].end} and ${sorted[i].start}-${sorted[i].end})`;
    }
  }
  return null;
}

function validateAvailability(availability = []) {
  if (!Array.isArray(availability)) return 'availability must be an array';
  const seenDays = new Set();
  for (const day of availability) {
    if (typeof day.dayOfWeek !== 'number' || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
      return 'dayOfWeek must be 0-6';
    }
    if (seenDays.has(day.dayOfWeek)) {
      return `duplicate availability entry for dayOfWeek ${day.dayOfWeek}`;
    }
    seenDays.add(day.dayOfWeek);
    const overlapErr = validateWindowsNoOverlap(day.windows);
    if (overlapErr) return `Day ${day.dayOfWeek}: ${overlapErr}`;
  }
  return null;
}

function validateOverrideDates(overrideDates = []) {
  if (!Array.isArray(overrideDates)) return 'overrideDates must be an array';
  const seen = new Set();
  for (const o of overrideDates) {
    if (!YMD.test(o.date)) return `invalid override date: ${o.date}`;
    if (seen.has(o.date)) return `duplicate override entry for ${o.date}`;
    seen.add(o.date);
    if (o.windows && o.windows.length) {
      const err = validateWindowsNoOverlap(o.windows);
      if (err) return `Override ${o.date}: ${err}`;
    }
  }
  return null;
}

function validateBlackoutDates(blackoutDates = []) {
  if (!Array.isArray(blackoutDates)) return 'blackoutDates must be an array';
  for (const d of blackoutDates) {
    if (!YMD.test(d)) return `invalid blackout date: ${d}`;
  }
  return null;
}

function validateTimezone(tz) {
  if (!tz) return null; // optional → model default kicks in
  if (!isValidIanaTimezone(tz)) return `invalid IANA timezone: ${tz}`;
  return null;
}

function validateLocation({ locationType, locationValue }) {
  if (!locationType) return null;
  if (!['google_meet', 'phone', 'in_person', 'custom'].includes(locationType)) {
    return `invalid locationType: ${locationType}`;
  }
  if (locationType === 'phone' && locationValue && locationValue.length > 60) {
    return 'phone locationValue must be ≤ 60 chars';
  }
  if (locationType === 'custom' && (!locationValue || !locationValue.length)) {
    return 'custom location requires locationValue';
  }
  return null;
}

function validateScheduleConsistency({ durationMinutes, slotIncrementMinutes }) {
  if (durationMinutes != null && slotIncrementMinutes != null) {
    if (durationMinutes < slotIncrementMinutes) {
      return 'durationMinutes must be ≥ slotIncrementMinutes';
    }
  }
  return null;
}

// Aggregator — returns the first failure or null.
function validateEventType(payload) {
  return (
    validateTimezone(payload.timezone) ||
    validateAvailability(payload.availability) ||
    validateOverrideDates(payload.overrideDates) ||
    validateBlackoutDates(payload.blackoutDates) ||
    validateLocation(payload) ||
    validateScheduleConsistency(payload)
  );
}

module.exports = {
  validateEventType,
  validateAvailability,
  validateOverrideDates,
  validateBlackoutDates,
  validateTimezone,
  validateLocation,
  validateScheduleConsistency,
  validateWindowsNoOverlap,
};
