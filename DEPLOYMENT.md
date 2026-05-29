# Spanbix on Vercel — Frontend Deployment Readiness

**Status:** Spanbix LIVE at `https://www.spanbix.com` on the standalone **Next.js 16 App Router** app at `spanbix-web/`. Backend LIVE on Render. Multi-property build-target architecture (Vite) still active for the Mavro admin + HRMS + Tickets surfaces.
**Phase:** 6.5 — SSR migration, canonical cutover to www, SEO audit fixes (author byline, security headers, HSTS preload) complete.
**Scope:** covers BOTH the original Vite multi-tenant deploy AND the Phase 6 Spanbix-only Next.js sub-app. Sections 0–7 below describe the Vite path (still relevant for the admin / HRMS / Tickets builds). Section 7 ("SSR migration considerations") is now historical — see Section 8 below + [PROJECT_CONTEXT.md Phase 6](./PROJECT_CONTEXT.md) and [spanbix-web/README.md](./spanbix-web/README.md) for the live Next architecture.

## Critical gotchas observed during real deploys (read this first)

1. **NEVER set `cleanUrls: true` in `vercel.json`** — it makes Vercel try `/<path>.html` before SPA-fallback rewrites fire, returning 404 on every deep-link refresh. Vite emits a single `dist/index.html`; cleanUrls expects per-route HTML files that don't exist.
2. **NEVER use aggressive Vite `manualChunks` that separate React from its peer libraries** (framer-motion, react-hot-toast, etc.). Module-init order across non-direct deps isn't guaranteed → libraries calling `React.createContext(...)` at module load crash with `Cannot read properties of undefined (reading 'createContext')`. Letting Rollup auto-split keeps React co-located with peers in the same chunk.
3. **Render backend-only deploys need `SERVE_CLIENT=false` env var** (or rely on the auto-detect in `src/app.js`). Without the gate, Express tries `client/dist/index.html` which doesn't exist on Render → ENOENT crash on `/`. The fixed `app.js` skips the static-serve block when the file isn't present.
4. **`devTargetHtmlPlugin` middleware in `vite.config.js` is mandatory for `dev:spanbix`** — Vite's dev server reads `<root>/index.html` regardless of `rollupOptions.input`, so without the middleware the dev server still serves the full Mavro Console even when `VITE_BUILD_TARGET=spanbix`.

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

What did NOT change in Phase 5.3 (per the constraints of THAT phase — Phase 6 later changed some of this):
- Backend (`src/`) untouched
- Mongo schema untouched
- Centralized SEO engine + analytics service + AI orchestration untouched
- Existing Mavro dashboard ecosystem untouched
- ~~No SSR, no Next.js~~ **Superseded in Phase 6** — Spanbix now ships from `spanbix-web/` on Next.js 16 App Router with SSR + ISR + on-demand revalidation. The Vite path described in this section still runs the Mavro admin + HRMS + Tickets builds. See Section 8 below.

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
3. Update backend `CORS_ORIGIN` to include the production origin (e.g. `https://spanbix.com,https://www.spanbix.com`). The Vercel `*.vercel.app` preview URLs are already covered by the static baseline + regex in `src/app.js`.
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

## 7. SSR migration considerations — ✅ DONE in Phase 6 (historical context)

> The analysis below is preserved as historical context for the decision that was taken. Spanbix has since migrated to Path B (Next.js sub-app at `spanbix-web/`). See Section 8 below + [PROJECT_CONTEXT.md Phase 6](./PROJECT_CONTEXT.md) for the live state.

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

## Current live deployment

