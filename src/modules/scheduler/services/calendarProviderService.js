const config = require('../../../config');
const { CalendarConnection } = require('../models');
const {
  getProvider,
  isProviderConfigured,
  ProviderAuthError,
  ProviderTransientError,
} = require('../providers');
const { encrypt, decrypt } = require('../utils/encryption');
const { signOAuthState, verifyOAuthState } = require('../utils/oauthState');

// ===================================
// calendarProviderService — provider-agnostic orchestration
// ===================================
// The single layer through which the rest of the app talks to external
// calendars. Responsibilities:
//   1. Dispatch into provider adapters via the registry (providers/index.js)
//   2. Encrypt tokens before persistence; decrypt only inside this module
//   3. Auto-refresh on ProviderAuthError before retrying
//   4. Persist connection status (active / reauth_required / revoked / error)
//   5. In-memory cache for getBusyRanges (120s TTL per spec)
//
// Token plaintext never leaves this module — callers receive booking-shaped
// returns from the public surface, never raw OAuth credentials.
//
// REDIRECT URI:
//   Built from config.scheduler.publicBackendUrl + the provider segment.
//   Google Cloud Console must list both:
//     http://localhost:5000/api/scheduler/calendar-connections/google/callback
//     https://mavro-dashboard.onrender.com/api/scheduler/calendar-connections/google/callback

function buildRedirectUri(provider) {
  const base = config.scheduler.publicBackendUrl.replace(/\/+$/, '');
  return `${base}/api/scheduler/calendar-connections/${provider}/callback`;
}

// ---------- Connection token helpers ----------

async function loadConnectionWithTokens(connectionId) {
  const conn = await CalendarConnection.findById(connectionId)
    .select('+accessToken +refreshToken +tokenExpiry +scopesGranted +lastError');
  if (!conn) {
    const err = new Error('CalendarConnection not found');
    err.statusCode = 404;
    throw err;
  }
  return conn;
}

function decryptedTokens(conn) {
  return {
    accessToken: conn.accessToken ? decrypt(conn.accessToken) : null,
    refreshToken: conn.refreshToken ? decrypt(conn.refreshToken) : null,
  };
}

async function persistTokens(conn, { accessToken, refreshToken, expiresAt, scopesGranted }) {
  if (accessToken) conn.accessToken = encrypt(accessToken);
  if (refreshToken) conn.refreshToken = encrypt(refreshToken);
  if (expiresAt) conn.tokenExpiry = expiresAt;
  if (Array.isArray(scopesGranted)) conn.scopesGranted = scopesGranted;
  conn.lastError = null;
  conn.status = 'active';
  await conn.save();
}

async function markReauthRequired(conn, err) {
  conn.status = 'reauth_required';
  conn.lastError = err && err.message ? err.message.slice(0, 500) : 'reauth_required';
  await conn.save();
}

async function markError(conn, err) {
  conn.status = 'error';
  conn.lastError = err && err.message ? err.message.slice(0, 500) : 'unknown_error';
  await conn.save();
}

// Run a provider method with auto-refresh + retry on ProviderAuthError.
// `op` receives the decrypted token bundle and is expected to make the actual
// provider call. On first auth failure we refresh once, then re-invoke. A
// second auth failure marks the connection reauth_required and rethrows.
async function withAutoRefresh(connectionOrId, op) {
  const conn = typeof connectionOrId === 'string' || connectionOrId._id == null
    ? await loadConnectionWithTokens(connectionOrId)
    : connectionOrId;
  const provider = getProvider(conn.provider);
  let tokens = decryptedTokens(conn);
  try {
    return await op(provider, tokens, conn);
  } catch (err) {
    if (!(err instanceof ProviderAuthError)) throw err;
    // Attempt refresh
    if (!tokens.refreshToken) {
      await markReauthRequired(conn, err);
      throw err;
    }
    let refreshed;
    try {
      refreshed = await provider.refreshAccessToken({ refreshToken: tokens.refreshToken });
    } catch (refreshErr) {
      await markReauthRequired(conn, refreshErr);
      throw refreshErr;
    }
    await persistTokens(conn, refreshed);
    tokens = decryptedTokens(conn);
    try {
      return await op(provider, tokens, conn);
    } catch (err2) {
      if (err2 instanceof ProviderAuthError) await markReauthRequired(conn, err2);
      else await markError(conn, err2);
      throw err2;
    }
  }
}

// ---------- OAuth flow ----------

function generateOAuthUrl({ provider, userId, tenantId }) {
  if (!isProviderConfigured(provider)) {
    const err = new Error(`Provider not configured: ${provider}`);
    err.statusCode = 503;
    throw err;
  }
  const prov = getProvider(provider);
  const state = signOAuthState({ userId, tenantId, provider });
  const redirectUri = buildRedirectUri(provider);
  return {
    url: prov.buildAuthUrl({ state, redirectUri }),
    state,
    redirectUri,
  };
}

