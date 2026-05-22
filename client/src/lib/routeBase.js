// ════════════════════════════════════════════════════════════════════════════
// Route base resolver — single source of truth for per-tenant URL prefixes.
// ────────────────────────────────────────────────────────────────────────────
// The Mavro frontend ships in multiple build targets driven by VITE_BUILD_TARGET:
//
//   full     (default) — Mavro Console + every public site under one app.
//                        Spanbix lives at /spanbix/*, HRMS at /hrms/*, etc.
//   spanbix            — standalone Spanbix deploy at spanbix.com (or
//                        spanbix.vercel.app). Spanbix routes live at the root:
//                        /, /courses, /career-paths/:code, /blog/:slug, etc.
//   hrms / tickets     — reserved for future standalone HRMS / Tickets deploys.
//
// `withSpanbixBase(path)` is the helper every Spanbix component uses when
// emitting `<Link to>`. The same component code runs in both build targets;
// the helper resolves to '/spanbix/blog' or '/blog' depending on target.
//
//   <Link to={withSpanbixBase('/blog')}>      → '/spanbix/blog' (full)
//                                             → '/blog'         (spanbix)
//
// Build-time read of VITE_BUILD_TARGET means the path strings are baked into
// the bundle — no runtime branch on every render.
// ════════════════════════════════════════════════════════════════════════════

const TARGET = import.meta.env.VITE_BUILD_TARGET || 'full';

// Standalone Spanbix deploys mount Spanbix at the root. Every other build
// target keeps the /spanbix prefix.
const SPANBIX_PREFIX = TARGET === 'spanbix' ? '' : '/spanbix';
const HRMS_PREFIX = TARGET === 'hrms' ? '' : '/hrms';
const TICKETS_PREFIX = TARGET === 'tickets' ? '' : '/tickets';

function joinBase(prefix, path) {
  if (typeof path !== 'string' || !path) {
    // Empty path → return root for the tenant. In standalone mode that's '/',
    // in full mode that's '/spanbix' (no trailing slash).
    return prefix || '/';
  }
  // The Spanbix landing route is "/" in standalone mode and "/spanbix" in full.
  // Callers pass '/' to mean "tenant root"; preserve that semantics.
  if (path === '/') return prefix || '/';
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${prefix}${clean}`;
}

export function withSpanbixBase(path) {
  return joinBase(SPANBIX_PREFIX, path);
}

export function withHrmsBase(path) {
  return joinBase(HRMS_PREFIX, path);
}

export function withTicketsBase(path) {
  return joinBase(TICKETS_PREFIX, path);
}

export function getBuildTarget() {
  return TARGET;
}

export function isStandaloneSpanbix() {
  return TARGET === 'spanbix';
}