- **Frontend (Spanbix):** **canonical `https://www.spanbix.com`**. Apex `spanbix.com` 301-redirects to www at the Cloudflare edge AND via `spanbix-web/src/proxy.js` (Next 16 Proxy; explicit `NextResponse.redirect(url, 301)` because `redirects()` only emits 307/308). Legacy `spanbix-web.vercel.app` still resolves as a preview alias and stays in the CORS allowlist.
- **Stack:** Next.js 16 App Router (Turbopack) at `spanbix-web/`. SSR + ISR + on-demand revalidation; per-blog static generation; backend-proxied sitemap + robots; security headers including HSTS preload. The legacy Vite Spanbix bundle is retired but still buildable as a fallback (`npm run build:spanbix` from `client/`).
- **Backend:** `mavro-dashboard.onrender.com` (Express + Mongo Atlas).
- **API origin (spanbix-web):** `NEXT_PUBLIC_API_BASE_URL=https://mavro-dashboard.onrender.com` (set in Vercel env).
- **ISR revalidation:** Render env `SPANBIX_WEB_URL=https://www.spanbix.com` + matching `REVALIDATE_SECRET` on both ends. Backend POSTs `${SPANBIX_WEB_URL}/api/revalidate` fire-and-forget on every publish (`src/services/revalidateService.js`). The endpoint busts `/blog`, `/blog/<slug>`, `/sitemap.xml`, `/robots.txt`.
- **CORS:** Render `CORS_ORIGIN` + the static baseline in `src/app.js` together cover `https://www.spanbix.com`, `https://spanbix.com`, `https://spanbix-web.vercel.app`, and the `spanbix-web-*.vercel.app` preview regex.
- **Vercel project Domains setup:** `www.spanbix.com` is the PRIMARY. Apex `spanbix.com` must point DIRECTLY at the app — do NOT toggle "redirect to www.spanbix.com" in the Vercel Domains UI. If Vercel handles the redirect at the edge with 308, our explicit 301 in `proxy.js` never fires.
- **Author byline (Phase 6.5):** real author data lives on the populated `Blog.author` AdminUser doc. Update via `npm run set:spanbix-author` driven by `SPANBIX_AUTHOR_*` env vars — no MongoDB editing.

---

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

1. Set `CORS_ORIGIN` env var to include the production hosts. Comma-separated: `https://spanbix.com,https://www.spanbix.com`. The `*.vercel.app` preview URLs are already covered by the static baseline + regex in `src/app.js`, so they don't need to be repeated here.
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

---

## 8. Phase 6 — Live Spanbix SSR deploy on `spanbix-web/` (Next.js 16)

The standalone Next.js sub-app at `spanbix-web/` is what `www.spanbix.com` actually serves today. It is a SEPARATE Vercel project from the Mavro admin Vite project — they share a backend on Render but nothing else.

### 8.1 Vercel project — `spanbix-web`

| Setting | Value |
|---|---|
| Framework Preset | **Next.js** (auto-detected, 16.x) |
| Root Directory | `spanbix-web/` |
| Install Command | `npm install` (default) |
| Build Command | `npm run build` (default) |
| Output Directory | `.next` (auto) |
| Domains | `www.spanbix.com` (primary), `spanbix.com` (points at app, do **not** toggle "redirect to www" in Vercel UI), `spanbix-web.vercel.app` (preview alias) |

**Env vars (Production + Preview):**
```
NEXT_PUBLIC_API_BASE_URL=https://mavro-dashboard.onrender.com
REVALIDATE_SECRET=<shared secret, also in Render env>
```

### 8.2 Render env additions (backend pairs with spanbix-web)

```
SPANBIX_WEB_URL=https://www.spanbix.com
REVALIDATE_SECRET=<same value as Vercel>
CORS_ORIGIN=https://www.spanbix.com,https://spanbix.com    # baseline in app.js already covers these + preview regex
```

### 8.3 First-deploy verification checklist

```
# Redirect path
curl -I https://spanbix.com/                                  # expect 301 → https://www.spanbix.com/

# Security headers (must all be present)
curl -I https://www.spanbix.com/ | grep -iE "strict-transport-security|content-security-policy|x-frame-options|x-content-type|referrer-policy|permissions-policy"

# Sitemap host
curl https://www.spanbix.com/sitemap.xml | grep -c '<loc>'    # expect 12+ (scales with published blogs)
curl https://www.spanbix.com/sitemap.xml | grep -oE 'https://[^<]+' | grep -v 'www.spanbix.com'   # expect EMPTY

# Robots
curl https://www.spanbix.com/robots.txt | grep -i Sitemap     # expect Sitemap: https://www.spanbix.com/sitemap.xml

# Per-blog real meta + Person schema in raw HTML (no JS)
curl https://www.spanbix.com/blog/<slug> | grep -oE '"@type":"(BlogPosting|Person)"'

# On-demand revalidation works (will 401 with wrong secret — expected)
curl -X POST https://www.spanbix.com/api/revalidate -H "Content-Type: application/json" -d '{"slug":"x","secret":"wrong"}'
```

### 8.4 Common-failure runbook

