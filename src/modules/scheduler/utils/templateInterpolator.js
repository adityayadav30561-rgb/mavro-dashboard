const { DateTime } = require('luxon');

// ===================================
// Template interpolator — safe `{{path.to.value}}` substitution
// ===================================
// Used by custom email + SMS + Slack templates. ALWAYS HTML-escapes string
// values to prevent injection from invitee-controlled fields (e.g. name).
// Numbers and booleans pass through unescaped.
//
// Variable namespace:
//   {{invitee.name}}       — booking.inviteeName
//   {{invitee.email}}      — booking.inviteeEmail
//   {{invitee.phone}}      — booking.inviteePhone (Phase 7+)
//   {{invitee.timezone}}   — booking.inviteeTimezone
//   {{event.name}}         — eventType.name
//   {{event.slug}}         — eventType.slug
//   {{event.duration}}     — eventType.durationMinutes
//   {{event.location}}     — eventType.locationType
//   {{meeting.link}}       — booking.meetingLink
//   {{start.utc}}          — booking.startTimeUtc ISO
//   {{start.local}}        — invitee-zone formatted ("Mon, Jun 15 · 2:30 PM")
//   {{end.local}}          — invitee-zone formatted
//   {{host.name}}          — host.name
//   {{host.email}}         — host.email
//   {{tenant.name}}        — tenant.name
//
// Missing variables render as empty string (never the literal `undefined`).

const VAR_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9._-]*)\s*\}\}/g;

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildContext({ booking, eventType, host, tenant }) {
  const tz = booking?.inviteeTimezone || 'UTC';
  const start = booking?.startTimeUtc ? DateTime.fromJSDate(new Date(booking.startTimeUtc)).setZone(tz) : null;
  const end = booking?.endTimeUtc ? DateTime.fromJSDate(new Date(booking.endTimeUtc)).setZone(tz) : null;
  return {
    invitee: {
      name: booking?.inviteeName || '',
      email: booking?.inviteeEmail || '',
      phone: booking?.inviteePhone || '',
      timezone: tz,
    },
    event: {
      name: eventType?.name || '',
      slug: eventType?.slug || '',
      duration: eventType?.durationMinutes ?? '',
      location: eventType?.locationType || '',
    },
    meeting: {
      link: booking?.meetingLink || '',
    },
    start: {
      utc: booking?.startTimeUtc ? new Date(booking.startTimeUtc).toISOString() : '',
      local: start ? start.toFormat('ccc, LLL d · h:mm a') : '',
    },
    end: {
      utc: booking?.endTimeUtc ? new Date(booking.endTimeUtc).toISOString() : '',
      local: end ? end.toFormat('h:mm a') : '',
    },
    host: {
      name: host?.name || '',
      email: host?.email || '',
    },
    tenant: {
      name: tenant?.name || '',
    },
  };
}

function getPath(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return null;
    cur = cur[p];
  }
  return cur;
}

function render(template, ctx, { escape = true } = {}) {
  if (typeof template !== 'string') return '';
  return template.replace(VAR_RE, (_, path) => {
    const value = getPath(ctx, path);
    if (value == null) return '';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return escape ? escapeHtml(value) : String(value);
  });
}

function renderTemplate({ subject, html, text }, context) {
  return {
    subject: render(subject, context, { escape: false }), // subject is plain text
    html: render(html, context, { escape: true }),
    text: render(text, context, { escape: false }),
  };
}

module.exports = {
  buildContext,
  render,
  renderTemplate,
  escapeHtml,
};
