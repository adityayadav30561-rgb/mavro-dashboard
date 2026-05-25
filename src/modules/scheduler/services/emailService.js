const nodemailer = require('nodemailer');
const config = require('../../../config');
const { Booking, EventType } = require('../models');
const { Website, AdminUser } = require('../../../models');
const { generateIcs } = require('../utils/ics');
const analytics = require('../utils/analytics');
const templates = require('./emailTemplates');

// ===================================
// emailService — transactional email via nodemailer
// ===================================
// Single transporter singleton. Lazy init — only built when EMAIL_HOST is
// configured. Every public send fn returns `{ sent, reason }` so callers can
// log without blowing up the booking flow.

let transporterCache = null;
let warnedDisabled = false;

function getTransporter() {
  if (transporterCache) return transporterCache;
  const { host, port, secure, user, pass, from } = config.email;
  if (!host || !from) {
    if (!warnedDisabled) {
      // eslint-disable-next-line no-console
      console.warn('[emailService] EMAIL_HOST / EMAIL_FROM not set — outbound email disabled');
      warnedDisabled = true;
    }
    return null;
  }
  transporterCache = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporterCache;
}

// Email injection defense — bail on header CRLF in any recipient field.
function sanitizeEmail(addr) {
  if (typeof addr !== 'string') return null;
  const cleaned = addr.trim();
  if (/[\r\n]/.test(cleaned)) return null;
  if (cleaned.length === 0 || cleaned.length > 320) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return null;
  return cleaned;
}

function manageUrl(token) {
  const origin = (config.scheduler && config.scheduler.dashboardOrigin) || '';
  return `${origin.replace(/\/+$/, '')}/manage/${token}`;
}

function fromHeader() {
  const { from, fromName } = config.email;
  if (!from) return null;
  return fromName ? `"${String(fromName).replace(/"/g, '')}" <${from}>` : from;
}

async function loadBookingFull(bookingId) {
  const booking = await Booking.findById(bookingId)
    .select('+cancelToken +rescheduleToken +googleEventId +providerMetadata')
    .lean();
  if (!booking) return null;
  const [eventType, tenant, host] = await Promise.all([
    EventType.findById(booking.eventType).lean(),
    Website.findById(booking.tenant).select('name slug').lean(),
    AdminUser.findById(booking.hostUser).select('name email').lean(),
  ]);
  return { booking, eventType, tenant, host };
}

async function safeSend({ to, subject, html, text, attachments, action, meta = {} }) {
  const transporter = getTransporter();
  const cleanTo = sanitizeEmail(to);
  if (!cleanTo) {
    return { sent: false, reason: 'invalid_recipient' };
  }
  if (!transporter) {
    return { sent: false, reason: 'transporter_unconfigured' };
  }
  const from = fromHeader();
  try {
    const info = await transporter.sendMail({
      from,
      to: cleanTo,
      subject,
      html,
      text,
      attachments: attachments || [],
    });
    analytics.emit({
      action: 'email_sent',
      tenantId: meta.tenantId || null,
      userId: null,
      meta: { kind: action, messageId: info.messageId || null },
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    analytics.emit({
      action: 'email_failed',
      tenantId: meta.tenantId || null,
      userId: null,
      meta: { kind: action, message: String(err.message || err).slice(0, 500) },
    });
    return { sent: false, reason: 'send_failed', message: err.message };
  }
}

function icsAttachment({ booking, eventType, host, status = 'CONFIRMED' }) {
  if (!booking) return null;
  const ics = generateIcs({
    uid: `mavro-booking-${booking._id}`,
    startUtc: booking.startTimeUtc,
    endUtc: booking.endTimeUtc,
    summary: eventType ? `${eventType.name} — ${booking.inviteeName}` : 'Booking',
    description: eventType ? eventType.description : '',
    location: booking.locationType === 'in_person' ? booking.locationValue : '',
    meetingLink: booking.meetingLink || '',
    organizerEmail: host?.email,
    organizerName: host?.name,
    attendeeEmail: booking.inviteeEmail,
    attendeeName: booking.inviteeName,
    status,
  });
  return {
    filename: 'invite.ics',
    content: ics,
    contentType: 'text/calendar; method=REQUEST; charset=utf-8',
  };
}

// ----- Public surface -----

async function sendBookingConfirmation({ bookingId }) {
  const ctx = await loadBookingFull(bookingId);
  if (!ctx) return { sent: false, reason: 'booking_not_found' };
  const { booking, eventType, tenant, host } = ctx;
  const template = templates.bookingConfirmation({
    booking,
    eventType,
    tenant,
    manageUrl: manageUrl(booking.cancelToken),
  });
  return safeSend({
    to: booking.inviteeEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: [icsAttachment({ booking, eventType, host, status: 'CONFIRMED' })].filter(Boolean),
    action: 'booking_confirmation',
    meta: { tenantId: booking.tenant },
  });
}

async function sendBookingReminder({ bookingId, kind }) {
  const ctx = await loadBookingFull(bookingId);
  if (!ctx) return { sent: false, reason: 'booking_not_found' };
  const { booking, eventType, tenant, host } = ctx;
  if (booking.status !== 'confirmed') return { sent: false, reason: 'not_confirmed' };
  const template = templates.bookingReminder({
    booking,
    eventType,
    tenant,
    manageUrl: manageUrl(booking.cancelToken),
    kind,
  });
  return safeSend({
    to: booking.inviteeEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: [icsAttachment({ booking, eventType, host })].filter(Boolean),
    action: 'booking_reminder',
    meta: { tenantId: booking.tenant },
  });
}

async function sendBookingCancellation({ bookingId, reason }) {
  const ctx = await loadBookingFull(bookingId);
  if (!ctx) return { sent: false, reason: 'booking_not_found' };
  const { booking, eventType, tenant, host } = ctx;
  const template = templates.bookingCancellation({ booking, eventType, tenant, reason });
  return safeSend({
    to: booking.inviteeEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: [icsAttachment({ booking, eventType, host, status: 'CANCELLED' })].filter(Boolean),
    action: 'booking_cancellation',
    meta: { tenantId: booking.tenant },
  });
}

async function sendRescheduleConfirmation({ bookingId }) {
  const ctx = await loadBookingFull(bookingId);
  if (!ctx) return { sent: false, reason: 'booking_not_found' };
  const { booking, eventType, tenant, host } = ctx;
  const template = templates.bookingReschedule({
    booking,
    eventType,
    tenant,
    manageUrl: manageUrl(booking.cancelToken),
  });
  return safeSend({
    to: booking.inviteeEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: [icsAttachment({ booking, eventType, host })].filter(Boolean),
    action: 'booking_reschedule',
    meta: { tenantId: booking.tenant },
  });
}

module.exports = {
  sendBookingConfirmation,
  sendBookingReminder,
  sendBookingCancellation,
  sendRescheduleConfirmation,
};
