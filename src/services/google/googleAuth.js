/**
 * Google service-account auth — zero-dependency OAuth2 token minting.
 *
 * Signs an RS256 JWT with the service-account private key (node:crypto) and
 * exchanges it at Google's token endpoint. No googleapis / google-auth-library
 * dependency — keeps the Render build light.
 *
 * Credentials come from ONE env var:
 *   GOOGLE_SERVICE_ACCOUNT_JSON — the downloaded key file contents,
 *   either raw JSON or base64-encoded (base64 is safer for Render env UI).
 *
 * Tokens are cached in-memory until ~1 min before expiry. Scopes for the
 * MBR surface are read-only: Analytics Data API + Search Console.
 */

const crypto = require('crypto');

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
].join(' ');

// Multi-account support: each MBR source may point at its own service account
// via `credentialsEnv` in MBR_SOURCES (e.g. GOOGLE_SERVICE_ACCOUNT_JSON_SAISATWIK).
// Default env var serves sources that don't specify one.
const DEFAULT_CREDS_ENV = 'GOOGLE_SERVICE_ACCOUNT_JSON';
const credsCache = new Map(); // envName → { clientEmail, privateKey } | null
const tokenCache = new Map(); // envName → { accessToken, expiresAt }

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadServiceAccount(credsEnv) {
  const envName = credsEnv || DEFAULT_CREDS_ENV;
  if (credsCache.has(envName)) return credsCache.get(envName);

  let creds = null;
  const raw = (process.env[envName] || '').trim();
  if (raw) {
    try {
      const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      const parsed = JSON.parse(json);
      if (parsed.client_email && parsed.private_key) {
        creds = { clientEmail: parsed.client_email, privateKey: parsed.private_key };
      } else {
        console.error(`❌ [googleAuth] ${envName} missing client_email/private_key`);
      }
    } catch (err) {
      console.error(`❌ [googleAuth] Failed to parse ${envName}:`, err.message);
    }
  }
  credsCache.set(envName, creds);
  return creds;
}

const isConfigured = (credsEnv) => Boolean(loadServiceAccount(credsEnv));

async function getAccessToken(credsEnv) {
  const envName = credsEnv || DEFAULT_CREDS_ENV;
  const creds = loadServiceAccount(envName);
  if (!creds) {
    throw new Error(`Google service account not configured (${envName})`);
  }

  const cachedToken = tokenCache.get(envName);
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60 * 1000) {
    return cachedToken.accessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: SCOPES,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${claims}`)
    .sign(creds.privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google token exchange failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const fresh = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  tokenCache.set(envName, fresh);
  return fresh.accessToken;
}

/** Authenticated JSON fetch against a Google API. Throws on non-2xx. */
async function googleApiFetch(url, { method = 'GET', body, credsEnv } = {}) {
  const token = await getAccessToken(credsEnv);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Google API ${method} ${url} failed (${res.status}): ${text.slice(0, 500)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

module.exports = { isConfigured, getAccessToken, googleApiFetch };
