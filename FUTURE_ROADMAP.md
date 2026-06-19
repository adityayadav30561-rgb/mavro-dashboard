# Mavro Platform — Future Roadmap

**Status snapshot:** Phase 1 complete (operational SEO intelligence, real analytics, premium UI, multi-tenant cleanup). Phases 2–4 outlined below.

---

## Phase 1 — Operational SEO Intelligence ✅ COMPLETE

**Goals:**
- Weighted SEO audit engine (content-dominant)
- Real analytics pipeline (no placeholder data)
- Multi-tenant site polish (HRMS + Tickets)
- Premium light + dark themes
- Lead/analytics consistency

**Delivered:**
- ✅ `seoHealth.js` v3 — weighted categories, hard content caps, confidence multipliers
- ✅ `seoReadability.js` — Flesch + structural analyzers, transition words, passive voice
- ✅ Semantic depth + structural intelligence checks
- ✅ Interpretation bands + grade letters + critical roster UI
- ✅ Server-side `form_submit` emission for lead/analytics parity
- ✅ UTC-aligned timeseries aggregation
- ✅ Range filters (day/week/month/year) with real period-over-period deltas
- ✅ Cascade-delete for tenant cleanup
- ✅ Demo tenants removed (Fleet/Inventory/Transport)
- ✅ Localhost domain rewrites for dev (`localhost:5173/<slug>`)
- ✅ Visit Website action on tenant cards
- ✅ Premium pastel light theme with no-flash bootstrap
- ✅ Public sites: HRMS + Tickets fully wired
- ✅ **Blog Editor Cockpit** — real-time SEO writing cockpit, focus keyword analysis, task-based checklist, 7 live audit cards, autosave indicator
- ✅ **Analytics Intelligence page** — 8 new backend endpoints (funnel, tenant-comparison, top-blogs, content-performance, realtime, landing-pages, exit-pages, engagement); 11 frontend modules; operational insights generator
- ✅ **TenantContext** — global tenant selection consumed by Dashboard; Topbar switcher gated to `/` only
- ✅ **Burst-session engagement model** — 30-min inactivity gap split for realistic session metrics
- ✅ **Calendar-today day range** — "Today" pill excludes yesterday's events

---

## Phase 2 — External Search Intelligence + Anomaly Detection

**Theme:** plug Mavro into the actual search ecosystem AND surface operational anomalies from existing telemetry.

### 2.0 Anomaly Detection Engine ✅ COMPLETE
- ✅ `src/services/anomalyService.js` — 7 pure-function detectors:
  - **Traffic spike** — sessions > 2× previous window (prev ≥ 3, curr ≥ 5)
  - **Traffic drop** — sessions < 0.5× previous (prev ≥ 8)
  - **Conversion drop** — leads/sessions ratio < 70% of previous (prev rate ≥ 0.5%)
  - **Bounce spike** — burst-session bounce > 1.5× previous (prev ≥ 10%)
  - **Inactive tenant** — 0 events in last 7d but has published blogs
  - **Stale tenant** — no publish in 30+ days OR never published
  - **Declining blog** — top blog views < 50% of previous (prev ≥ 5 views)
- ✅ `GET /api/analytics/anomalies?range=&websiteSlug=`
- ✅ `client/src/components/analytics/AnomalyAlerts.jsx` — severity-tagged UI with recommendations + all-clear state
- ✅ Severity sort (critical → warning → notice) + alphabetical kind sort
- ✅ Tenant-comparison detectors auto-skip when scope ≠ `all`
- ✅ Each detector returns `null` on insufficient data — no false positives

### 2.0.1 Returning visitor metric ✅ COMPLETE
- ✅ `getReturningVisitors({range, websiteSlug})` — sessionIds present in BOTH current AND previous window
- ✅ `GET /api/analytics/returning`
- ✅ Surfaced as 6th overview tile in `AnalyticsOverview.jsx` (emerald if >20%, amber otherwise)

### 2.0.2 Per-page conversion + bounce ✅ COMPLETE
- ✅ `getPageConversion` — intersect per-page visitor sessions with form_submit sessions
- ✅ `getPageBounce` — per-page bounce rate (first-page landings with single event)
- ✅ Surfaced via `BehaviorIntelligence.jsx` (2-up: emerald best-converting + rose highest-bounce)

### 2.0.3 Contextual Help Popover system ✅ COMPLETE
- ✅ `client/src/components/analytics/InfoPopover.jsx` — reusable portaled popover primitive
- ✅ `client/src/lib/analyticsCopy.js` — `METRIC_INFO` registry, 18 metric/section definitions
- ✅ Wired into every analytics card label across 11 components (Overview tiles, all section headers, sub-panels)
- ✅ Hover-to-open on desktop; tap-to-open on touch devices (UA-capability detected)
- ✅ Outside-click + escape + scroll + window-resize close
- ✅ Auto-flip above when bottom space < 100px
- ✅ Portaled to `<body>` — avoids `overflow:hidden` clipping inside backdrop-blur cards
- ✅ Glassmorphism with violet accent strip + Framer Motion scale+fade animation

### 2.1 Phase 2.1 candidates (next sprint)
- WebSocket-driven realtime feed (replace 15s polling)
- Email/Slack alert dispatch on critical anomalies
- `AnomalySnapshot` collection — historical anomaly tracking via cron
- AI-augmented operational narratives layered on top of pure-function insights

### 2.2 Google Search Console (GSC) integration
- OAuth flow for tenant connection
  - `POST /api/seo/gsc/oauth/start` — generates state, redirects to Google consent
  - `GET /api/seo/gsc/oauth/callback` — exchanges code, stores refresh token in tenant doc
- Property verification + linkage
- Data pulls (cron-driven, daily):
  - Impressions, clicks, CTR, average position per page
  - Top queries
  - Top pages
  - Index coverage status
- Storage: new `GscDaily` collection with `{websiteId, date, page, query, impressions, clicks, ctr, position}`
- Reserved hooks already in `client/src/api/seo.js`:
  - `getGoogleSearchConsoleSummary(websiteId)` — currently swallows 404
- UI:
  - SEO Engine "External Search Intelligence" section activates
  - Per-tenant query/page tables in admin dashboard
  - Position trend lines (Recharts) on blog detail pages in admin

**Schema additions:**
- `Website.googleSearchConsole = { connected, propertyUrl, refreshToken (encrypted), connectedAt, lastSyncAt }`
- `GscDaily` collection (cap 365 days per tenant)

### 2.2 Bing Webmaster integration
- Same pattern as GSC (different OAuth endpoint)
- Reserved hook: `getBingWebmasterSummary(websiteId)`
- Storage: `BingDaily` collection

### 2.3 IndexNow protocol
- `Website.indexNowKey` field already exists
- Implement `POST /sitemap/indexnow/:slug` to submit URL changes instantly
- Auto-trigger on blog publish + status changes

### 2.4 Keyword tracking (internal)
- New `KeywordTarget` collection: `{websiteId, term, mappedTo (blogId), priority, monthlyVolume?, intent}`
- New `KeywordRanking` collection: daily snapshot of position (sourced from GSC data)
- Admin UI: `/seo/keywords` page with rank tracker chart per keyword
- Audit engine extension: blog SEO Score boosts when target keywords appear in title/H2/body density bands

### 2.5 Server-side rollups
- Cron job runs `auditCorpus()` per tenant daily
- Writes to new `SeoAudit` collection: `{websiteId, date, overallScore, categoryScores, criticalCount, warningCount, ...}`
- Dashboard charts historical SEO health trend over time
- Engine module already pure-functions — can run server-side without rewrite

---

## Phase 3 — Editorial Operations + Internal Linking + Content Decay ✅ COMPLETE

**Theme:** evolve the platform from CMS into an editorial operating system. All sub-phases delivered.

### 3.0 Editorial pipeline + Calendar ✅ COMPLETE
- `/calendar` route with Month / Agenda / Editorial Kanban (5-col: Ideas/Drafting/Review/Scheduled/Published)
- `Campaign` model + CRUD + velocity rollups (publishedPerWeek, overdueDrafts, daysRemaining, completionPct, risk band)
- Drag-drop reschedule + drag-between-columns workflow transitions w/ optimistic UI
- `scheduledPublishService` 60s-poll worker auto-publishes due blogs (atomic, race-safe)
- Approval workflow: `approve`, `request-revision`, `reject` endpoints with `reviewNotes[]` history
- Activity log (`activityLog[]` on Blog, capped at 200) + cross-corpus feed endpoint `GET /api/blogs/activity`
- Roles extended: `writer`, `reviewer` + permissions scaffold (`src/utils/permissions.js`)
- DOCX import via mammoth + heading inference (`src/utils/headingInference.js` promotes all-bold paragraphs → H2/H3)
- FAQ block insert button + multi-pattern detector (explicit + heuristic + positional gating) + FAQPage JSON-LD generator
- RichTextEditor image pipeline: drag-drop insert + hover toolbar (size S/M/L/Full, alignment L/C/R, alt text, delete) + drag-to-reposition (custom Quill `ResizableImage` blot persists width/alt across HTML round-trip)

