# Spanbix on Vercel — Frontend Deployment Readiness

**Status:** Architecture prepared, NOT yet deployed.
**Phase:** 5.3 — public-isolation hardening + Vercel readiness.
**Scope:** frontend only. Backend hosting unchanged. No SSR, no Next.js migration.

This document is the operational source of truth for the Spanbix Vercel deploy. Read it before any future deploy or rollback.

---

## 0. Build target switching (Phase 5.4 — Option B2)

Multiple frontend deploys ship from the **same source tree** via the `VITE_BUILD_TARGET` env var:

| Target | Entry HTML | Entry JS | Routing tree | Output |
|---|---|---|---|---|
| `full` (default) | `index.html` | `src/main.jsx` | `App.jsx` — every public site under `/spanbix/*` `/hrms/*` `/tickets/*` + admin routes | `dist/index.html` |
| `spanbix` | `index.spanbix.html` | `src/entries/spanbix.jsx` | `SpanbixApp.jsx` — Spanbix routes at root (`/`, `/courses`, `/blog`, etc.) | `dist/index.html` (auto-promoted by Vite plugin) |
| `hrms` (reserved) | `index.hrms.html` | `src/entries/hrms.jsx` | future `HrmsApp.jsx` | `dist/index.html` |
| `tickets` (reserved) | `index.tickets.html` | `src/entries/tickets.jsx` | future `TicketsApp.jsx` | `dist/index.html` |

How it works:
1. `vite.config.js` reads `process.env.VITE_BUILD_TARGET` at build time.
2. Selects the matching `index.<target>.html` as the rollup entry.
3. `define` block bakes the target into the bundle so `lib/routeBase.js → withSpanbixBase()` returns the correct prefix (`''` for standalone, `/spanbix` for full).
4. A `closeBundle` plugin promotes `dist/index.<target>.html` to `dist/index.html` after build so Vercel serves it as the default document.
5. `manualChunks` excludes admin-only deps (Recharts, Quill, Radix) from standalone Spanbix builds because `SpanbixApp.jsx` never imports them.

**Local test commands:**
```bash
# Standalone Spanbix dev server (routes at /)
cd client
npm run dev:spanbix
# → http://localhost:5173/  → SpanbixLanding
# → http://localhost:5173/blog → SpanbixBlogList

# Full Mavro Console dev server (existing behaviour, Spanbix at /spanbix/*)
npm run dev

# Build standalone Spanbix
npm run build:spanbix
# → dist/index.html (Spanbix-only) + assets/* (no Recharts, no Quill, no Radix)

# Build full Mavro Console
npm run build:full

# Quick output inspection
ls -la dist/
```

**One-time setup:** install `cross-env` if not already present (added to `devDependencies`):
```bash
cd client
npm install
```

---

## 1. Deployment-readiness summary

The Mavro frontend can now be deployed to Vercel as a public-only Spanbix property while still powered by the existing Express + MongoDB backend.

What changed in Phase 5.3:

| Concern | Before | After |
|---|---|---|
| API base URL | hardcoded relative `/api` in 3 axios clients + `analytics.js` raw fetch | centralized in `client/src/lib/apiBase.js` → driven by `VITE_API_BASE_URL` |
| Admin bundle | eager-imported in `App.jsx` — shipped to every public visitor | code-split via `React.lazy` — admin chunks load only when an admin user navigates to `/login` or a protected route |
| Vite build | default config — no manual chunking, no Vercel awareness | predictable chunk names, manual chunks for Recharts / Quill / Radix, Vercel-aware build path |
| Vercel config | none | `client/vercel.json` with SPA rewrite, security headers, asset cache policy, sitemap/robots backend rewrite (placeholder backend URL) |
| Env contract | undocumented | `client/.env.example` with single `VITE_API_BASE_URL` switch |

What did NOT change (per constraints):
- Backend (`src/`) untouched
- Mongo schema untouched
- Centralized SEO engine + analytics service + AI orchestration untouched
- Existing Mavro dashboard ecosystem untouched
- No SSR, no Next.js

