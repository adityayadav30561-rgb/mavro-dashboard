const { DateTime } = require('luxon');
const { EventType, Booking, CalendarConnection } = require('../models');
const {
  combineWallClockToUtc,
  utcToWallClock,
  enumerateDatesInZone,
  isValidIanaTimezone,
} = require('../utils/timezone');
const { slotHash } = require('../utils/slotHash');
const rules = require('./schedulingRulesService');
const calendarProviderService = require('./calendarProviderService');
const hostSelection = require('./hostSelectionService');

// ===================================
// availabilityEngineService — slot grid computation
// ===================================
// Pipeline:
//   1. Load EventType (active, not deleted)
//   2. Clip range: max(rangeStart, now+minNotice) → min(rangeEnd, now+rollingWindow)
//   3. Enumerate UTC calendar dates in host timezone
//   4. For each date, pick effective windows = overrideDate ?? weekly[dayOfWeek]
//      Skip if date is in blackoutDates
//   5. Convert each (date, window) pair to a [startUtc, endUtc) span via luxon
//   6. Pull busy ranges:
//        - Confirmed Bookings for hostUser inside range
//        - getBusyRanges() for every active CalendarConnection with checkConflicts
//   7. Normalize + merge busy ranges, pad with buffers
//   8. Inside each availability span, walk by slotIncrementMinutes:
//        candidate = [t, t + durationMinutes)
//        skip if candidate extends past span end
//        skip if candidate overlaps mergedBusy (binary search)
//        skip if dailyCap reached for that date in inviteeTimezone
//   9. Return [{ startUtc, endUtc, inviteeLocalStart, inviteeLocalEnd,
//                hostLocalStart, hostLocalEnd, hash, timezone }]
//
// Provider-agnostic — all knowledge of Google/Outlook stays inside
// calendarProviderService.

const MAX_RANGE_DAYS = 62; // hard cap to prevent abuse / runaway scans
const MIN_RANGE_MINUTES = 5;

class AvailabilityRangeError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 422;
    this.name = 'AvailabilityRangeError';
  }
}

function clampRange({ rangeStartUtc, rangeEndUtc, minNoticeHours, rollingWindowDays, nowUtc }) {
  const minStart = rules.enforceMinNotice({ minNoticeHours, nowUtc });
  const maxEnd = rules.enforceRollingWindow({ rollingWindowDays, nowUtc });
  let start = new Date(Math.max(new Date(rangeStartUtc).getTime(), minStart.getTime()));
  let end = new Date(Math.min(new Date(rangeEndUtc).getTime(), maxEnd.getTime()));
  if (end <= start) return null;
  const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
  if (days > MAX_RANGE_DAYS) {
    throw new AvailabilityRangeError(`range too large (${Math.ceil(days)} days, max ${MAX_RANGE_DAYS})`);
  }
  if (end.getTime() - start.getTime() < MIN_RANGE_MINUTES * 60 * 1000) return null;
  return { start, end };
}

function effectiveWindowsForDate({ dateStr, ianaZone, eventType }) {
  // Override wins. Empty override = full-day unavailable.
  const override = (eventType.overrideDates || []).find((o) => o.date === dateStr);
  if (override) return override.windows || [];
  if ((eventType.blackoutDates || []).includes(dateStr)) return [];
  // Compute weekday-in-zone from a noon-of-day moment (avoids midnight DST edges).
  const dow = DateTime.fromFormat(`${dateStr} 12:00`, 'yyyy-LL-dd HH:mm', { zone: ianaZone }).weekday % 7;
  const day = (eventType.availability || []).find((d) => d.dayOfWeek === dow);
  return day ? day.windows || [] : [];
}

async function loadEventTypeOrThrow(eventTypeId) {
  const eventType = await EventType.findOne({ _id: eventTypeId, deletedAt: null }).lean();
  if (!eventType) {
    const err = new Error('EventType not found');
    err.statusCode = 404;
    throw err;
  }
  if (!eventType.isActive) {
    const err = new Error('EventType is not active');
    err.statusCode = 410;
    throw err;
  }
  return eventType;
}

