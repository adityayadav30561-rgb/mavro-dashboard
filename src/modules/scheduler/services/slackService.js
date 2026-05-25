const analytics = require('../utils/analytics');

// ===================================
// slackService — Slack incoming-webhook delivery
// ===================================
// Workflow step `send_slack` config: { webhookUrl, text, blocks? }
// We POST the structured payload to the receiver's Slack webhook. The
// webhook URL itself IS the secret — never logged, never echoed back from
// admin lists (workflow config stripped on read where exposure matters).
//
// FAILURE MODES:
//   network / timeout / 5xx → retry (workflow worker handles via BullMQ)
//   4xx → terminal (bad payload or revoked webhook)

const TIMEOUT_MS = 10000;
const MAX_BODY_BYTES = 32 * 1024;

function sanitizeWebhookForLog(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.slice(0, 12)}…`;
  } catch {
    return '(invalid)';
  }
}

async function send({ webhookUrl, text, blocks, meta = {} }) {
  if (!webhookUrl || !/^https:\/\/hooks\.slack\.com\//.test(webhookUrl)) {
    return { ok: false, reason: 'invalid_webhook_url' };
  }
  const body = {};
  if (text) body.text = String(text).slice(0, 4000);
  if (Array.isArray(blocks)) body.blocks = blocks;
  const raw = JSON.stringify(body);
  if (raw.length > MAX_BODY_BYTES) return { ok: false, reason: 'payload_too_large' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
      signal: controller.signal,
    });
    const ok = res.ok;
    if (ok) {
      analytics.emit({
        action: 'slack_sent',
        tenantId: meta.tenantId || null,
        userId: null,
        meta: { webhook: sanitizeWebhookForLog(webhookUrl) },
      });
    } else {
      analytics.emit({
        action: 'slack_failed',
        tenantId: meta.tenantId || null,
        userId: null,
        meta: { webhook: sanitizeWebhookForLog(webhookUrl), httpStatus: res.status },
      });
    }
    return { ok, status: res.status };
  } catch (err) {
    return { ok: false, reason: err.name === 'AbortError' ? 'timeout' : 'network', message: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { send };