### 3.1 Content Decay Detection ✅ COMPLETE
- `contentDecay.js` weighted engine (engagement 30%, freshness 25%, seoDrift 20%, linking 10%, metadata 10%, contentBody 5%)
- 5 states: fresh / stable / aging / declining / critical (HIGHER score = MORE decay)
- `ContentDecayPanel` + `DecayQueueCard` + `DecayAlertsStrip` surfaces on `/seo`
- Backend endpoint `GET /api/analytics/blog-trends` returns per-blog current vs previous-window view + session deltas
- Refresh queue prioritized by `decay × traffic potential`; clickable row → opens blog editor
- Recommendations engine with confidence/effort/impact metadata per action

### 3.2 Internal Linking Engine v2 ✅ COMPLETE
- `anchorIntel.js` — sentence-derived anchor variants (exact/partial/semantic), each with context preview
- `linkGraphIntel.js` — directed link graph build, single-link Jaccard clustering, linking-quality score (5 sub-signals)
- `LinkGraph.jsx` force-laid-out SVG visualization with hub/orphan/cluster highlighting on `/seo`
- `OrphanPanel.jsx` + `TopicalClusterPanel.jsx` + `LinkingQualityCard.jsx`
- BlogForm `handleInsertLink` contextual replace — wraps anchor inline inside existing sentence when matched; falls back to append paragraph only when no match
- Tenant-scoped via `useTenantBlogCorpus` hook — suggestions never cross tenant boundary

### 3.3 Keyword Intelligence unification ✅ COMPLETE
- `keywordMatch.js` single matcher across editor + audit (handles NBSP / smart quotes / em-dashes / hyphens-as-spaces)
- `keywordIntel.js` semantic engine: primary phrase detection (bi/trigram scored by freq × length × heading hits × title hits × spread), adaptive density bands by article length, health states
- Density now consistent across Focus Keyword card + Keyword Intelligence card + audit scoring (previously off by ~3pp)
- Semantic variations / supporting terms / coverage UI sections **HIDDEN pending LLM-backed semantic engine** (Phase 4) — engine still computes them; re-wire is UI-only

---

## Phase 4 — AI-Augmented SEO

### 5.9 Spanbix SSR migration to Next.js 16 (Phases 0–7) ✅ COMPLETE
End-to-end rebuild of the Spanbix public surface on **Next.js 16 App Router** (`spanbix-web/`) so search engines and social platforms receive real per-page metadata, JSON-LD, and content in the initial HTML — closes the gap that `useSEO` (client-side) left open for Facebook, LinkedIn, WhatsApp, Bing, and DuckDuckGo. Mavro admin (Vite) untouched; HRMS + Tickets stay on the Vite bundle.
- ✅ **Phase 0** — Documentation discovery. Confirmed backend endpoints (`/api/blogs/website/spanbix`, `/api/blogs/website/spanbix/<slug>`) return everything `generateMetadata` needs; `client/src/lib/spanbixSeo.js` JSON-LD builders are reusable verbatim; legacy `client/src/pages/spanbix/*` will be retired but stays buildable as a fallback.
- ✅ **Phase 1** — Next.js scaffold. `spanbix-web/` created with App Router (JS, Tailwind, Turbopack). `next/font` loads Instrument Serif, Geist, JetBrains Mono, DM Serif Display, Sora. `.env`: `NEXT_PUBLIC_API_BASE_URL=https://mavro-dashboard.onrender.com`, `REVALIDATE_SECRET=<shared with backend>`.
- ✅ **Phase 2** — Design system + component port. `client/src/styles/spanbix-redesign.css` imported verbatim into `spanbix-web/src/styles/` and loaded from `app/layout.js`. Components copied from `client/src/components/spanbix/redesign/**`. `'use client'` added to interactive leaves (carousels, forms, accordions); static sections stay Server Components. `react-router-dom` → `next/link` + `next/navigation`. `withSpanbixBase()` dropped because Next routes are root-relative. `lib/analytics` calls confined to `'use client'` components.
- ✅ **Phase 3** — Marketing routes (SSG). `app/page.jsx`, `courses/page.jsx`, `career-paths/page.jsx`, `career-paths/[code]/page.jsx` (with `generateStaticParams()` from `SPANBIX_CAREER_PATHS` codes — `fico` / `mm` / `sd` / `abap`), `campus-programs/page.jsx`, `about/page.jsx`, `contact/page.jsx`. Per-page `generateMetadata()` mirrors the old `useSEO({...})` call. JSON-LD via server-rendered `<script type="application/ld+json">`.
- ✅ **Phase 4** — Blog routes (ISR). `app/blog/page.jsx` — Server Component, fetches `${API}/api/blogs/website/spanbix` with `next: { revalidate: 300 }`. `app/blog/[slug]/page.jsx` — `generateStaticParams()` over every published slug; body fetched with `revalidate: 300`; `generateMetadata({ params })` resolves blog `seoTitle / seoDescription / canonicalUrl / ogImage / keywords`; emits `breadcrumbLd + blogPostingLd`; `notFound()` on backend 404. **AuthorByline block** below the article body renders avatar + serif name + monospace job title + bio paragraph + LinkedIn link (inline brand SVG; lucide 1.16 has no `Linkedin` export).
- ✅ **Phase 5** — On-demand ISR revalidation. `spanbix-web/src/app/api/revalidate/route.js` (POST + secret) calls `revalidatePath('/blog')` + `revalidatePath('/blog/<slug>')` + `revalidatePath('/sitemap.xml')` + `revalidatePath('/robots.txt')`. Backend `src/services/revalidateService.js` posts fire-and-forget on every publish path (`blogController.publishBlog`, `blogController.updateWorkflowStatus` when `becamePublished`, `scheduledPublishService` worker). 4s timeout; never throws; silent no-op if env vars unset.
- ✅ **Phase 6** — Sitemap + robots + legacy redirects. `app/sitemap.xml/route.js` + `app/robots.txt/route.js` proxy the backend (`/sitemap/spanbix.xml`, `/robots/spanbix.txt`) with 5-min / 1-hour ISR caches and graceful fallback. `next.config.mjs` redirects `/spanbix → /` and `/spanbix/:path((?!.*\\.).*) → /:path` (308; asset extensions excluded). Backend sitemap expanded to 12 URLs via `seedSpanbix.js → upsertSpanbixStaticPages()` — 9 marketing `SeoMetadata` rows (`/about`, `/courses`, `/career-paths` + the 4 codes, `/campus-programs`, `/contact`) seeded idempotently with `$setOnInsert`, so admin tweaks are preserved.
- ✅ **Phase 7** — Vercel cutover + CORS. New Vercel project `spanbix-web` (Next preset). Env: `NEXT_PUBLIC_API_BASE_URL` + `REVALIDATE_SECRET`. Backend `src/app.js` CORS baseline already includes `https://spanbix.com`, `https://www.spanbix.com`, `https://spanbix-web.vercel.app`, plus a `spanbix-web-*.vercel.app` preview regex.

### 5.9.1 Canonical cutover to www.spanbix.com (May 28–29, 2026) ✅ COMPLETE
- ✅ **Domain attach** — DNS for `spanbix.com` + `www.spanbix.com` points at the spanbix-web Vercel project. Cloudflare handles apex → www 301 at the edge. `spanbix-web/src/proxy.js` (Next 16 Proxy convention, renamed from `middleware.js` per the new file-name deprecation) is the belt-and-braces fallback — explicit `NextResponse.redirect(url, 301)` because `redirects()` only emits 307/308.
- ✅ **Canonical flipped** to `https://www.spanbix.com` everywhere: `seedSpanbix.js` domain, `SPANBIX_SITE.url` + `logo` in both `client/` and `spanbix-web/` `spanbixSeo.js`, `app/layout.js` `metadataBase`, `client/index.spanbix.html` `og:url` + `og:image` + `twitter:image`, `.env.example` `SPANBIX_WEB_URL`.
- ✅ **`Website.domain` migration hardened** — `seedSpanbix.js` LEGACY_DOMAINS migration normalizes both sides (strip scheme + trailing slash + lowercase) before comparing, so a stored value like `"https://spanbix-web.vercel.app/"` (the value that defeated the initial exact-match) is now caught and rewritten to `www.spanbix.com` on the next boot.
- ✅ **`sitemapService.buildBaseUrl` hardened** — loops the scheme strip so a double-prefixed input like `https://https://...` can no longer re-emerge as the bug the helper exists to prevent.
- ✅ **Dashboard sitemap URL helpers fixed** — `client/src/pages/websites/WebsiteList.jsx` `defaultSitemapUrl(domain)` + `client/src/pages/SeoEngine.jsx` `sitemapXmlUrl(domain)` / `robotsTxtUrl(domain)` now derive from the website's public domain via `publicUrlFromDomain(domain)` instead of the hardcoded `window.location.hostname:5000` form that produced `https://mavro-dashboard.vercel.app:5000/sitemap/<slug>.xml` on the live admin Vercel.

