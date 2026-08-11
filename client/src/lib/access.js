// ════════════════════════════════════════════════════════════════════════════
// Client-side view of what a role may open — single source of truth.
// ────────────────────────────────────────────────────────────────────────────
// This is WAYFINDING, not security. The real gate is blockRoles() on the
// Express routers; a restricted user who types a URL by hand gets bounced here
// and would get a 403 from the API even if they didn't.
//
// Roles absent from RESTRICTED_ROLE_ROUTES have unrestricted client routing.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Route path prefixes each restricted role may open, plus where to send them
 * when they land anywhere else (including `/`).
 */
const RESTRICTED_ROLE_ROUTES = {
  leads_agent: { allow: ['/leads', '/saisatwik-leads'], home: '/leads' },
};

/** The landing route for a role — restricted roles skip the Dashboard. */
export function homeRouteFor(role) {
  return RESTRICTED_ROLE_ROUTES[role]?.home || '/';
}

/** True when the role may open this pathname. */
export function canAccessRoute(role, pathname) {
  const rule = RESTRICTED_ROLE_ROUTES[role];
  if (!rule) return true;
  return rule.allow.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** True when the role is limited to a subset of the admin. */
export function isRestrictedRole(role) {
  return Boolean(RESTRICTED_ROLE_ROUTES[role]);
}
