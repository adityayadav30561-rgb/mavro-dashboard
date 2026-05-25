// ===================================
// BaseCalendarProvider — adapter contract
// ===================================
// Every provider adapter (Google, Outlook, future iCloud, ...) implements
// the same surface. calendarProviderService dispatches through a provider
// registry keyed on `CalendarConnection.provider`.
//
// Why an abstract base instead of duck-typing:
//   - Forces every method to exist (throws Unimplemented otherwise).
//   - Single place to document the wire contract — return shapes are stable
//     across providers so downstream services (availability engine, booking
//     service) never branch on provider.
//
// Returned shapes — single source of truth:
//   buildAuthUrl({ state, redirectUri }) → string
//   exchangeCode({ code, redirectUri })   → { accessToken, refreshToken, expiresAt, providerAccountId, providerAccountEmail, primaryCalendar: { id, name, timezone } }
//   refreshAccessToken({ refreshToken })  → { accessToken, expiresAt, refreshToken? }
//   listCalendars({ accessToken })        → [{ id, name, timezone, isPrimary, accessRole }]
//   getBusyRanges({ accessToken, calendarIds, startUtc, endUtc })
//                                         → [{ startUtc: Date, endUtc: Date, calendarId }]
//   createEvent({ accessToken, calendarId, payload })
//                                         → { externalEventId, meetingLink, htmlLink, raw }
//   updateEvent({ accessToken, calendarId, externalEventId, payload })
//                                         → { externalEventId, meetingLink, htmlLink, raw }
//   deleteEvent({ accessToken, calendarId, externalEventId })
//                                         → { ok: true }
//   revoke({ refreshToken })              → { ok: true }
//
// Error contract:
//   Throw `ProviderAuthError` for expired / revoked tokens — calendarProviderService
//   maps that to CalendarConnection.status = 'reauth_required'.
//   Throw `ProviderTransientError` for retryable upstream failures (5xx, network).
//   Throw `Error` for everything else.

class ProviderAuthError extends Error {
  constructor(message = 'Provider auth failed') {
    super(message);
    this.name = 'ProviderAuthError';
    this.code = 'PROVIDER_AUTH';
  }
}

class ProviderTransientError extends Error {
  constructor(message = 'Provider transient error') {
    super(message);
    this.name = 'ProviderTransientError';
    this.code = 'PROVIDER_TRANSIENT';
  }
}

class BaseCalendarProvider {
  static get providerName() {
    throw new Error('providerName must be set on subclass');
  }

  buildAuthUrl() {
    throw new Error('buildAuthUrl: not implemented');
  }

  async exchangeCode() {
    throw new Error('exchangeCode: not implemented');
  }

  async refreshAccessToken() {
    throw new Error('refreshAccessToken: not implemented');
  }

  async listCalendars() {
    throw new Error('listCalendars: not implemented');
  }

  async getBusyRanges() {
    throw new Error('getBusyRanges: not implemented');
  }

  async createEvent() {
    throw new Error('createEvent: not implemented');
  }

  async updateEvent() {
    throw new Error('updateEvent: not implemented');
  }

  async deleteEvent() {
    throw new Error('deleteEvent: not implemented');
  }

  async revoke() {
    throw new Error('revoke: not implemented');
  }
}

module.exports = {
  BaseCalendarProvider,
  ProviderAuthError,
  ProviderTransientError,
};