async function loadBusyForHost({ hostUserId, tenantId, start, end }) {
  // Wrapper kept for backwards compat — single-host load.
  return loadHostBusyRanges({ hostUserId, tenantId, start, end });
}

async function loadMultiHostBusyRanges({ hostUserIds, tenantId, start, end }) {
  // Per-host arrays, parallel. Caller decides how to combine (union for
  // collective; subtract-each for round-robin candidates).
  const results = await Promise.all(
    hostUserIds.map((id) => loadHostBusyRanges({ hostUserId: id, tenantId, start, end }))
  );
  const map = new Map();
  hostUserIds.forEach((id, idx) => map.set(String(id), results[idx]));
  return map;
}

async function loadHostBusyRanges({ hostUserId, tenantId, start, end }) {
  // 1. Confirmed booking conflicts
  const bookingRows = await Booking.find({
    tenant: tenantId,
    hostUser: hostUserId,
    status: 'confirmed',
    startTimeUtc: { $lt: end },
    endTimeUtc: { $gt: start },
  })
    .select('startTimeUtc endTimeUtc')
    .lean();
  const bookingRanges = bookingRows.map((b) => ({ startUtc: b.startTimeUtc, endUtc: b.endTimeUtc }));

  // 2. Per-active-connection provider busy
  const connections = await CalendarConnection.find({
    tenant: tenantId,
    user: hostUserId,
    status: 'active',
    checkConflicts: true,
  }).select('_id selectedCalendars calendarId').lean();

  const providerBuckets = await Promise.allSettled(
    connections.map(async (c) => {
      // Pick calendars opted-in for conflict scan, fall back to the connection's primary calendarId.
      let calIds = (c.selectedCalendars || [])
        .filter((s) => s.checkConflicts)
        .map((s) => s.calendarId);
      if (!calIds.length && c.calendarId) calIds = [c.calendarId];
      if (!calIds.length) return [];
      return calendarProviderService.getBusyRanges({
        connectionId: c._id,
        calendarIds: calIds,
        startUtc: start,
        endUtc: end,
      });
    })
  );
  const providerRanges = [];
  for (const r of providerBuckets) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) providerRanges.push(...r.value);
    // Provider failure on one connection = degrade gracefully; others still contribute.
  }
  return [...bookingRanges, ...providerRanges];
}

