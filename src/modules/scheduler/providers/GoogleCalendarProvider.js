const { google } = require('googleapis');
const crypto = require('crypto');
const config = require('../../../config');
const {
  BaseCalendarProvider,
  ProviderAuthError,
  ProviderTransientError,
} = require('./BaseCalendarProvider');

// ===================================
// GoogleCalendarProvider — real implementation
// ===================================
// Wraps the official `googleapis` SDK. All Google-specific knowledge
// (scopes, API surface, error semantics) lives inside this file. Nothing
// outside `providers/` imports `googleapis`.
//
// SCOPES (minimum required):
//   - calendar.events       — read+write events on user's calendars (for
//                             writing booking events + reading existing
//                             events to compute busy ranges)
//   - calendar.readonly     — read calendar list metadata
//   - openid + email + profile — fetch the connecting account's email so
//                             the dashboard can label "alice@gmail.com"
//                             vs "alice.work@gmail.com" connections.
//
// We intentionally do NOT request the broad `calendar` scope (full account
// access including ACL mutation) — events + readonly is enough for the
// scheduling use case.
//
// REFRESH TOKEN HANDLING:
//   Google only returns a refresh_token on the first consent (or if
//   `prompt=consent` is passed). We always pass `prompt=consent` + `access_type=offline`
//   on connect so reconnect flows reliably yield a refresh token.

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'openid',
  'email',
  'profile',
];

function mapGoogleError(err) {
  const status = err && err.response && err.response.status;
  const code = err && err.code;
  // Token expired / refresh failed — Google returns 401 (token expired)
  // or 400 with invalid_grant when the refresh token itself is revoked.
  if (status === 401) return new ProviderAuthError('Google access token expired');
  if (status === 400 && err.response && err.response.data && err.response.data.error === 'invalid_grant') {
    return new ProviderAuthError('Google refresh token revoked — re-authentication required');
  }
  if (status >= 500 || code === 'ETIMEDOUT' || code === 'ECONNRESET') {
    return new ProviderTransientError(`Google upstream error: ${status || code}`);
  }
  return err;
}

class GoogleCalendarProvider extends BaseCalendarProvider {
  static get providerName() {
    return 'google';
  }

  constructor() {
    super();
    const g = (config.scheduler && config.scheduler.google) || {};
    if (!g.clientId || !g.clientSecret) {
      throw new Error(
        'GoogleCalendarProvider: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET must be set'
      );
    }
    this.clientId = g.clientId;
    this.clientSecret = g.clientSecret;
  }

  // Per-request OAuth2 client so we don't share auth state across requests.
  _newClient({ accessToken, refreshToken, redirectUri } = {}) {
    const client = new google.auth.OAuth2(this.clientId, this.clientSecret, redirectUri);
    const creds = {};
    if (accessToken) creds.access_token = accessToken;
    if (refreshToken) creds.refresh_token = refreshToken;
    if (Object.keys(creds).length) client.setCredentials(creds);
    return client;
  }