---

## 2. Routing architecture summary

`client/src/App.jsx` is the single router with three route classes:

1. **Public marketing routes** — eager-imported (first-paint critical):
   - `/hrms`, `/hrms/blog`, `/hrms/blog/:slug`
   - `/tickets`, `/tickets/blog`, `/tickets/blog/:slug`
   - `/spanbix`, `/spanbix/courses`, `/spanbix/career-paths`, `/spanbix/career-paths/:code`, `/spanbix/campus-programs`, `/spanbix/placements`, `/spanbix/demo-classes`, `/spanbix/about`, `/spanbix/contact`, `/spanbix/blog`, `/spanbix/blog/:slug`

2. **Auth route** — lazy: `/login`

3. **Admin routes** — lazy + protected by `<ProtectedRoute>`:
   - `/` (Dashboard), `/blogs`, `/blogs/new`, `/blogs/:id/edit`, `/leads`, `/websites`, `/seo`, `/analytics`, `/calendar`, `/test-ui`

Provider tree (`client/src/main.jsx`):
```
BrowserRouter → ThemeProvider → AuthProvider → TenantProvider → <App />
```

- `AuthProvider` only fires `/api/auth/me` when a token exists in `localStorage` → public visitors trigger zero auth requests.
- `TenantProvider` only fetches `/api/websites` when `user` is set → public visitors trigger zero tenant fetches.
- `ThemeProvider` is purely client-side CSS-class management.

Deep-link refresh: Vercel SPA rewrite (`/(.*) → /index.html`) means every public URL serves the React app, which then resolves the route client-side. Tested patterns:
- `/spanbix/career-paths/fico` ✅
- `/spanbix/blog/<slug>` ✅
- `/spanbix/career-paths/fico?mode=campus` ✅ (query param preserved through rewrite)

---

## 3. Environment variable structure

Single client-facing variable lives in `client/.env` (gitignored) or Vercel env settings:

```
VITE_API_BASE_URL=https://<backend-host>
```

| Mode | `VITE_API_BASE_URL` | Behaviour |
|---|---|---|
| Local dev | unset | `apiPath()` returns relative `/api/...`; Vite dev proxy forwards to `localhost:5000` |
| Co-hosted prod (current Mavro deploy) | unset | Same-origin `/api/...`; Express serves both React build + API |
| Independent Vercel deploy | `https://api.spanbix.com` | axios + analytics beacon issue absolute requests to remote backend |

Vite exposes only `VITE_*` vars to client code. Anything else in `.env` stays server-side. **Never** put backend secrets (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) in `client/.env` — they would leak into the bundle.

---

## 4. Vercel readiness status

`client/vercel.json` is provisioned with:

- `framework: vite` + `buildCommand: npm run build` + `outputDirectory: dist`
- SPA rewrite catch-all → `/index.html`
- `/sitemap/:path*` + `/robots/:path*` rewrite to a placeholder backend URL — **REPLACE BEFORE FIRST DEPLOY**
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`
- Cache policy: hashed assets `immutable` for 1y; HTML `must-revalidate`
- `cleanUrls: true`, `trailingSlash: false`

**Before first deploy you must:**
1. Replace `https://placeholder-backend.example.com` in `client/vercel.json` (two occurrences) with the real backend URL — e.g. `https://api.spanbix.com` or your Render/Railway/etc. host.
2. Set `VITE_API_BASE_URL` in Vercel project settings to the same backend URL.
3. Update backend `CORS_ORIGIN` to include the Vercel domain (e.g. `https://spanbix.vercel.app`, then your custom domain).
4. Update each `Website.domain` for Spanbix in MongoDB once the production hostname is live so canonical URLs + sitemaps reflect production.

---

## 5. Public/admin separation validation