### 5.9.2 SEO audit fixes — author byline + security headers + HSTS preload ✅ COMPLETE
- ✅ **AdminUser byline schema** — `bio` (≤600ch), `linkedinUrl` (linkedin.com URL validator), `jobTitle` (≤120ch) added. `PUT /api/auth/users/:id` whitelist accepts the new fields.
- ✅ **Populate enriched** — `blogController.getPublicBlog` populates `author` with `name avatar bio linkedinUrl jobTitle`.
- ✅ **Person JSON-LD enriched** — `blogPostingLd` in both `spanbixSeo.js` files emits `@type: Person` with `name`, `jobTitle`, `description`, `image`, `url`, `sameAs[]` — every field conditional on a value. Closes Google's Sept 2025 QRG "anonymous authorship" gap.
- ✅ **CLI `npm run set:spanbix-author`** — `src/utils/setSpanbixAuthor.js` updates the Spanbix admin user's author fields from env vars (`SPANBIX_AUTHOR_NAME / JOBTITLE / BIO / AVATAR / LINKEDIN / EMAIL`). No MongoDB editing needed.
- ✅ **Security headers** in `spanbix-web/next.config.mjs` `headers()`:
  - `Content-Security-Policy` — `default-src 'self'`; scoped allowlists for Vercel scripts, Google Fonts, Render API, Vercel analytics. `'unsafe-inline' 'unsafe-eval'` retained on `script-src` until nonce-based CSP refactor. `frame-src 'self' https://www.google.com https://maps.google.com` for the `/contact` Google Maps embed (Phase 6.8.2). `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — exact value hstspreload.org requires.
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy` drops every unused sensor (camera, microphone, geolocation, payment, USB, etc.).
  - `poweredByHeader: false`.

### 6.0 Spanbix Phase 6.7 — Legacy Vite Spanbix surface DELETED (May 29, 2026) ✅ COMPLETE
- ✅ **91 files removed** from `client/`: every Spanbix page (`pages/spanbix/*`), every Spanbix component (`components/spanbix/*` including the redesign sections), the standalone routing tree (`SpanbixApp.jsx`), the standalone entry (`entries/spanbix.jsx`), the SEO + brand constants (`lib/spanbixSeo.js`), the build-target route base helper (`lib/routeBase.js`), the entry HTML (`index.spanbix.html`), and the asset namespace (`public/spanbix/`).
- ✅ **`VITE_BUILD_TARGET` machinery dropped** — `client/vite.config.js` is now a single-entry config (no `ENTRY_HTML` table, no rename plugin, no dev-target middleware, no `define` block). `client/package.json` ships `dev` / `build` / `preview` only (removed `dev:spanbix`, `build:full`, `build:spanbix`, `build:hrms`, `build:tickets`; removed `cross-env` from devDependencies).
- ✅ **`client/vercel.json` simplified** — Spanbix-specific sitemap + robots rewrites removed; the SPA fallback regex still excludes `sitemap.xml` + `robots.txt` so they 404 cleanly on the admin host.
- ✅ **`ThemeContext.jsx`** — `DEFAULT_DARK` is now just `true` (the build-target check was the only Spanbix-specific behaviour in the admin theme).
- ✅ **`client/src/App.jsx`** — `<SpanbixLegacyRedirect />` catch-all on `/spanbix` and `/spanbix/*` hard-redirects to `https://www.spanbix.com/<path>` via `window.location.replace`, preserving search + hash.
- ✅ **Admin Vite build** ✓ 18.06s. Main chunk shrank 1234 kB → 1097 kB (gzipped 359 → 325 kB) — the saved bytes are the removed Spanbix code.
- ✅ **Live site unaffected** — `spanbix-web/` Next build still ships 12 routes + Proxy; `https://www.spanbix.com` serves the same SSR + ISR + on-demand revalidation contract.

### 6.3 Spanbix Phase 6.8.3 — Dedicated WhatsApp-share enquiry page (May 29, 2026) ✅ COMPLETE
- ✅ **New route `/enquire`** at `spanbix-web/src/app/enquire/page.jsx` + `EnquireForm.jsx` ('use client'). Single-column centered card on cream, no contact-coordinates aside, no map. Headline "Tell us about you.", same audience / interest chip set as `/contact`.
- ✅ **Attribution mechanism** — submissions tag `formId: 'spanbix-whatsapp'` + `customFields.source: 'whatsapp-share'`. Backend `Lead.formId` index lets admin filter cleanly. Beats UTM-on-`/contact` because copy-paste flattens query strings; a dedicated route guarantees 100% attribution regardless of how the link travels.
- ✅ **SEO** — `robots: { index: false, follow: false }` via Next `generateMetadata`. Not added to sitemap / `SeoMetadata` seed. Search engines stay focused on `/contact`.
- ✅ Next build green: 13 static + ƒ-routes (`/enquire` listed as `○`).

### 6.2 Spanbix Phase 6.8 follow-up patches (May 29, 2026) ✅ COMPLETE
- ✅ **Phase 6.8.1** — capitalised `I` in the WhatsApp floater prefilled message. Draft now reads `"I want to enquire about the courses"`.
- ✅ **Phase 6.8.2** — CSP `frame-src` directive added to `spanbix-web/next.config.mjs` `headers()`: `frame-src 'self' https://www.google.com https://maps.google.com`. The `/contact` Google Maps embed was previously blocked by the CSP default-src fallback (Chrome rendered "This content is blocked"). Allow-list kept tight — no wildcards, exact upstream hosts only.

### 6.1 Spanbix Phase 6.8 — Next app content + UX polish (May 29, 2026) ✅ COMPLETE
- ✅ **Contact info updated** in `spanbix-web/src/app/contact/ContactForm.jsx`: phone `+91 93107 93790`, email `contact@spanbix.com`, address `Galaxy Blue Sapphire Plaza, 1415, Greater Noida West Link Rd, Sector 4, Ghaziabad, Greater Noida, UP (201009)`, centres `Greater Noida · Lucknow`. Map embed re-pointed at the real Galaxy Blue Sapphire Plaza coordinates.
- ✅ **Footer copyright** flipped to `© 2026 Spanbix Training Institute. · Greater Noida`. Bengaluru / Hyderabad / Pune copy removed from the footer + every visible surface.
- ✅ **Social tiles** replaced the `IG / LI / YT / X` placeholder grid with real LinkedIn / Facebook / Instagram links and inline brand SVG glyphs (lucide-react 1.16 has no brand-icon exports). Each tile opens in a new tab with `rel="noopener noreferrer me"`.
- ✅ **Tushar testimonial** trimmed to remove the `before I even graduated` tail.
- ✅ **Floating WhatsApp button** — new component `WhatsAppFloater.jsx`, fixed bottom-right on every page (mounted from `SpanbixLayout`), brand-green button, hover-scale. Deep link `https://wa.me/919310793790?text=i%20want%20to%20enquire%20about%20the%20courses` pre-populates the WhatsApp draft.
- ✅ **First-visit cohort banner** — new component `CohortBanner.jsx`, centered modal with Option A copy ("Batch starts 8 June 2026"), eyebrow citron pill, 3 meta rows (📅 STARTS / 🎯 TRACKS OPEN / 🪑 SEATS), primary CTA → `/contact`, secondary "Maybe later". Dismiss via × / "Maybe later" / backdrop click / Esc → `localStorage.setItem('spanbix-cohort-banner-dismissed-1', Date.now())` → suppressed 24h. Bumping the key suffix invalidates every existing dismissal next time users load the site. Body scroll locked while open.

