const { CalendarConnection } = require('../models');
const { asyncHandler, ApiResponse } = require('../../../utils');
const { assertTenantAccess } = require('../utils/tenantGuard');
const calendarProviderService = require('../services/calendarProviderService');
const { isProviderConfigured } = require('../providers');
const analytics = require('../utils/analytics');
const config = require('../../../config');
const { verifyOAuthState } = require('../utils/oauthState');

// ===================================
// CalendarConnection controller
// ===================================
// Three groups of endpoints:
//   1. JWT-protected CRUD (list/get/delete)
//   2. JWT-protected OAuth init (POST /google/connect → URL)
//   3. UNAUTHENTICATED OAuth callback (GET /google/callback) — identity carried
//      by the signed state JWT, NOT by an Authorization header (Google won't send one).

// ----- CRUD -----

const listConnections = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  const accessibleIds = req.user.getAccessibleWebsiteIds();
  if (accessibleIds !== null) filter.tenant = { $in: accessibleIds };
  if (req.query.tenant) filter.tenant = req.query.tenant;
  const connections = await CalendarConnection.find(filter)
    .populate('tenant', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
  // lean() bypasses toJSON transforms — strip secret fields manually.
  for (const c of connections) {
    delete c.accessToken;
    delete c.refreshToken;
    delete c.tokenExpiry;
    delete c.scopesGranted;
    delete c.lastError;
  }
  return ApiResponse.success(res, {
    connections,
    providerStatus: {
      google: isProviderConfigured('google'),
      outlook: isProviderConfigured('outlook'),
    },
  });
});

const getConnection = asyncHandler(async (req, res) => {
  const conn = await CalendarConnection.findById(req.params.id).populate('tenant', 'name slug');
  if (!conn) return ApiResponse.error(res, 'CalendarConnection not found', 404);
  await assertTenantAccess(req.user, conn.tenant._id || conn.tenant);
  if (String(conn.user) !== String(req.user._id)) {
    return ApiResponse.error(res, 'You can only view your own calendar connections', 403);
  }
  return ApiResponse.success(res, { connection: conn.toJSON() });
});

const deleteConnection = asyncHandler(async (req, res) => {
  const conn = await CalendarConnection.findById(req.params.id);
  if (!conn) return ApiResponse.error(res, 'CalendarConnection not found', 404);
  await assertTenantAccess(req.user, conn.tenant);
  if (String(conn.user) !== String(req.user._id)) {
    return ApiResponse.error(res, 'You can only disconnect your own calendar connections', 403);
  }
  await calendarProviderService.disconnect(conn._id);
  analytics.emit({
    action: 'calendar_disconnected',
    tenantId: conn.tenant,
    userId: req.user._id,
    meta: { provider: conn.provider, providerAccountEmail: conn.providerAccountEmail },
  });
  return ApiResponse.success(res, null, 'Connection removed');
});

// ----- OAuth init -----

// GET /google/connect?tenant=<id>  → 302 to Google auth URL
// We use GET + 302 (rather than POST → JSON URL) so the browser can be
// redirected directly from a `<a href>` in the dashboard.
const initGoogleConnect = asyncHandler(async (req, res) => {
  const tenantId = req.query.tenant;
  if (!tenantId) return ApiResponse.error(res, 'tenant query param is required', 400);
  await assertTenantAccess(req.user, tenantId);
  if (!isProviderConfigured('google')) {
    return ApiResponse.error(res, 'Google Calendar integration is not configured on this server', 503);
  }
  const { url } = calendarProviderService.generateOAuthUrl({
    provider: 'google',
    userId: req.user._id,
    tenantId,
  });
  // If the client wants JSON back (XHR), honor Accept header.
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return ApiResponse.success(res, { url });
  }
  return res.redirect(url);
});

// ----- OAuth callback (NO AUTH MIDDLEWARE) -----
// Identity flows from the signed `state` JWT. Google calls this URL
// directly; there's no JWT bearer header to authenticate the request.

const googleCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  const dashboardBase = config.scheduler.dashboardCallbackUrl;

  function redirectWithStatus(qs) {
    const url = new URL(dashboardBase);
    Object.entries(qs).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    return res.redirect(url.toString());
  }

  if (error) {
    return redirectWithStatus({ schedulerStatus: 'error', code: error });
  }
  if (!code || !state) {
    return redirectWithStatus({ schedulerStatus: 'error', code: 'missing_code_or_state' });
  }
  try {
    const { connection, reconnected, decodedState } =
      await calendarProviderService.completeOAuthHandshake({
        provider: 'google',
        code,
        state,
      });
    analytics.emit({
      action: reconnected ? 'calendar_reauthorized' : 'calendar_connected',
      tenantId: decodedState.tenantId,
      userId: decodedState.userId,
      meta: { provider: 'google', providerAccountEmail: connection.providerAccountEmail },
    });
    return redirectWithStatus({
      schedulerStatus: reconnected ? 'reconnected' : 'connected',
      provider: 'google',
      connectionId: connection._id,
    });
  } catch (err) {
    // State verification or token exchange failure
    return redirectWithStatus({
      schedulerStatus: 'error',
      code: err && err.message ? err.message.slice(0, 120) : 'oauth_failed',
    });
  }
});

// ----- Calendar listing + preferences -----

const listConnectionCalendars = asyncHandler(async (req, res) => {
  const conn = await CalendarConnection.findById(req.params.id);
  if (!conn) return ApiResponse.error(res, 'Connection not found', 404);
  await assertTenantAccess(req.user, conn.tenant);
  if (String(conn.user) !== String(req.user._id)) {
    return ApiResponse.error(res, 'You can only view your own connections', 403);
  }
  const calendars = await calendarProviderService.listCalendars(conn._id);
  return ApiResponse.success(res, { calendars });
});

const updateConnectionPreferences = asyncHandler(async (req, res) => {
  const conn = await CalendarConnection.findById(req.params.id);
  if (!conn) return ApiResponse.error(res, 'Connection not found', 404);
  await assertTenantAccess(req.user, conn.tenant);
  if (String(conn.user) !== String(req.user._id)) {
    return ApiResponse.error(res, 'You can only update your own connections', 403);
  }
  // Allowed patches only — never mutate token / tenant / provider fields.
  const allowed = ['selectedCalendars', 'checkConflicts', 'writeEvents'];
  for (const k of allowed) {
    if (k in req.body) conn[k] = req.body[k];
  }
  // Validate the selectedCalendars primary invariant — at most one isPrimary=true
  if (Array.isArray(conn.selectedCalendars)) {
    const primaries = conn.selectedCalendars.filter((c) => c.isPrimary);
    if (primaries.length > 1) {
      return ApiResponse.error(res, 'Only one calendar can be primary per connection', 422);
    }
  }
  await conn.save();
  return ApiResponse.success(res, { connection: conn.toJSON() }, 'Preferences updated');
});

const refreshConnection = asyncHandler(async (req, res) => {
  const conn = await CalendarConnection.findById(req.params.id);
  if (!conn) return ApiResponse.error(res, 'Connection not found', 404);
  await assertTenantAccess(req.user, conn.tenant);
  if (String(conn.user) !== String(req.user._id)) {
    return ApiResponse.error(res, 'You can only refresh your own connections', 403);
  }
  const updated = await calendarProviderService.refreshAccessToken(conn._id);
  return ApiResponse.success(res, { connection: updated }, 'Token refreshed');
});

module.exports = {
  listConnections,
  getConnection,
  deleteConnection,
  initGoogleConnect,
  googleCallback,
  listConnectionCalendars,
  updateConnectionPreferences,
  refreshConnection,
};
