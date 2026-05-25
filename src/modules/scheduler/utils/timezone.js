const { DateTime } = require('luxon');

// ===================================
// Timezone + UTC normalization layer (luxon-backed)
// ===================================
// Scheduler stores every Date as UTC in Mongo. Public surface accepts +
// returns ISO-8601 strings; internal computation uses luxon DateTime for
// DST-safe + half-hour-zone-safe arithmetic.
//
// SINGLE library choice: luxon. Do NOT mix with date-fns / dayjs / native
// Date math — different zone semantics break across the codebase.

function isValidIanaTimezone(tz) {
  if (typeof tz !== 'string' || !tz.length) return false;
  try {
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    return false;
  }
  // Luxon's `.isValid` also catches edge cases not flagged by Intl.
  const dt = DateTime.now().setZone(tz);
  return dt.isValid;
}

// Normalize Date | ISO string → UTC Date. Rejects garbage loudly.
function toUtcDate(input) {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) throw new Error('Invalid Date instance');
    return input;
  }
  if (typeof input === 'string') {
    const dt = DateTime.fromISO(input, { zone: 'utc' });
    if (!dt.isValid) throw new Error(`Unparseable date string: ${input}`);
    return dt.toJSDate();
  }
  throw new Error('toUtcDate requires Date or ISO string');
}

/**
 * Combine YYYY-MM-DD + HH:mm in an IANA zone → UTC Date.
 * DST-safe: luxon picks the correct offset for the wall-clock moment.
 */
function combineWallClockToUtc(dateStr, timeStr, ianaZone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error(`Invalid date: ${dateStr}`);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) throw new Error(`Invalid time: ${timeStr}`);
  if (!isValidIanaTimezone(ianaZone)) throw new Error(`Invalid IANA zone: ${ianaZone}`);
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  const dt = DateTime.fromObject({ year: y, month: mo, day: d, hour: h, minute: mi }, { zone: ianaZone });
  if (!dt.isValid) throw new Error(`Cannot combine ${dateStr}T${timeStr} in ${ianaZone}: ${dt.invalidReason}`);
  return dt.toUTC().toJSDate();
}

/**
 * Break a UTC Date into wall-clock components in a specific zone.
 * Returns ISO local string + breakdown — caller uses what they need.
 */
function utcToWallClock(utcDate, ianaZone) {
  if (!isValidIanaTimezone(ianaZone)) throw new Error(`Invalid IANA zone: ${ianaZone}`);
  const dt = DateTime.fromJSDate(new Date(utcDate)).setZone(ianaZone);
  return {
    iso: dt.toISO({ suppressMilliseconds: true }),
    dateStr: dt.toFormat('yyyy-LL-dd'),
    timeStr: dt.toFormat('HH:mm'),
    dayOfWeek: dt.weekday % 7, // luxon weekday: 1 (Mon) - 7 (Sun); convert to 0 (Sun) - 6 (Sat)
    year: dt.year,
    month: dt.month,
    day: dt.day,
    hour: dt.hour,
    minute: dt.minute,
    offsetMinutes: dt.offset,
  };
}

/**
 * Day-of-week (0–6, Sun=0) at a UTC moment in a given zone.
 */
function dayOfWeekInZone(utcDate, ianaZone) {
  return utcToWallClock(utcDate, ianaZone).dayOfWeek;
}

/**
 * Enumerate YYYY-MM-DD strings in `ianaZone` between two UTC dates (inclusive).
 */
function enumerateDatesInZone(rangeStartUtc, rangeEndUtc, ianaZone) {
  const start = DateTime.fromJSDate(new Date(rangeStartUtc)).setZone(ianaZone).startOf('day');
  const end = DateTime.fromJSDate(new Date(rangeEndUtc)).setZone(ianaZone).startOf('day');
  const dates = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor.toFormat('yyyy-LL-dd'));
    cursor = cursor.plus({ days: 1 });
  }
  return dates;
}

module.exports = {
  isValidIanaTimezone,
  toUtcDate,
  combineWallClockToUtc,
  utcToWallClock,
  dayOfWeekInZone,
  enumerateDatesInZone,
};