async function computeAvailableSlots({
  eventTypeId,
  rangeStartUtc,
  rangeEndUtc,
  inviteeTimezone,
  nowUtc = new Date(),
}) {
  if (!eventTypeId) throw new AvailabilityRangeError('eventTypeId is required');
  if (!rangeStartUtc || !rangeEndUtc) throw new AvailabilityRangeError('rangeStartUtc + rangeEndUtc required');
  if (inviteeTimezone && !isValidIanaTimezone(inviteeTimezone)) {
    throw new AvailabilityRangeError(`Invalid invitee timezone: ${inviteeTimezone}`);
  }

  const eventType = await loadEventTypeOrThrow(eventTypeId);
  if (!isValidIanaTimezone(eventType.timezone)) {
    throw new AvailabilityRangeError(`EventType has invalid timezone: ${eventType.timezone}`);
  }
  const hostZone = eventType.timezone;
  const guestZone = inviteeTimezone || hostZone;

  const clamped = clampRange({
    rangeStartUtc,
    rangeEndUtc,
    minNoticeHours: eventType.minNoticeHours || 0,
    rollingWindowDays: eventType.rollingWindowDays || 60,
    nowUtc,
  });
  if (!clamped) return { slots: [], eventType: publicEventTypeShape(eventType), hostZone, guestZone };

  const { start, end } = clamped;

  // 1. Busy ranges — dispatched by hostSelectionStrategy
  const strategy = eventType.hostSelectionStrategy || 'single_host';
  const isTeam = strategy === 'round_robin' || strategy === 'collective';
  let perHostBusy = null;       // Map<hostId, mergedBusy[]> when team
  let mergedBusy = null;        // single mask when single-host
  let teamHostIds = [];
  let roundRobinLoad = null;

  if (isTeam) {
    teamHostIds = hostSelection.hostsForEventType(eventType);
    if (!teamHostIds.length) teamHostIds = [String(eventType.owner)];
    const busyMap = await loadMultiHostBusyRanges({
      hostUserIds: teamHostIds,
      tenantId: eventType.tenant,
      start,
      end,
    });
    perHostBusy = new Map();
    for (const [id, ranges] of busyMap.entries()) {
      perHostBusy.set(id, rules.enforceBuffers({
        busyRanges: ranges,
        bufferBeforeMinutes: eventType.bufferBeforeMinutes || 0,
        bufferAfterMinutes: eventType.bufferAfterMinutes || 0,
      }));
    }
    if (strategy === 'round_robin') {
      roundRobinLoad = await hostSelection.bookingLoadByHost({
        tenantId: eventType.tenant,
        hostIds: teamHostIds,
      });
    }
  } else {
    const rawBusy = await loadHostBusyRanges({
      hostUserId: eventType.owner,
      tenantId: eventType.tenant,
      start,
      end,
    });
    mergedBusy = rules.enforceBuffers({
      busyRanges: rawBusy,
      bufferBeforeMinutes: eventType.bufferBeforeMinutes || 0,
      bufferAfterMinutes: eventType.bufferAfterMinutes || 0,
    });
  }

  // 2. Daily-cap counts (in invitee timezone for "per visible day")
  const sameDayBookings = await Booking.find({
    tenant: eventType.tenant,
    eventType: eventType._id,
    status: 'confirmed',
    startTimeUtc: { $lt: end, $gte: start },
  }).select('startTimeUtc').lean();
  const perDayCounts = rules.bookingsPerDay({
    bookings: sameDayBookings,
    ianaZone: guestZone,
  });

  // 3. Enumerate dates in HOST zone (windows are wall-clock in host zone).
  const dates = enumerateDatesInZone(start, end, hostZone);
  const duration = eventType.durationMinutes;
  const step = eventType.slotIncrementMinutes || 30;

  const slots = [];
  for (const dateStr of dates) {
    const windows = effectiveWindowsForDate({ dateStr, ianaZone: hostZone, eventType });
    if (!windows.length) continue;

    // Per-window slot iteration
    for (const w of windows) {
      // Window start/end as UTC moments
      const winStartUtc = combineWallClockToUtc(dateStr, w.start, hostZone);
      const winEndUtc = combineWallClockToUtc(dateStr, w.end, hostZone);
      if (winEndUtc <= winStartUtc) continue;

      // Walk the window in `step` minutes; each candidate is duration long.
      const stepMs = step * 60 * 1000;
      const durationMs = duration * 60 * 1000;
      let cursor = winStartUtc.getTime();
      while (cursor + durationMs <= winEndUtc.getTime()) {
        const candidateStart = new Date(cursor);
        const candidateEnd = new Date(cursor + durationMs);
        // Filter — pre-range
        if (candidateStart.getTime() < start.getTime()) {
          cursor += stepMs;
          continue;
        }
        if (candidateEnd.getTime() > end.getTime()) break;

        // Daily-cap check (in invitee timezone)
        const guestDate = utcToWallClock(candidateStart, guestZone).dateStr;
        if (!rules.isUnderDailyCap({
          dateStr: guestDate,
          dailyCap: eventType.dailyCap,
          perDayCounts,
        })) {
          cursor += stepMs;
          continue;
        }

        // Busy overlap check — dispatched by strategy
        let assignedHostId = null;
        let assignedHostIds = null;
        if (isTeam && strategy === 'collective') {
          // All hosts must be free
          let allFree = true;
          for (const id of teamHostIds) {
            const busy = perHostBusy.get(String(id)) || [];
            if (rules.overlapsBusy({ candidateStart, candidateEnd, mergedBusy: busy })) {
              allFree = false;
              break;
            }
          }
          if (!allFree) { cursor += stepMs; continue; }
          assignedHostIds = teamHostIds;
        } else if (isTeam && strategy === 'round_robin') {
          // Pick least-loaded host who is free for this candidate
          const freeHosts = teamHostIds.filter((id) => !rules.overlapsBusy({
            candidateStart,
            candidateEnd,
            mergedBusy: perHostBusy.get(String(id)) || [],
          }));
          if (!freeHosts.length) { cursor += stepMs; continue; }
          assignedHostId = hostSelection.pickRoundRobinHost({
            hostIds: freeHosts,
            loadMap: roundRobinLoad,
          });
        } else {
          if (rules.overlapsBusy({ candidateStart, candidateEnd, mergedBusy })) {
            cursor += stepMs;
            continue;
          }
          assignedHostId = String(eventType.owner);
        }

        const hostLocal = utcToWallClock(candidateStart, hostZone);
        const guestLocal = utcToWallClock(candidateStart, guestZone);
        const hostLocalEnd = utcToWallClock(candidateEnd, hostZone);
        const guestLocalEnd = utcToWallClock(candidateEnd, guestZone);

        const hashHostId = assignedHostId
          || (assignedHostIds ? assignedHostIds.join(',') : String(eventType.owner));
        slots.push({
          startUtc: candidateStart.toISOString(),
          endUtc: candidateEnd.toISOString(),
          hostLocalStart: hostLocal.iso,
          hostLocalEnd: hostLocalEnd.iso,
          inviteeLocalStart: guestLocal.iso,
          inviteeLocalEnd: guestLocalEnd.iso,
          hostTimezone: hostZone,
          inviteeTimezone: guestZone,
          assignedHostId,
          assignedHostIds,
          strategy,
          hash: slotHash({
            eventTypeId: String(eventType._id),
            hostUserId: hashHostId,
            startUtc: candidateStart,
            endUtc: candidateEnd,
          }),
        });
        cursor += stepMs;
      }
    }
  }

  return {
    slots,
    eventType: publicEventTypeShape(eventType),
    hostZone,
    guestZone,
  };
}