| Surface | Public exposure | Admin exposure | Verified |
|---|---|---|---|
| Eager-imported JS | HRMS + Tickets + Spanbix page chunks + React/Router framework | nothing admin in initial bundle | ✅ via `React.lazy` for admin routes |
| `AuthProvider` | renders briefly with no-op (no token → no fetch) | reads token, hits `/api/auth/me` | ✅ |
| `TenantProvider` | mounts with empty websites, no fetch | fetches `/api/websites` once user is set | ✅ |
| `ProtectedRoute` | lazy-loaded — never reached on public routes | gates the entire `DashboardLayout` subtree | ✅ |
| `axios` (auth interceptor) | imported only by admin modules that lazy-load | attaches `Bearer` token from localStorage | ✅ |
| `publicApi` | used by public site components for blog/lead/website lookups | unused | ✅ |

Public bundle does NOT execute any admin code path on first paint. Verified by inspecting `App.jsx` import graph: public route files import only `lib/spanbixSeo`, `hooks/useSEO`, `hooks/useTrackPageView`, `lib/analytics`, `api/public`, and React Router primitives.

---

## 6. Remaining blockers before deployment

1. **Replace placeholder backend URL** in `client/vercel.json` rewrites (sitemap + robots).
2. **Set `VITE_API_BASE_URL`** in Vercel project settings.
3. **Update backend `CORS_ORIGIN`** to allow the Vercel domain.
4. **Ensure backend is publicly reachable** — current dev URL is `localhost:5000`. Until the Express app is hosted (Render/Railway/Fly/etc.) and reachable over HTTPS with a stable hostname, the Vercel frontend cannot complete any API call.
5. **Update Spanbix `Website.domain`** in MongoDB once a production hostname is finalized — sitemap URLs + `useSEO` canonicals derive from this field.
6. **Decide sitemap strategy** — see §7. Either Vercel rewrites `/sitemap/*` to the backend, OR we generate a static sitemap snapshot at build time and serve it from the Vercel CDN.
7. **Reseed Spanbix tenant** with the production `Website.domain` once known. The auto-bootstrap in `server.js` will refresh content fields on every boot.

None of these are code changes; they are operational configuration steps.

---

## 7. SSR migration considerations (for later, not now)

Current architecture is client-rendered SPA. For SEO-critical Spanbix public pages, this is **acceptable but not optimal** because:

- Google's main indexer renders JS, but discovery + ranking benefit from server-rendered HTML.
- Social-share preview generators (LinkedIn, X, Slack) do NOT execute JS — `useSEO` meta tags are injected at runtime, so OG/Twitter previews see only the `index.html` defaults.
- Time-to-first-paint is bounded by the React hydration cycle.

When/if SSR becomes worth the migration cost, two paths exist:

**Path A — keep Vite, add SSR via `vite-plugin-ssr` or React Server Components in Vite.**
- Pros: stays in current toolchain. Minimal disruption to existing components.
- Cons: ecosystem maturity is uneven; tooling churn.

**Path B — migrate Spanbix only to Next.js 14 as a separate frontend app.**
- Public Spanbix lives in a fresh Next.js repo, talks to the same Express backend over `VITE_API_BASE_URL`-equivalent env var.
- Admin dashboard stays on the existing Vite app.
- Pros: best-in-class SSR + ISR + image optimization + Vercel-native.
- Cons: two frontend codebases to maintain. Brand + tone constants in `lib/spanbixSeo.js` need to be ported.

**Recommendation when the time comes:** Path B. The public Spanbix marketing surface is a strong candidate for ISR (incremental static regeneration) because blog content updates on publish, and Next.js gives that for free. The admin dashboard's complexity (Quill, Recharts, multi-tab cockpit) is not worth re-platforming.

For now, ship the SPA on Vercel. Revisit when organic traffic justifies the SSR investment.

---

## 8. Production deployment recommendations

When you are ready to deploy:

### Prep (one-time)