  buildAuthUrl({ state, redirectUri }) {
    const client = this._newClient({ redirectUri });
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // force refresh-token on every connect
      scope: SCOPES,
      state,
      include_granted_scopes: true,
    });
  }

  async exchangeCode({ code, redirectUri }) {
    try {
      const client = this._newClient({ redirectUri });
      const { tokens } = await client.getToken(code);
      if (!tokens.refresh_token) {
        // Edge case: Google sometimes omits refresh_token if the user has
        // already granted us offline access in another session. Reject so
        // the dashboard can prompt for a fresh consent.
        throw new ProviderAuthError(
          'Google did not return a refresh_token — try disconnecting and reconnecting with prompt=consent'
        );
      }
      client.setCredentials(tokens);

      // Fetch the connecting account's email + primary calendar metadata
      // so the dashboard can label the connection clearly.
      const [userinfoRes, calRes] = await Promise.all([
        google.oauth2({ version: 'v2', auth: client }).userinfo.get(),
        google.calendar({ version: 'v3', auth: client }).calendarList.get({ calendarId: 'primary' }),
      ]);

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        providerAccountId: userinfoRes.data.id,
        providerAccountEmail: userinfoRes.data.email,
        primaryCalendar: {
          id: calRes.data.id,
          name: calRes.data.summary || calRes.data.id,
          timezone: calRes.data.timeZone || null,
        },
        scopesGranted: tokens.scope ? tokens.scope.split(' ') : SCOPES,
      };
    } catch (err) {
      throw mapGoogleError(err);
    }
  }

  async refreshAccessToken({ refreshToken }) {
    try {
      const client = this._newClient({ refreshToken });
      // googleapis exposes refresh via getAccessToken() which transparently
      // uses the refresh_token. We instead call refreshAccessToken() (deprecated
      // alias) for explicit semantics; modern API is `getAccessToken`.
      const { credentials } = await client.refreshAccessToken();
      return {
        accessToken: credentials.access_token,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        // Google sometimes rotates the refresh token; surface the new one
        // so the caller can persist it.
        refreshToken: credentials.refresh_token || null,
      };
    } catch (err) {
      throw mapGoogleError(err);
    }
  }

  async listCalendars({ accessToken, refreshToken }) {
    try {
      const client = this._newClient({ accessToken, refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: client });
      const res = await calendar.calendarList.list({ maxResults: 250, minAccessRole: 'reader' });
      const items = res.data.items || [];
      return items.map((c) => ({
        id: c.id,
        name: c.summary || c.id,
        timezone: c.timeZone || null,
        isPrimary: !!c.primary,
        accessRole: c.accessRole,
      }));
    } catch (err) {
      throw mapGoogleError(err);
    }
  }

  async getBusyRanges({ accessToken, refreshToken, calendarIds, startUtc, endUtc }) {
    try {
      const client = this._newClient({ accessToken, refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: client });
      const ids = Array.isArray(calendarIds) && calendarIds.length ? calendarIds : ['primary'];
      const res = await calendar.freebusy.query({
        requestBody: {
          timeMin: new Date(startUtc).toISOString(),
          timeMax: new Date(endUtc).toISOString(),
          items: ids.map((id) => ({ id })),
        },
      });
      const calendars = (res.data && res.data.calendars) || {};
      const out = [];
      for (const id of ids) {
        const cal = calendars[id];
        if (!cal || !Array.isArray(cal.busy)) continue;
        for (const b of cal.busy) {
          out.push({
            startUtc: new Date(b.start),
            endUtc: new Date(b.end),
            calendarId: id,
          });
        }
      }
      return out;
    } catch (err) {
      throw mapGoogleError(err);
    }
  }

  async createEvent({ accessToken, refreshToken, calendarId, payload }) {
    try {
      const client = this._newClient({ accessToken, refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: client });

      const wantsMeet = payload.locationType === 'google_meet';
      const requestId = `mavro-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const event = {
        summary: payload.summary,
        description: payload.description || '',
        start: { dateTime: new Date(payload.startUtc).toISOString(), timeZone: 'UTC' },
        end: { dateTime: new Date(payload.endUtc).toISOString(), timeZone: 'UTC' },
        attendees: payload.attendees || [],
        // Custom location when not using Meet (room address, phone bridge, etc.)
        location: !wantsMeet ? payload.locationValue || undefined : undefined,
      };
      if (wantsMeet) {
        event.conferenceData = {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        };
      }

      const res = await calendar.events.insert({
        calendarId: calendarId || 'primary',
        conferenceDataVersion: wantsMeet ? 1 : 0,
        sendUpdates: 'all',
        requestBody: event,
      });

      const created = res.data;
      let meetingLink = null;
      if (created.conferenceData && Array.isArray(created.conferenceData.entryPoints)) {
        const video = created.conferenceData.entryPoints.find((e) => e.entryPointType === 'video');
        if (video) meetingLink = video.uri;
      }
      if (!meetingLink && created.hangoutLink) meetingLink = created.hangoutLink;

      return {
        externalEventId: created.id,
        meetingLink,
        htmlLink: created.htmlLink || null,
        raw: undefined, // intentionally not surfaced — keeps serialization slim
      };
    } catch (err) {
      throw mapGoogleError(err);
    }
  }

  async updateEvent({ accessToken, refreshToken, calendarId, externalEventId, payload }) {
    try {
      const client = this._newClient({ accessToken, refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: client });
      const res = await calendar.events.patch({
        calendarId: calendarId || 'primary',
        eventId: externalEventId,
        sendUpdates: 'all',
        requestBody: {
          summary: payload.summary,
          description: payload.description,
          start: payload.startUtc
            ? { dateTime: new Date(payload.startUtc).toISOString(), timeZone: 'UTC' }
            : undefined,
          end: payload.endUtc
            ? { dateTime: new Date(payload.endUtc).toISOString(), timeZone: 'UTC' }
            : undefined,
          attendees: payload.attendees,
        },
      });
      return {
        externalEventId: res.data.id,
        meetingLink: res.data.hangoutLink || null,
        htmlLink: res.data.htmlLink || null,
      };
    } catch (err) {
      throw mapGoogleError(err);
    }
  }

  async deleteEvent({ accessToken, refreshToken, calendarId, externalEventId }) {
    try {
      const client = this._newClient({ accessToken, refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: client });
      await calendar.events.delete({
        calendarId: calendarId || 'primary',
        eventId: externalEventId,
        sendUpdates: 'all',
      });
      return { ok: true };
    } catch (err) {
      // 410 Gone = already deleted upstream. Treat as success.
      if (err && err.response && err.response.status === 410) return { ok: true };
      throw mapGoogleError(err);
    }
  }

  async revoke({ refreshToken, accessToken }) {
    try {
      const client = this._newClient({ accessToken, refreshToken });
      // googleapis offers `revokeCredentials()` which targets the access token.
      // The refresh token is auto-revoked when the access token + scope is
      // revoked at Google's end.
      await client.revokeCredentials();
      return { ok: true };
    } catch (err) {
      // Revocation failures shouldn't block local cleanup. Map auth errors
      // (already revoked) to success so disconnect is idempotent.
      const mapped = mapGoogleError(err);
      if (mapped instanceof ProviderAuthError) return { ok: true };
      throw mapped;
    }
  }
}

module.exports = GoogleCalendarProvider;
module.exports.SCOPES = SCOPES;