### 5.7 Mavro Scheduler module (Phases 1–7) ✅ COMPLETE
- ✅ **Module skeleton** — self-contained at `src/modules/scheduler/` with `models/`, `controllers/`, `services/`, `routes/`, `providers/`, `validators/`, `utils/`, `queue/`, `workers/`. Aggregated mount via `routes/index.js` exporting `schedulerRoutes` (JWT-protected) + `schedulerPublicRoutes` (unauthenticated `/api/public/book/*` + `/api/public/bookings/*` + `/api/public/routing/*`).
- ✅ **8 Mongoose models** — `CalendarConnection` (encrypted OAuth tokens at rest), `EventType` (tracks, availability, override dates, blackouts, booking rules, team strategy, soft-delete), `FormQuestion` (intake form fields with validation rules), `Booking` (race-guard partial unique on `{tenant, hostUser, startTimeUtc}` where `status='confirmed'` + slot hash + provider metadata + co-hosts), `Workflow` (trigger + actions array), `WorkflowExecution` (per-action audit with 90-day TTL), `WebhookDelivery` (signed-delivery audit with 90-day TTL), `RoutingForm` (questions + ordered rules + fallback target).
- ✅ **Google Calendar provider via `googleapis`** — `BaseCalendarProvider` adapter contract, `GoogleCalendarProvider` (OAuth + freebusy + events + Meet auto-link), `OutlookCalendarProvider` stub (Phase 8). Provider registry dispatches by `CalendarConnection.provider` so the rest of the system stays provider-agnostic.
- ✅ **AES-256-GCM token encryption** — `utils/encryption.js` (v1 envelope format `v1:<iv>:<tag>:<ciphertext>`, key resolution + future rotation hook). `TOKEN_ENCRYPTION_KEY` env required in prod; dev derives a fallback via HKDF from `JWT_SECRET`.
- ✅ **OAuth state JWT** — `utils/oauthState.js` signs `{userId, tenantId, provider, nonce}` with `OAUTH_STATE_SECRET`, 600s TTL, replay defense via nonce.
- ✅ **Availability engine (luxon)** — `services/availabilityEngineService.js` with DST-safe `combineWallClockToUtc` + `utcToWallClock` + `enumerateDatesInZone`. Pipeline: clampRange → loadHostBusyRanges (bookings + provider, Promise.allSettled for graceful degradation) → enforceBuffers (buffer-pad busy mask) → enumerateDates → effectiveWindowsForDate (override / weekly / blackout) → per-window slot iteration with daily-cap + binary-search overlap. Returns normalized `{startUtc, endUtc, hostLocal, inviteeLocal, hostTimezone, inviteeTimezone, assignedHostId, hash}`. `isSlotStillBookable` re-runs the engine for booking-time race protection.
- ✅ **Slot hash** — `utils/slotHash.js` HMAC-SHA256 of `(eventTypeId, hostUserId, startUtc, endUtc)` returned with every slot; `verifySlotHash` is timing-safe.
- ✅ **Team scheduling** — `services/hostSelectionService.js` deterministic round-robin (least 14-day load + ObjectId tiebreak) + collective (all hosts must be free, primary host + coHosts persisted on Booking).
- ✅ **Routing forms** — `services/routingRuleEvaluator.js` pure rule engine with whitelisted ops (equals / not_equals / contains / greater_than / less_than / includes_any), first-match-wins, required-field gate, fallback target. Public `/api/public/routing/:slug` + `/evaluate` endpoints.
- ✅ **Template interpolator + SMS + Slack** — `utils/templateInterpolator.js` HTML-escapes string values, passes numbers/booleans through, supports `{{invitee.name}}` `{{event.name}}` `{{meeting.link}}` `{{start.local}}` `{{host.name}}` etc. `services/smsService.js` (Twilio adapter with provider registry), `services/slackService.js` (incoming webhook poster, validates `hooks.slack.com` host).
- ✅ **BullMQ + ioredis + nodemailer** — `queue/` + `workers/` with 8 job handlers (confirmation/reminder/cancellation/reschedule emails, provider_retry, webhook_delivery, workflow_action, completion_transition). Graceful Redis-disabled degradation — booking creation works without Redis, only the workflow side-effect layer goes quiet. Standalone worker entry at `src/workers/scheduler-worker.js` for horizontal scaling.
- ✅ **Workflow engine** — `services/workflowService.dispatch(trigger, ctx)` fires built-in defaults (confirmation email immediately + T-60 reminder) plus admin-configured workflows matching `(tenant, trigger, status:'active')`. Workflow steps: send_email / send_sms / send_slack / wait / webhook. Cumulative delay computed across step chain.
- ✅ **Webhook security** — `services/webhookService.js` HMAC-SHA256 signed delivery with `X-Mavro-Signature: t=<unix>,v1=<hex>` header. 5-min replay window on inbound verify. 10s timeout. `WORKFLOW_SIGNING_SECRET` env required.
- ✅ **ICS generation** — `utils/ics.js` RFC 5545 compliant VCALENDAR builder. Attached to every confirmation / reminder / reschedule email.
- ✅ **Cancellation window enforcement** — `bookingService.cancelBooking` + `rescheduleBooking` reject when `now > startTimeUtc - cancellationWindowHours*3600s`. Admin source bypasses (hosts can always cancel).
- ✅ **Frontend** — `client/src/modules/scheduler/pages/*` admin (CalendarConnectionsPage, EventTypesPage, EventTypeEditorPage, BookingsPage, WorkflowEditorPage, WorkflowHistoryPage, RoutingFormsPage) + public (PublicBookingAvailabilityPage at `/book/:eventSlug`, BookingManagePage at `/manage/:token`, PublicRoutingPage at `/route/:slug`). Sidebar entries wired under "Scheduler" group in DashboardLayout.

### 5.6 Spanbix editorial redesign (magazine v2) ✅ COMPLETE
- ✅ **Scoped design system** — `client/src/styles/spanbix-redesign.css` with tokens (`--sx-navy`, `--sx-cream`, `--sx-citron`, `--sx-coral`, `--sx-signal`, ink scale, hairlines), utilities (`.sx-display`, `.sx-eyebrow`, `.sx-lead`, `.sx-mono`, `.sx-btn-*`, `.sx-section-*`, `.sx-photo-*`, `.sx-chip`, `.sx-marquee`, `.sx-reveal`, `.sx-hero-*`, `.sx-cohort-*`), every selector prefixed `.spanbix-scope` so it cannot leak into Mavro admin / HRMS / Tickets.
- ✅ **Editorial typography stack** — Instrument Serif headlines + Geist UI + JetBrains Mono labels added to both HTML shells. Fallback chain to DM Serif / Sora / Inter so transition-period legacy sections still render cleanly.
- ✅ **Background-video Hero** — `redesign/Hero.jsx` plays `/spanbix/herosection-video.mp4` autoplay+muted+loop+playsInline, with a two-axis gradient stack (horizontal navy darkness + vertical fade-to-deep-navy). Cohort card backdrop bumped to `rgba(10,20,40,0.55)` + 22px blur. Citron CTA gets a warm glow; ghost CTA uses 8% white + blur. Headline updated to "There are 50,000+ ERP jobs waiting." with broader SAP-and-ERP framing.
- ✅ **13 redesign sections** — `redesign/sections/*` ship HiringPartners (local PNG logo strip on cream-50), MarketValidation, WhySap (locked 3×2 grid — never auto-fits to 4 columns), Tracks (3-tab pill switcher mirroring `/courses` layout — sliding pill via `motion.span layoutId` + AnimatePresence content swap; Functional 3-col / Technical 1-card centered / Campus full-width 2-col with right navy stat panel), Mentors (horizontal carousel + hover overlay revealing "CURRENTLY SHIPPING" delivery context), LearningExperience (sticky dashboard mockup), Placement, Outcomes (before/after CTC), Campus, Certification (credential mockup), DemoVideos, FAQ, FinalCta (wired to `submitPublicLead` with `formId: 'spanbix-final-cta'`).
- ✅ **Reusable PageHero primitive** — `redesign/PageHero.jsx` magazine page-header (eyebrow + serif title + lead + optional meta strip + optional tonal photo).
- ✅ **10 subpages rewritten** to the editorial language: Courses, CareerPaths, CourseDetail (mode switcher + sticky pricing panel preserved), CampusPrograms, Placements, DemoClasses, About (6 Operating Principles 3×2), Contact (3 audience lanes + coordinates strip), BlogList (search + tonal grid + paging), BlogDetail (navy article header + prose body).
- ✅ **Navbar + Footer redesigned** — Navbar transparent→scrolled-navy after 40px (was always-navy), wordmark badge, lg height dropped to 96px, mount animation stays suppressed. Footer = 5-col (Platform / Company / Resources / Legal) + social tiles + `REDESIGN_2026` build tag.
- ✅ **`SpanbixLayout` top padding removed** — heroes own clearance under transparent navbar. Adding `pt-*` back will cover the hero on every refresh.
- ✅ **HiringPartners logo strategy** — Clearbit deprecated, switched to 12 local brand PNGs at `client/public/spanbix/partners/`. Section bg `--sx-cream-50` so native brand colors are visible. `onError` fallback to serif italic wordmark.
- ✅ **`useScrollReveal` bug** — original `sx-reveal` on tab-switched card lists left fresh cards invisible after a tab switch (IO already disconnected). Fixed by dropping `sx-reveal` from track cards; documented as an invariant.
- ✅ Both builds clean (spanbix target 7.4s, full target 15.4s).

