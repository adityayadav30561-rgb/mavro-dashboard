const { BaseCalendarProvider } = require('./BaseCalendarProvider');

// ===================================
// OutlookCalendarProvider — Phase 3 stub
// ===================================
// The Outlook provider plugs into the same adapter contract as
// GoogleCalendarProvider but is deliberately unimplemented in Phase 2 per
// the MVP scope. Every method throws so the provider registry can list
// `outlook` as a known provider while still failing loudly if a caller tries
// to drive an Outlook connection.
//
// When Phase 3 lands the implementation:
//   - Swap `googleapis` for `@microsoft/microsoft-graph-client` + `@azure/msal-node`.
//   - Use the `https://graph.microsoft.com/Calendars.ReadWrite` + `offline_access` scopes.
//   - Map Graph's `/me/calendars/getSchedule` to getBusyRanges().
//   - Map Teams meetings via `onlineMeeting.providerInfo = 'teamsForBusiness'`
//     (mirrors Google Meet integration).
//
// The rest of the system (provider service, controllers, routes, dashboard)
// is provider-agnostic — only this file changes.

class OutlookCalendarProvider extends BaseCalendarProvider {
  static get providerName() {
    return 'outlook';
  }
  // Inherits throwing stubs from BaseCalendarProvider.
}

module.exports = OutlookCalendarProvider;
