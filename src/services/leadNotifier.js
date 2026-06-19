// ───────────────────────────────────────────────────────────────────────────
// Speed-to-lead notifier — instant alert to the team when a new lead lands.
// ───────────────────────────────────────────────────────────────────────────
// Fire-and-forget. Never throws (a failed alert must never break lead capture).
// No-op unless a channel is configured via env, so it's safe to deploy before
// any credentials exist.
//
// CHANNELS (configure one or more):
//
//   WhatsApp GROUP — the official Meta WhatsApp Cloud API CANNOT post to groups,
//   so group delivery requires a 3rd-party WhatsApp gateway (Whapi.cloud,
//   Wassenger, etc.). Set:
//     LEAD_ALERT_WA_PROVIDER = whapi | wassenger | generic
//     LEAD_ALERT_WA_TOKEN    = <gateway API token>
//     LEAD_ALERT_WA_GROUP_ID = <the group id from the gateway>
//     LEAD_ALERT_WA_URL      = <endpoint> (only for provider=generic)
//
//   Telegram GROUP — free + official + reliable. Set:
//     LEAD_ALERT_TELEGRAM_TOKEN   = <bot token from @BotFather>
//     LEAD_ALERT_TELEGRAM_CHAT_ID = <group chat id, usually negative>
//
//   Generic webhook (Slack / Make / Zapier) — posts JSON {text, lead}. Set:
//     LEAD_ALERT_WEBHOOK_URL = <url>
//
//   Scope (optional): LEAD_ALERT_WEBSITE_SLUGS = spanbix,mavro-hrms
//     If set, only leads for those tenant slugs trigger an alert. Unset = all.

const ALERT_TIMEOUT_MS = 4000;

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('alert_timeout')), ALERT_TIMEOUT_MS)),
  ]);
}

function digitsOnly(s) {
  return String(s || '').replace(/[^0-9]/g, '');
}

function buildMessage({ lead, website }) {
  const cf = lead.customFields || {};
  const lines = [];
  lines.push(`🟢 New ${website?.name || 'website'} lead`);
  lines.push('');
  lines.push(`Name: ${lead.name || '—'}`);
  lines.push(`Phone: ${lead.phone || '—'}`);
  if (lead.email) lines.push(`Email: ${lead.email}`);
  if (lead.company) lines.push(`Company: ${lead.company}`);
  if (cf.interest) lines.push(`Interest: ${cf.interest}`);
  if (cf.education) lines.push(`Education: ${cf.education}`);
  if (lead.formId) lines.push(`Form: ${lead.formId}`);
  if (cf.source) lines.push(`Source: ${cf.source}`);

  const utm = [cf.utm_source, cf.utm_medium, cf.utm_campaign].filter(Boolean).join(' / ');
  if (utm) lines.push(`Campaign: ${utm}`);
  if (cf.gclid) lines.push(`gclid: ${cf.gclid}`);

  if (lead.message) lines.push(`Message: ${String(lead.message).slice(0, 300)}`);

  const phoneDigits = digitsOnly(lead.phone);
  if (phoneDigits) lines.push('', `Reply on WhatsApp: https://wa.me/${phoneDigits}`);

  try {
    const when = new Date(lead.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    lines.push(`Time: ${when} IST`);
  } catch {
    /* ignore */
  }
  return lines.join('\n');
}

async function sendTelegram(text) {
  const token = process.env.LEAD_ALERT_TELEGRAM_TOKEN;
  const chatId = process.env.LEAD_ALERT_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await withTimeout(fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  }));
}

async function sendWhatsApp(text) {
  const provider = (process.env.LEAD_ALERT_WA_PROVIDER || '').toLowerCase();
  const token = process.env.LEAD_ALERT_WA_TOKEN;
  const group = process.env.LEAD_ALERT_WA_GROUP_ID;
  if (!provider || !token || !group) return;

  let url;
  let headers;
  let body;
  if (provider === 'whapi') {
    // Whapi.cloud — group ids look like "<id>@g.us".
    url = 'https://gate.whapi.cloud/messages/text';
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    body = JSON.stringify({ to: group, body: text });
  } else if (provider === 'wassenger') {
    url = 'https://api.wassenger.com/v1/messages';
    headers = { 'Content-Type': 'application/json', Token: token };
    body = JSON.stringify({ group, message: text });
  } else {
    // generic: POST {to, body} with Bearer token to a custom endpoint.
    url = process.env.LEAD_ALERT_WA_URL;
    if (!url) return;
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    body = JSON.stringify({ to: group, body: text });
  }
  await withTimeout(fetch(url, { method: 'POST', headers, body }));
}

async function sendWebhook(text, lead) {
  const url = process.env.LEAD_ALERT_WEBHOOK_URL;
  if (!url) return;
  await withTimeout(fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lead: { id: lead._id, name: lead.name, phone: lead.phone, email: lead.email } }),
  }));
}

function inScope(website) {
  const raw = process.env.LEAD_ALERT_WEBSITE_SLUGS;
  if (!raw || !raw.trim()) return true; // unset → notify for all tenants
  const allowed = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(String(website?.slug || '').toLowerCase());
}

// Public entry point. Call WITHOUT await from the controller (fire-and-forget).
async function notifyNewLead({ lead, website }) {
  try {
    if (!lead || !inScope(website)) return;
    const text = buildMessage({ lead, website });
    // Send to every configured channel in parallel; isolate failures.
    await Promise.allSettled([
      sendWhatsApp(text),
      sendTelegram(text),
      sendWebhook(text, lead),
    ]);
  } catch (e) {
    console.warn('[leadNotifier] alert failed:', e.message);
  }
}

module.exports = { notifyNewLead };