### 5.5 Spanbix responsive sweep + Hero mobile-breakage fix ✅ COMPLETE
- ✅ **Navbar fully responsive** — container `h-16 sm:h-20 md:h-24 lg:h-[116px]`; logo `h-12 sm:h-16 md:h-20 lg:h-28`; CTA hidden under md (folds into hamburger panel); horizontal padding + gap scale with viewport.
- ✅ **`SpanbixLayout` main offset** matched at every breakpoint: `pt-16 sm:pt-20 md:pt-24 lg:pt-[116px]` so the hero never tucks under the navbar.
- ✅ **Hero responsive** — eyebrow pill now wraps inside `max-w-full` with smaller mobile font + tighter tracking + `whitespace-normal break-words leading-tight` inner span; h1 ramped `text-[1.65rem] sm:text-[2.5rem] md:text-[3.2rem] lg:text-[4.1rem]` with `break-words` safety net; body paragraph `text-[15px] sm:text-[17px] md:text-[18.5px]`.
- ✅ **`PageHero`** subpage banner same treatment — `text-[1.9rem] sm:text-[2.4rem] md:text-[2.8rem] lg:text-[3.5rem]`, padded `pt-10 sm:pt-16 md:pt-24 lg:pt-28`.
- ✅ **`Section` primitive** drives every section's responsive rhythm: `py-14 sm:py-20 md:py-28`, h2 ramps `text-[1.7rem] sm:text-[2.25rem] md:text-[3rem]`, subtitle `14.5/15.5/17px`. Single source of truth — all 13 homepage sections inherit automatically.
- ✅ **Footer responsive** — grid flips `grid-cols-2 lg:grid-cols-12`; brand block spans both mobile cols (`col-span-2 lg:col-span-4`); link columns 2-up on mobile (`col-span-1 lg:col-span-2`); logo ramps `h-20 sm:h-28 md:h-32 lg:h-40`.
- ✅ **`SpanbixCourseDetail`** hero text + pill switcher + meta row all responsive: pills `px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3`, text ramps across xs→lg.
- ✅ **`CareerPaths` pill switcher** (homepage) — same responsive pill tightening.
- ✅ Manually verified: 320px / 375px / 414px / 768px / 1024px / 1280px / 1920px — every route renders cleanly, no horizontal scroll, no clipped CTAs, no logo too-big-on-mobile.

### 5.4 Option B2 architecture — independent per-tenant build targets ✅ COMPLETE
- ✅ **`VITE_BUILD_TARGET`** env var drives entry selection at build time. Supported values: `full` (default — Mavro Console + every public site), `spanbix` (standalone Spanbix routes at root), reserved `hrms` + `tickets`.
- ✅ **`client/src/lib/routeBase.js`** — `withSpanbixBase()` / `withHrmsBase()` / `withTicketsBase()` / `getBuildTarget()` / `isStandaloneSpanbix()`. Build-time read of `VITE_BUILD_TARGET` resolves to `''` for standalone or `/spanbix` for full. Same component code works under both build targets via this helper.
- ✅ **`client/src/SpanbixApp.jsx`** — Spanbix-only routing tree, root-mounted (`/`, `/courses`, `/career-paths/:code`, `/blog/:slug`, etc.). Includes legacy `/spanbix/*` Navigate redirect so inbound links from the Mavro Console era still resolve.
- ✅ **`client/src/entries/spanbix.jsx`** — standalone entry with `BrowserRouter` + `ThemeProvider` + `Toaster` ONLY. Deliberately omits `AuthProvider` + `TenantProvider` + every admin context — net effect: a Vercel deploy of this entry pulls in zero admin chunks.
- ✅ **`client/index.spanbix.html`** — Spanbix-specific `<title>`, meta description, OG / Twitter defaults, theme-color, font preloads, favicon links, script src `/src/entries/spanbix.jsx`.
- ✅ **`vite.config.js` build-target switching** — reads `process.env.VITE_BUILD_TARGET`, picks the matching `index.<target>.html` as rollup input, `define` block bakes the target into the bundle so `routeBase.js` resolves the right prefix, `closeBundle` plugin promotes `dist/index.<target>.html` → `dist/index.html` so Vercel serves it as default.
- ✅ **`devTargetHtmlPlugin`** — dev-server middleware intercepts every HTML request and substitutes `index.spanbix.html` content (still piped through `transformIndexHtml` so HMR + React plugin work). Without this, `npm run dev:spanbix` would still serve the full Mavro Console because Vite reads `<root>/index.html` by default at dev time.
- ✅ **Per-target npm scripts** in `client/package.json`: `dev:spanbix`, `build:full`, `build:spanbix`, `build:hrms`, `build:tickets`. `cross-env` added as devDependency.
- ✅ **All Spanbix Link `to=` references refactored** to use `withSpanbixBase()` — 11 components + 4 page files. `Navigate to=` redirects and `trackBlogView` paths too. Same components transparently produce `/spanbix/blog` (full build) or `/blog` (standalone).
- ✅ **Brand logo wired** — `client/public/spanbix/spanbix-white.png` + `spanbix-blue.png`. Navbar + Footer use white variant (navy bg); favicon + OG / Twitter image + Schema.org JSON-LD use blue variant.
- ✅ **Spanbix-default theme is LIGHT** — `ThemeContext` reads `VITE_BUILD_TARGET` and defaults to light when target is `spanbix` (Cyber Editorial dark stays default for `full`).
- ✅ Verified: `npm run build:spanbix` ships 0 bytes of Recharts / Quill / Radix (grep against `dist/assets/*.js` confirms `0` matches for those packages); React + framer + react-hot-toast all co-located in the entry chunk to prevent the `createContext` race that earlier manual chunking introduced.

### 5.3.1 Production-stability fixes ✅ COMPLETE
- ✅ **`vite.config.js` — manual chunks removed** → resolved the `Cannot read properties of undefined (reading 'createContext')` crash. Aggressive vendor-chunk splitting put React in `vendor-react` while libraries like `framer-motion` that call `React.createContext(...)` at module-init time were forced into `vendor-motion`; chunk execution order across non-direct deps is not guaranteed, so React could be undefined when motion's top-level code ran. Letting Rollup auto-split co-locates React with every React-peer in one chunk → no race.
- ✅ **`vercel.json` SPA-fallback fix** — dropped `cleanUrls: true` (was making Vercel try `/career-paths.html` before the rewrite catch-all → 404 on every deep-link refresh) and `trailingSlash: false` (default fine). Replaced placeholder backend URL with the real Render host. Added root-level `/sitemap.xml` + `/robots.txt` proxy rewrites pointing at `mavro-dashboard.onrender.com/sitemap/spanbix.xml` + `/robots/spanbix.txt` so SEO crawlers fetching the apex hit the backend correctly. SPA fallback uses negative-lookahead regex `/((?!assets/|favicon\.ico|sitemap\.xml|robots\.txt).*)` so `/assets/*`, favicon, and SEO files keep their real responses.
- ✅ **Navbar mount animation removed** — `motion.header` with `initial={{ y: -16, opacity: 0 }}` caused a visible white sliver between navbar and first section on every refresh. Replaced with a plain `<header>`. Mobile-menu + scroll-shadow transitions still animate (state-driven, correct UX).
- ✅ **Backend `src/app.js` static-serve gate** — production block now skips `express.static(client/dist)` + SPA fallback when `client/dist/index.html` doesn't exist (Render backend-only deploy) OR when `SERVE_CLIENT=false`. Eliminates the ENOENT crash on `/` for backend-only hosts. Logs which branch ran at boot.

### 5.3 Spanbix Vercel deployment readiness ✅ COMPLETE
- ✅ **`client/src/lib/apiBase.js`** — single source of truth for API origin. `apiPath('/api/x')` returns relative `/api/x` in dev / co-hosted prod, or absolute `<VITE_API_BASE_URL>/api/x` for independent Vercel deploys.
- ✅ All 4 channels wired through it: `api/axios.js`, `api/public.js`, `api/seo.js` (sitemap rootApi), `lib/analytics.js` (raw `sendBeacon`).
- ✅ **Admin routes lazy-loaded** in `App.jsx` via `React.lazy` + `Suspense`. Login, DashboardLayout, ProtectedRoute, BlogList, BlogForm, LeadList, WebsiteList, SeoEngine, Analytics, Calendar, PremiumTestDashboard — none ship in the public-bundle initial payload.
- ✅ `client/vercel.json` (initial version), `client/.env.example`, `DEPLOYMENT.md` written.
- ✅ Provider-tree audit: `AuthProvider` only fetches `/api/auth/me` when token exists; `TenantProvider` only fetches `/api/websites` when user is set. Public visitors trigger zero auth/tenant requests.

