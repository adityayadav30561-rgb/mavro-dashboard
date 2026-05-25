const crypto = require('crypto');
const config = require('../../../config');
const analytics = require('../utils/analytics');

// ===================================
// webhookService — HMAC-signed POST delivery
// ===================================
// Signature header format:
//   X-Mavro-Signature: t=<unix_ts>,v1=<hex_hmac_sha256(t.body)>
// Receivers must:
//   1. Reject if `Date.now()/1000 - t > 300` (5min replay window)
//   2. Recompute HMAC using shared secret + `${t}.${rawBody}`
//   3. timingSafeEqual against `v1`
//
// Payload shape (stable):
//   {
//     id: '<delivery uuid>',           // dedup key for receivers
//     event: '<trigger>',              // booking_created / booking_cancelled / ...
//     deliveredAt: ISO,
//     workflowId, tenantId,
//     booking: { ... },                // toJSON-stripped Booking
//     eventType: { name, slug, durationMinutes, locationType }
//   }

const TIMEOUT_MS = 10000;
const MAX_BODY_BYTES = 64 * 1024;

function signPayload(rawBody, ts) {
  const secret = config.scheduler.workflowSigningSecret;
  if (!secret) return null;
  return crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${rawBody}`)
    .digest('hex');
}

function buildSignatureHeader(rawBody) {
  const ts = Math.floor(Date.now() / 1000);
  const sig = signPayload(rawBody, ts);
  if (!sig) return null;
  return `t=${ts},v1=${sig}`;
}

/**
 * Deliver one webhook. Caller (worker) handles retry semantics via BullMQ
 * `attempts` + exponential backoff — this function returns success/failure
 * without retrying internally.
 */
async function deliverWebhook({ url, payload, meta = {} }) {
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return { ok: false, reason: 'invalid_url' };
  }
  const fullPayload = {
    id: crypto.randomBytes(12).toString('hex'),
    deliveredAt: new Date().toISOString(),
    ...payload,
  };
  const rawBody = JSON.stringify(fullPayload);
  if (rawBody.length > MAX_BODY_BYTES) {
    return { ok: false, reason: 'payload_too_large' };
  }
  const signature = buildSignatureHeader(rawBody);
  if (!signature) {
    return { ok: false, reason: 'workflow_signing_secret_missing' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Mavro-Signature': signature,
        'X-Mavro-Delivery': fullPayload.id,
        'User-Agent': 'Mavro-Scheduler-Webhook/1.0',
      },
      body: rawBody,
    });
    const ok = res.ok;
    if (ok) {
      analytics.emit({
        action: 'webhook_delivered',
        tenantId: meta.tenantId || null,
        userId: null,
        meta: { url: sanitizeUrlForLog(url), status: res.status, deliveryId: fullPayload.id },
      });
    }
    return { ok, status: res.status, deliveryId: fullPayload.id };
  } catch (err) {
    return { ok: false, reason: err.name === 'AbortError' ? 'timeout' : 'network', message: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

function sanitizeUrlForLog(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return '(invalid)';
  }
}

/**
 * Verify a received signature (utility for future inbound endpoints — same
 * algorithm as the one we emit).
 */
function verifyIncomingSignature({ header, rawBody, secret = config.scheduler.workflowSigningSecret, maxAgeSeconds = 300 }) {
  if (!header || !secret) return false;
  const parts = String(header).split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const ts = parseInt(parts.t, 10);
  const sig = parts.v1;
  if (!ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - ts) > maxAgeSeconds) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
  if (expected.length !== sig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

module.exports = {
  deliverWebhook,
  buildSignatureHeader,
  verifyIncomingSignature,
  signPayload,
};