| Symptom | Cause | Fix |
|---|---|---|
| Sitemap `<loc>` still shows `spanbix-web.vercel.app` after Render redeploy | `Website.domain` in Mongo still stores the legacy value; the seed migration's exact-match Set didn't catch a stored value with trailing slash | Already hardened in `seedSpanbix.js → LEGACY_DOMAINS` (normalize scheme + trailing slash + casing). For a one-shot manual fix, run from repo root: `node -e "require('dotenv').config();require('dns').setServers(['8.8.8.8']);const m=require('mongoose');const{Website}=require('./src/models');const c=require('./src/config');(async()=>{await m.connect(c.mongo.uri);const w=await Website.findOne({slug:'spanbix'});w.domain='www.spanbix.com';await w.save();process.exit(0);})()"` |
| Vercel deploy fails with `Proxy is missing expected function export name` | `src/proxy.js` exports `middleware(...)` instead of `proxy(...)` (Next 16 file-convention deprecation) | Rename the export to `proxy(request)` |
| `ERR_TOO_MANY_REDIRECTS` on www | Vercel project Domains has `www.spanbix.com` set to "Redirect to spanbix.com" while Cloudflare does apex → www → infinite loop | Set `www.spanbix.com` as the PRIMARY in Vercel Domains; `spanbix.com` either points at the app (let `proxy.js` 301) or "Redirect to www" |
| Public sitemap shows old URLs after canonical change | Vercel ISR cache holds the proxied response (5 min for `/sitemap.xml`, 1 hour for `/robots.txt`) | Wait the ISR window, OR redeploy spanbix-web (fully busts cache), OR POST `/api/revalidate` with the right secret (now busts both paths too) |
| Blog author block missing on detail page | AdminUser `bio` / `linkedinUrl` / `jobTitle` / `avatar` not set on the populated author doc | `npm run set:spanbix-author` from repo root with `SPANBIX_AUTHOR_*` env vars |
| `unsafe-inline` CSP warnings in Lighthouse | Intentional — Next runtime + framer-motion + Vercel analytics need it until a nonce-based CSP is wired | Defer; tracked under Open follow-ups in FUTURE_ROADMAP.md |
| HRMS or Tickets blog social previews still generic | They are still on the Vite admin bundle with `useSEO` — not migrated | Re-apply the `spanbix-web/` blueprint to a new sub-app if/when SEO becomes a priority |

### 8.5 Files / paths to know

| Path | Role |
|---|---|
| `spanbix-web/next.config.mjs` | `headers()` (security headers + HSTS preload) + `redirects()` (legacy `/spanbix/*` → root) + `poweredByHeader: false` |
| `spanbix-web/src/proxy.js` | Apex → www 301 (Next 16 Proxy convention; renamed from `middleware.js`) |
| `spanbix-web/src/app/api/revalidate/route.js` | On-demand ISR bust for `/blog`, `/blog/<slug>`, `/sitemap.xml`, `/robots.txt` |
| `spanbix-web/src/app/sitemap.xml/route.js` | Proxy of backend `/sitemap/spanbix.xml` (5-min ISR) |
| `spanbix-web/src/app/robots.txt/route.js` | Proxy of backend `/robots/spanbix.txt` (1-hour ISR) |
| `spanbix-web/src/app/blog/[slug]/page.jsx` | Per-blog SSG + ISR + enriched Person JSON-LD + `AuthorByline` block |
| `spanbix-web/src/lib/spanbixSeo.js` | `blogPostingLd` (enriched Person), `breadcrumbLd`, `blogListLd`, `SPANBIX_SITE`, `SPANBIX_CAREER_PATHS` |
| `src/services/revalidateService.js` | Backend fire-and-forget POST to `${SPANBIX_WEB_URL}/api/revalidate` |
| `src/utils/seedSpanbix.js` | `upsertSpanbixTenant` (LEGACY_DOMAINS migration, normalized) + `upsertSpanbixStaticPages` (9 marketing `SeoMetadata` rows seeded idempotently) |
| `src/utils/setSpanbixAuthor.js` | `npm run set:spanbix-author` — env-driven AdminUser byline updates |
| `src/services/sitemapService.js` | `buildBaseUrl` (looped scheme strip) + `generateSitemap` + `generateRobotsTxt` |
| `src/controllers/blogController.js` | `getPublicBlog` populates `author` with `name avatar bio linkedinUrl jobTitle`; publish paths fire `revalidateService.revalidateBlog(slug)` |
| `src/controllers/authController.js` | `updateUser` whitelist now accepts `avatar / phone / bio / linkedinUrl / jobTitle` |

---

*End of deployment readiness document. Update before each subsequent deploy.*
