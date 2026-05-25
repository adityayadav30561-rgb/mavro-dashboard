const config = require('../../../config');
const analytics = require('../utils/analytics');

// ===================================
// smsService — Twilio adapter (extensible)
// ===================================
// Single public surface (`send`) — internal `providers` table maps env-driven
// provider name to a sender function. Adding Vonage/Plivo/MessageBird is one
// new function + one entry. No hardcoded Twilio anywhere outside this file.
//
// PROVIDER SELECTION:
//   SMS_PROVIDER=twilio (default). Falls back to no-op when env is incomplete.
//
// FORMAT:
//   to    — E.164 phone (+15551234567). Sanitized to digits + leading '+'.
//   body  — plain text (max 1600 chars). Truncated if longer.

const E164_RE = /^\+[1-9]\d{6,14}$/;
const MAX_BODY = 1600;

function sanitizePhone(input) {
  if (typeof input !== 'string') return null;
  const stripped = input.replace(/[^+0-9]/g, '');
  if (!E164_RE.test(stripped)) return null;
  return stripped;
}

function truncateBody(input) {
  if (typeof input !== 'string') return '';
  return input.slice(0, MAX_BODY);
}

// ----- Twilio -----
async function sendViaTwilio({ to, body }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) {
    return { ok: false, reason: 'twilio_not_configured' };
  }
  const params = new URLSearchParams();
  params.set('To', to);
  params.set('From', from);
  params.set('Body', body);
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, reason: `http_${res.status}`, message: text.slice(0, 300) };
    }
    const json = await res.json();
    return { ok: true, providerMessageId: json.sid || null };
  } catch (err) {
    return { ok: false, reason: err.name === 'AbortError' ? 'timeout' : 'network', message: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

const PROVIDERS = {
  twilio: sendViaTwilio,
};

/**
 * Public send. Returns `{sent, providerMessageId?, reason?}` — never throws.
 * Caller (workflow worker) decides whether to retry based on `reason`.
 */
async function send({ to, body, meta = {} }) {
  const cleanTo = sanitizePhone(to);
  if (!cleanTo) return { sent: false, reason: 'invalid_recipient' };
  const cleanBody = truncateBody(body);
  if (!cleanBody.length) return { sent: false, reason: 'empty_body' };

  const providerName = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();
  const provider = PROVIDERS[providerName];
  if (!provider) return { sent: false, reason: `unknown_provider:${providerName}` };

  const result = await provider({ to: cleanTo, body: cleanBody });
  if (result.ok) {
    analytics.emit({
      action: 'sms_sent',
      tenantId: meta.tenantId || null,
      userId: null,
      meta: { provider: providerName, providerMessageId: result.providerMessageId || null },
    });
    return { sent: true, providerMessageId: result.providerMessageId };
  }
  analytics.emit({
    action: 'sms_failed',
    tenantId: meta.tenantId || null,
    userId: null,
    meta: { provider: providerName, reason: result.reason, message: result.message || null },
  });
  return { sent: false, reason: result.reason, message: result.message };
}

module.exports = { send, sanitizePhone };