### 5.2 Spanbix full admin parity + auto-bootstrap ✅ COMPLETE
- ✅ **Auto-bootstrap on backend boot** — `seedSpanbix.js` refactored to export `upsertSpanbixTenant({ silent })`; CLI runner gated by `require.main === module`. `server.js` calls the upsert after `connectDB()` so the Spanbix `Website` row materializes (and refreshes content fields) on every backend restart.
- ✅ **Observable bootstrap logging** — `silent: true` only suppresses the per-field snapshot. Status (success / failure) ALWAYS prints to stdout/stderr — one `✅ [bootstrap]` line on success, full `❌ [bootstrap]` + Mongoose per-field error trace on failure. Silent-but-failing bootstraps eliminated.
- ✅ **Compact `aiContext` per current spec** — replaced the verbose Phase 5.1 long-form audience/industry/tone/vocabulary/avoid block with a tight, prompt-budget-friendly version: single-line audience ("Commerce, MBA, and non-technical graduates seeking enterprise technology careers"), single-line industry/tone, 6-term vocabulary, 3-item avoid list. The seed always refreshes this on next boot.
- ✅ **Spanbix added to default `seedWebsites` array** in `src/utils/seeder.js` (between Tickets and Fleet) so fresh installs include it from the first `npm run seed`.
- ✅ **Verified full admin parity** — every admin surface uses `getWebsites()` which returns all active tenants. Spanbix now appears automatically in: Dashboard TenantSwitcher, Blog CMS list + form, Lead inbox, SEO Engine, Calendar, Analytics Intelligence filter, Properties page. No tenant-specific code was needed.
- ✅ **Verified full public-infrastructure parity** — sitemap (`/sitemap/spanbix.xml`), robots (`/robots/spanbix.txt`), public blog list + detail endpoints, public lookup endpoint all key off the `Website.slug` lookup pattern and resolve Spanbix immediately.
- ✅ **Verified analytics + lead pipelines** — `SpanbixLayout` sets `setAnalyticsTenant('spanbix')` at module load + on mount; every page_view / blog_view / cta_click fires with the spanbix slug. `ContactForm` submits with `formId: 'spanbix-contact'` and the backend emits the canonical server-side `form_submit` AnalyticsEvent.
- ✅ **AI blog generation for Spanbix held back intentionally** — though AI services would work for any tenant via dynamic `aiContext`, Spanbix blog content stays human-written for the current launch. No code-level block (no hardcoded tenant maps reintroduced); operational decision documented in PROJECT_CONTEXT §15.41 + CLAUDE.md invariants.

### 5.1 Spanbix catalog refinement + course detail + faculty + placement support ✅ COMPLETE
- ✅ SAP catalog trimmed to 4 active tracks (FICO, MM, SD, ABAP) — HCM, SuccessFactors, BASIS, Analytics deferred to a later phase
- ✅ Each track extended with rich detail in `lib/spanbixSeo.js`: pricing (`priceIndividual` + `priceMrp`), social proof (`studentsEnrolled` / `rating` / `ratingsCount` / `lastUpdated` / `language`), instructor `{ name, title, bio }`, `whatYoullLearn[]`, `includes[]`, `requirements[]`, week-bucketed `individualTimeline[]` (14–20 weeks), month-bucketed `campusTimeline[]` (6–7 months aligned to academic calendar). Helper `getCareerPath(code)` resolves a track by slug
- ✅ `SPANBIX_CAMPUS_PROGRAM` constant added — drives the campus pseudo-program in the homepage Career Paths pill switcher
- ✅ Listing page (`/spanbix/career-paths`) rewritten as Udemy-style horizontal grid — navy preview header per card with gradient track code, category pill, bestseller chip, rating + stars, mini-pills, price + slashed MRP, View course CTA
- ✅ **New dynamic route** `/spanbix/career-paths/:code` → `SpanbixCourseDetail.jsx` — navy hero + floating enrolment panel + What you'll learn + accordion timeline + This course includes + Requirements + Instructor
- ✅ **Individual / Campus pill toggle** on the detail page swaps the entire surface: Individual shows price + Enrol CTA + `individualTimeline`; Campus hides price (negotiated with college T&P in backend) + shows "Talk to Campus Team" CTA + `campusTimeline`
- ✅ Deep-link via `?mode=campus` query param consumed by `useSearchParams` — campus catalog cards land directly on the campus view, no extra click
- ✅ `CampusCoursesCatalog` component — campus-context catalog inserted in `/spanbix/campus-programs` listing the same 4 tracks tuned for placement-cell framing, links to `?mode=campus` detail
- ✅ `IndustryExperts` component — homepage faculty + mentor scroll-snap rail on navy. 6 cards: 4 track instructors + 2 cross-track mentors (Vikram Joshi / Divya Krishnan). Initials-gradient avatars (no fabricated portraits)
- ✅ `PlacementSupport` component — homepage 3-step placement layer (Profile Building / Mentor & Alumni Referrals / Hiring Partner Tie-Ups) with navy step cards on white. CSS/SVG mini illustrations per step. Honest hiring-category chip strip (8 categories) instead of fake brand-logo wall
- ✅ **Section tone system** — `Section.jsx` extended with `white`/`cream`/`navy` tones via `TONE_STYLES` map; each tone resolves its own caption / title / subtitle / rule colors automatically. Homepage rhythm hand-tuned across 13 sections — no two same-tone sections adjacent
- ✅ **`.spanbix-scope` CSS opt-out** — `index.css` extended so Spanbix's navy zones bypass Mavro's global light-mode utility repaint and render literal white text/surfaces. `SpanbixLayout` root carries the scope class
- ✅ **Full marketing copy rewrite** — every Spanbix homepage section + subpage PageHero rewritten from PDF-summary voice to opinionated market-aware language. New Hero headline ("There are 40,000 SAP jobs waiting. Almost nobody told graduates about them."), 6 fresh FAQs, sharper feature blocks across the entire surface
- ✅ Cleanup — ContactForm interest pills trimmed to active 4 tracks; FAQ + WhySap + keywords purged of removed module names

### 5.0 Spanbix tenant launch ✅ COMPLETE
- ✅ Third active tenant (`spanbix`) — first non-Mavro-prefixed brand validating that the multi-tenant frontend pattern scales to a separate vertical (SAP / ERP / enterprise education)
- ✅ Idempotent backend seeder (`node src/utils/seedSpanbix.js`, also `npm run seed:spanbix`) — creates the `Website` row with branding + `seoDefaults` + full `aiContext` (audience / industry / tone / SAP vocabulary / avoid list)
- ✅ Typography pipeline — DM Serif Display + Sora + JetBrains Mono loaded in `client/index.html` and registered in `tailwind.config.js → fontFamily` (`serif`, `sora`, `mono`)
- ✅ Brand foundation — `client/src/lib/spanbixSeo.js` with `SPANBIX_SITE` constants, `SPANBIX_BRAND` color tokens, `SPANBIX_CAREER_PATHS` (8 SAP tracks), `SPANBIX_MARKET_SIGNALS`, and JSON-LD builders (`organizationLd`, `educationalOrganizationLd`, `faqLd`, `breadcrumbLd`, `courseLd`, `blogPostingLd`, `blogListLd`)
- ✅ 10 public marketing routes — `/spanbix` + 9 sub-pages, registered in `App.jsx`
- ✅ 16 frontend components — `SpanbixLayout`, `Navbar`, `Footer`, `Section`, `PageHero`, `Hero`, `MarketValidation`, `WhySap`, `CareerPaths`, `LearningExperience`, `DemoClasses`, `CampusPrograms`, `SuccessStories`, `Certifications`, `FinalCta`, `ContactForm`
- ✅ Tenant analytics — `setAnalyticsTenant('spanbix')` fires on layout mount + module load; all page_view / cta_click / blog_view events scope to the new tenant
- ✅ Lead capture — `submitPublicLead({ formId: 'spanbix-contact' })` flows through the existing 6-layer spam pipeline; backend emits canonical `form_submit` event server-side
- ✅ Zero backend route changes — sitemap, robots, AI orchestration, SEO audit, analytics aggregation all pick up the new tenant via the slug-based pattern. Confirms the "add new tenant = `Website` row + frontend layer" architecture promise.

