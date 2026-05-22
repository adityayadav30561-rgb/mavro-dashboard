// ════════════════════════════════════════════════════════════════════════════
// API base URL resolution — single source of truth.
// ────────────────────────────────────────────────────────────────────────────
// Three deploy modes the Mavro frontend has to survive:
//
//   1. Local dev (Vite dev server on :5173)
//      - VITE_API_BASE_URL not set → `apiBase()` returns '' (empty)
//      - `apiPath('/api/x')` → '/api/x' (relative) → Vite proxy forwards to :5000
//
//   2. Co-hosted production (Express serves the static React build at /)
//      - VITE_API_BASE_URL not set → '' (empty)
//      - `apiPath('/api/x')` → '/api/x' (relative to the same origin)
//
//   3. Independent public deploy (e.g. Spanbix on Vercel, backend elsewhere)
//      - VITE_API_BASE_URL=https://api.spanbix.com  (set at Vercel build time)
//      - `apiPath('/api/x')` → 'https://api.spanbix.com/api/x' (absolute)
//
// All axios clients + the raw analytics `fetch()` / `navigator.sendBeacon()`
// must route through `apiPath()` so the frontend can be moved to a separate
// host without rewriting every call site.
//
// Edge: trailing slashes are stripped so `apiPath('/x')` is always safe.
// ════════════════════════════════════════════════════════════════════════════

function rawBase() {
  // Vite replaces `import.meta.env.VITE_API_BASE_URL` at build time. When the
  // var is unset (dev + co-hosted prod), default to '' so paths stay relative.
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, '');
  }
  return '';
}

/**
 * Returns the API origin (no trailing slash). Empty string means "same-origin".
 * Consumers that need a full URL (e.g. sendBeacon) should call `apiPath()`
 * rather than concatenating manually.
 */
export function apiBase() {
  return rawBase();
}

/**
 * Joins the API base with a path. Path must start with a leading slash.
 *   apiPath('/api/blogs')  → '' + '/api/blogs'  = '/api/blogs' (relative)
 *                          → 'https://api...'   + '/api/blogs' (absolute)
 */
export function apiPath(path) {
  if (typeof path !== 'string' || !path) return rawBase();
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${rawBase()}${clean}`;
}

/**
 * Returns true iff the frontend is configured to talk to an external API
 * origin (i.e. VITE_API_BASE_URL is set). Useful for cross-origin code paths
 * that need to opt into `credentials: 'include'` or CORS-aware fetches.
 */
export function isExternalApi() {
  return rawBase().length > 0;
}
