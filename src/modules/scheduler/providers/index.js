const GoogleCalendarProvider = require('./GoogleCalendarProvider');
const OutlookCalendarProvider = require('./OutlookCalendarProvider');
const { BaseCalendarProvider, ProviderAuthError, ProviderTransientError } = require('./BaseCalendarProvider');
const config = require('../../../config');

// ===================================
// Provider registry — lazy singleton per provider
// ===================================
// We construct each provider once on first use and cache the instance. This
// keeps OAuth2 client construction cheap on the hot path (every busy-range
// query, every booking write).
//
// `getProvider('google')` returns a ready GoogleCalendarProvider, or throws
// a clear error if its env is missing. `getProvider('outlook')` returns the
// stub — callers will hit per-method `not implemented` only when they invoke
// a method, not at registry lookup time.

const registry = {};

function getProvider(name) {
  if (!name) throw new Error('getProvider: provider name required');
  const key = String(name).toLowerCase();
  if (registry[key]) return registry[key];
  switch (key) {
    case 'google': {
      // Lazy env check — if Google env is incomplete we throw a 503-style
      // error so the route can return a clean message instead of crashing.
      const g = (config.scheduler && config.scheduler.google) || {};
      if (!g.clientId || !g.clientSecret) {
        const err = new Error('Google Calendar integration is not configured on this server');
        err.statusCode = 503;
        throw err;
      }
      registry[key] = new GoogleCalendarProvider();
      return registry[key];
    }
    case 'outlook':
      registry[key] = new OutlookCalendarProvider();
      return registry[key];
    default: {
      const err = new Error(`Unknown calendar provider: ${name}`);
      err.statusCode = 400;
      throw err;
    }
  }
}

function isProviderConfigured(name) {
  const key = String(name || '').toLowerCase();
  if (key === 'google') {
    const g = (config.scheduler && config.scheduler.google) || {};
    return !!(g.clientId && g.clientSecret);
  }
  if (key === 'outlook') return false; // Phase 3
  return false;
}

module.exports = {
  getProvider,
  isProviderConfigured,
  BaseCalendarProvider,
  ProviderAuthError,
  ProviderTransientError,
};