### 4.0.1 Multi-tenant AI scaling ✅ COMPLETE
- ✅ `Website.aiContext` schema block — `{ audience, industry, tone, vocabulary[], avoid[] }`
- ✅ `src/services/ai/promptBuilders/tenantContext.js` — pure-function `renderTenantBrief()` builds the per-tenant AI brief from `aiContext` → derived `description` + `seoDefaults.keywords` + `name` → generic B2B fallback
- ✅ `src/services/ai/tenantResolver.js` — single shared lookup used by every AI controller (`resolveTenantContext({ targetWebsite, tenantSlug })` → `{ slug, name, doc }`)
- ✅ Stripped hardcoded `TENANT_BRIEFS` maps from `titlePrompt.js`, `metaPrompt.js`, `faqPrompt.js`, `siteIntelligencePrompt.js`
- ✅ All 4 prompt builders now accept `tenant` field (full Website doc) and delegate to `renderTenantBrief()`
- ✅ All AI controllers (`generateBlogTitles`, `generateBlogMetaDescriptions`, `generateBlogFaqs`) use the shared resolver
- ✅ `siteIntelligenceService` fetches full AI-relevant Website fields and passes through to the prompt builder
- ✅ Verified live: a brand-new "Mavro Asset Tracking" tenant produced finance-vocab-correct titles with zero code change

### 4.0 AI Infrastructure + Editorial Assistance ✅ COMPLETE
- ✅ `src/services/ai/` provider-agnostic orchestration layer
- ✅ `BaseProvider` abstract + `GeminiProvider` + `OpenRouterProvider` (OpenAI-API-compatible gateway)
- ✅ `config/modelRegistry.js` with 8 registered models: DeepSeek V4 Flash, Nemotron 3 Super 120B, Qwen3 Next 80B Instruct, GPT-OSS 120B (free), GLM 4.5 Air (free), Qwen3 Coder (free), Gemini 2.5 Flash Lite, Gemini 2.5 Flash
- ✅ `config/routingStrategy.js` with 9 feature plans (titles, meta_descriptions, faqs, outline, seo_audit, semantic_suggestions, long_form, planning, default) — each a cross-provider fallback chain
- ✅ `AIProviderService` — feature-routed `generateText`, quota-aware fallover, exponential backoff retries, prompt sanitization (24k char cap), structured logging ring buffer (200)
- ✅ AI Title Suggestions V1 — `AiTitleSuggester.jsx` next to title field; 7 categories × 2; deterministic per-title quality scoring; one-click Apply → live SEO recalc
- ✅ AI Meta Description Suggestions V1 — `AiMetaSuggester.jsx` next to Meta Description label; 7 categories × 2; deterministic quality scoring; live metadata score recalc
- ✅ Diagnostics endpoints: `/api/ai/health` (provider + model + routing snapshot), `/api/ai/model-test` (single-model probe), `/api/ai/route-test` (exercise chain incl. fallover)
- ✅ Security: dedicated `/api/ai` rate limiter (20/min/IP, prod-only), keys backend-only, JWT-protected, role-gated `/test` `/model-test` `/route-test`



**Theme:** layer LLM-driven recommendations on top of the deterministic audit engine. **Critical:** AI never replaces the engine — it augments it with explanations + suggestions.

### 4.0.x Phase 4 sub-items remaining (next sprint)
- AI FAQ generator (routing already wired: `feature: 'faqs'` → Qwen3-Next primary). Will reuse `FaqBlockButton.jsx` flow to insert AI-generated FAQ blocks that the existing detector + FAQPage JSON-LD generator pick up automatically.
- AI Outline generator for new blogs (routing wired: `feature: 'outline'` → GLM → GPT-OSS).
- Wire up `/api/ai/blog/seo-audit` + `/api/ai/blog/semantic-suggestions` consumer endpoints for `/seo` page surfaces (engine helpers already in `AIProviderService` placeholders).
- Re-wire the Semantic Variations / Supporting Terms / Coverage panels in `KeywordIntelligenceCard.jsx` to consume the LLM semantic engine (currently HIDDEN pending this layer — heuristic engine still computes them).

### 4.1 LLM recommendation layer
- Per-blog "Optimization Suggestions" card in SEO Engine
- Inputs: blog content + audit results + GSC top queries
- Outputs:
  - Headline rewrite suggestions (with reasoning)
  - Meta description rewrites
  - Internal-link target suggestions (matched against blog corpus)
  - Content expansion outline (H2s the blog should add)
- Backend endpoint: `POST /api/seo/suggest/:blogId` → calls Claude/GPT, returns suggestions

### 4.2 Semantic content clustering — re-wire Keyword Intelligence semantic panels (variations/supporting terms/coverage) using LLM embeddings instead of n-gram heuristics
- For each tenant, embed all blogs (via local sentence-transformer or API)
- Detect topical clusters
- Identify content gaps (clusters with weak coverage)
- Identify content cannibalization (clusters with multiple weak posts that should merge)
- UI: `/seo/topics` page with cluster visualization

### 4.3 Content optimization assistant
- In the Blog editor, real-time engine integration:
  - SEO sidebar shows live overall score as user types
  - Per-issue inline highlight (similar to Yoast/RankMath in WordPress)
  - "Apply fix" suggestions backed by LLM rewrites

### 4.4 Lead intent classification
- LLM classifies inbound lead messages into intent categories (demo request, pricing inquiry, partnership, support, spam)
- Auto-tags lead + routes to appropriate notification channel
- Dashboard breakdown of lead intent over time

### 4.5 Auto-meta generation
- One-click "Generate SEO metadata" in blog editor
- LLM produces seoTitle + seoDescription + tags from blog content
- Human reviews + saves

---

## Phase 4 — Production Readiness

**Theme:** prepare for real deployment and scaling.

### 4.1 Deployment
- Dockerfile + multi-stage build
- nginx config for serving static frontend + reverse-proxy to backend
- PM2 ecosystem config for process management
- Health probes + auto-restart
- Environment-aware config: separate dev / staging / prod env files

### 4.2 Domain mapping
- Flip each tenant's `domain` field from `localhost:5173/<slug>` to `<slug>.mavro.com` or custom domain
- DNS configuration outside repo
- Universal `publicUrlFromDomain()` resolver already handles both forms — no code change needed
- HTTPS via Let's Encrypt or Cloudflare

### 4.3 Authentication hardening
- Add refresh-token flow (currently 7-day JWT expiry forces re-login)
- Add 2FA option for superadmin role
- Session revocation endpoint
- Audit log for all auth events

### 4.4 Privacy & GDPR
- IP address hashing (daily-rotating salt) in `AnalyticsEvent` + `Lead`
- Cookie consent banner on public sites (analytics only fires post-consent)
- DSAR (Data Subject Access Request) flow for lead/analytics data export
- Configurable data retention per tenant

### 4.5 Performance & scaling
- Redis cache layer for sitemap generation (currently on-request)
- Mongo replica set with read preference for analytics queries
- CDN in front of public sites (Cloudflare or similar)
- Image upload pipeline with Cloudflare R2 / S3 + image optimization
- Server-side blog pre-rendering or static export for top public pages
- Background queue (Bull/BullMQ) for indexing pings, GSC syncs, audit cron jobs

### 4.6 Observability
- Sentry integration (frontend + backend)
- Mongo slow-query monitoring
- Prometheus metrics export from Express
- Custom Grafana dashboard for: traffic, lead conversion, indexing latency, audit scores over time

### 4.7 Testing
- Vitest + Testing Library for frontend
- Jest + Supertest for backend
- E2E suite with Playwright covering: lead submission, blog publish flow, SEO audit, analytics ingestion, tenant cleanup
- CI/CD pipeline: GitHub Actions → lint → test → build → deploy preview

### 4.8 Tenant self-service
- Marketing site for Mavro itself (sales page)
- Tenant onboarding flow: invite link → set up website row → configure branding → publish first blog
- Per-tenant billing integration (Stripe) gated by feature tiers

---

## Phase 5 — Beyond Phase 4 (long horizon)

- AI-driven content gap analysis tying to keyword research APIs (Ahrefs, Semrush data import)
- Competitor analysis module
- A/B testing layer for landing pages
- Internal link recommender (graph-based)
- WCAG 2.2 AA accessibility audit on every blog
- Performance budget enforcement (CLS, LCP, INP) per public page
- Multilingual support (i18n keys for public sites)
- White-label deployment for resellers

---

## Reserved Integration Points (Already Wired)

These call-sites are stubbed and ready for backend implementation:

| Frontend caller | Backend endpoint to implement | Phase |
|---|---|---|
| `client/src/api/seo.js → getGoogleSearchConsoleSummary` | `GET /api/seo/gsc/summary/:websiteId` | 2.1 |
| `client/src/api/seo.js → getBingWebmasterSummary` | `GET /api/seo/bing/summary/:websiteId` | 2.2 |
| `SeoEngine.jsx IntegrationCard` placeholders | Both above | 2.1, 2.2 |

---

## Decision Log Forward