1. Pick a backend host (Render, Railway, Fly, or self-hosted). Confirm it serves `https://<host>/api/health` with a 200.
2. In Vercel: create **one project per public property** (Option B2 architecture). All projects point at this same repo, all use `client/` as the Root Directory.
3. Per-project Vercel Build Settings:
   - **Spanbix project (`spanbix.vercel.app` / spanbix.com):**
     - Framework Preset: `Vite`
     - Build Command: `npm run build:spanbix`  (or set `VITE_BUILD_TARGET=spanbix` env var + use default `npm run build` via vercel.json)
     - Output Directory: `dist`
     - Install Command: `npm install`
   - **HRMS / Tickets projects:** future — same pattern with `build:hrms` / `build:tickets`.
   - **Mavro Console project (`dashboard.mavro.com`):** Build Command `npm run build:full`.
4. Vercel Environment Variables per project:
   - `VITE_API_BASE_URL=https://<your-backend-host>` (Production + Preview)
   - `VITE_BUILD_TARGET=spanbix` (or `full` / `hrms` / `tickets` depending on project)
5. Edit `client/vercel.json`: replace both `placeholder-backend.example.com` occurrences with your real backend host. The committed `vercel.json` already points the build at `npm run build:spanbix` — if you also use this repo for a Mavro Console deploy, that project should override the Build Command in its Vercel settings (project-level setting wins over `vercel.json` when both define one).

### Backend prep

1. Set `CORS_ORIGIN` env var to include the Vercel domain(s). Comma-separated: `https://spanbix.vercel.app,https://spanbix.com`.
2. Ensure backend is publicly accessible over HTTPS.
3. Run `npm run seed:spanbix` once on the backend to materialize the Spanbix `Website` row (or just restart — auto-bootstrap will do it).

### First deploy

1. `git push` → Vercel auto-builds.
2. Verify `https://<vercel-domain>/spanbix` renders.
3. Open DevTools → Network → confirm API calls hit the remote backend host, not the Vercel domain.
4. Submit a test lead from `/spanbix/contact` → verify it appears in `/leads` of the admin dashboard.
5. Visit `/spanbix/blog` → confirm published blogs render.
6. Tail backend logs → confirm `setAnalyticsTenant('spanbix')` events arriving with `websiteSlug: 'spanbix'`.

### Custom domain

1. Point your DNS (e.g. `spanbix.com`) to Vercel via the project's Domains tab.
2. Update `Website.domain` for the Spanbix row in MongoDB to `spanbix.com` (drop the `/spanbix` path prefix — production hostname uses the root).
3. Update `lib/spanbixSeo.js → SPANBIX_SITE.url` if needed (currently `https://spanbix.com` — already correct).
4. Trigger a backend restart so the auto-bootstrap refreshes `Website.seoDefaults` against the new hostname.
5. Submit `https://spanbix.com/sitemap/spanbix.xml` to Google Search Console + Bing Webmaster.

### Rollback plan

- Vercel: instant rollback via project's Deployments tab — click the previous deployment → "Promote to Production".
- Backend: rollback to the previous git tag and redeploy. No DB migration required.
- Spanbix `Website` row: untouched by frontend rollback; admins can edit via `/websites`.

---

## Quick reference

| Path | Purpose |
|---|---|
| `client/src/lib/apiBase.js` | Single source of truth for API origin resolution |
| `client/src/api/axios.js` | Authenticated axios instance (admin) |
| `client/src/api/public.js` | Unauthenticated axios instance (public + analytics) |
| `client/src/api/seo.js` | Sitemap + GSC stubs (admin only) |
| `client/src/lib/analytics.js` | `sendBeacon` analytics tracker (public + admin) |
| `client/src/App.jsx` | Route table with lazy admin chunks |
| `client/vercel.json` | SPA rewrites + headers + cache policy |
| `client/.env.example` | Env contract documentation |
| `client/vite.config.js` | Build chunking + dev proxy switch |
| `src/utils/seedSpanbix.js` | Idempotent tenant bootstrap |
| `src/server.js` | Calls `upsertSpanbixTenant({ silent: true })` on boot |

*End of deployment readiness document. Update before each subsequent deploy.*
