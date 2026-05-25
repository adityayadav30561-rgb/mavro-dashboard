const {
  Booking, EventType, CalendarConnection, WorkflowExecution, WebhookDelivery,
} = require('../models');
const { Website, AdminUser } = require('../../../models');
const emailService = require('../services/emailService');
const webhookService = require('../services/webhookService');
const smsService = require('../services/smsService');
const slackService = require('../services/slackService');
const calendarProviderService = require('../services/calendarProviderService');
const config = require('../../../config');
const analytics = require('../utils/analytics');
const { JOB_NAMES } = require('../queue');
const interpolator = require('../utils/templateInterpolator');

// ===================================
// Job handlers — pure async functions, idempotent
// ===================================
// Each handler:
//   - re-reads the latest Booking row (state may have changed)
//   - writes a WorkflowExecution audit row at completion
//   - throws on retryable failure (BullMQ retries with backoff)
//   - returns serializable result on terminal success / skip

async function withExecutionLog(job, { tenantId, workflowId, bookingId, trigger, actionType, payloadSummary }, fn) {
  const startedAt = new Date();
  let status = 'running';
  let error = null;
  let result = null;
  try {
    result = await fn();
    status = result && result.skipped ? 'skipped' : 'succeeded';
  } catch (err) {
    status = 'failed';
    error = String(err && err.message ? err.message : err).slice(0, 1000);
    // Persist execution row first, then rethrow so BullMQ retries.
    await persistExecutionRow();
    throw err;
  }
  await persistExecutionRow();
  return result;

  async function persistExecutionRow() {
    if (!tenantId) return;
    const completedAt = new Date();
    try {
      await WorkflowExecution.create({
        tenant: tenantId,
        workflow: workflowId || null,
        booking: bookingId || null,
        trigger: trigger || null,
        stepIndex: job.data.stepIndex != null ? job.data.stepIndex : 0,
        actionType,
        status,
        attempts: job.attemptsMade + 1,
        durationMs: completedAt - startedAt,
        error,
        payloadSummary: payloadSummary || {},
        jobId: job.id || null,
        startedAt,
        completedAt,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[scheduler executions] persist failed:', e.message);
    }
  }
}

async function loadFullBookingCtx(bookingId) {
  const booking = await Booking.findById(bookingId)
    .select('+cancelToken +rescheduleToken +googleEventId +providerMetadata +providerError')
    .lean();
  if (!booking) return null;
  const [eventType, tenant, host] = await Promise.all([
    EventType.findById(booking.eventType).lean(),
    Website.findById(booking.tenant).select('name slug').lean(),
    AdminUser.findById(booking.hostUser).select('name email').lean(),
  ]);
  return { booking, eventType, tenant, host };
}

// ----- Email handlers -----

async function handleConfirmationEmail(job) {
  const { bookingId } = job.data;
  return withExecutionLog(job, {
    tenantId: null, bookingId, trigger: 'booking_created', actionType: 'builtin', payloadSummary: { kind: 'confirmation' },
  }, async () => {
    const booking = await Booking.findById(bookingId).select('tenant status').lean();
    if (!booking) return { skipped: true, reason: 'booking_not_found' };
    job.executionTenantId = booking.tenant;
    if (booking.status !== 'confirmed') return { skipped: true, reason: 'not_confirmed' };
    const result = await emailService.sendBookingConfirmation({ bookingId });
    if (!result.sent && result.reason === 'send_failed') throw new Error(result.message || 'send_failed');
    return result;
  });
}

async function handleReminderEmail(job) {
  const { bookingId, kind } = job.data;
  return withExecutionLog(job, {
    tenantId: null, bookingId, trigger: 'before_meeting', actionType: 'builtin', payloadSummary: { kind: 'reminder', reminderKind: kind },
  }, async () => {
    const booking = await Booking.findById(bookingId).select('tenant status startTimeUtc').lean();
    if (!booking) return { skipped: true, reason: 'booking_not_found' };
    if (booking.status !== 'confirmed') return { skipped: true, reason: 'no_longer_confirmed' };
    if (new Date(booking.startTimeUtc).getTime() < Date.now()) return { skipped: true, reason: 'meeting_in_past' };
    const result = await emailService.sendBookingReminder({ bookingId, kind });
    if (!result.sent && result.reason === 'send_failed') throw new Error(result.message || 'send_failed');
    analytics.emit({ action: 'reminder_sent', tenantId: booking.tenant, userId: null, meta: { bookingId, kind } });
    return result;
  });
}

async function handleCancellationEmail(job) {
  const { bookingId, reason } = job.data;
  return withExecutionLog(job, {
    tenantId: null, bookingId, trigger: 'booking_cancelled', actionType: 'builtin', payloadSummary: { kind: 'cancellation' },
  }, async () => {
    const result = await emailService.sendBookingCancellation({ bookingId, reason });
    if (!result.sent && result.reason === 'send_failed') throw new Error(result.message || 'send_failed');
    return result;
  });
}

async function handleRescheduleEmail(job) {
  const { bookingId } = job.data;
  return withExecutionLog(job, {
    tenantId: null, bookingId, trigger: 'booking_rescheduled', actionType: 'builtin', payloadSummary: { kind: 'reschedule' },
  }, async () => {
    const result = await emailService.sendRescheduleConfirmation({ bookingId });
    if (!result.sent && result.reason === 'send_failed') throw new Error(result.message || 'send_failed');
    return result;
  });
}

// ----- Webhook (built-in) -----

async function handleWebhookDelivery(job) {
  const { url, payload, meta = {} } = job.data;
  return withExecutionLog(job, {
    tenantId: meta.tenantId || null, bookingId: meta.bookingId || null, workflowId: meta.workflowId || null,
    trigger: meta.trigger || null, actionType: 'webhook', payloadSummary: { url },
  }, async () => {
    const result = await webhookService.deliverWebhook({ url, payload, meta });
    // Persist delivery audit
    if (meta.tenantId) {
      try {
        await WebhookDelivery.create({
          tenant: meta.tenantId,
          workflow: meta.workflowId || null,
          booking: meta.bookingId || null,
          trigger: meta.trigger || null,
          url,
          deliveryId: result.deliveryId || null,
          status: result.ok ? 'delivered' : (result.reason === 'invalid_url' ? 'invalid_url' : 'failed'),
          httpStatus: result.status || null,
          attempts: job.attemptsMade + 1,
          lastError: result.ok ? null : (result.reason || result.message || 'unknown'),
          deliveredAt: result.ok ? new Date() : null,
        });
      } catch (e) { /* swallow audit failure */ }
    }
    if (!result.ok && (result.reason === 'timeout' || result.reason === 'network' || (result.status && result.status >= 500))) {
      throw new Error(`webhook ${result.reason || result.status}`);
    }
    return result;
  });
}

// ----- Workflow action dispatcher -----

async function handleWorkflowAction(job) {
  const { step, bookingId, trigger, workflowId } = job.data;
  if (!step || !step.type) return { skipped: true, reason: 'no_step' };

  const ctx = await loadFullBookingCtx(bookingId);
  if (!ctx) return { skipped: true, reason: 'booking_not_found' };
  const { booking, eventType, tenant, host } = ctx;

  return withExecutionLog(job, {
    tenantId: booking.tenant, bookingId, workflowId, trigger,
    actionType: step.type,
    payloadSummary: { stepType: step.type, stepIndex: job.data.stepIndex },
  }, async () => {
    if (step.type === 'send_email') {
      // Custom template support — step.config.template = { subject, html, text }
      const template = step.config && step.config.template;
      if (template && (template.subject || template.html || template.text)) {
        const context = interpolator.buildContext({ booking, eventType, host, tenant });
        const rendered = interpolator.renderTemplate(template, context);
        // Pipe through emailService's safeSend by emitting a custom call —
        // we use the reminder path which carries the right meta + ICS attach;
        // override its template at the email layer.
        return emailServiceSendCustom({
          booking, tenant, host,
          rendered,
        });
      }
      const result = await emailService.sendBookingReminder({ bookingId, kind: 'workflow' });
      if (!result.sent && result.reason === 'send_failed') throw new Error(result.message || 'send_failed');
      return result;
    }
    if (step.type === 'send_sms') {
      const context = interpolator.buildContext({ booking, eventType, host, tenant });
      const phoneTpl = (step.config && step.config.to) || '{{invitee.phone}}';
      const bodyTpl = (step.config && step.config.body) || 'Reminder: {{event.name}} at {{start.local}}';
      const to = interpolator.render(phoneTpl, context, { escape: false });
      const body = interpolator.render(bodyTpl, context, { escape: false });
      const result = await smsService.send({ to, body, meta: { tenantId: booking.tenant } });
      if (!result.sent && (result.reason === 'network' || result.reason === 'timeout' || result.reason?.startsWith('http_5'))) {
        throw new Error(`sms ${result.reason}`);
      }
      return result;
    }
    if (step.type === 'send_slack') {
      const context = interpolator.buildContext({ booking, eventType, host, tenant });
      const webhookUrl = step.config && step.config.webhookUrl;
      const textTpl = (step.config && step.config.text) || 'New booking: {{event.name}} — {{invitee.name}} at {{start.local}}';
      const text = interpolator.render(textTpl, context, { escape: false });
      const result = await slackService.send({ webhookUrl, text, meta: { tenantId: booking.tenant } });
      if (!result.ok && (result.reason === 'timeout' || result.reason === 'network' || (result.status && result.status >= 500))) {
        throw new Error(`slack ${result.reason || result.status}`);
      }
      return result;
    }
    if (step.type === 'webhook') {
      const url = step.config && step.config.url;
      if (!url) return { skipped: true, reason: 'no_url' };
      const eventTypeSlim = eventType ? {
        name: eventType.name, slug: eventType.slug,
        durationMinutes: eventType.durationMinutes, locationType: eventType.locationType,
      } : null;
      const payload = {
        event: trigger, workflowId,
        tenantId: String(booking.tenant),
        booking: stripBookingForWebhook(booking),
        eventType: eventTypeSlim,
        tenant: tenant ? { name: tenant.name, slug: tenant.slug } : null,
      };
      const result = await webhookService.deliverWebhook({ url, payload, meta: { tenantId: booking.tenant } });
      // Audit row
      try {
        await WebhookDelivery.create({
          tenant: booking.tenant, workflow: workflowId, booking: booking._id,
          trigger, url,
          deliveryId: result.deliveryId || null,
          status: result.ok ? 'delivered' : (result.reason === 'invalid_url' ? 'invalid_url' : 'failed'),
          httpStatus: result.status || null,
          attempts: job.attemptsMade + 1,
          lastError: result.ok ? null : (result.reason || result.message || 'unknown'),
          deliveredAt: result.ok ? new Date() : null,
        });
      } catch (e) { /* ignore audit failure */ }
      if (!result.ok && (result.reason === 'timeout' || result.reason === 'network' || (result.status && result.status >= 500))) {
        throw new Error(`webhook ${result.reason || result.status}`);
      }
      return result;
    }
    return { skipped: true, reason: `unknown_type:${step.type}` };
  });
}

function stripBookingForWebhook(b) {
  const out = { ...b };
  delete out.cancelToken;
  delete out.rescheduleToken;
  delete out.googleEventId;
  delete out.outlookEventId;
  delete out.providerMetadata;
  delete out.providerError;
  delete out.slotHash;
  return out;
}

// Custom-template send — sidesteps the standard reminder template
async function emailServiceSendCustom({ booking, tenant, host, rendered }) {
  // Reuse emailService internals via dynamic call — but to avoid expanding
  // the public surface mid-phase we duplicate the minimal safe-send here.
  // Phase 8 will lift this into emailService directly.
  const nodemailer = require('nodemailer');
  const cfg = config.email;
  if (!cfg.host || !cfg.from) return { sent: false, reason: 'transporter_unconfigured' };
  const transporter = nodemailer.createTransport({
    host: cfg.host, port: cfg.port, secure: cfg.secure,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  try {
    const info = await transporter.sendMail({
      from: cfg.fromName ? `"${cfg.fromName}" <${cfg.from}>` : cfg.from,
      to: booking.inviteeEmail,
      subject: rendered.subject || 'Booking update',
      html: rendered.html,
      text: rendered.text,
    });
    analytics.emit({ action: 'email_sent', tenantId: booking.tenant, userId: null, meta: { kind: 'workflow_custom', messageId: info.messageId || null } });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    analytics.emit({ action: 'email_failed', tenantId: booking.tenant, userId: null, meta: { kind: 'workflow_custom', message: String(err.message || '').slice(0, 500) } });
    return { sent: false, reason: 'send_failed', message: err.message };
  }
}

// ----- Provider retry handler -----

async function handleProviderRetry(job) {
  const { bookingId } = job.data;
  return withExecutionLog(job, {
    tenantId: null, bookingId, actionType: 'builtin', payloadSummary: { kind: 'provider_retry' },
  }, async () => {
    const booking = await Booking.findById(bookingId)
      .select('+googleEventId +providerMetadata +providerError');
    if (!booking) return { skipped: true, reason: 'booking_not_found' };
    if (booking.status !== 'confirmed') return { skipped: true, reason: 'not_confirmed' };
    if (booking.googleEventId) return { skipped: true, reason: 'already_synced' };

    const eventType = await EventType.findById(booking.eventType).lean();
    if (!eventType) return { skipped: true, reason: 'event_type_missing' };

    const conn = await CalendarConnection.findOne({
      tenant: booking.tenant, user: booking.hostUser, status: 'active', isPrimary: true,
    }).lean() || await CalendarConnection.findOne({
      tenant: booking.tenant, user: booking.hostUser, status: 'active',
    }).lean();
    if (!conn) {
      booking.providerError = 'no_active_connection';
      await booking.save();
      return { skipped: true, reason: 'no_connection' };
    }
    const writeCal = (conn.selectedCalendars || []).find((c) => c.writeEvents && c.isPrimary)
      || (conn.selectedCalendars || []).find((c) => c.writeEvents);
    const calendarId = (writeCal && writeCal.calendarId) || conn.calendarId || 'primary';
    try {
      const result = await calendarProviderService.createExternalEvent({
        connectionId: conn._id, calendarId,
        payload: {
          summary: `${eventType.name} — ${booking.inviteeName}`,
          description: eventType.description || '',
          startUtc: booking.startTimeUtc,
          endUtc: booking.endTimeUtc,
          attendees: [{ email: booking.inviteeEmail, displayName: booking.inviteeName }],
          locationType: booking.locationType || eventType.locationType,
          locationValue: booking.locationValue || eventType.locationValue,
        },
      });
      booking.googleEventId = result.externalEventId || null;
      booking.meetingLink = result.meetingLink || booking.meetingLink;
      booking.providerMetadata = { provider: 'google', calendarId, htmlLink: result.htmlLink || null };
      booking.providerError = null;
      await booking.save();
      return { ok: true, synced: true };
    } catch (err) {
      booking.providerError = `retry_attempt_${job.attemptsMade}: ${err.message || 'unknown'}`.slice(0, 500);
      await booking.save();
      throw err;
    }
  });
}

// ----- Completion sweep handler -----

async function handleCompletionTransition(job) {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);
  const stale = await Booking.find({
    status: 'confirmed', endTimeUtc: { $lt: cutoff },
  }).select('_id tenant').limit(500).lean();
  let updated = 0;
  for (const b of stale) {
    const res = await Booking.updateOne({ _id: b._id, status: 'confirmed' }, { $set: { status: 'completed' } });
    if (res.modifiedCount) {
      updated += 1;
      analytics.emit({ action: 'booking_completed', tenantId: b.tenant, userId: null, meta: { bookingId: String(b._id) } });
    }
  }
  return { updated, scanned: stale.length };
}

module.exports = {
  [JOB_NAMES.BOOKING_CONFIRMATION_EMAIL]: handleConfirmationEmail,
  [JOB_NAMES.BOOKING_REMINDER_EMAIL]: handleReminderEmail,
  [JOB_NAMES.BOOKING_CANCELLATION_EMAIL]: handleCancellationEmail,
  [JOB_NAMES.BOOKING_RESCHEDULE_EMAIL]: handleRescheduleEmail,
  [JOB_NAMES.WEBHOOK_DELIVERY]: handleWebhookDelivery,
  [JOB_NAMES.WORKFLOW_ACTION]: handleWorkflowAction,
  [JOB_NAMES.PROVIDER_RETRY]: handleProviderRetry,
  [JOB_NAMES.BOOKING_COMPLETION_TRANSITION]: handleCompletionTransition,
};