When implementing each phase:
- **Always preserve PROJECT_CONTEXT §15 invariants** (rate-limiter behavior, server-side form_submit, UTC alignment, etc.)
- **Document new load-bearing decisions** in PROJECT_CONTEXT §15
- **Never break the no-fake-data rule** — see AGENTS.md philosophy section
- **Multi-tenant first** — see MULTI_TENANT_SYSTEM.md for the pattern to follow

---

## How to Pick the Next Task

1. Read PROJECT_CONTEXT.md current status
2. Read the Phase X section here
3. Check ARCHITECTURE.md for the system touchpoint you'll modify
4. Check SEO_ENGINE.md / ANALYTICS_SYSTEM.md / MULTI_TENANT_SYSTEM.md for the specific subsystem
5. Build in a way that future phases can plug in cleanly

---

## ✅ Phase 5.8 — Spanbix Tone Pass + Lead Schema Flexibility (May 26, 2026)

### Goals
- Strip overclaims across every Spanbix surface — sales-y promises, AICTE/NAAC compliance claims, SAP-exam-parity language, fabricated placement counts.
- Switch to ERP-first framing while keeping SAP context where meaningful.
- Replace placeholder striped photos with real images sitewide.
- Make the lead schema flexible enough for any tenant's form without per-tenant code changes.
- Lock down hosting topology (Vercel + Render + Atlas + optional Redis) with custom-domain readiness.

### Completed
- ✅ **6 sections removed** from Spanbix flow: DemoVideos (homepage), Placements page (entirely + routes + nav), Full Catalog table (CareerPaths), Operating Principles (About), Certification (homepage only), inline lead form (FinalCta).
- ✅ **All 4 track durations unified to 3 months.**
- ✅ **Personality development module** wired into every track card + `whatYoullLearn[]` + `includes[]` + campus highlights, with citron marker-highlight via `Tracks.jsx` keyword matcher.
- ✅ **AICTE / NAAC / NSDC stripped sitewide.**
- ✅ **SAP-exam parity claims dropped.** "Crack the C_TS####" bullets gone. "Maps directly to SAP's official C_TS exams" Certification point gone. Spanbix credential framed as its own mentor-signed certificate.
- ✅ **Real images wired** for WhySap (6 cards), MarketValidation, Outcomes (3 alumni), Campus, Contact lane cards (3), Mentors (4 faculty), About founder story.
- ✅ **SPANBIX_MENTORS hoisted** to `spanbixSeo.js` as single source of faculty data for homepage carousel + course-detail `MentorCarousel`.
- ✅ **New `MentorCarousel`** component on course detail pages — one mentor at a time, prev/next chevrons, clickable dots, framer-motion crossfade, 50px touch swipe, sticky on `md+`.
- ✅ **Course detail page rebuilt** — pricing display removed (Enrol Now → `/contact`), timeline render bug fixed (`block.meta + block.title` reads), per-module 4-bullet topics dropped for general flow, "This Track Includes" reduced 9 → 5 generic items, responsive 2-col grids stack on mobile.
- ✅ **Footer track route bug fixed** — `/career-paths/sap-fico` → `/career-paths/fico` (codes are bare).
- ✅ **Contact page form built** — 2-col 30/70 layout (navy aside left with 4 contact rows + Google Maps iframe, white card right with full lead form). Audience lanes get `Start The Conversation` anchor CTAs.
- ✅ **Phone + locations updated** — `+91 9211429011`, `Noida · Lucknow`.
- ✅ **Lead schema rebuilt** — `formId` (indexed) + `customFields` (Mixed) added to `Lead.js`. Sanitizer in `leadController.js`. All 3 ContactForms (Spanbix/HRMS/Tickets) send real form keys via `customFields` instead of bracket-stuffing `message`. `LeadList.jsx` modal auto-renders the keys.
- ✅ **Navbar redesigned** to glassmorphic cream (`rgba(243, 237, 224, 0.72)` + `blur(22px) saturate(160%)`). Logo is real blue PNG, zero vertical padding, `clamp(56-96px)` height. Footer logo wrapped in white pill against navy bg.
- ✅ **Spanbix sections become props-driven**: `MarketValidation` (eyebrow/title/lead/stats/sources/image/imageAlt/imageCorner), `Campus` (tone navy|paper + showCtaStrip). About + CampusPrograms subpages override defaults — homepage unchanged.
- ✅ **`client/vercel.json` rewritten** as shared multi-project config (Spanbix + Admin). `buildCommand` removed (per-project Vercel UI overrides). Sitemap + robots rewrites use actual backend paths.
- ✅ **Linux-safe imports** — Badge import case fixed (`@/components/ui/Badge`).
- ✅ **Hosting decisions documented** — Vercel for frontend (custom domain attachable in 15 min, no migration needed), Render for backend (Starter $7/mo recommended for always-on).

### Deferred (intentional, not removed from data)
- 🕒 `priceIndividual` + `priceMrp` fields still live in `spanbixSeo.js` but no longer rendered. Reinstate when pricing is finalised + approved for public display.
- 🕒 `instructor` per-track field still in data but no longer rendered (`MentorCarousel` replaces it). Decide later whether to surface track-lead in addition to faculty roster.
- ✅ Spanbix custom-domain attach (`www.spanbix.com` → Vercel spanbix-web project). **Done in Phase 5.9.1.** Apex `spanbix.com` 301-redirects to www at the Cloudflare edge.

### Open follow-ups
- 🔜 Real recordings infrastructure (Cloudflare R2 + signed upload URLs) when the recording library goes live.
- ✅ Backend CORS allowlist updated for `https://spanbix.com` + `https://www.spanbix.com`. **Done in Phase 5.9.1.** Baseline now in `src/app.js`; preview regex covers every `spanbix-web-*.vercel.app` deployment.
- 🔜 Render free-tier upgrade decision (Starter $7/mo always-on vs UptimeRobot keepalive).
- 🔜 Submit `www.spanbix.com` to `hstspreload.org` once a few production requests have confirmed the `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` header is live.
- 🔜 Migrate HRMS + Tickets to the same Next.js SSR pattern when their organic SEO becomes a priority. Architectural blueprint is now `spanbix-web/`.
- 🔜 Replace CSP `'unsafe-inline' 'unsafe-eval'` on `script-src` with a per-request nonce (would require the Proxy layer to inject the nonce on every render).
- 🔜 Per-blog `ogImage` upload pipeline so social previews stop falling back to the Spanbix logo for posts that don't set a featured image.

---

## Phase 7 follow-ups — SAP Ads landing page + tracking (June 2026)

Code is shipped; these are blocked on third-party IDs/accounts or are explicit next steps. Full record in PROJECT_CONTEXT.md §Phase 7.

### Pending — needs IDs from the ads/analytics person
- 🔜 **GA4 / GTM / Google Ads IDs** — receive `G-…` (GA4 Measurement ID), `GTM-…` (container ID), `AW-…` + conversion label (Google Ads "Lead – SAP LP"). The request email + console setup steps are written; waiting on the reply.
- 🔜 **Set `NEXT_PUBLIC_GTM_ID` on the spanbix-web Vercel project + redeploy** → GTM loads sitewide and starts receiving the dataLayer events (`page_view`, `cta_click`, `call_click`, `whatsapp_click`, `generate_lead`).
- 🔜 **Build the importable GTM container JSON** (GA4 config tag + custom-event → GA4 event tags + Conversion Linker + Google Ads conversion on `generate_lead`) so the analytics person imports instead of hand-building tags.
- 🔜 **Enhanced Conversions for Google Ads** — push hashed email/phone (`user_data`) to dataLayer for better match rates / lower CPA. Small client change + a toggle in Ads.
- 🔜 **Mark `generate_lead` as a Key event/conversion in GA4** + link GA4 ↔ Google Ads and GA4 ↔ Search Console.

### Deferred / optional
- 🕒 **Live Google reviews on `/sap-course`** — `src/lib/googleReviews.js` auto-merges real Google reviews when `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID` are set on Vercel (Places API caps at 5). Currently curated reviews only (4 alumni + 3 real pasted). User deprioritised the live pull.
- 🕒 **Offline / qualified-conversion import** — once a lead actually enrols, feed that back to Google Ads as an offline conversion (keyed on the captured `gclid`) so Ads optimises for QUALITY, not just form-fills. Depends on a lead-status → Ads pipeline.

### Declined (do not build without an explicit new ask)
- ⛔ **Automated lead-alert notifications** (WhatsApp/Telegram/email/SMS) — a `leadNotifier` service was built and **reverted at user request**. Note: official WhatsApp Cloud API cannot post to groups (needs a 3rd-party gateway); free single-recipient options surveyed: Email (Brevo/Resend/Gmail SMTP), CallMeBot (unofficial WhatsApp), Telegram bot, ntfy.sh. SMS is not realistically free in India (DLT + paid gateway).

---

*End of roadmap.*
</content>
</invoke>