async function completeOAuthHandshake({ provider, code, state }) {
  const decodedState = verifyOAuthState(state);
  if (decodedState.provider !== provider) {
    throw new Error('OAuth state provider mismatch');
  }
  const prov = getProvider(provider);
  const redirectUri = buildRedirectUri(provider);
  const tokens = await prov.exchangeCode({ code, redirectUri });

  // Upsert by (tenant, user, provider, providerAccountId) so reconnect of
  // the same Google account refreshes tokens instead of creating duplicates.
  const filter = {
    tenant: decodedState.tenantId,
    user: decodedState.userId,
    provider,
    providerAccountId: tokens.providerAccountId,
  };

  let conn = await CalendarConnection.findOne(filter).select(
    '+accessToken +refreshToken +tokenExpiry +scopesGranted'
  );
  const isNew = !conn;
  if (!conn) {
    conn = new CalendarConnection({
      ...filter,
      providerAccountEmail: tokens.providerAccountEmail,
      calendarId: tokens.primaryCalendar ? tokens.primaryCalendar.id : '',
      calendarName: tokens.primaryCalendar ? tokens.primaryCalendar.name : '',
      selectedCalendars: tokens.primaryCalendar
        ? [
            {
              calendarId: tokens.primaryCalendar.id,
              name: tokens.primaryCalendar.name,
              timezone: tokens.primaryCalendar.timezone || null,
              checkConflicts: true,
              writeEvents: true,
              isPrimary: true,
            },
          ]
        : [],
    });
    // First connection of this user+tenant+provider — set isPrimary on it.
    const existingPrimary = await CalendarConnection.findOne({
      tenant: decodedState.tenantId,
      user: decodedState.userId,
      provider,
      isPrimary: true,
    }).select('_id');
    if (!existingPrimary) conn.isPrimary = true;
  } else {
    // Reconnect — refresh metadata but keep selectedCalendars to preserve
    // the host's per-calendar preferences.
    conn.providerAccountEmail = tokens.providerAccountEmail || conn.providerAccountEmail;
    if (tokens.primaryCalendar) {
      conn.calendarId = tokens.primaryCalendar.id;
      conn.calendarName = tokens.primaryCalendar.name;
    }
  }
  await persistTokens(conn, tokens);
  conn.lastSyncedAt = new Date();
  await conn.save();

  return { connection: conn.toJSON(), reconnected: !isNew, decodedState };
}

// ---------- Connection ops ----------

async function refreshAccessToken(connectionId) {
  const conn = await loadConnectionWithTokens(connectionId);
  const provider = getProvider(conn.provider);
  const { refreshToken } = decryptedTokens(conn);
  if (!refreshToken) {
    await markReauthRequired(conn, new Error('Missing refresh token'));
    throw new Error('Missing refresh token — reconnect required');
  }
  try {
    const refreshed = await provider.refreshAccessToken({ refreshToken });
    await persistTokens(conn, refreshed);
    return conn.toJSON();
  } catch (err) {
    if (err instanceof ProviderAuthError) await markReauthRequired(conn, err);
    else await markError(conn, err);
    throw err;
  }
}

async function listCalendars(connectionId) {
  return withAutoRefresh(connectionId, async (provider, tokens) => {
    return provider.listCalendars({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  });
}

// ---------- Busy-range cache ----------
// In-memory only — process-local. Phase 3 with multi-instance backend swaps
// this for Redis-backed cache. Cache key: connectionId + cal list hash + range.

const busyCache = new Map();
function busyCacheKey(connectionId, calendarIds, startUtc, endUtc) {
  const ids = (calendarIds || []).slice().sort().join(',');
  return `${connectionId}|${ids}|${new Date(startUtc).getTime()}|${new Date(endUtc).getTime()}`;
}
function pruneBusyCache(now) {
  for (const [k, v] of busyCache.entries()) {
    if (v.expiresAt <= now) busyCache.delete(k);
  }
}

async function getBusyRanges({ connectionId, calendarIds, startUtc, endUtc }) {
  const now = Date.now();
  pruneBusyCache(now);
  const key = busyCacheKey(connectionId, calendarIds, startUtc, endUtc);
  const cached = busyCache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const result = await withAutoRefresh(connectionId, async (provider, tokens) => {
    return provider.getBusyRanges({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      calendarIds,
      startUtc,
      endUtc,
    });
  });

  const ttl = (config.scheduler && config.scheduler.busyCacheTtlSeconds) || 120;
  busyCache.set(key, { value: result, expiresAt: now + ttl * 1000 });
  return result;
}

async function createExternalEvent({ connectionId, calendarId, payload }) {
  return withAutoRefresh(connectionId, async (provider, tokens) => {
    return provider.createEvent({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      calendarId,
      payload,
    });
  });
}

async function updateExternalEvent({ connectionId, calendarId, externalEventId, payload }) {
  return withAutoRefresh(connectionId, async (provider, tokens) => {
    return provider.updateEvent({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      calendarId,
      externalEventId,
      payload,
    });
  });
}

async function deleteExternalEvent({ connectionId, calendarId, externalEventId }) {
  return withAutoRefresh(connectionId, async (provider, tokens) => {
    return provider.deleteEvent({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      calendarId,
      externalEventId,
    });
  });
}

async function disconnect(connectionId) {
  const conn = await loadConnectionWithTokens(connectionId);
  const provider = getProvider(conn.provider);
  const { accessToken, refreshToken } = decryptedTokens(conn);
  try {
    await provider.revoke({ accessToken, refreshToken });
  } catch (_err) {
    // Best-effort revoke. We still delete locally so the user isn't stuck.
  }
  await CalendarConnection.deleteOne({ _id: conn._id });
  return { ok: true };
}

module.exports = {
  generateOAuthUrl,
  completeOAuthHandshake,
  refreshAccessToken,
  listCalendars,
  getBusyRanges,
  createExternalEvent,
  updateExternalEvent,
  deleteExternalEvent,
  disconnect,
  // Re-exports for legacy callers
  buildRedirectUri,
};
