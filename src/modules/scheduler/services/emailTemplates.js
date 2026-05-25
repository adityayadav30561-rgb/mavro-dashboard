const { DateTime } = require('luxon');

// ===================================
// Email templates — pure functions, no I/O
// ===================================
// Returns { subject, html, text } for each transactional kind. Tenant-aware
// branding flows through `brand` (color + name); template never imports
// tenant data directly.

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRange({ startUtc, endUtc, timezone }) {
  const tz = timezone || 'UTC';
  const s = DateTime.fromJSDate(new Date(startUtc)).setZone(tz);
  const e = DateTime.fromJSDate(new Date(endUtc)).setZone(tz);
  return `${s.toFormat('cccc, LLL d')} · ${s.toFormat('h:mm a')} – ${e.toFormat('h:mm a')} (${tz})`;
}

function shell({ brand, title, bodyHtml, ctaText, ctaUrl, footerHtml }) {
  const color = brand?.color || '#2764e4';
  const name = escapeHtml(brand?.name || 'Mavro Scheduler');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:14px;border:1px solid #e6ebf2;overflow:hidden;">
    <div style="padding:18px 24px;border-bottom:1px solid #eef2f7;font-weight:600;color:${color};font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">${name}</div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:600;line-height:1.3;">${escapeHtml(title)}</h1>
      <div style="font-size:14.5px;line-height:1.55;color:#1f2937;">${bodyHtml}</div>
      ${ctaUrl ? `<div style="margin-top:24px;"><a href="${ctaUrl}" style="display:inline-block;background:${color};color:#ffffff;padding:11px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">${escapeHtml(ctaText)}</a></div>` : ''}
    </div>
    ${footerHtml ? `<div style="padding:16px 24px;border-top:1px solid #eef2f7;font-size:12px;color:#64748b;">${footerHtml}</div>` : ''}
  </div>
</body></html>`;
}

function plain({ title, lines }) {
  return [title, '', ...lines].join('\n');
}

function bookingConfirmation({ booking, eventType, tenant, manageUrl }) {
  const when = formatRange({
    startUtc: booking.startTimeUtc,
    endUtc: booking.endTimeUtc,
    timezone: booking.inviteeTimezone,
  });
  const join = booking.meetingLink ? `<p><strong>Join:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : '';
  const location = booking.locationType === 'phone' || booking.locationType === 'in_person'
    ? `<p><strong>Location:</strong> ${escapeHtml(booking.locationValue || '')}</p>`
    : '';
  return {
    subject: `Booked: ${eventType.name} — ${when.split('(')[0].trim()}`,
    html: shell({
      brand: { color: '#2764e4', name: tenant?.name || 'Mavro Scheduler' },
      title: `Your ${eventType.name} is confirmed`,
      bodyHtml: `
        <p>Hey ${escapeHtml(booking.inviteeName)} — your booking is on the calendar.</p>
        <p><strong>When:</strong> ${escapeHtml(when)}</p>
        ${join}${location}
      `,
      ctaText: booking.meetingLink ? 'Join meeting' : 'Manage booking',
      ctaUrl: booking.meetingLink || manageUrl,
      footerHtml: manageUrl ? `Need to change something? <a href="${manageUrl}">Cancel or reschedule</a>.` : '',
    }),
    text: plain({
      title: `Your ${eventType.name} is confirmed`,
      lines: [
        `When: ${when}`,
        booking.meetingLink ? `Join: ${booking.meetingLink}` : '',
        manageUrl ? `Manage: ${manageUrl}` : '',
      ].filter(Boolean),
    }),
  };
}

function bookingReminder({ booking, eventType, tenant, manageUrl, kind = 'upcoming' }) {
  const when = formatRange({
    startUtc: booking.startTimeUtc,
    endUtc: booking.endTimeUtc,
    timezone: booking.inviteeTimezone,
  });
  const titleByKind = kind === 'hour_before' ? `Starting soon: ${eventType.name}` : `Reminder: ${eventType.name}`;
  const lead = kind === 'hour_before'
    ? 'Your meeting is about to start.'
    : 'A quick reminder that your meeting is coming up.';
  return {
    subject: titleByKind,
    html: shell({
      brand: { color: '#2764e4', name: tenant?.name || 'Mavro Scheduler' },
      title: titleByKind,
      bodyHtml: `
        <p>${lead}</p>
        <p><strong>When:</strong> ${escapeHtml(when)}</p>
        ${booking.meetingLink ? `<p><strong>Join:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : ''}
      `,
      ctaText: booking.meetingLink ? 'Join meeting' : 'View booking',
      ctaUrl: booking.meetingLink || manageUrl,
      footerHtml: manageUrl ? `<a href="${manageUrl}">Cancel or reschedule</a>.` : '',
    }),
    text: plain({
      title: titleByKind,
      lines: [
        `When: ${when}`,
        booking.meetingLink ? `Join: ${booking.meetingLink}` : '',
      ].filter(Boolean),
    }),
  };
}

function bookingCancellation({ booking, eventType, tenant, reason }) {
  const when = formatRange({
    startUtc: booking.startTimeUtc,
    endUtc: booking.endTimeUtc,
    timezone: booking.inviteeTimezone,
  });
  return {
    subject: `Cancelled: ${eventType.name}`,
    html: shell({
      brand: { color: '#2764e4', name: tenant?.name || 'Mavro Scheduler' },
      title: 'Your booking has been cancelled',
      bodyHtml: `
        <p>The following booking has been cancelled:</p>
        <p><strong>${escapeHtml(eventType.name)}</strong></p>
        <p><strong>Was scheduled for:</strong> ${escapeHtml(when)}</p>
        ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
      `,
      footerHtml: '',
    }),
    text: plain({
      title: 'Your booking has been cancelled',
      lines: [
        `Event: ${eventType.name}`,
        `Was scheduled for: ${when}`,
        reason ? `Reason: ${reason}` : '',
      ].filter(Boolean),
    }),
  };
}

function bookingReschedule({ booking, eventType, tenant, manageUrl }) {
  const when = formatRange({
    startUtc: booking.startTimeUtc,
    endUtc: booking.endTimeUtc,
    timezone: booking.inviteeTimezone,
  });
  return {
    subject: `Rescheduled: ${eventType.name}`,
    html: shell({
      brand: { color: '#2764e4', name: tenant?.name || 'Mavro Scheduler' },
      title: 'Your booking has been rescheduled',
      bodyHtml: `
        <p>Your meeting has moved.</p>
        <p><strong>New time:</strong> ${escapeHtml(when)}</p>
        ${booking.meetingLink ? `<p><strong>Join:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : ''}
      `,
      ctaText: booking.meetingLink ? 'Join meeting' : 'View booking',
      ctaUrl: booking.meetingLink || manageUrl,
      footerHtml: manageUrl ? `<a href="${manageUrl}">Manage booking</a>.` : '',
    }),
    text: plain({
      title: 'Your booking has been rescheduled',
      lines: [`New time: ${when}`, booking.meetingLink ? `Join: ${booking.meetingLink}` : ''].filter(Boolean),
    }),
  };
}

module.exports = {
  bookingConfirmation,
  bookingReminder,
  bookingCancellation,
  bookingReschedule,
};
