const crypto = require('crypto');

// ===================================
// iCalendar (.ics) generator — RFC 5545 minimal
// ===================================
// Tiny self-contained generator. No deps. Produces a single VEVENT inside
// a VCALENDAR envelope. UTC-only times — clients render in invitee's local
// zone. ORGANIZER + ATTENDEE included so calendar clients show the host +
// invitee on the event card.

const VERSION = '2.0';
const PRODID = '-//Mavro//Scheduler//EN';

function utcStamp(d) {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcsText(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldLine(line) {
  // Per RFC 5545, lines longer than 75 octets must be folded.
  if (line.length <= 75) return line;
  const chunks = [];
  for (let i = 0; i < line.length; i += 74) {
    chunks.push((i === 0 ? '' : ' ') + line.slice(i, i + 74));
  }
  return chunks.join('\r\n');
}

function generateIcs({
  uid,
  startUtc,
  endUtc,
  summary,
  description = '',
  location = '',
  meetingLink = '',
  organizerEmail,
  organizerName,
  attendeeEmail,
  attendeeName,
  sequence = 0,
  status = 'CONFIRMED',
}) {
  const finalUid = uid || `${crypto.randomBytes(8).toString('hex')}@mavro.scheduler`;
  const now = utcStamp(new Date());

  const descParts = [];
  if (description) descParts.push(description);
  if (meetingLink) descParts.push(`Join meeting: ${meetingLink}`);

  const fields = [
    'BEGIN:VCALENDAR',
    `PRODID:${PRODID}`,
    `VERSION:${VERSION}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(finalUid)}`,
    `DTSTAMP:${now}`,
    `DTSTART:${utcStamp(startUtc)}`,
    `DTEND:${utcStamp(endUtc)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    meetingLink ? `URL:${escapeIcsText(meetingLink)}` : null,
    organizerEmail
      ? `ORGANIZER;CN=${escapeIcsText(organizerName || organizerEmail)}:mailto:${organizerEmail}`
      : null,
    attendeeEmail
      ? `ATTENDEE;CN=${escapeIcsText(attendeeName || attendeeEmail)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${attendeeEmail}`
      : null,
    `STATUS:${status}`,
    `SEQUENCE:${sequence}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .map(foldLine);

  return fields.join('\r\n');
}

module.exports = { generateIcs };