/**
 * Re-runs the engine for a SINGLE candidate time. Used by Phase 5 booking
 * service to close the race between slot grid render + POST. Returns true if
 * the slot is still bookable. Implementation is a thin wrapper that computes
 * a tiny range around the requested slot and looks for a hash match.
 */
async function isSlotStillBookable({ eventTypeId, startUtc, endUtc, inviteeTimezone, nowUtc = new Date() }) {
  // Compute a 30-minute pad around the candidate so the slot iterator picks
  // it up even with weird DST / step boundary timing.
  const padMs = 30 * 60 * 1000;
  const rangeStart = new Date(new Date(startUtc).getTime() - padMs);
  const rangeEnd = new Date(new Date(endUtc).getTime() + padMs);
  const { slots } = await computeAvailableSlots({
    eventTypeId,
    rangeStartUtc: rangeStart,
    rangeEndUtc: rangeEnd,
    inviteeTimezone,
    nowUtc,
  });
  const startIso = new Date(startUtc).toISOString();
  return slots.some((s) => s.startUtc === startIso);
}

function publicEventTypeShape(ev) {
  return {
    _id: ev._id,
    name: ev.name,
    slug: ev.slug,
    description: ev.description,
    color: ev.color,
    durationMinutes: ev.durationMinutes,
    locationType: ev.locationType,
    timezone: ev.timezone,
    minNoticeHours: ev.minNoticeHours,
    rollingWindowDays: ev.rollingWindowDays,
    slotIncrementMinutes: ev.slotIncrementMinutes,
    requireConfirmation: ev.requireConfirmation,
    allowReschedule: ev.allowReschedule,
    allowCancellation: ev.allowCancellation,
    cancellationWindowHours: ev.cancellationWindowHours,
  };
}

module.exports = {
  computeAvailableSlots,
  isSlotStillBookable,
  AvailabilityRangeError,
  // Exported for tests
  _internals: { clampRange, effectiveWindowsForDate },
};
