# spanbix-web — Spanbix public site (Next.js 16 App Router)

Standalone Next.js 16 (App Router, JS, Tailwind, Turbopack) application that ships **Spanbix's** public marketing surface — `https://www.spanbix.com`. SSR + ISR + on-demand revalidation; no admin, no auth, no CMS UI. Talks to the same Express backend on Render as the rest of the Mavro platform.

> **AGENTS.md note:** this version of Next.js has breaking changes from the public training data corpus. Read the relevant guide under `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Why this app exists

Pre-Phase 6, Spanbix lived inside the Mavro admin Vite bundle at `/spanbix/*`. SEO meta (title / description / OG / canonical / JSON-LD) was injected client-side by `useSEO`, which meant search engines and social platforms that don't render JS (Facebook, LinkedIn, WhatsApp, Bing, DuckDuckGo) saw the static homepage shell on every URL. This app fixes that by emitting real per-page metadata + content + JSON-LD in the initial server HTML, with ISR keeping blog detail pages indexable within seconds of publish — no redeploy.

The big-picture context lives in the **monorepo root** docs: [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), [ARCHITECTURE.md](../ARCHITECTURE.md), [ROUTING_MAP.md](../ROUTING_MAP.md), [FUTURE_ROADMAP.md](../FUTURE_ROADMAP.md), [CLAUDE.md](../CLAUDE.md). The original migration plan lives at [plans/spanbix-ssr.md](../plans/spanbix-ssr.md).

## Local development

```bash
# from spanbix-web/
npm install
npm run dev      # http://localhost:3000
```

The backend can be local (`http://localhost:5000`) or the live Render host (`https://mavro-dashboard.onrender.com`) — whichever `NEXT_PUBLIC_API_BASE_URL` resolves to.

### Environment variables

```
# spanbix-web/.env
NEXT_PUBLIC_API_BASE_URL=https://mavro-dashboard.onrender.com
REVALIDATE_SECRET=<shared with backend SPANBIX_WEB_URL/REVALIDATE_SECRET>
```

`REVALIDATE_SECRET` is server-only (no `NEXT_PUBLIC_` prefix) and is checked inside `app/api/revalidate/route.js`.

## Routes

Every route is root-relative; the legacy `/spanbix/*` prefix from the Vite era is 308-redirected to root via `next.config.mjs` (page paths only — static assets under `/spanbix/...` still resolve via the negative-lookahead matcher).

- `/` — homepage (Server Component, EducationalOrganization + FAQ JSON-LD)
- `/courses` — course catalog
- `/career-paths` — track listing
- `/career-paths/[code]` — per-track detail (`generateStaticParams` over `fico` / `mm` / `sd` / `abap`)
- `/campus-programs` — institutional partnerships
- `/about`
- `/contact` — server-rendered shell + client `ContactForm` island
- `/blog` — blog index, `revalidate: 300`
- `/blog/[slug]` — blog detail, `generateStaticParams` over every published slug + `revalidate: 300` + enriched Person JSON-LD + `AuthorByline` block below the article
- `/api/revalidate` — secret-gated POST. Busts `/blog`, `/blog/<slug>`, `/sitemap.xml`, `/robots.txt`. Called fire-and-forget by the Express backend on every publish.
- `/sitemap.xml` — proxies the backend (`/sitemap/spanbix.xml`), 5-min ISR
- `/robots.txt` — proxies the backend (`/robots/spanbix.txt`), 1-hour ISR

## Edge / cross-cutting

- **`src/proxy.js`** — Next 16 Proxy (renamed from `middleware.js` per the new file-convention deprecation). Apex `spanbix.com` → 301 → `www.spanbix.com` via explicit `NextResponse.redirect(url, 301)` (Next 16 `redirects()` only emits 307/308).
- **`next.config.mjs` `headers()`** — Content-Security-Policy (`default-src 'self'` with scoped allowlists for Vercel scripts, Google Fonts, Render API, Vercel analytics; `'unsafe-inline' 'unsafe-eval'` retained on `script-src` until a nonce-based CSP is wired; `frame-src 'self' https://www.google.com https://maps.google.com` for the `/contact` Google Maps embed; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`), Strict-Transport-Security (`max-age=63072000; includeSubDomains; preload`), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (every unused sensor disabled). `poweredByHeader: false`.
- **`next.config.mjs` `redirects()`** — legacy `/spanbix` and `/spanbix/<page>` → root (308, page paths only; asset extensions excluded).
- **`src/components/JsonLd.jsx`** — emits `<script type="application/ld+json">` server-side for every page.

## Build + deploy

```bash
npm run build    # next build (Turbopack)
npm start        # next start (rarely needed locally; Vercel runs this)
```

Hosted on Vercel as the standalone project for the canonical `www.spanbix.com` domain. The apex `spanbix.com` must be attached to the project but **must not** be set to "Redirect to www" via the Vercel Domains UI — Vercel's edge redirect (308) would pre-empt our explicit 301 inside `proxy.js`. Cloudflare in front of the domain also enforces apex → www 301; the proxy is a belt-and-braces fallback.

Backend on Render needs:

```
SPANBIX_WEB_URL=https://www.spanbix.com
REVALIDATE_SECRET=<same value as spanbix-web/.env>
CORS_ORIGIN=https://www.spanbix.com,https://spanbix.com
```

## Updating the public author byline

The blog detail page renders an `AuthorByline` block (avatar + name + job title + bio + LinkedIn link) and a matching `schema.org/Person` JSON-LD block. Both read from the populated `Blog.author` AdminUser doc. To update the live author without touching MongoDB:

```bash
# from the repo root, against the backend's MongoDB
SPANBIX_AUTHOR_EMAIL=admin@mavro.com \
SPANBIX_AUTHOR_NAME="Real Name" \
SPANBIX_AUTHOR_JOBTITLE="SAP Career Strategist · Spanbix" \
SPANBIX_AUTHOR_BIO="One-paragraph bio with credentials + areas of expertise" \
SPANBIX_AUTHOR_AVATAR="https://www.spanbix.com/spanbix/authors/<file>.jpg" \
SPANBIX_AUTHOR_LINKEDIN="https://www.linkedin.com/in/<handle>" \
npm run set:spanbix-author
```

The change reflects on the next request to any blog detail page (or immediately if you POST `/api/revalidate`).

## Operational invariants (do not regress)

- **`src/proxy.js`** is the *only* place that emits 301. Do not move it back to `middleware.js`; do not rename the exported function away from `proxy`.
- **CSP `'unsafe-inline' 'unsafe-eval'`** stay on `script-src` until a nonce-based CSP is wired (would require the Proxy to inject a per-request nonce). Removing them today breaks Next runtime + framer-motion + Vercel analytics.
- **`generateStaticParams`** for `[code]` and `[slug]` is the contract that pre-builds every track + every published blog. Removing it disables ISR + breaks Google Course / BlogPosting freshness.
- **No admin imports.** This app is public-only — `axios` interceptors, admin contexts, `react-quill-new`, `recharts`, radix primitives must never appear in `package.json` dependencies. They belong in the Vite admin bundle.
- **AGENTS.md takes precedence on Next.js conventions.** When the docs in `node_modules/next/dist/docs/` contradict prior intuition, follow the docs.
