# Mavro Platform — Project Context (Master Memory)

**Status:** Active Development · Phase 4.0 (AI Editorial Assistance — multi-model orchestration)
**Last Updated:** 2026-05-16
**Environment:** Local Development
**Frontend:** http://localhost:5173
**Backend:** http://localhost:5000

This is the master operational memory file for the Mavro platform. It survives Claude auto-compaction, context resets, agent switching, and long development cycles. Any new agent or human contributor must read this first.

Companion files in repository root:
- [ARCHITECTURE.md](./ARCHITECTURE.md) — full architecture + data flow diagrams
- [SEO_ENGINE.md](./SEO_ENGINE.md) — weighted SEO scoring system internals
- [ANALYTICS_SYSTEM.md](./ANALYTICS_SYSTEM.md) — event ingestion + aggregation pipeline
- [MULTI_TENANT_SYSTEM.md](./MULTI_TENANT_SYSTEM.md) — tenant isolation logic
- [ROUTING_MAP.md](./ROUTING_MAP.md) — every route, public + protected
- [FUTURE_ROADMAP.md](./FUTURE_ROADMAP.md) — phased plan
- [UI_VISION.md](./UI_VISION.md) — design manifesto
- [AGENTS.md](./AGENTS.md) — engineering operating system
- [CLAUDE.md](./CLAUDE.md) — Claude session optimization

---

## 1. What Mavro Is

Mavro is a **multi-tenant SEO + publishing + lead operations platform**. One Node/Express + MongoDB Atlas backend serves multiple branded public marketing sites (currently HRMS, Ticket Management) plus a unified admin dashboard. Each public site reads blogs + submits leads through tenant-scoped APIs. The admin dashboard manages content, leads, websites, SEO health, and real-time analytics across every tenant.

**Identity:** futuristic enterprise operations console — not a generic admin panel, not a CMS.

**Three concurrent surfaces:**
1. Admin operations console (`/`, `/blogs`, `/leads`, `/websites`, `/seo`, etc.)
2. Public marketing sites (`/hrms*`, `/tickets*`)
3. Public infrastructure surfaces (`/sitemap/*`, `/robots/*`, `/api/leads/submit`, `/api/analytics/track`)

---

## 2. Tech Stack

**Frontend** (`client/`)
- React 18 (Vite 5)
- TailwindCSS 3 with CSS-variable token system
- shadcn/ui primitives (`button`, `card`, `input`, `badge`, `dialog`, `dropdown-menu`)
- Framer Motion (scroll-driven, parallax, stagger reveals)
- Lucide React (iconography)
- Recharts (charts, gauges, radial bars)
- Axios (API clients)
- React Router v6
- React Hook Form + Zod (form validation)
- React Quill New (rich text editor in CMS)
- React Hot Toast (notifications)

**Backend** (`src/`)
- Node.js >=18 + Express 4
- MongoDB Atlas + Mongoose 8
- JWT auth (`jsonwebtoken`), 7-day expiry
- Helmet + CORS + Compression + Morgan
- express-rate-limit (per-route + global)
- express-validator (input validation)
- bcryptjs (password hashing)
- slugify (auto slug generation)

---

## 3. Active Tenants

| Slug | Name | Public route | Status |
|---|---|---|---|
| `mavro-hrms` | Mavro HRMS | `/hrms` | Live (co-hosted on the Vite admin bundle) |
| `mavro-ticket-management` | Mavro Ticket Management | `/tickets` | Live (co-hosted on the Vite admin bundle) |
| `spanbix` | Spanbix | `https://www.spanbix.com` | **Live on the standalone Next.js app `spanbix-web/`** — Career Transformation Infrastructure for Enterprise Technologies (SAP ecosystem upskilling, campus partnerships, placement). Brand isolated: navy `#102c56` + accent `#2764e4` + Instrument Serif + Geist + JetBrains Mono (DM Serif Display + Sora retained as fallbacks). Public ecosystem at root: `/`, `/courses`, `/career-paths`, `/career-paths/{fico,mm,sd,abap}`, `/campus-programs`, `/about`, `/contact`, `/blog`, `/blog/<slug>`. Legacy `/spanbix/*` page paths 308 → root via `next.config.mjs` redirects (asset-extension excluded). |

**Canonical host:** `https://www.spanbix.com`. Apex `spanbix.com` 301-redirects to www via `spanbix-web/src/proxy.js` (Next 16 Proxy / formerly Middleware — explicit `NextResponse.redirect(url, 301)`, since `redirects()` only emits 307/308). Legacy `spanbix-web.vercel.app` stays in the CORS allowlist as a fallback / preview alias. `Website.domain` for the Spanbix row was migrated to `"www.spanbix.com"` (the backend sitemap + robots URL generators read this field via `sitemapService.buildBaseUrl`).

Demo tenants (Fleet, Inventory, Transport) removed via `POST /api/websites/_cleanup-demo`. Domains stored in `Website.domain` as `localhost:5173/hrms` and `localhost:5173/tickets` for dev; will be flipped to production hostnames at deploy time without code changes (resolver detects `localhost*` prefix and switches `http://` vs `https://`).

---

## 4. Local Development

```bash
# Backend on :5000
cd custombackend
npm run dev                    # nodemon src/server.js

# Frontend on :5173
cd custombackend/client
npm run dev                    # vite
```

`.env` (backend):
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster...
JWT_SECRET=<secret>
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
ADMIN_EMAIL=admin@mavro.com
ADMIN_PASSWORD=Admin@123456
```

Vite proxies in `client/vite.config.js`:
- `/api` → `http://localhost:5000`
- `/sitemap` → `http://localhost:5000`
- `/robots` → `http://localhost:5000`

Default admin: `admin@mavro.com` / `Admin@123456` (seeded).

---

## 5. Key Routes

### Public marketing
- `/hrms` — HRMS landing (`HrmsLanding.jsx`)
- `/hrms/blog` — HRMS blog list
- `/hrms/blog/:slug` — HRMS blog detail
- `/tickets` — Tickets landing (`TicketsLanding.jsx`)
- `/tickets/blog` — Tickets blog list
- `/tickets/blog/:slug` — Tickets blog detail

### Admin (protected by `ProtectedRoute` + JWT)
- `/` — Command Center dashboard (real analytics, tenant-scoped via global `TenantContext`)
- `/blogs` — Blog CMS list
- `/blogs/new`, `/blogs/:id/edit` — **Blog Editor Cockpit** (real-time SEO writing, focus keyword, live checklist, 7 cockpit cards)
- `/leads` — Lead capture list
- `/websites` — Tenant management + Visit Website
- `/seo` — SEO Engine (weighted v3 audit + sitemap + robots + content intelligence + **Internal Linking** (LinkGraph + LinkingQuality + Orphan + Clusters) + **Content Decay Monitoring** (ContentDecayPanel + DecayQueueCard + DecayAlertsStrip))
- `/analytics` — **Analytics Intelligence** (overview + funnel + tenant comparison + content + realtime + SEO telemetry + operational insights)
- `/calendar` — **Content Calendar** (Month / Agenda / Editorial Kanban views + Campaign panel + Velocity strip + Planning recommendations + Activity feed)
- `/login` — Auth

### Public infra
- `/sitemap/index.xml` — master sitemap
- `/sitemap/:slug.xml` — per-tenant sitemap
- `/robots/:slug.txt` — per-tenant robots
- `POST /api/leads/submit` — public lead capture (rate-limited + 6-layer spam protection)
- `POST /api/analytics/track` — public analytics ingestion (rate-limited, dedicated bucket)
- `GET /api/websites/public/:slug` — public tenant lookup
- `GET /api/blogs/website/:slug` — public blog list
- `GET /api/blogs/website/:websiteSlug/:blogSlug` — public blog detail
- **Editorial APIs** (protected): `PATCH /api/blogs/:id/schedule` (reschedule), `/workflow` (transition), `/assign` (ownership), `/approve`, `/request-revision`, `/reject`. `POST /api/blogs/import-docx` (mammoth + heading inference). `GET /api/blogs/activity` (cross-corpus activity feed). `GET /api/analytics/blog-trends` (per-blog current vs previous-window deltas for decay engine). Full CRUD for `/api/campaigns/*` + `POST /api/campaigns/:id/assign-blogs`.
- **AI APIs** (Phase 4.0, protected, dedicated `/api/ai` rate limiter): `GET /api/ai/health` (providers + 8-model registry + 9 feature routing chains + log stats), `GET /api/ai/recent` (in-process AI request log), `POST /api/ai/test` (free-form prompt, accepts `feature` key), `POST /api/ai/model-test` (single-model probe, bypasses routing), `POST /api/ai/route-test` (exercise feature routing + fallover), `POST /api/ai/blog/titles` (AI title suggestions, 7 categories), `POST /api/ai/blog/meta-descriptions` (AI meta descriptions, 7 categories). All AI calls flow through `AIProviderService` → `BaseProvider` subclass → registry-resolved model. Frontend never sees provider keys.

Full route inventory: [ROUTING_MAP.md](./ROUTING_MAP.md).

---

## 6. Database Models

All under `src/models/`:

- **`AdminUser`** — admins. Roles: `superadmin`, `admin`, `editor`, `seo_manager`, `writer`, `reviewer`. Capability matrix lives in `src/utils/permissions.js → CAPABILITIES`; `can(user, action)` + `requireCapability(action)` middleware available for new editorial endpoints. Existing endpoints still use `authorize()` middleware.
- **`Website`** — tenant config. Fields: `name`, `slug` (auto from name), `domain`, `description`, `branding{primaryColor, secondaryColor, fontFamily}`, `status` enum [`active`, `inactive`, `maintenance`], `seoDefaults`, `cachedStats`, `sitemapUrl`, `notificationEmails`, `aiContext{ audience, industry, tone, vocabulary[], avoid[] }` (Phase 4.0.1 — drives the AI layer's per-tenant prompt brief; all fields optional, falls back to derived defaults from `description` + `seoDefaults.keywords` + `name`).
- **`Blog`** — content. Required: `title`, `content` (HTML), `targetWebsite` (ObjectId → Website). SEO fields: `seoTitle`, `seoDescription`, `keywords[]`, `canonicalUrl`, `ogImage`, `tags[]`, `category`. Lifecycle: `status` enum [`draft`, `published`, `scheduled`, `archived`], `publishedAt`, `scheduledAt`, `indexingStatus`, `lastIndexedAt`, `version`, `lastEditedBy`. **Editorial layer**: `editorialStatus` 5-state enum [`ideas`, `drafting`, `review`, `scheduled`, `published`] (drives `/calendar` Kanban), legacy `workflowStatus` 8-state retained for back-compat, `isUpdating` boolean flag, `campaign` (ObjectId → Campaign), `assignedTo`/`reviewer`/`seoReviewer` (AdminUser refs), `editorialNotes`, `dueAt`, `priority` enum [`low`,`medium`,`high`,`urgent`], `completionPercentage`. **History**: `workflowHistory[]`, `publishHistory[]`, `activityLog[]` (capped at 200 entries), `reviewNotes[]` (approve/request-revision/reject). **Approval**: `approvedAt`, `approvedBy`, `lastReviewedAt`. `content` is HEAVY — list-view strips it unless `?includeContent=true`.
- **`Campaign`** — editorial campaign grouping (tenant-scoped). Fields: `name`, `slug` (auto), `description`, `targetWebsite` (ObjectId → Website, required, immutable post-create), `color`, `startDate`, `endDate`, `targetKeywords[]`, `targetBlogCount`, `targetSeoScore`, `assignedTeam[]` (AdminUser refs), `status` enum [`planned`,`active`,`completed`,`paused`]. Unique slug per tenant. List endpoint hydrates per-campaign `progress` (total/published/scheduled/draft) + `velocity` rollup (publishedPerWeek, overdueDrafts, daysRemaining, completionPct, risk).
- **`Lead`** — captured leads. `website` (ObjectId → Website), `name`, `email`, `phone`, `company`, `message`, `sourcePage`, `referrer`, `utmSource/Medium/Campaign`, `spamScore`, `spamReasons`, `isSpam`, `status`, `statusHistory`, `ipAddress`, `userAgent`.
- **`AnalyticsEvent`** — event log. `websiteSlug`, `eventType` enum [`page_view`, `blog_view`, `form_submit`, `cta_click`], `page`, `sessionId`, `ipAddress`, `referrer`, `deviceType`, `browser`, `os`, `userAgent`, `meta` (Mixed), `timestamp`. TTL: 540 days. Compound indexes on `{websiteSlug, timestamp}` and `{websiteSlug, eventType, timestamp}`.
- **`SeoMetadata`** — per-page SEO records (extensible for static page metadata, used by `getSeoStats`).

Relationships: `Blog.targetWebsite` → `Website`. `Lead.website` → `Website`. `AnalyticsEvent.websiteSlug` → `Website.slug` (denormalized for performance).

---

## 7. Multi-Tenant Architecture

See [MULTI_TENANT_SYSTEM.md](./MULTI_TENANT_SYSTEM.md) for deep dive.

**Isolation primitives:**
- `targetWebsite` / `website` foreign keys at the model level for Blog + Lead
- `websiteSlug` string denormalized into `AnalyticsEvent` for fast aggregation
- Public APIs always require `slug` or `websiteId` in path/body — no implicit tenant context
- Admin APIs accept `?websiteSlug=` or `?targetWebsite=` filters; `'all'` means cross-tenant
- Frontend `setAnalyticsTenant(slug)` per layout — public sites set their own tenant once at module load + on mount, so all tracking calls scope automatically

**Adding a tenant:** create a `Website` row → assign branding → optionally seed an admin user with that website's scope → public site code reuses the existing pattern (slug-based fetches).

**Removing a tenant:** `DELETE /api/websites/:id` cascades blogs + leads + analytics events tied to that tenant. One-shot `POST /api/websites/_cleanup-demo` (superadmin) bulk-removes seeded demos.

---

## 8. Analytics System

See [ANALYTICS_SYSTEM.md](./ANALYTICS_SYSTEM.md) for the full pipeline.

**Ingestion (public):**
- `POST /api/analytics/track` — accepts JSON or sendBeacon Blob
- Bot UA filtered (does not record)
- 60 events/min/IP rate limit (skipped in dev)
- Excluded from global `/api/*` rate limiter to avoid lockout

**Source of truth:**
- `form_submit` events are emitted **server-side** in `leadController.submitLead()` immediately after `Lead.create()`. Client-side tracking removed for forms to guarantee Leads ↔ form_submit equality.
- `page_view`, `cta_click`, `blog_view` fired from frontend via `lib/analytics.js`. Uses `navigator.sendBeacon` with `keepalive fetch` fallback. Per-tab session id from `sessionStorage`. 1.5s dedupe key.

**Aggregation pipelines** (`src/services/analyticsService.js`):
- `getOverview({slug, range})` — totals + period-over-period real deltas (`pctChange()`)
- `getTimeseries({slug, range})` — `$dateTrunc`-bucketed `$facet` aggregation. UTC-aligned. Returns sessions + per-eventType counts per bucket.
- `getTopPages` / `getRecent` / `getBreakdown` (device + referrer host extraction)
- **`getFunnel`** — 3-stage session funnel (visitors → cta_click → form_submit)
- **`getTenantComparison`** — per-tenant sessions/views/CTAs/leads/conv-rate + period delta + top page
- **`getTopBlogs`** — `blog_view` events grouped by `meta.blogSlug`, hydrated with Blog metadata
- **`getContentPerformance`** — Blog corpus joined with `blog_view` aggregates; `isStale` flag >180d
- **`getRealtime`** — last N minutes of events + active session count (last 5 min)
- **`getLandingPages` / `getExitPages`** — first/last page_view per session
- **`getEngagement`** — burst-session model: splits sessionId timeline into bursts separated by 30-min inactivity gaps; returns avg duration, pages/burst, bounce % from real bursts
- Ranges: `day` → calendar today (midnight → now) with hourly buckets; `week`/`month` → rolling daily buckets; `year` → rolling monthly buckets

**Critical bug history (do not regress):**
1. `generateBuckets()` and `$dateTrunc` must both align to **UTC**. Local midnight (`setHours`) was the original cause of empty traffic graph despite events existing.
2. **Burst-session model** in `getEngagement`: sessionStorage IDs persist for tab lifetime including idle minutes. Without burst-splitting, single tab with intermittent activity reported avg session of 49+ minutes. Fix: split each sessionId timeline by 30-min inactivity gaps; treat each burst as a session.
3. **"Today" = calendar today, not rolling 24h.** `resolveRange('day')` uses server-local midnight. User expectation: yesterday's events do not appear under "Today".

---

## 9. SEO Engine

See [SEO_ENGINE.md](./SEO_ENGINE.md) for the full engine.

**Weighted category model (v3):**
| Category | Weight |
|---|---|
| Content Quality | 45% |
| Metadata Quality | 20% |
| Technical SEO | 15% |
| UX / Readability | 10% |
| Operational Freshness | 10% |

**Hard content caps** (applied after weighted score):
- <100 words → max 35
- 100–300 → max 55
- 300–700 → max 75
- 700+ → unrestricted; >1500 + structure → +3 bonus

**Confidence multipliers** — non-content categories dampened when content collapses (content score <30 → metadata×0.4, technical×0.4, ux×0.3, freshness×0.5).

**Interpretation bands:** Excellent (90+) · Strong (75-89) · Average (60-74) · Weak (40-59) · Critical (<40).

**Pure-function modules:**
- `client/src/lib/seoHealth.js` — engine: `auditBlog()`, `auditCorpus()`, `interpretation()`, `gradeLetter()`
- `client/src/lib/seoReadability.js` — Flesch Reading Ease, heading/image/link extractors, syllable counter, passive voice detector, transition word dictionary

**Page:** `client/src/pages/SeoEngine.jsx`. Sections: Overview (radial gauge + grade letter + interpretation pill + category breakdown bars + 8 telemetry tiles + insights panel + critical roster), Sitemap Operations, Metadata Coverage, SEO Health (filterable by severity + category), Content Intelligence (sortable per-blog category sub-scores), Robots & Indexing, Future GSC/Bing placeholders.

---

## 10. Blog System

**Admin CMS:**
- `BlogList.jsx` — paginated filterable list
- `BlogForm.jsx` — **Editor Cockpit** with 12-col layout: 8-col Quill rich-text editor (large title, status pill, excerpt zone, metadata card) + 4-col sticky right-side SEO Cockpit
- **Blog Editor Cockpit** (`client/src/components/blog-editor/`):
  - `LiveSeoEngine.js` — pure-function wrapper around `seoHealth.auditBlog()` + adds focus-keyword placement matrix, sub-score derivation, task-based checklist
  - `SeoAssistantPanel.jsx` — debounced 280ms cockpit composer, sticky sidebar
  - `SeoScoreRing.jsx` — animated radial score gauge with grade letter
  - `FocusKeywordCard.jsx` — keyword input + 8-slot placement matrix + density band (missing/sparse/optimal/high/stuffing)
  - `SeoChecklist.jsx` — task list with completed/pending grouping, gradient progress bar, motion.li layout-animated reorder on completion
  - `CockpitCards.jsx` — 7 cards: Content, Structure, Metadata, Readability, Links, Media, IssueFeed
- Autosave to localStorage every 700ms (key: `mavro_blog_draft_<id|new>`); draft restored on mount for new posts
- Autosave indicator: idle → dirty → saving → saved (Loader2 spin → CheckCircle2)
- Auto slug generation from title (mongoose hook)
- Status flow: draft → published → archived (or → scheduled with `scheduledAt`)
- Auto sitemap regeneration + Google/Bing indexing ping on publish (`indexingService` + `pingService`)

**Public blog rendering:**
- HRMS site reads from `/api/blogs/website/mavro-hrms`
- Tickets site reads from `/api/blogs/website/mavro-ticket-management`
- Per-tenant `seoSlugPrefix` (default `blog`) controls public URL pattern
- Blog detail emits BlogPosting JSON-LD via `useSEO` + `lib/{hrms,tickets}Seo.js`

---

## 11. Lead Engine

**Submission flow:**
1. Public site `ContactForm.jsx` → `getOrCreateSession()` adds analytics sessionId
2. `POST /api/leads/submit` body: `{ website (mongoId), name, email, phone?, company?, message?, sourcePage?, referrer?, sessionId?, formId? }`
3. Backend pipeline: rate-limit (10/15min/IP) → spam protection (6 layers in `src/middleware/spamProtection.js`) → validator → controller
4. `leadController.submitLead`:
   - Creates Lead
   - Emits `form_submit` AnalyticsEvent via `emitFormSubmitEvent()` (skipped if auto-spam)
   - Returns minimal `{ id, message }` payload
5. Admin sees lead in `/leads` + analytics dashboards reflect new form_submit + lead delta

**Admin actions on leads:** filter, search, status transitions, mark-spam, bulk delete (superadmin), CSV export.

---

## 12. Sitemap & Indexing

**Generation** (`src/services/sitemapService.js`):
- `generateSitemap(websiteId)` — per-tenant URL list (homepage + blog index + published blogs + SeoMetadata-sitemap pages)
- `generateSitemapBySlug(slug)` — slug variant
- `generateSitemapIndex(host)` — master listing all tenant sitemaps
- `generateRobotsTxt(slug)` — per-tenant robots.txt
- `getSitemapStats(websiteId)` — URL counts (blogUrls + staticUrls + total)

**Distribution:**
- Master: `GET /sitemap/index.xml`
- Per-tenant: `GET /sitemap/:slug.xml`
- Robots: `GET /robots/:slug.txt`

**Indexing pipeline:**
- On blog publish: `indexingService.submitBlogForIndexing(blogId)` calls Google IndexingAPI (planned) + tracks `indexingStatus`
- `pingService.pingAllEngines(sitemapUrl)` notifies Google + Bing on demand from SEO Engine UI

---

## 13. Authentication & RBAC

- JWT in `Authorization: Bearer <token>` header, 7-day expiry
- Token stored in `localStorage.mavro_token`, user object in `localStorage.mavro_user`
- `AuthContext` exposes `{ user, login, logout, loading }`
- `ProtectedRoute` wraps admin routes; redirects to `/login` on missing/expired token
- 401 interceptor in `client/src/api/axios.js` clears local state + redirects
- Roles: `superadmin` (cleanup, bulk delete), `admin`, `editor`, `seoManager` (granular middleware in `src/middleware/authorize.js`)

Public API client (`client/src/api/public.js`) is a separate axios instance with no auth interceptor — used by HRMS + Tickets sites.

---

## 14. Theme System

Single CSS-variable token system in `client/src/index.css`:
- `:root` = light pastel theme (premium cream/lavender atelier)
- `.dark` = Cyber Editorial graphite (preserved exactly from v1)
- Toggle: `ThemeContext` adds/removes `.dark` class on `<html>`
- No-flash: bootstrap script in `index.html` sets class before React mounts
- Light-mode utility repaint layer maps dark-only Tailwind classes (`text-white/*`, `bg-white/[0.0X]`, `border-white/*`) to semantic light tokens automatically
- Per-tenant accents: HRMS = violet, Tickets = cyan/teal/emerald

Full spec: [UI_VISION.md](./UI_VISION.md).

---

## 15. Implementation Decisions (Hall of Important)

These exist for **specific historical reasons** — do not revert without consulting context.

1. **Dev-mode rate limiter skip** (`src/app.js`): both `apiLimiter` and `authLimiter` `skip: () => !isProd`. Analytics traffic flooded the global bucket → blocked all `/api/*` calls → login failed. Production keeps full DOS protection.
2. **Analytics track excluded from global apiLimiter** in production too: dedicated 60/min limiter on `/api/analytics/track` route.
3. **`AnalyticsEvent.timestamp` uses TTL only, not duplicate index**: `index: true` + `schema.index({timestamp:1}, {expireAfterSeconds})` caused duplicate-index warning. Removed `index: true`.
4. **Lead controller emits form_submit server-side**: client-side `trackFormSubmit` removed. Guarantees `Lead.count == AnalyticsEvent.count(eventType:form_submit)`.
5. **Blog list excludes `content` field by default** (`select('-content -contentPlainText')`): heavy field stripped for list-view performance. SEO Engine opts in via `?includeContent=true` for word-count audits.
6. **SEO Engine word count limit = 100**: `blogQueryRules` validator caps `limit` at 100. Audit page fits comfortably for current scale.
7. **UTC alignment in timeseries**: `$dateTrunc` returns UTC midnight; `generateBuckets()` must align to UTC via `setUTCHours/setUTCMonth/Date.UTC()`. Local midnight via `setHours` caused empty chart bug.
8. **Vite proxy includes `/sitemap` and `/robots`**: sitemap admin stats endpoint at `/sitemap/stats/:id` (not under `/api`) needs proxy in dev.
9. **Content cap applied after weighted score**: prevents perfect metadata from rescuing 11-word posts (real-world Ahrefs/Semrush behavior).
10. **Tenant slug `mavro-ticket-management`** (not `mavro-tickets`): seeded from name "Mavro Ticket Management" via slugify.
11. **`TenantContext` is global** (`client/src/context/TenantContext.jsx`). Topbar `TenantSwitcher` writes; Dashboard reads + passes `websiteSlug` to analytics endpoints. Switcher renders **only on `/`** via `useLocation()` check — every other admin page has its own tenant selector or isn't tenant-scoped.
12. **`TenantContext` fetches websites only when `user` is set** (gated by `AuthContext`). Prevents 401-redirect loop on `/login`.
13. **Burst-session model** in `getEngagement`: split each sessionId timeline into bursts separated by ≥30 minutes inactivity. Each burst counts as one session for engagement metrics. SessionStorage-backed sessionIds persist across hours of idle tab — without burst-splitting, avg session duration ballooned to 49+ minutes for short visits.
14. **Calendar-today day range**: `resolveRange('day')` uses **server-local midnight** as window start (not now − 24h). User expectation: "Today" pill excludes yesterday's events. Week/month/year remain rolling.
15. **Blog Editor Cockpit uses canonical engine**: `LiveSeoEngine.js` wraps `seoHealth.auditBlog()` rather than forking. Editor scores + `/seo` page scores cannot diverge.
16. **Form `?includeContent=true` opt-in**: `getBlogs` strips `content` from list view by default for performance. SEO Engine + Analytics SEO Telemetry rollup must pass the flag explicitly.
17. **5-col editorial pipeline coexists with publish-state `status`**: `editorialStatus` (ideas/drafting/review/scheduled/published) drives the Kanban. `status` (draft/published/scheduled/archived) drives public visibility. The bridge in `updateWorkflowStatus` enforces consistency — moving away from `published` automatically unpublishes (status='draft'), moving to `scheduled` auto-sets a +24h default scheduledAt when missing. `archived` is hidden from the 5-col Kanban.
18. **Scheduled publish worker**: `src/services/scheduledPublishService.js` polls `Blog.find({status:'scheduled', scheduledAt:{$lte:now}})` every 60s and atomically flips them to published via `findOneAndUpdate` (race-safe). Started in `server.js`, stopped on SIGTERM/SIGINT. Single-instance assumption (no distributed lock yet — add `JobLock` collection if Mavro ever scales to multi-instance).
19. **Unified keyword matcher**: `client/src/lib/keywordMatch.js` is the single source of truth for "does this haystack contain this keyword?". `normalizeText`/`normalizeKeyword`/`countOccurrences`/`includesKeyword`/`computeDensity` are used by `analyzeFocusKeyword`, `analyzeKeywordIntel`, and the SEO engine. Handles NBSP, zero-width chars, smart quotes, em/en dashes, hyphens-as-spaces, word-boundary regex. **Density now consistent across Focus Keyword card, Keyword Intelligence card, and audit scoring** (was previously off by ~3pp due to different tokenizers).
20. **Sentence-derived anchor variants**: `generateAnchorVariants` in `client/src/lib/anchorIntel.js` extracts anchors from actual sentences in the draft (not n-gram noise). Each variant carries `context` (the full sentence it came from). `BlogForm.handleInsertLink` performs contextual replacement — wraps anchor inline inside an existing sentence when a regex match exists; falls back to appending a paragraph only when no in-context match found. Eliminates the "best ultimately outsourcing" junk-anchor problem.
21. **Content Decay engine** (`client/src/lib/contentDecay.js`): weighted score across 6 sub-signals (engagement 30%, freshness 25%, seoDrift 20%, linking 10%, metadata 10%, contentBody 5%). Returns state (fresh/stable/aging/declining/critical), reasons, recommendations with confidence/effort/impact. Decay score is HIGHER = MORE decay. Surfaces in `/seo` as `ContentDecayPanel` + `DecayQueueCard` + `DecayAlertsStrip`. Backed by `GET /api/analytics/blog-trends` for per-blog current-vs-previous window deltas.
22. **FAQ detection — explicit vs heuristic**: detector tags each question with `source` field. Heuristic matches (H2 headings ending in `?`, numbered paragraphs) only count when they appear AFTER an explicit "Frequently Asked Questions" section marker in document order. Explicit matches (Q. / Q: / bold-Q paragraphs from `Insert FAQ` button) always count. Final dedupe collapses on `canonicalQuestionKey` so "Q. Q. What?" + "What?" never produce duplicate entries. Requires ≥2 questions OR explicit section marker before FAQ panel renders (single curiosity headings no longer trigger phantom Q&A).
23. **DOCX import** (`POST /api/blogs/import-docx`): mammoth + custom styleMap (Title/H1/H2/H3/Quote). Post-processed by `src/utils/headingInference.js` which promotes paragraphs that are all-bold short titles into `<h2>`/`<h3>` heuristically. Returns `{html, detectedTitle, wordCount, readingTime, structure:{h1,h2,h3,lists,promoted}}`. Limits: 10MB upload, multer memoryStorage. NO AI rewriting — formatting intelligence only.
24. **RichTextEditor (Quill 2) image pipeline**: custom `ResizableImage` blot whitelists `alt`/`width`/`style`/`class` attributes so they survive Quill's HTML round-trip. Hover toolbar offers size presets (S/M/L/Full = 25/50/75/100% width), alignment (Left/Center/Right via float + display+margin), Alt-text editor, Delete. Native HTML5 drag-drop reposition preserves alt + width across the move. MutationObserver flags every `<img>` with `draggable="true"` (Quill's contenteditable=false wrappers otherwise suppress dragstart). Listener attach uses `requestAnimationFrame` poll loop so init survives Quill's async DOM setup. Image data currently stored as data URLs; migrate to uploaded URLs when image-upload service lands.
25. **InternalLinkEngine v2 + LinkGraph**: `client/src/lib/anchorIntel.js` + `client/src/lib/linkGraphIntel.js` power the editor's Internal Linking Assistant + `/seo`'s Content Relationship Graph. Tenant-scoped (`useTenantBlogCorpus` hook fetches with `targetWebsite=<id>` + `includeContent=true`). Orphan detection, cluster detection (single-link Jaccard), linking-quality score (5 signals). Suggestions never cross tenant boundary.
26. **Multi-model AI orchestration (Phase 4.0)**: `src/services/ai/` is the single backend interface for all AI calls. Architecture:
    - `BaseProvider` abstract → `GeminiProvider` (Google) + `OpenRouterProvider` (OpenAI-API-compatible gateway to DeepSeek / Nemotron / Qwen3-Next / Qwen3-Coder / GPT-OSS / GLM 4.5 Air)
    - `config/modelRegistry.js` — 8 registered models with provider, modelId, strengths, useCases, rateTier, active flag. Single source of truth.
    - `config/routingStrategy.js` — feature key → ordered model chain (e.g. `titles` → gpt-oss-120b-free → gemini-flash-lite → qwen3-next → glm). 9 features mapped.
    - `AIProviderService` — resolves chain, applies retries (exponential backoff), cross-provider fallover, prompt sanitization (24k char cap), structured logging (ring buffer 200 entries).
    - Fallover rules: quota / 429 → skip retry, jump model. Timeout → skip retry, jump model (excluded from retry list deliberately — chain fallover is better than 3× 30s waits). 5xx / network → retry then jump. Empty completion (Gemini 2.5 thinking-budget exhaust, GLM reasoning timeout) → treat as failure, fall over.
    - All endpoints behind `/api/ai` rate limiter (20/min/IP, prod-only). Keys backend-only.
    - **Consumers never import providers directly.** They call `aiProviderService.generateText({ prompt, options: { feature: '<key>' }, op })` and the orchestrator picks the model. Adding a provider or model = registry edit, zero consumer changes.
27. **AI Title Suggestions V1 (Phase 4.0)**: `src/services/ai/promptBuilders/titlePrompt.js` + `src/services/ai/titleService.js` + `client/src/components/blog-editor/AiTitleSuggester.jsx`. Lives next to title input in `/blogs/new` and `/blogs/:id/edit`. Generates 7 categories × 2 (SEO Optimized / High CTR / Authority / Listicle / Educational / Problem-Solution / Beginner-Friendly). Per-suggestion **deterministic** quality scoring via `client/src/lib/titleQuality.js` (length, keyword position via `keywordMatch.js`, CTR heuristics, readability) — AI never scores its own output, and the live `LiveSeoEngine` recalculates the real SEO score post-Apply. 5-min in-memory cache by context signature in `useAiTitles` hook so reopening the panel costs zero quota. Tenant-aware (HRMS vocab vs Tickets vocab in prompt). Banned phrase list filtered server-side. Hard rules: 50-65 char ideal, 70 ceiling, focus keyword required, current-title not echoed.
28. **AI Meta Description Suggestions V1 (Phase 4.0)**: `src/services/ai/promptBuilders/metaPrompt.js` + `src/services/ai/metaService.js` + `client/src/components/blog-editor/AiMetaSuggester.jsx`. Renders next to Meta Description label inside the editor metadata grid. 7 categories × 2 (SEO Optimized / High CTR / Professional / Educational / Commercial Intent / Authority / Beginner-Friendly). Deterministic quality scoring via `client/src/lib/metaQuality.js` (length 140-160 ideal / 110-170 hard floor-ceiling, keyword placement + stuffing detection, action-verb CTR, readability). Same cache pattern via `useAiMeta`. After Apply, the existing metadata category score in `seoHealth.auditBlog` recalculates against the new value.
29. **OpenRouter free-tier quirks**:
    - `qwen/qwen3-coder:free` (registry id `qwen3-coder-480b-free`) is frequently saturated → request timeouts. Configured as primary for `long_form` but `nemotron-3-super` is the proven fallback.
    - `z-ai/glm-4.5-air:free` is a reasoning model. With short prompts it often consumes its output budget on internal "thinking" and returns empty completion. Orchestrator treats empty completion as failure → falls over to next chain entry (verified with `outline` + `planning` features).
    - `gemini-2.5-flash` free tier = **20 requests/day per project per model**. `gemini-2.5-flash-lite` = 200/day. Default editor flow uses `gemini-2.5-flash-lite` for meta descriptions; flash is only kept as a higher-quality fallback. Hitting either daily cap surfaces as `429 / quota exhausted` which the orchestrator's `isQuotaError` path catches and routes around without retrying the same model.
    - OpenRouter API key + Gemini API key both backend-only (`.env`), never logged, never sent to the client. Both keys pasted in chat history during initial setup must be rotated before production.
30. **Blog list filter parity with editorial pipeline**: `GET /api/blogs` now accepts both `?status=` (publish state — draft/published/scheduled/archived) AND `?editorialStatus=` (5-col kanban — ideas/drafting/review/scheduled/published). Filter dropdown on `/blogs` is grouped (Pipeline / Publish State) and routes the chosen value to the correct query param via the `PIPELINE_VALUES` set in `BlogList.jsx`. Status cell renders the canonical Badge plus the editorial state below it when the two diverge.
31. **Dashboard scrollable activity surfaces**: Top Pages (Traffic Sources) + Publishing Feed (Activity) cards on `/` cap inner content at `max-h-[300px]` with a thin scrollbar so growth in either list does not push the third-row System Status / Recent Publications cards down the viewport.
33. **Spanbix tenant (Phase 5.0)** — `spanbix` slug added as the third active tenant. Public ecosystem lives under `/spanbix/*` mirroring the HRMS + Tickets pattern (no special-cased root routes). Brand isolation enforced at the component layer: navy `#102c56` + accent `#2764e4` + DM Serif Display + Sora + JetBrains Mono — registered in `tailwind.config.js → fontFamily` (`serif`, `sora`, `mono`) and Google Fonts loaded in `client/index.html`. Tenant row seeded by idempotent `node src/utils/seedSpanbix.js` (also `npm run seed:spanbix`) which populates `aiContext` (SAP-aware audience / industry / vocabulary / tone / avoid) so AI prompt builders produce SAP-correct copy without code change. Analytics tenant set via `setAnalyticsTenant('spanbix')` at the layout module + on mount. **11 public routes** registered in `App.jsx` including dynamic detail route. Sub-pages reuse the marketing sections + `PageHero` + `Section` primitives — no engine forks, no Mavro Console route changes.
34. **Spanbix `.spanbix-scope` CSS opt-out** — Mavro's light-mode utility repaint (`index.css` `:where(html:not(.dark)) [class*="text-white"]` etc.) auto-remaps any `text-white*` / `bg-white/[X.X]` / `border-white/*` class to dark semantic tokens so cyber components stay legible in light mode. Spanbix renders genuinely-white text/surfaces inside its navy zones (Hero, IndustryExperts, CampusPrograms, FinalCta, navy step cards in PlacementSupport, navy preview headers in track cards). To bypass the global repaint without touching every component, `SpanbixLayout` root carries class `spanbix-scope`, and `client/src/index.css` contains a matching `.spanbix-scope [class*="..."]` override block placed AFTER the repaint inside the same `:where(html:not(.dark))` selector — higher specificity (`.spanbix-scope` adds 0,1,0) wins. Adding new Spanbix navy-tone components must use the same Tailwind white classes; no further CSS work required.
35. **Spanbix Section tone system + alternation** — `client/src/components/spanbix/Section.jsx` exposes three tones via a `TONE_STYLES` map: `white` (#ffffff), `cream` (#f5f8ff with radial gradient bg pattern), `navy` (#102c56 with grid texture). Each tone resolves its own caption / title / subtitle / rule / divider colors automatically. Homepage rhythm is hand-tuned to alternate: Hero(navy) → MarketValidation(white) → WhySap(cream) → CareerPaths(white) → IndustryExperts(navy) → LearningExperience(cream) → PlacementSupport(white) → CampusPrograms(navy) → SuccessStories(cream) → Certifications(white) → DemoClasses(cream) → FinalCta(navy) → ContactForm(cream). No two same-tone sections sit adjacent. New Spanbix sections must call `<Section tone="...">` explicitly and slot into the rhythm.
36. **Spanbix SAP catalog (Phase 5.1)** — `SPANBIX_CAREER_PATHS` in `lib/spanbixSeo.js` is trimmed from 8 candidate tracks to **4 active tracks**: FICO, MM, SD (functional, beginner-friendly) + ABAP (technical). HCM, SuccessFactors, BASIS, Analytics are deferred to a later expansion phase. Each track now carries rich detail driving the homepage card view, the listing page (`/spanbix/career-paths`), and the dynamic detail page (`/spanbix/career-paths/:code`): `priceIndividual` + `priceMrp`, `studentsEnrolled`, `rating`, `ratingsCount`, `lastUpdated`, `language`, `instructor { name, title, bio }`, `whatYoullLearn[]`, `includes[]`, `requirements[]`, `individualTimeline[]` (4–8 modules, week-bucketed, 14–20 weeks), `campusTimeline[]` (6–7 month semester-aligned cohort plan). Helper `getCareerPath(code)` resolves a track by slug. `SPANBIX_CAMPUS_PROGRAM` constant added for the campus pseudo-program surfaced in the homepage Career Paths pill switcher.
37. **Spanbix Course Detail page + Individual/Campus pill toggle (Phase 5.1)** — `pages/spanbix/SpanbixCourseDetail.jsx` at `/spanbix/career-paths/:code`. Navy hero with breadcrumb, gradient title, rating, learners, instructor credit, and a right-side floating enrolment panel. Pill toggle ("Individual Program / Campus Program") drives the entire surface: Individual mode shows `priceIndividual` + `priceMrp` + "Enrol Now" CTA + `individualTimeline`; Campus mode hides pricing entirely + shows "Talk to Campus Team" CTA + `campusTimeline`. Deep-link via `?mode=campus` query param (consumed by `useSearchParams` in the detail page) lets Campus Programs catalog cards land directly on the campus view — no extra click. Hooks-order safe: `useSEO` is called unconditionally above the `<Navigate>` guard for invalid slugs.
38. **Spanbix homepage section inventory (Phase 5.0+5.1)** — 13 sections on the landing page in this order: Hero, MarketValidation, WhySap, CareerPaths (4-track pill switcher routing to detail pages), IndustryExperts (faculty + mentor rail with 6 cards, scroll-snap on navy), LearningExperience, PlacementSupport (3-step navy cards on white with hiring-category chip strip — no fake logos), CampusPrograms, SuccessStories, Certifications, DemoClasses, FinalCta, ContactForm. Each Spanbix component file in `client/src/components/spanbix/` is self-contained and reusable across subpages. Phase 5.0 marketing copy underwent a full rewrite in Phase 5.1 — moved from PDF-summary voice to opinionated, market-aware, audience-specific language.
39. **Spanbix auto-bootstrap on backend boot (Phase 5.2)** — `src/utils/seedSpanbix.js` exports `upsertSpanbixTenant({ silent })` (CLI runner gated by `require.main === module`). `src/server.js` calls `upsertSpanbixTenant({ silent: true })` after `connectDB()` so the Spanbix Website row materializes (and refreshes `description` / `aiContext` / `seoDefaults`) on every backend boot. Branding stays only-if-empty so admin tweaks in `/websites` survive reboots. **Logging contract:** `silent` ONLY suppresses the verbose per-field CLI snapshot — it never suppresses status. Every boot emits exactly one `✅ [bootstrap] Spanbix tenant refreshed/created — slug: ..., id: ...` line on success, or a loud `❌ [bootstrap] Spanbix tenant upsert failed — ...` with Mongoose per-field error trace on failure. Silent-but-failing bootstraps are exactly how a missing tenant goes unnoticed in production — never reintroduce that anti-pattern. The bootstrap also returns `null` on silent failure so server startup continues regardless. This pattern is the canonical way to bootstrap a new tenant going forward: extract config → export `upsert<Name>Tenant({ silent })` → call from `server.js`. Avoids the "fresh-install-only" trap of `seedWebsites()` skipping when any websites already exist. The Spanbix `aiContext` baked into the seed is intentionally compact (single-line audience/industry/tone, 6-term vocabulary, 3-item avoid list) so the AI prompt-brief stays under the prompt-builder budget; the full long-form aiContext that existed before Phase 5.2 has been retired in favour of this lean version.
40. **Spanbix has FULL Mavro admin parity (Phase 5.2)** — every admin surface uses `getWebsites()` which returns all active `Website` rows, so Spanbix appears automatically in: Dashboard TenantSwitcher (`/`), Blog CMS list + form (`/blogs`, `/blogs/new`), Lead inbox (`/leads`), SEO Engine tenant dropdown (`/seo`), Calendar tenant dropdown (`/calendar`), Analytics Intelligence filter (`/analytics`), Properties page (`/websites`). Public infrastructure auto-serves Spanbix too: `/sitemap/spanbix.xml`, `/robots/spanbix.txt`, `/api/blogs/website/spanbix`, `/api/blogs/website/spanbix/:slug`, `/api/websites/public/spanbix`. ContactForm submits with `formId: 'spanbix-contact'`; backend emits the canonical `form_submit` AnalyticsEvent server-side keyed to `websiteSlug: 'spanbix'`. `setAnalyticsTenant('spanbix')` in `SpanbixLayout` scopes all `trackPageView` / `trackBlogView` / `trackCtaClick` calls. No tenant-specific backend code exists — every endpoint resolves Spanbix dynamically via slug or ObjectId.
41. **AI blog generation for Spanbix is intentionally NOT enabled yet (Phase 5.2 decision)** — though the AI infrastructure (titleService / metaService / faqService) supports any tenant via dynamic `aiContext`, Spanbix-targeted blogs are written manually by admins for the current launch phase. Do NOT auto-generate AI blog content targeting `targetWebsite === <spanbix _id>` without the user's explicit go-ahead. The AI suggester UI in `BlogForm.jsx` is not blocked at the code level (we don't reintroduce hardcoded tenant maps), but the operational decision stands: Spanbix blog content stays human-written for now. Re-evaluate once a placement-data corpus is large enough to ground SAP-specific AI prompts honestly.
42. **Spanbix Vercel deployment + API URL abstraction (Phase 5.3)** — `client/src/lib/apiBase.js` is single source of truth for API origin. `apiPath('/api/x')` returns relative `/api/x` in dev / co-hosted prod, or absolute `<VITE_API_BASE_URL>/api/x` for independent deploys (e.g. Spanbix on Vercel pointing at Render backend). All 4 channels wired through it: `api/axios.js`, `api/public.js`, `api/seo.js` rootApi, `lib/analytics.js` raw `sendBeacon`. Admin routes (Login, DashboardLayout, ProtectedRoute, BlogList, BlogForm, LeadList, WebsiteList, SeoEngine, Analytics, Calendar, PremiumTestDashboard) are `React.lazy` + `Suspense` so public-only Vercel builds never ship admin chunks. `AuthProvider` no-ops without a token; `TenantProvider` gates `/api/websites` fetch on `user` — public visitors trigger zero auth/tenant requests. `client/vercel.json` written with SPA rewrite + security headers + cache policy. Backend `src/app.js` static-serve block now gated on filesystem check (`fs.existsSync(client/dist/index.html)`) AND `SERVE_CLIENT !== 'false'` so backend-only Render deploys don't ENOENT-crash on root requests.
43. **Spanbix Option B2 architecture — independent per-tenant build targets (Phase 5.4)** — `VITE_BUILD_TARGET` env var drives entry selection at build time. Supported values: `full` (default — single bundle with Mavro Console + every public site, Spanbix at `/spanbix/*`), `spanbix` (standalone Spanbix bundle, routes at root), reserved `hrms` + `tickets`. Adding a new target = new entry HTML + new `src/entries/<name>.jsx` + new `<Name>App.jsx` + new build script. `client/src/lib/routeBase.js → withSpanbixBase()` resolves to `''` for standalone or `/spanbix` for full at build time (baked via Vite `define`). Same Spanbix component code works under both targets via the helper — 11 components + 4 page files use `withSpanbixBase()` for every `<Link to>`. `SpanbixApp.jsx` includes legacy `/spanbix/*` Navigate redirect so inbound links from the Mavro Console era still resolve at the standalone Spanbix domain. `entries/spanbix.jsx` deliberately omits `AuthProvider` + `TenantProvider` — public-only entry pulls in zero admin chunks. **`devTargetHtmlPlugin`** in `vite.config.js` is critical: Vite's dev server reads `<root>/index.html` for every HTML request, ignoring `rollupOptions.input` (build-time only). The plugin installs middleware that intercepts HTML requests and substitutes `index.<target>.html` content (piped through `transformIndexHtml` so HMR works). Without it, `npm run dev:spanbix` would still serve the full Mavro Console at `/`. Build-time, `closeBundle` plugin promotes `dist/index.<target>.html` → `dist/index.html` so Vercel serves it as default. Admin lazy-load splits from Phase 5.3 still in place for the `full` target.
44. **Spanbix logo system (Phase 5.4)** — two PNG variants live in `client/public/spanbix/`: `spanbix-white.png` (used on navy surfaces — Navbar, Footer) and `spanbix-blue.png` (used on light surfaces — favicon, OG / Twitter share image, Schema.org JSON-LD logo). Variant choice is by background, not by build target. Logo height is responsive: Navbar `h-12 sm:h-16 md:h-20 lg:h-28`; Footer `h-20 sm:h-28 md:h-32 lg:h-40`. Tenant-namespaced subfolder (`public/spanbix/`) keeps logo files isolated so future HRMS / Tickets tenants can drop into `public/hrms/` and `public/tickets/` without collisions. `SPANBIX_SITE.logo` in `lib/spanbixSeo.js` points at `https://spanbix.com/spanbix/spanbix-blue.png`.
45. **Spanbix responsive contract (Phase 5.5)** — every Spanbix surface tested at 320 / 375 / 414 / 768 / 1024 / 1280 / 1920px. `Section` primitive drives section padding (`py-14 sm:py-20 md:py-28`), heading sizes, subtitle sizes, container padding (`px-5 sm:px-6 md:px-8`) — every section inherits automatically. Navbar height + logo height + `SpanbixLayout` main `pt-*` move in lockstep across breakpoints: `h-16 sm:h-20 md:h-24 lg:h-[116px]` ↔ logo `h-12 sm:h-16 md:h-20 lg:h-28` ↔ layout offset `pt-16 sm:pt-20 md:pt-24 lg:pt-[116px]`. Footer flips 2-up on mobile (`grid-cols-2 lg:grid-cols-12`, brand block `col-span-2 lg:col-span-4`, link cols `col-span-1 lg:col-span-2`). Hero eyebrow pill wraps inside `max-w-full` with `whitespace-normal break-words leading-tight` inner span (was clipping on `<375px` due to no-wrap + heavy `tracking-[0.24em]`). H1 ramps `text-[1.65rem] sm:text-[2.5rem] md:text-[3.2rem] lg:text-[4.1rem]` with `break-words` safety. CourseDetail + CareerPaths pill switchers shrink padding + text on mobile so the navy capsule never overflows.
46. **Spanbix production-stability fixes (Phase 5.3.1)** — three production crashes resolved: (a) **React `createContext` undefined** crash on Vercel deploy was caused by aggressive `manualChunks` in `vite.config.js` putting React in `vendor-react` while libraries like `framer-motion` that call `React.createContext(...)` at module-init time were forced into `vendor-motion`; chunk execution order across non-direct deps isn't guaranteed, so React could be undefined when motion's top-level code ran. Fix: removed manual chunking entirely; Rollup auto-co-locates React with every React-peer in the same chunk. (b) **404 on every deep-link refresh** on Vercel was caused by `cleanUrls: true` in `vercel.json` — Vercel was trying `/career-paths.html` before the SPA catch-all rewrite fired. Fix: dropped `cleanUrls` and `trailingSlash`; SPA fallback uses negative-lookahead regex `/((?!assets/|favicon\.ico|sitemap\.xml|robots\.txt).*)` → `/index.html` so assets and SEO files keep their real responses. Added root-level `/sitemap.xml` + `/robots.txt` proxy rewrites pointing at `mavro-dashboard.onrender.com/sitemap/spanbix.xml` + `/robots/spanbix.txt`. (c) **White-gap navbar flash on every refresh** was caused by `motion.header` with `initial={{ y: -16, opacity: 0 }}` sliding the navbar down over 500ms; during that animation the body's white bg showed through the 16px sliver at top. Fix: replaced with plain `<header>`; mobile-menu + scroll-shadow transitions still animate.

32. **Dynamic per-tenant AI brief (Phase 4.0.1)**: ALL AI prompt builders pull their tenant brief from `src/services/ai/promptBuilders/tenantContext.js → renderTenantBrief(websiteDoc)`. **Zero hardcoded tenant maps** — the earlier `TENANT_BRIEFS` constants were stripped from `titlePrompt.js`, `metaPrompt.js`, `faqPrompt.js`, `siteIntelligencePrompt.js`. Source priority: explicit `Website.aiContext` fields → derived from `description` + `seoDefaults.keywords` + `name` → generic B2B fallback. Adding a 3rd, 10th, or 50th tenant requires only a new `Website` row — no code change, no redeploy. `src/services/ai/tenantResolver.js` is the single shared lookup used by every AI controller, fetching `slug name description aiContext seoDefaults` and passing the full doc to the service layer as `tenant`. Site-intelligence service uses the same dynamic source. The brief includes a "Stay inside the <name> product domain" guard to prevent cross-tenant pivots when vocabulary is sparse.

---

## 16. Current Production Priorities (Phase 1)

✅ Operational SEO intelligence (weighted v3 scoring + readability + structure + semantic analysis)
✅ Real analytics (no placeholder data, server-authoritative form_submit, UTC-aligned buckets)
✅ Multi-tenant cleanup (demo tenants removed, localhost dev domains)
✅ Premium light + dark themes
✅ Public site polish (HRMS + Tickets)
✅ Lead engine consistency (server-side form_submit emission)
✅ Blog Editor Cockpit (real-time SEO writing, focus keyword analysis, task-based checklist, 7 cockpit cards)
✅ Analytics Intelligence page (8 backend endpoints, 11 frontend modules, funnel, tenant comparison, realtime feed, operational insights)
✅ Dashboard tenant scoping (`TenantContext` + dashboard-only switcher)
✅ Burst-session engagement model (industry-standard 30-min inactivity gap)
✅ Calendar-today range semantics
✅ **Phase 2.0 Behavior Intelligence + Anomaly Detection** — 4 new endpoints (`returning`, `page-conversion`, `page-bounce`, `anomalies`); `anomalyService.js` with 7 pure-function detectors (traffic spike/drop, conversion drop, bounce spike, inactive tenant, stale tenant, declining blog); `AnomalyAlerts.jsx` + `BehaviorIntelligence.jsx` UI; Returning % tile on overview row
✅ **Contextual Help Popover system** — `InfoPopover.jsx` reusable portaled primitive + `analyticsCopy.js` + `seoCopy.js` central registries; wired into every analytics card label + SEO Engine section headers/tiles/categories/issues/orphans/clusters; glassmorphism, hover/tap/keyboard, auto-flipping, escape/outside-click/scroll close
✅ **Phase 3.0 Editorial Operations** — `/calendar` route (Month/Agenda/Kanban views), 5-col editorial pipeline (Ideas/Drafting/Review/Scheduled/Published), Campaign model + CRUD + velocity rollups, scheduled-publish worker, approval workflow (approve/request-revision/reject), activity log + cross-corpus feed endpoint, DOCX import via mammoth + heading inference, FAQ block insert + multi-pattern detector + FAQPage JSON-LD generator, RichTextEditor image pipeline (drag-drop insert + hover toolbar with size/alignment/alt/delete + drag-to-reposition), roles extended (writer + reviewer) + permissions scaffold.
✅ **Phase 3.1 Content Decay Detection** — `contentDecay.js` weighted decay engine (6 sub-signals), `ContentDecayPanel` + `DecayQueueCard` + `DecayAlertsStrip` on `/seo`, `GET /api/analytics/blog-trends` backend endpoint for per-blog trend deltas. Refresh queue prioritized by decay × traffic potential.
✅ **Phase 3.2 Internal Linking Engine v2** — `anchorIntel.js` sentence-derived anchor variants with context preview, `linkGraphIntel.js` graph + cluster + linking-quality scoring, `LinkGraph.jsx` + `OrphanPanel.jsx` + `LinkingQualityCard.jsx` + `TopicalClusterPanel.jsx` surfaces on `/seo`, contextual anchor insertion in `BlogForm.handleInsertLink` (wraps inline match when available, falls back to append), tenant-scoped via `useTenantBlogCorpus` hook.
✅ **Phase 3.3 Keyword Intelligence unification** — `keywordMatch.js` single matcher (NBSP/smart-quotes/hyphen-as-space tolerant), `keywordIntel.js` semantic engine (primary detection, distribution, density bands adaptive to article length, health states). Density consistent across Focus Keyword card + Keyword Intelligence card + audit scoring. Semantic variations / supporting terms / coverage UI panels currently HIDDEN pending LLM-backed semantic engine (engine still computes them; re-wire is UI-only when AI layer lands).
✅ **Phase 4.0 AI Editorial Assistance (multi-model orchestration)** —
  - **AI infrastructure**: `BaseProvider` abstract + `GeminiProvider` + `OpenRouterProvider`; centralized `AIProviderService` with feature-based routing, cross-provider fallover, retries, prompt sanitization, structured logging
  - **Model registry**: 8 models registered — DeepSeek V4 Flash, Nemotron 3 Super (120B), Qwen3 Next 80B Instruct, GPT-OSS 120B (free), GLM 4.5 Air (free), Qwen3 Coder (free), Gemini 2.5 Flash Lite, Gemini 2.5 Flash
  - **Routing strategy**: 9 feature plans (titles / meta_descriptions / faqs / outline / seo_audit / semantic_suggestions / long_form / planning / default), each with cross-provider fallback chains
  - **AI Title Suggestions V1**: editor cockpit AI Suggest button next to title field → 7 categories × 2 variants → deterministic per-title quality bundle → one-click Apply → live SEO recalc
  - **AI Meta Description Suggestions V1**: editor cockpit AI Suggest next to Meta Description label → 7 categories × 2 variants → deterministic quality bundle → live metadata score recalc
  - **Diagnostics endpoints**: `/api/ai/health`, `/api/ai/recent`, `/api/ai/test`, `/api/ai/model-test`, `/api/ai/route-test`
  - **Security**: all keys backend-only, dedicated `/api/ai` rate limiter (20/min/IP, prod-only), 24k char prompt cap, JWT-protected routes
✅ **Phase 4.0.1 Multi-tenant AI scaling** — dropped hardcoded `TENANT_BRIEFS` maps. Added `Website.aiContext` field + `tenantContext.renderTenantBrief()` dynamic builder + `tenantResolver.resolveTenantContext()` shared lookup. New tenants get a usable AI brief automatically, no code change required.
✅ **Phase 5.0 Spanbix tenant launch** — Spanbix (Career Transformation Infrastructure for Enterprise Technologies) onboarded as the third active Mavro tenant, validating the multi-tenant scaling claim with a brand-new vertical (SAP / ERP / enterprise education). Delivered: idempotent backend seeder (`node src/utils/seedSpanbix.js` populates Website + `aiContext` with SAP vocab + audience), brand foundation (`lib/spanbixSeo.js` constants + tokens + Course/EducationalOrganization JSON-LD), typography stack (DM Serif Display + Sora + JetBrains Mono loaded in `index.html`, registered in `tailwind.config.js`), 10 public routes under `/spanbix/*` (Landing / Courses / Career Paths / Campus Programs / Placements / Demo Classes / About / Contact / Blog / Blog Detail), 16 marketing components (`SpanbixLayout` / `Navbar` / `Footer` / `Section` / `PageHero` / `Hero` / `MarketValidation` / `WhySap` / `CareerPaths` / `LearningExperience` / `DemoClasses` / `CampusPrograms` / `SuccessStories` / `Certifications` / `FinalCta` / `ContactForm`), tenant analytics (`setAnalyticsTenant('spanbix')`), and lead capture wired to `submitPublicLead` with `formId: 'spanbix-contact'`. No backend route changes — confirms the "new tenant = `Website` row + frontend components" architecture promise.
✅ **Phase 5.1 Spanbix catalog refinement + detail pages + faculty + placement support** — second-pass on the Spanbix surface, post-launch. Delivered:
  - **SAP catalog trimmed to 4 active tracks** (FICO / MM / SD / ABAP) — HCM / SuccessFactors / BASIS / Analytics deferred. Each track extended with `priceIndividual`, `priceMrp`, `studentsEnrolled`, `rating`, `ratingsCount`, `lastUpdated`, `language`, `instructor { name, title, bio }`, `whatYoullLearn[]`, `includes[]`, `requirements[]`, `individualTimeline[]` (14–20 weeks), `campusTimeline[]` (6–7 months). Helper `getCareerPath(code)` added. `SPANBIX_CAMPUS_PROGRAM` constant for the campus pseudo-program.
  - **Listing page** (`/spanbix/career-paths`) rewritten as Udemy-style horizontal grid — navy preview header per card with gradient track code, category pill, bestseller chip, rating + stars, mini-pills (duration · learners · demand), price + slashed MRP, View course CTA.
  - **Detail page** (`/spanbix/career-paths/:code` → `SpanbixCourseDetail.jsx`) — navy hero with breadcrumb, gradient title, rating, learners, language, instructor credit. Right-side floating enrolment panel. Pill toggle "Individual Program / Campus Program" drives the entire surface: Individual = price + Enrol CTA + `individualTimeline`; Campus = no price + "Talk to Campus" CTA + `campusTimeline`. Deep-link via `?mode=campus` via `useSearchParams`. Hooks-order safe (`useSEO` above Navigate guard).
  - **CampusCoursesCatalog** — campus-context course catalog inside `/spanbix/campus-programs` linking each track to `/spanbix/career-paths/:code?mode=campus`.
  - **IndustryExperts** — homepage faculty + mentor section on navy. 6 cards in horizontal scroll-snap rail with prev/next arrows + faculty data sourced from track instructors + 2 cross-track mentors. Initials-gradient avatars (no fake portraits).
  - **PlacementSupport** — homepage 3-step placement-support section. Navy step cards on a white bg with custom CSS/SVG bottom-panel illustrations (resume + referral network + tie-up chip-bar). Honest hiring-category chip strip (8 categories) — no fake brand logos until MoUs sign.
  - **Section tone system** — `Section.jsx` extended with `white`/`cream`/`navy` tones via `TONE_STYLES` map. Each tone resolves its own foreground colors. Homepage rhythm hand-tuned to alternate cleanly.
  - **`.spanbix-scope` CSS opt-out** — added to `index.css` to bypass the light-mode utility repaint so Spanbix navy zones render literal white text/surfaces. `SpanbixLayout` root carries the class.
  - **Marketing copy rewrite** — every homepage section + subpage PageHero rewritten from PDF-summary voice to opinionated, market-aware, audience-specific language. Hero headline "There are 40,000 SAP jobs waiting. Almost nobody told graduates about them." 6 new FAQs framed around real learner + placement-head questions.
  - **Cleanup** — ContactForm interest pills trimmed to active 4 tracks. WhySap + Landing FAQ copy + `SPANBIX_SITE.keywords` purged of removed module names.
  - **11 public routes** total under `/spanbix/*` (the original 10 + `/spanbix/career-paths/:code` dynamic detail route).
✅ **Phase 5.6 Spanbix editorial redesign (magazine v2)** — full visual overhaul of the Spanbix surface. The original premium SaaS layer was rebuilt as a magazine-editorial design system, scoped strictly to `.spanbix-scope` so zero Mavro admin / HRMS / Tickets style leaks. Delivered:
  - **Design system** at `client/src/styles/spanbix-redesign.css` — new tokens (`--sx-navy`, `--sx-cream`, `--sx-citron`, `--sx-coral`, `--sx-signal`, ink scale, hairlines), Instrument Serif headlines + Geist UI + JetBrains Mono data fonts (loaded via both `index.html` shells alongside the original DM Serif + Sora). Photo-placeholder system: 5 tonal stand-ins (`sx-photo-slate|cream|rose|olive` + base) with striped editorial backgrounds + monospace `IMAGE_FILENAME.JPG` labels — drop-in slots for real photography later. Reveal-on-scroll via `.sx-reveal` + `useScrollReveal()` hook with safety fallback. Marquee + grid-bg + chip + pill-badge utilities.
  - **Background video hero** — `Hero.jsx` now plays `/spanbix/herosection-video.mp4` autoplay/muted/loop/playsInline, behind a two-axis gradient stack (horizontal navy darkness for headline legibility + vertical fade-to-deep-navy for section handoff). Cohort card backdrop bumped to `rgba(10,20,40,0.55)` + 22px blur so it reads on bright video frames. Citron CTA carries a warm glow shadow; ghost CTA uses 8% white + blur for a glass effect.
  - **13 redesign sections** at `client/src/components/spanbix/redesign/sections/*` — `HiringPartners` (logo marquee using local PNGs from `client/public/spanbix/partners/*.png`, cream-50 section bg), `MarketValidation` (4-stat grid + photo), `WhySap` (locked 3×2 card grid, never auto-fits to 4), `Tracks` (matches `/courses` layout — Functional 3-col / Technical single centered / Campus full-width 2-col with right navy stat panel; framer-motion sliding pill + AnimatePresence content swap; data from `SPANBIX_CAREER_PATHS` + `SPANBIX_CAMPUS_PROGRAM`), `Mentors` (horizontal carousel + hover overlay revealing "CURRENTLY SHIPPING" delivery context per faculty member), `LearningExperience` (sticky dashboard mockup), `Placement` (3-step deep-navy), `Outcomes` (before/after CTC cards), `Campus`, `Certification` (full credential mockup), `DemoVideos`, `FAQ`, `FinalCta` (form wired to `submitPublicLead` with `formId: 'spanbix-final-cta'`).
  - **`Tracks` tab-switch bug** — original implementation put `sx-reveal` on the per-card wrapper. `useScrollReveal` runs an IntersectionObserver once on mount + disconnects; switching tabs unmounted revealed cards + mounted fresh ones that never received `.in` → cards stuck at `opacity:0`. Fixed by dropping `sx-reveal` from track cards. Parent `motion.div` already animates entry. Same risk in any tab-switched / dynamic-content section — never put `sx-reveal` on a per-item card inside a switcher.
  - **Reusable `PageHero`** at `client/src/components/spanbix/redesign/PageHero.jsx` — magazine page-header primitive (eyebrow + serif title + lead + optional meta strip + optional photo).
  - **10 subpages rewritten** to the editorial language: Courses (`PageHero → Tracks → LearningExperience → Certification → FinalCta`), CareerPaths (`PageHero → Tracks → full catalog table → Mentors → FinalCta`), CampusPrograms (`PageHero → Campus → 5-step Rollout → tracks-on-campus grid → Mentors → Certification → FinalCta`), Placements (`PageHero → HiringPartners → Placement → Outcomes → 4-card Verification strip → FinalCta`), DemoClasses (`PageHero → DemoVideos → 9-card library → Mentors → FinalCta`), About (`PageHero → MarketValidation → 6 Operating Principles 3×2 → WhySap → Mentors → FinalCta`), Contact (`PageHero → 3 audience-lane cards → Direct coordinates strip → FinalCta`), CourseDetail (editorial navy hero + sticky pricing/mode panel with Individual/Campus pill + What you'll learn citron checkmarks + AnimatePresence timeline mode-switched + Instructor + Includes + Prerequisites + Mentors + FinalCta — mode switcher + `?mode=campus` deep-link contract preserved), BlogList (PageHero with embedded search + tonal grid + paging + FinalCta), BlogDetail (navy article header + cover image + prose body + FinalCta).
  - **Navbar redesign** — transparent at scroll-top, navy + backdrop-blur after 40px scroll, with a soft shadow. New "S" wordmark badge swapped for the file-based logo image. Mount animation still intentionally suppressed (see earlier white-sliver bug fix). Build-target aware via `withSpanbixBase()`.
  - **Footer redesign** — multi-column (Platform / Company / Resources / Legal) with social tiles + `v.3.0 — REDESIGN_2026` mono build tag.
  - **`SpanbixLayout` clearance** — removed `pt-*` from the main wrapper since the Hero (homepage) and `PageHero` (subpages) own visual clearance under the now-transparent navbar.
  - **HiringPartners logo strategy** — Clearbit's free logo CDN was deprecated mid-build (deprecated by HubSpot 2023). Final approach: 12 brand PNGs (TCS, Infosys, Capgemini, Deloitte, Accenture, Wipro, IBM, Cognizant, HCLTech, KPMG, PwC, Tech Mahindra) committed under `client/public/spanbix/partners/`. Section bg switched from `--sx-navy-900` to `--sx-cream-50` so native brand colors stay visible without per-brand color tweaks. `onError` fallback shows the brand wordmark in serif italic so the strip never breaks if a PNG goes missing.
✅ **Mavro Scheduler module (Phases 1–7)** — Calendly-style scheduling system embedded inside the existing Mavro multi-tenant architecture, NOT a separate app. Under `src/modules/scheduler/`. Stack: Mongo via Mongoose (5 + 3 models — CalendarConnection, EventType, FormQuestion, Booking, Workflow + WorkflowExecution, WebhookDelivery, RoutingForm), Google Calendar OAuth via `googleapis` (provider-agnostic adapter pattern with `BaseCalendarProvider` + `GoogleCalendarProvider` real + `OutlookCalendarProvider` stub), AES-256-GCM token encryption at rest (v1 envelope, key rotation ready), OAuth state signing via short-TTL JWT, availability engine with luxon-backed DST-safe timezone math + slot-hash for race-safe handoff + O(log n) busy-overlap binary search + buffer-padded busy mask + per-host load tracking for round-robin, race-guard partial unique index on confirmed bookings (`{tenant, hostUser, startTimeUtc}` where status='confirmed'), BullMQ + ioredis + nodemailer workflow worker with 8 job handlers + graceful Redis-disabled degradation + standalone worker entry (`src/workers/scheduler-worker.js`), HMAC-signed webhook delivery (`X-Mavro-Signature: t=,v1=`) with 5-min replay window, RFC 5545 ICS generator, intake form validator, public booking + manage-by-token endpoints with bookingLimiter + slotsLimiter rate limits, frontend admin pages (CalendarConnectionsPage, EventTypesPage, EventTypeEditorPage, BookingsPage, WorkflowEditorPage, WorkflowHistoryPage, RoutingFormsPage) + public pages (PublicBookingAvailabilityPage, BookingManagePage, PublicRoutingPage). Phase 7 added team scheduling (round-robin + collective), routing forms with whitelisted-op rule engine, custom email templates with `{{path.to.value}}` HTML-escape interpolation, SMS via Twilio adapter, Slack via incoming webhook, workflow execution history + replay tooling, cancellation-window enforcement. AI never scores availability — slot computation stays deterministic. Outlook plug-in path documented: implement `OutlookCalendarProvider` against the existing adapter contract, no changes to the engine / booking service / workflow infra.

---

## 17. Known Limitations / Tech Debt

- Sitemap "Regenerate" button is currently a no-op refresh — backend service generates on-request, no caching layer to invalidate
- `SeoMetadata` model exists but is sparsely used; only feeds `/seo/stats` rollups
- No real-time WebSocket layer; dashboard polls on range change
- Auth token has no refresh-token flow (7-day expiry forces re-login)
- ~~No CDN-cached blog detail pages yet — SSR or static export deferred~~ **Resolved in Phase 6** — Spanbix now ships from `spanbix-web/` (Next.js 16 App Router) with per-blog static generation + ISR + on-demand revalidation. HRMS + Tickets remain on the Vite admin bundle for now; they can adopt the same pattern when SEO becomes a priority.
- Image upload pipeline absent — all images are URL inputs
- Mobile UX of admin dashboard not deeply tested
- No automated test suite

---

## 18. Future Plans

See [FUTURE_ROADMAP.md](./FUTURE_ROADMAP.md).

**Reserved integration hooks** already wired in `client/src/api/seo.js`:
- `GET /api/seo/gsc/summary/:websiteId` — Google Search Console
- `GET /api/seo/bing/summary/:websiteId` — Bing Webmaster

**Architecture is multi-tenant-ready** for unlimited new tenants without schema changes.

**Phase 2.0 delivered** ✅:
- Anomaly detection engine (`anomalyService.js`, 7 detectors)
- Returning-visitor metric (`getReturningVisitors`)
- Per-page conversion rate (`getPageConversion`)
- Per-page bounce rate (`getPageBounce`)
- `AnomalyAlerts.jsx` + `BehaviorIntelligence.jsx` UI

**Phase 2.1 candidates** (see `FUTURE_ROADMAP.md`):
- WebSocket-driven realtime feed (replace 15s polling)
- GSC/Bing OAuth integration
- AI-augmented operational narratives
- Anomaly history snapshots collection (`AnomalySnapshot` cron-written)
- Email/Slack alert dispatch on critical anomalies

---

## 19. Development Philosophy

1. **No fake data.** Every metric on every dashboard must derive from real analysis or real events. Placeholder arrays are forbidden in production code paths.
2. **Operational realism over visual sugar.** SEO scores, analytics, and audits must behave the way an experienced operator expects.
3. **Multi-tenant first.** Every new feature is built assuming N tenants from day one.
4. **Modular primitives over monoliths.** Reuse `GlassCard`, `EditorialSection`, `MetricOrb`, etc. Build new primitives when a third occurrence appears.
5. **Cinematic but restrained.** Animation budget is tight — only motion that serves context.
6. **Preserve existing architecture.** Refactor surgically. Do not rewrite routing, analytics, or theme systems unless the user explicitly authorizes.
7. **Document load-bearing decisions.** Anything that survives a future "why was this done?" question belongs in section 15.

---

## 20. Project Continuity Checklist

When resuming a session, an agent should:
- [ ] Read this file in full
- [ ] Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system shape
- [ ] Read [AGENTS.md](./AGENTS.md) for engineering standards
- [ ] Read [UI_VISION.md](./UI_VISION.md) for design rules
- [ ] Check `client/src/App.jsx` for current route inventory
- [ ] Check `src/app.js` for backend route mounts
- [ ] Run both dev servers: `npm run dev` (backend) + `cd client && npm run dev` (frontend)
- [ ] Confirm `/api/health` returns 200
- [ ] Confirm dashboard at `http://localhost:5173/` loads after login

---

## Phase 5.8 — Spanbix Tone Pass + Lead Schema Flexibility (May 26, 2026)

### Scope
End-to-end editorial + claim-honesty pass across every Spanbix surface, removal of dead sections, lead capture schema rebuilt for per-tenant flexibility, and visual hosting decisions (Vercel + Render with custom domain ready).

### Content + tone changes (all Spanbix surfaces)
- **ERP-first framing** replacing SAP-only framing across homepage + subpages. SAP retained where contextually needed; ERP used where the message is broader (e.g., `Why ERP Careers`, `1,000+ EMPLOYERS` stat, `50,000+ ERP jobs` hero meta).
- **AICTE / NAAC / NSDC references stripped** sitewide. Replaced with `Industry-aligned curriculum` / `Campus cohort` / `6 mo cohort length` framing.
- **Course duration unified to 3 months** across all 4 tracks (FICO/MM/SD/ABAP) in `client/src/lib/spanbixSeo.js`. Previously: FICO 4mo, MM/SD 3.5mo, ABAP 5mo.
- **Personality development module** surfaced as a 4th highlight on each track card (homepage `Tracks`), in `whatYoullLearn[]` arrays, in `includes[]` arrays, and as complimentary for campus cohorts. Rendered with citron marker-style highlight in `Tracks.jsx` cards.
- **Overclaim removal**: dropped "Crack the C_TS####" bullets from `whatYoullLearn[]`, dropped "Maps directly to SAP's official C_TS exams" point from `Certification.jsx`, dropped `studentsEnrolled` / `★ rating · ratingsCount` from `SpanbixCourseDetail.jsx` hero meta, dropped `Last updated MAY 2026`, dropped "Faculty rotates as new consultants join the bench…" from `Mentors.jsx`, dropped 6-month / 200–2,000 cohort specifics from FAQ + Campus copy, dropped "₹14.2L Median placed CTC" / "142+ Placements last 12 months" from `SpanbixCourses` + `SpanbixCareerPaths` hero meta.

### Sections / pages removed
- **Demo Classes / DemoVideos**: homepage render dropped, route `/spanbix/demo-classes` removed from `App.jsx` + `SpanbixApp.jsx`, "Demo Library" link removed from Footer, Hero "Watch Free Demo" CTA → "Book Consultation", FinalCta "Join Demo Session" button removed. `SpanbixDemoClasses.jsx` + `DemoVideos.jsx` orphaned (not deleted).
- **Placements page** removed entirely. Routes + nav links + footer link stripped.
- **Full Catalog flat table** removed from `SpanbixCareerPaths.jsx`. Page now: PageHero → Tracks → Mentors → FinalCta.
- **Operating Principles** (6-card section) removed from `SpanbixAbout.jsx`. About flow now: PageHero → MarketValidation (founder-story override) → WhySap → Mentors → FinalCta.
- **Certification section** removed from homepage (still rendered on `/courses` + `/campus-programs`). Homepage flow: Hero → HiringPartners → MarketValidation → WhySap → Tracks → Mentors → LearningExperience → Placement → Outcomes → Campus → FAQ → FinalCta.
- **Form on homepage FinalCta** removed. Now copy + 2 CTAs (`Book Consultation` → `/contact`, `Explore Programs` → `/career-paths`). Form lives only on `/contact`.

### New components / behaviors
- **`SPANBIX_MENTORS`** hoisted to `client/src/lib/spanbixSeo.js` as single source of faculty data. 4 real mentors with real photos. Both homepage `Mentors.jsx` carousel and `MentorCarousel` (course detail) import from there.
- **`MentorCarousel`** new component inside `SpanbixCourseDetail.jsx`. One mentor at a time, citron YOE bubble top-right, real photo, prev/next chevron buttons, clickable pagination dots, framer-motion crossfade, touch swipe (50px threshold). Sticky on `md+`.
- **Outcomes section** converted from grid to horizontal-scroll carousel matching Mentors pattern. 3 real alumni photos with `objectPosition: '50% 15%'`.
- **WhySap reason cards** dropped striped placeholders → use 6 real images. Dropped `01 · REASON` micro-label above each card title.
- **MarketValidation became props-driven** — accepts `eyebrow`, `title`, `lead`, `stats[]`, `sources`, `image`, `imageAlt`, `imageCorner`. About page overrides to "Founder Story" with `lalit.png`; homepage default unchanged.
- **Campus section became props-driven** — `tone='navy'|'paper'` + `showCtaStrip` flag. CampusPrograms subpage uses `tone='paper'` to avoid same-tone collision with the navy PageHero above. Icon tiles per card (Megaphone / CalendarCheck / Wallet / Award).
- **LearningExperience features get icon tiles** (Users / Workflow / Radio / Terminal). Feature 03 reframed to `Live first, then on-demand` (dropped 1:1 promise).
- **Rollout Process** (CampusPrograms subpage) gets icon tiles. Step 05 removed — 4 steps total.
- **Certification points** reduced 4 → 3 with icon tiles (BadgeCheck / QrCode / Target). Strips QR mockup + verify URL.
- **CohortCard** (hero overlay) toned to general content card. Dropped `PLACEMENTS` stat, `NEXT LIVE` block, `PLACEMENT SIGNAL · ₹14.2L MEDIAN CTC`. Now shows `MODULES / MENTORS:4 / DURATION:3 mo`.
- **Tracks campus card** stats: `Individual GUIDANCE EVERY COHORT / 50,000+ ERP JOBS / 3 mo COHORT LENGTH`. Tagline: `One of the most competitive institutional ERP programs you can complete on your own`.

### Course detail page rebuild
- **Pricing removed** for all 4 individual tracks. Panel reads `Talk to us to enrol.` + `Enrol Now` button → `/contact`.
- **Curriculum Timeline bug fixed** — code read `block.label` / `block.body`, data has `block.meta` / `block.title` / `block.topics`. Caused runtime crash. Now reads correct fields. Dropped per-module 4-bullet topics for `meta + title` general flow.
- **"This Track Includes"** trimmed 9 → 5 generic items per track.
- **Mentors section** (the `Taught by the people you'll be working alongside` block) removed — MentorCarousel above already covers it.
- **Track Details section** introduced as the bottom block: eyebrow + heading + 2-col grid (MentorCarousel left / Includes + Requirements right).
- **Responsive overhaul** — hero pricing panel `lg:sticky top:110`, Track Details grid `grid-cols-1 md:[1fr_1.4fr]`, Curriculum block `grid-cols-1 sm:[2-col]`, H1 floor `40px → 32px`, MentorCarousel sticky only on `md+`.

### Footer route fix (critical)
- **`/career-paths/sap-fico` etc. → `/career-paths/fico`** in `Footer.jsx`. Code is `fico` not `sap-fico` per `spanbixSeo.js` data. Previously footer links 404'd.

### Contact page rebuild
- **Form added** on `/contact`. 2-col grid `md:[30%_70%]`: navy aside left with eyebrow, headline, 4 contact rows (Email / Phone +91 9211429011 / Locations: Noida · Lucknow / Hours) + Google Maps iframe embed; white card right with full lead form.
- **DIRECT COORDINATES strip** removed (data moved into the new aside).
- **PageHero subtitle** dropped `no scripted scripts` and `right SAP track` → ERP-first.
- **Audience Lane cards** wired to real images. Each card gets a bottom `Start The Conversation` button that anchor-scrolls to `#contact-form`.

### Lead schema rebuilt for per-tenant flexibility
- **`Lead.js`** — added `formId` (indexed, max 100 chars) + `customFields` (`mongoose.Schema.Types.Mixed`, default `{}`). Old leads with bracket-stuffed `message` strings remain as-is (no migration).
- **`leadController.js`** — `formId` + `customFields` added to `ALLOWED_SUBMIT_FIELDS`. New `sanitizeCustomFields()` helper drops functions, nested objects, caps key length 60, value length 1000, array length 20. Called in `submitLead` before `Lead.create()`.
- **3 ContactForms (Spanbix, HRMS, Tickets)** stop concatenating meta into `message` string. Send real keys via `customFields` (`{ audience, interest }` / `{ teamSize }` / `{ teamSize, ticketVolume }`).
- **`LeadList.jsx` modal** renders `Form Responses` grid that auto-iterates `customFields` keys, plus a `Form` row showing `formId`. `message` gets `whitespace-pre-wrap`.

### Visual + brand
- **Navbar redesigned** to **glassmorphic cream**: `rgba(243, 237, 224, 0.72)` + `blur(22px) saturate(160%)`. Logo swapped from CSS monogram `S` + wordmark to real blue PNG (`/spanbix/spanbix-blue.png`) at `clamp(56px, 9vw, 96px)` height, zero vertical padding. Nav text + CTA flipped to navy. Mobile drawer matches cream glass.
- **Footer logo** changed to blue PNG wrapped in white pill (10px radius, 10/16 padding) so it stays readable on the navy footer bg.
- **CLAUDE.md "navbar transparent at scroll-top" invariant is now superseded** — navbar is solid glassmorphic cream always. `SpanbixLayout` restored `pt-16 sm:pt-20 md:pt-24 lg:pt-24` on `<main>` since navbar no longer transparent.

### Hosting + deploy ops
- **`client/vercel.json`** — shared multi-project config for both Spanbix and Admin Dashboard Vercel projects. `buildCommand` removed from file (per-project Vercel UI overrides it). Sitemap + robots rewrites point to actual backend paths (`/sitemap/spanbix.xml` + `/robots/spanbix.txt`). Security headers + asset cache headers preserved. SPA fallback rewrite last.
- **Linux-safe imports**: `PremiumTestDashboard.jsx` import `@/components/ui/badge` → `@/components/ui/Badge` (PascalCase). Linux/Vercel case-sensitive FS rejected lowercase.
- **Hosting decisions**: Vercel for frontend (custom domain `spanbix.com` attachable in 15 min — no migration needed), Render for backend. Self-host on shared hosting documented as viable but not recommended.

---

## Phase 6 — Spanbix SSR migration + canonical cutover (May 27–29, 2026)

End-to-end rebuild of the Spanbix public surface on **Next.js 16 App Router** (`spanbix-web/`) so search engines and social platforms receive real per-page metadata, JSON-LD, and content in the initial HTML — closing the gap that `useSEO` (client-side) left open for Facebook, LinkedIn, WhatsApp, Bing, and DuckDuckGo. Mavro admin (Vite) is unchanged; HRMS + Tickets stay on the Vite bundle. Only Spanbix migrated.

### Why SSR / ISR (decision record)
`useSEO` (`client/src/hooks/useSEO.js`) injects title / meta / OG / JSON-LD client-side after React mount. The Vite shell `index.spanbix.html` carries only generic homepage meta for every URL. Bots that don't render JS (FB / LinkedIn / WhatsApp / Bing) see the same shell on every blog. Next.js App Router + `generateMetadata` + ISR + on-demand revalidation lets the backend keep ownership of blog data while the frontend ships real per-page meta + body. The legacy `client/src/pages/spanbix/*` Vite tree is **retired but still buildable** (`build:spanbix`) as a quick fallback.

### Phase 6.0 — Next.js scaffold + design-system port ✅ COMPLETE
- ✅ `spanbix-web/` — Next.js 16 App Router (Turbopack, JS, Tailwind), `src/` layout, project root at `import.meta.dirname`.
- ✅ Fonts loaded via `next/font` (Instrument Serif, Geist, JetBrains Mono, DM Serif Display, Sora) in `app/layout.js`.
- ✅ Spanbix design system imported verbatim from `client/src/styles/spanbix-redesign.css` — same `.spanbix-scope` selector, same tokens / utilities. Imported from both Vite (`main.jsx`) and Next (`entries/spanbix.jsx` analog: `app/layout.js`).
- ✅ Components ported verbatim from `client/src/components/spanbix/redesign/**`. Static sections stay Server Components; interactive ones (carousels, forms, accordions) get `'use client'`. `react-router-dom` → `next/link` + `next/navigation`; `withSpanbixBase()` dropped because Next routes are root-relative.
- ✅ `lib/spanbixSeo.js` copied as the single SEO source — `SPANBIX_SITE`, `SPANBIX_MENTORS`, `SPANBIX_CAREER_PATHS`, `blogPostingLd`, `breadcrumbLd`, `blogListLd`, `courseLd`, `educationalOrganizationLd`, `faqLd` all available to Next pages without re-implementation.
- ✅ Admin-only deps (recharts, react-quill-new, radix-*) NOT pulled into `spanbix-web/` — public bundle stays lean.

### Phase 6.1 — Marketing routes (SSG) + blog routes (ISR) ✅ COMPLETE
- ✅ Marketing routes: `app/page.jsx`, `app/courses/page.jsx`, `app/career-paths/page.jsx`, `app/career-paths/[code]/page.jsx`, `app/campus-programs/page.jsx`, `app/about/page.jsx`, `app/contact/page.jsx`. `[code]` uses `generateStaticParams()` over `SPANBIX_CAREER_PATHS` codes (`fico`, `mm`, `sd`, `abap`). Per-page `generateMetadata()` mirrors the old `useSEO({...})` call.
- ✅ JSON-LD emitted via server-rendered `<script type="application/ld+json">` (no client `useEffect`).
- ✅ `app/blog/page.jsx` — Server Component fetching `${API}/api/blogs/website/spanbix` with `next: { revalidate: 300 }`. `generateMetadata` from `SpanbixBlogList.jsx` defaults.
- ✅ `app/blog/[slug]/page.jsx` — Server Component, `generateStaticParams()` returns every published slug, body fetched with `revalidate: 300`. `generateMetadata({ params })` resolves blog `seoTitle / seoDescription / canonicalUrl / ogImage / keywords`; emits `breadcrumbLd` + `blogPostingLd`; `notFound()` on backend 404.

### Phase 6.2 — On-demand ISR revalidation ✅ COMPLETE
- ✅ `spanbix-web/src/app/api/revalidate/route.js` — POST with shared secret. Calls `revalidatePath('/blog')` + `revalidatePath('/blog/<slug>')` + (Phase 6-fix) `revalidatePath('/sitemap.xml')` + `revalidatePath('/robots.txt')`. Returns 401 on bad secret, 500 if `REVALIDATE_SECRET` unset.
- ✅ `src/services/revalidateService.js` — backend fire-and-forget POST. 4s timeout; never throws; silent no-op when `SPANBIX_WEB_URL` / `REVALIDATE_SECRET` unset. Tenant-agnostic — `/api/revalidate` ignores slugs it doesn't know.
- ✅ Wired into every backend publish path: `blogController.publishBlog`, `blogController.updateWorkflowStatus` (when `becamePublished` flag set), `scheduledPublishService` worker. Every publish triggers `revalidateService.revalidateBlog(slug)` without blocking the response.

### Phase 6.3 — Sitemap + robots + legacy redirects ✅ COMPLETE
- ✅ `app/sitemap.xml/route.js` proxies `${API}/sitemap/spanbix.xml` (5-min ISR cache). `app/robots.txt/route.js` proxies `${API}/robots/spanbix.txt` (1-hour ISR cache). Both fall back gracefully if the backend is unreachable.
- ✅ `next.config.mjs` redirects: `/spanbix → /` (308) and `/spanbix/:path((?!.*\\.).*) → /:path` (308). Negative-lookahead excludes static assets so `/spanbix/herosection-video.mp4` etc still resolve.
- ✅ Backend sitemap (`sitemapService.generateSitemap`) now lists 9 seeded marketing pages via `SeoMetadata` rows (`/about`, `/courses`, `/career-paths`, `/career-paths/{fico,mm,sd,abap}`, `/campus-programs`, `/contact`) plus `/` + `/blog` + every published blog post. Seeded by `seedSpanbix.js → upsertSpanbixStaticPages()` with idempotent `$setOnInsert` so admin tweaks are preserved.

### Phase 6.4 — Production cutover to www.spanbix.com ✅ COMPLETE
- ✅ Domain cutover: DNS for `spanbix.com` + `www.spanbix.com` points at the spanbix-web Vercel project. Apex 301-redirects to www (via Cloudflare at the edge + a Next 16 Proxy at the app layer as a belt-and-braces fallback). www serves the Next app.
- ✅ Canonical host flipped to `https://www.spanbix.com` across the entire codebase: `seedSpanbix.js` domain field, `spanbixSeo.js` (`client/` + `spanbix-web/`) `SPANBIX_SITE.url` / `logo`, `app/layout.js` `metadataBase`, `client/index.spanbix.html` `og:url` + `og:image` + `twitter:image`, `.env.example` `SPANBIX_WEB_URL`, backend CORS baseline in `src/app.js`.
- ✅ `spanbix-web/src/proxy.js` — Next 16 Proxy (renamed from `middleware.js` per the new file-convention deprecation). Detects exact apex hostname and emits `NextResponse.redirect(url, 301)`. Necessary because `redirects()` only emits 307/308.
- ✅ `seedSpanbix.js` LEGACY_DOMAINS migration normalizes both sides (strip scheme + trailing slash + lowercase) before comparing, so a stored value like `"https://spanbix-web.vercel.app/"` (the value that defeated the initial exact-match) is now caught and rewritten to `www.spanbix.com` on the next boot.
- ✅ `sitemapService.buildBaseUrl` hardened: loops the scheme strip so a double-prefixed input like `https://https://...` can no longer re-emerge as the bug the helper exists to prevent.

### Phase 6.5 — SEO audit fixes: author byline + security headers ✅ COMPLETE
- ✅ **AdminUser byline fields** — `bio` (≤600ch), `linkedinUrl` (linkedin.com URL validator), `jobTitle` (≤120ch) added to the schema and surfaced in `PUT /api/auth/users/:id` whitelist.
- ✅ **Populate enriched** — `blogController.getPublicBlog` populates `name avatar bio linkedinUrl jobTitle` so the public blog endpoint returns the full author shape.
- ✅ **Person schema enriched** — `blogPostingLd` (in both `client/src/lib/spanbixSeo.js` and `spanbix-web/src/lib/spanbixSeo.js`) emits `@type: Person` with `name`, `jobTitle`, `description`, `image`, `url`, `sameAs[]` — every field conditional on a value. Closes Google's Sept 2025 QRG "anonymous authorship" gap.
- ✅ **AuthorByline block** rendered on `spanbix-web/src/app/blog/[slug]/page.jsx` below the article body — avatar + serif name + monospace job title + bio paragraph + LinkedIn link (inline brand SVG; lucide 1.16 in this project has no `Linkedin` export).
- ✅ **CLI: `npm run set:spanbix-author`** — `src/utils/setSpanbixAuthor.js` updates author fields on the existing AdminUser from env vars (`SPANBIX_AUTHOR_NAME / JOBTITLE / BIO / AVATAR / LINKEDIN / EMAIL`). No MongoDB editing needed.
- ✅ **Security headers** in `spanbix-web/next.config.mjs` `headers()`:
  - `Content-Security-Policy` — `default-src 'self'`; scoped allowlists for Vercel scripts, Google Fonts, Render API, Vercel analytics. `'unsafe-inline' 'unsafe-eval'` retained on `script-src` until nonce-based CSP refactor lands. `frame-src 'self' https://www.google.com https://maps.google.com` for the `/contact` Google Maps embed (Phase 6.8.2). `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — exact value `hstspreload.org` requires.
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy` drops every unused sensor (camera, microphone, geolocation, payment, USB, etc.).
  - `poweredByHeader: false` disables Vercel's `X-Powered-By: Next.js` advertising header.

### Phase 6.6 — Dashboard sitemap URL helpers (admin Vite) ✅ COMPLETE
- ✅ `client/src/pages/websites/WebsiteList.jsx` `defaultSitemapUrl(domain)` and `client/src/pages/SeoEngine.jsx` `sitemapXmlUrl(domain)` / `robotsTxtUrl(domain)` now derive from the website's public domain via `publicUrlFromDomain(domain)` + `/sitemap.xml` (or `/robots.txt`). The old hardcoded `window.location.hostname:5000` form produced `https://mavro-dashboard.vercel.app:5000/sitemap/<slug>.xml` on the live admin Vercel — broken because Vercel doesn't serve port 5000.
- ✅ `onDomainChange` re-derives the auto-default sitemap URL only while it still equals the previous domain's auto-default (preserves admin hand-edits).

### Phase 6 invariants (do not regress)
- **Canonical host is `https://www.spanbix.com`.** Apex `spanbix.com` 301s to www at both the Cloudflare edge AND `spanbix-web/src/proxy.js`. Never reintroduce a www-side redirect (caused the redirect-loop incident — Vercel was doing www → apex while Cloudflare did apex → www).
- **`Website.domain` is the single source of truth** for sitemap + robots URLs. Backend `sitemapService.buildBaseUrl(domain)` strips scheme + trailing slash and emits `https://${host}/...`. Migrating the canonical host = update this field (or let `seedSpanbix.js` LEGACY_DOMAINS migration do it on next boot).
- **Spanbix marketing pages must live in `SeoMetadata` rows**, not hardcoded in `sitemapService`. Adding a new marketing page = add a row to `SPANBIX_STATIC_PAGES` in `seedSpanbix.js`; the seeder upserts it idempotently on next boot.
- **Author byline reads from the populated `Blog.author` doc** — never hardcoded. Every blog with a real author gets full Person schema; blogs without one fall back to Organization. Avatar / bio / LinkedIn must be set on the AdminUser record (use `npm run set:spanbix-author`).
- **`/api/revalidate` is the single on-demand cache-bust path** for spanbix-web ISR. Every backend publish calls it. It now busts blog (`/blog`, `/blog/<slug>`) AND infrastructure (`/sitemap.xml`, `/robots.txt`) routes — do not duplicate this logic elsewhere.
- **proxy.js, not middleware.js** — Next 16 renamed the file convention. The exported function is `proxy(request)`, the file is `src/proxy.js`. Vercel deploys fail with `Proxy is missing expected function export name` if either is wrong.
- **CSP `'unsafe-inline' 'unsafe-eval'` remain on `script-src`** until a nonce-based CSP is wired (would require Proxy/Middleware to inject a per-request nonce). Removing them today breaks Next runtime + framer-motion + Vercel analytics.
- **Apex domain in Vercel must point DIRECTLY at the app**, not redirect to www via the Vercel Domains UI. If Vercel handles the apex redirect at the edge with 308, our 301 never fires.

---

## Phase 6.7 — Vite Spanbix surface FULLY DELETED (May 29, 2026)

After the Phase 6 SSR migration verified the Next.js app at `spanbix-web/` was serving every Spanbix surface from `https://www.spanbix.com`, the legacy Vite Spanbix tree was retired in-place and then deleted to remove confusion + dead code.

### Deleted in this phase
- `client/src/SpanbixApp.jsx` (standalone Spanbix routing tree)
- `client/src/entries/spanbix.jsx` (standalone Vite entry)
- `client/src/components/spanbix/` (entire tree — Navbar, Footer, SpanbixLayout + every redesign section)
- `client/src/pages/spanbix/` (entire tree — all 10 Spanbix page components)
- `client/src/lib/spanbixSeo.js` (SPANBIX_SITE constants, mentor roster, career-path catalog, JSON-LD builders)
- `client/src/lib/routeBase.js` (`withSpanbixBase()` / `isStandaloneSpanbix()` / `getBuildTarget()`)
- `client/index.spanbix.html` (Spanbix entry HTML)
- `client/public/spanbix/` (entire asset namespace — logos, mentor photos, alumni photos, hero video, partner PNGs)

Total: 91 files removed in a single commit.

### Config simplification
- `client/vite.config.js` — entire `VITE_BUILD_TARGET` machinery dropped: `ENTRY_HTML` table, `renamePromotedHtmlPlugin`, `devTargetHtmlPlugin`, the `define` block pinning the target into the bundle, the `rollupOptions.input` override. Single-entry config: `index.html → src/main.jsx → App.jsx`.
- `client/package.json` — removed `dev:spanbix`, `build:full`, `build:spanbix`, `build:hrms`, `build:tickets`. Scripts now: `dev` / `build` / `preview`. `cross-env` dropped from devDependencies (no longer used).
- `client/vercel.json` — removed Spanbix-specific rewrites (`/sitemap.xml → /sitemap/spanbix.xml`, `/robots.txt → /robots/spanbix.txt`). The SPA fallback regex still excludes `sitemap.xml` + `robots.txt` so those paths 404 cleanly on the admin host instead of falling through to `index.html`.
- `client/src/context/ThemeContext.jsx` — `DEFAULT_DARK` is now just `true` (the build-target-based default was the only Spanbix-specific behaviour in the admin context).

### Legacy URL handling
- `client/src/App.jsx` mounts a single `<SpanbixLegacyRedirect />` catch-all on `/spanbix` and `/spanbix/*`. The component reads `window.location.{pathname, search, hash}`, strips the `/spanbix/` prefix, and calls `window.location.replace('https://www.spanbix.com' + path + search + hash)`. Deep links survive the cutover; admin history doesn't carry the legacy path.

### Verification
- Admin Vite `npm run build` clean. Main chunk shrank from 1234 kB → 1097 kB (gzipped 359 kB → 325 kB) — the saved bytes are the removed Spanbix code.
- Next `spanbix-web/` build unchanged: 12 routes + Proxy still ship; live site unaffected.

### Invariant
- **Adding a new Spanbix page = `spanbix-web/src/app/...`. Always.** Never reintroduce `client/src/components/spanbix/` or `client/src/pages/spanbix/`. Same for `spanbixSeo.js` and `routeBase.js` — both are gone permanently.

---

## Phase 6.8 — Spanbix Next app content + UX polish (May 29, 2026)

Content + UX updates applied to `spanbix-web/` after the cleanup. Live site immediately reflects them on the next deploy.

### Contact / brand identity updates
- **Phone:** `+91 93107 93790` (`spanbix-web/src/app/contact/ContactForm.jsx → COORDINATES`).
- **Email:** `contact@spanbix.com` (was `hello@spanbix.com`).
- **Address:** Galaxy Blue Sapphire Plaza, 1415, Greater Noida West Link Rd, Sector 4, Ghaziabad, Greater Noida, Uttar Pradesh (201009).
- **Centres:** Greater Noida + Lucknow only. All Bengaluru / Hyderabad / Pune copy removed (image filenames retained where they don't surface in visible UI).
- **Map embed** rewritten to point at the Galaxy Blue Sapphire Plaza address (the old iframe pointed at an unrelated "Saisatwik Technologies" pin).
- **Footer copyright** flipped to `© 2026 Spanbix Training Institute. · Greater Noida`.
- **Tushar testimonial** trimmed to remove the `before I even graduated` tail (`spanbix-web/src/components/spanbix/redesign/sections/Outcomes.jsx`).

### Social brand tiles
`spanbix-web/src/components/spanbix/Footer.jsx` now ships real brand glyphs (inline SVG paths because lucide-react 1.16 has no brand-icon exports) for **LinkedIn**, **Facebook**, **Instagram** — every tile opens in a new tab with `rel="noopener noreferrer me"`:
- LinkedIn → `https://www.linkedin.com/company/118163985`
- Facebook → `https://www.facebook.com/people/Spanbix-Training-Institute/61590494903596/`
- Instagram → `https://www.instagram.com/spanbix93`

The previous 4-tile placeholder grid (`IG / LI / YT / X` with `href="#"`) was removed in the same edit.

### Floating WhatsApp affordance
- New component `spanbix-web/src/components/spanbix/WhatsAppFloater.jsx` ('use client').
- Fixed bottom-right on every page (mounted from `SpanbixLayout`).
- Brand-green circular button (`#25D366`) with inline brand glyph SVG, hover-scale interaction.
- Deep link: `https://wa.me/919310793790?text=i%20want%20to%20enquire%20about%20the%20courses` — pre-populates the WhatsApp draft with the user's chosen enquiry message.
- Phone number constant `PHONE_DIGITS_ONLY = '919310793790'` (full international form, no `+`, no spaces — per wa.me spec).

### First-visit cohort banner
- New component `spanbix-web/src/components/spanbix/CohortBanner.jsx` ('use client').
- Trigger contract:
  - Appears centered on first visit after ~400 ms delay (avoids fighting LCP paint).
  - × icon, "Maybe later" button, backdrop click, AND Esc key all dismiss.
  - Dismissal writes `Date.now()` to `localStorage` under key `spanbix-cohort-banner-dismissed-1`. Suppressed for 24 h. Bumping the key suffix invalidates every existing dismissal next time the user loads the site.
  - Body scroll is locked while open.
- Mounted globally from `spanbix-web/src/components/spanbix/SpanbixLayout.jsx` so it appears on every route.
- Locked copy (Option A — recommended):
  - Eyebrow: `NEW COHORT · ENROLMENTS OPEN`
  - Headline: `Batch starts 8 June 2026.`
  - Meta rows: `📅 STARTS — Monday · 8 June 2026`, `🎯 TRACKS OPEN — SAP FICO · MM · SD · ABAP`, `🪑 SEATS — Limited · cohort-capped`
  - Subtext: `Reserve a seat before the cohort fills. 30-minute consultation to map the right track for your background.`
  - Primary CTA: `Book Consultation →` (routes `/contact`, also dismisses)
  - Secondary: `Maybe later`

### Phase 6.8.3 — Dedicated WhatsApp-share enquiry page `/enquire` (May 29, 2026)

Single-purpose lead-capture page intended for **1-to-1 outreach** (sales team shares the URL over WhatsApp / email when chatting with a prospect). Lives at `https://www.spanbix.com/enquire`. Distinct from `/contact` so admin Leads can separate inbound channels by `formId` without relying on UTM hygiene.

- **Form contract** — `formId: 'spanbix-whatsapp'` + `customFields.source: 'whatsapp-share'`. Backend Lead schema indexes `formId`; admin Leads UI groups by it. Do NOT change either string without updating the matching saved filter on the admin side.
- **Visual identity** — single-column centered card on `--sx-cream-50`, no contact-coordinates aside, no map. Headline: "Tell us about you." Same audience / interest chip set as `/contact` for consistency.
- **SEO posture** — `robots: { index: false, follow: false }` via Next `generateMetadata`. The page is intentionally NOT in the sitemap and is not seeded as a `SeoMetadata` row. Search engines should not index it; people receive the URL by direct share.
- **Files** — `spanbix-web/src/app/enquire/page.jsx` (Server Component, metadata + JSON-LD breadcrumbs) + `spanbix-web/src/app/enquire/EnquireForm.jsx` (`'use client'` form island reusing `submitPublicLead` + `getOrCreateSession`).
- **Attribution alternative considered** — UTM (`?utm_source=whatsapp&utm_medium=referral`) on the existing `/contact` URL. Rejected as the primary mechanism because copy-paste flattens query strings, browser back/refresh loses them, and people often type the bare URL. A dedicated route + `formId` is 100% reliable; UTMs can still ride on top if needed for finer-grained campaign tracking.

### Phase 6.8 invariants
- **`Footer.jsx SOCIALS` is the single source of truth for social URLs.** Adding a new platform = drop a new entry; the glyph is a path payload, the tile chrome stays the same.
- **WhatsApp phone digits + prefilled message live in `WhatsAppFloater.jsx`** as hardcoded constants for now. A future move to a shared contact-config module can replace them without touching the floater layout. The prefilled draft is `"I want to enquire about the courses"` — capital `I` is intentional (Phase 6.8.1 fix). When editing the message: keep it ≤60 chars so the WhatsApp draft preview doesn't truncate on mobile.
- **Cohort banner `DISMISS_KEY` is versioned (`-1`).** Bump the suffix when launching a new cohort campaign so previously-dismissed users see the new banner. Don't mutate the suppression window inline — flip the key.
- **The cohort banner is mounted from `SpanbixLayout.jsx`.** Don't drop it into individual pages; the global mount is what guarantees the 24-h localStorage contract is enforced consistently across navigations.
- **CSP `frame-src` whitelist is tight: `'self' https://www.google.com https://maps.google.com`** (Phase 6.8.2 fix). Required for the `/contact` Google Maps iframe — without it the CSP default-src fallback renders Chrome's "This content is blocked" placeholder. **Do NOT wildcard `frame-src`** when adding new embeds. Add the exact upstream host and nothing else; if it's a third-party calendar / video / form embed, also vet whether it should be CSP-allowed at all vs replaced by a native component.

---

## Phase 7 — SEO Phase 1, SAP Ads landing page, legal/consent, ad attribution (June 11–19, 2026)

All changes below are in `spanbix-web/` (Next 16) unless noted. Backend untouched except where stated.

### 7.1 SEO Phase 1 (schema / on-page / perf) — DEPLOYED
- **Schema** (`src/lib/spanbixSeo.js`): real `sameAs` via new `SPANBIX_SOCIALS` (LinkedIn/FB/Insta/YouTube/Pinterest); `courseLd` now emits `hasCourseInstance` (Online, P3M) + `offers` (INR, InStock, `/contact` url, **no `price`** per pricing policy); new `websiteLd()` = WebSite + SearchAction on homepage; consolidated into ONE `EducationalOrganization` node (`@id` `#organization`) enriched with Greater Noida `PostalAddress`, phone, email, `areaServed` India, founder. `organizationLd()` is now an alias of `educationalOrganizationLd()`.
- **Meta** (`src/lib/seoMeta.js`): added `alternates.languages` → `en-IN` + `x-default`. New `SPANBIX_SITE.metaDescription` (≤155). All page descriptions rewritten ≤155, no false city claims.
- **Perf**: logo/footer/mentors/partners/founder images → `next/image` (auto AVIF/WebP); navbar logo `priority`. Fonts trimmed 5→3 (dropped DM Serif Display + Sora webfonts; `globals.css` keeps them as LITERAL fallback names — never `var(--font-dm-serif)`, which is now undefined and would invalidate the font stack). `/spanbix` brand assets long-cache headers in `next.config.mjs`.
- **GSC**: ownership file `spanbix-web/public/googlebc2ab882feaaad60.html` (HTML-file method, www property).

### 7.2 About page = founder-only (decision)
- SEO Phase 1 briefly re-added `<Mentors/>` (instructor carousel) to `/about` for an E-E-A-T grid. **REVERTED** — About is intentionally **founder-only** (PageHero → Founder Story → company facts → CTA). Do NOT re-add the instructor carousel to About.

### 7.3 SAP Ads landing page `/sap-course` — DEPLOYED
- Dedicated Google Ads lead-gen page. `metadata.robots = { index:false, follow:true }` (paid LP, kept out of organic). Stripped chrome — own minimal sticky header + footer, NOT `SpanbixLayout` (no nav escape links). All under `.spanbix-scope` so `sx-*` tokens apply.
- Files: `src/app/sap-course/{page.jsx, SapCourseLanding.jsx, LpLeadForm.jsx}`, `src/components/spanbix/lp/CallFloater.jsx`, `src/lib/track.js`.
- **Video hero** (homepage `/spanbix/herosection-video.mp4` + gradient stack). Sections (all redesigned, premium): why-SAP bento (`f500-boardroom.jpg` + "hired at" partner logos), why-Spanbix split (`CONSULTANT_15YR.png` + 5-item list), course highlights (icon cards + ghost numbers, no photos), audience cards (navy glass, BEST-FIT track chips), reviews carousel, **zigzag** process timeline (alt above/below on desktop, vertical on mobile), batch details (pulse urgency), FAQ (2-col: navy "prefer to ask?" card + accordion), final capture (badge + trust + reassurance).
- **Reviews carousel** merges CURATED (4 real alumni + 3 real Google reviews pasted by user: Aditya Yadav, Sonu Singh, Ruchikas Singh) with optional live Google reviews. Google-source cards show the G badge; no time text. Avatars: photos where available else initials. Live Google pull = `src/lib/googleReviews.js` via Places API, **off unless** `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID` env set (currently curated-only; user deprioritised live pull).
- **Floaters**: `CallFloater` (navy, click-to-call) stacked above the existing green `WhatsAppFloater` (now fires `whatsapp_click`). Both on the LP. **CTA strips** (`CtaStrip`, bright citron) after why-Spanbix and after reviews; each = Enroll + Call + WhatsApp.
- **Lead form** (`LpLeadForm`, hero + final): posts under `formId: 'spanbix-sap-lp'` + `customFields.source: 'google-ads-sap-lp'` → separate filterable section in admin. Track chips styled inline (light + dark) — `sx-role-chip` is light-only and was invisible on the navy form.

### 7.4 Tracking (GTM) — code DEPLOYED, waiting on IDs
- `src/lib/track.js` = unified dispatch: pushes to `window.dataLayer` (for GTM/GA4/Ads) AND mirrors to backend analytics. Events: `cta_click`, `call_click`, `whatsapp_click`, `generate_lead`. `generate_lead` fires only on confirmed lead — backend already emits the authoritative `form_submit`, so do NOT re-emit form_submit client-side.
- `src/components/GoogleTagManager.jsx` (`GtmScript` + `GtmNoScript`) mounted sitewide in `app/layout.js`. Env-driven `NEXT_PUBLIC_GTM_ID` — no-op when unset. CSP in `next.config.mjs` opened for googletagmanager / google-analytics / analytics.google / doubleclick / googleadservices (script-src, connect-src, frame-src).
- **GA4 + Google Ads conversions are configured in the GTM UI, not in code.** PENDING from the ads/analytics person: GA4 `G-…`, GTM `GTM-…`, Ads `AW-…` + conversion label. Then: set `NEXT_PUBLIC_GTM_ID` on the spanbix-web Vercel project + redeploy; build the importable GTM container JSON; wire Enhanced Conversions.

### 7.5 Legal pages + DPDP consent — DEPLOYED
- `/privacy`, `/terms`, `/refund` via `src/components/spanbix/LegalPage.jsx` (data-driven `sections`). DPDP Act 2023 aware; general/comprehensive, **no overcommitting** (refund policy has no hard fee numbers or fixed-day promises). Governing law = courts at Gautam Buddh Nagar (Greater Noida), UP. SAP trademark disclaimer (independent, not affiliated). **No CIN/GST/foundingDate** — unverified, do NOT add placeholders. Founder named: LalitMohan Parihar.
- **Mandatory consent** on EVERY lead form via `src/components/spanbix/ConsentCheckbox.jsx` (`CONSENT_RECORD` constant). Blocks submit when unchecked (native `required` + JS guard). Writes `customFields.consent` → admin `LeadList` auto-renders it per NEW submission (old leads untouched). Wired into ContactForm, EnquireForm, LpLeadForm (hero+final). Footer Legal links fixed (`/about#…` dead anchors → real routes); LP footer also links Privacy/Terms/Refund (Google Ads requires a privacy link on the LP).

### 7.6 Ad attribution + spam guard — DEPLOYED
- `src/lib/attribution.js`: FIRST-TOUCH capture of `gclid/gbraid/wbraid` + `utm_*` (+`fbclid`) into sessionStorage on first load (survives navigation), merged into every lead's `customFields` (verified rendering in admin). Captured via `SpanbixLayout` (site pages) + `SapCourseLanding` (LP). Real ad clicks carry `gclid` automatically (Ads auto-tagging). No backend change — sanitizer accepts arbitrary customFields keys.
- `src/components/spanbix/Honeypot.jsx`: hidden `company_website` field on all 3 forms; if filled (bot) → submit shows success UI but never POSTs. Cuts paid-traffic junk leads.

### 7.7 Lead-alert notification — TRIED + REVERTED (do not rebuild without explicit ask)
- A `leadNotifier` service (WhatsApp-gateway/Telegram/webhook) + controller hook was built then **reverted at user request** (commit reverted; backend clean). User decided **no automated lead alert** for now. Note: official WhatsApp Cloud API CANNOT post to groups — group delivery needs a 3rd-party gateway. Do NOT add lead notifications/alerts again unless the user explicitly asks.

### Phase 7 invariants (do not regress)
- `/sap-course` is a **noindex** Ads LP with its OWN minimal chrome (not SpanbixLayout); leads use `formId: 'spanbix-sap-lp'`. No pricing anywhere on it.
- **Every Spanbix lead form must include the `ConsentCheckbox`** (blocks submit, writes `customFields.consent`). New tenant/forms going forward must too — DPDP requirement.
- **Every lead form captures attribution** via `getAttribution()` spread into `customFields` + renders the `Honeypot`. Keep both when adding/editing forms.
- `track.js` events go to BOTH dataLayer and backend; never client-emit `form_submit` (server-authoritative). `generate_lead` is the Ads conversion signal.
- GTM is env-driven (`NEXT_PUBLIC_GTM_ID`); GA4/Ads live in the GTM UI. CSP must list any new Google/3rd-party tag host before it loads.
- About page is founder-only — no instructor carousel.
- Legal facts: founder LalitMohan Parihar; office Galaxy Blue Sapphire Plaza, 1415, Greater Noida West Link Rd, Sector 4, Greater Noida, UP 201009; centres Greater Noida + Lucknow; phone +91 93107 93790; email contact@spanbix.com. No CIN/GST/founding year until verified.
- Lead alerts/notifications: user-declined — do not build without an explicit new request.

---

## Phase 7.8 — Playwright E2E suite (June 19, 2026)

End-to-end test suite at repo root (`e2e/` + `playwright.config.ts`). Targets the
DEPLOYED sites. No app/source code changed — the only fixes were in the test code
(see gotchas below). devDependency `@playwright/test` added to root `package.json`
with `test:e2e*` scripts.

### Layout
- `playwright.config.ts` — projects: `spanbix-{chromium,webkit,mobile-chromium,mobile-webkit}` (baseURL `SPANBIX_BASE_URL`, default https://www.spanbix.com) + `admin-{setup,chromium,webkit}` (only when `ADMIN_BASE_URL` set). Records **video + screenshot + trace ON for every test** → `outputDir: e2e/recordings`; HTML report → `e2e/report`. retries:1.
- `e2e/support/` — `data.ts` (routes/forms/selectors), `mock.ts` (`mockLeadSubmit`, `gotoReady`, `autoClosePopups`, `dataLayerEvents`), `fixtures.ts` (banner-suppressing `test`).
- `e2e/spanbix/` — `smoke` (routes + sitemap/robots), `seo` (canonical/hreflang/noindex/JSON-LD incl. Course offers-no-price), `forms` (consent gate, mocked-submit payload incl. gclid/utm, honeypot), `tracking` (dataLayer events), `sap-course` (no-nav/floaters/CTA strips/no-₹), `responsive` (no horizontal overflow).
- `e2e/admin/` — `admin.setup.ts` (login once → `e2e/.auth/admin.json` storageState) + `admin.spec.ts` (read-only: leads list/detail, core pages, logged-out redirect). Env-gated.
- `.gitignore`: `e2e/recordings/`, `e2e/report/`, `e2e/.auth/`, `test-results/`, `playwright/.cache/` (local artifacts only).

### Hard rule
**Lead submits are ALWAYS mocked** (`page.route('**/api/leads/submit')` in `mockLeadSubmit`) so tests NEVER write a real lead to the prod DB — even running against prod. The read-only `**/api/websites/public/**` lookup is left to pass so the form gets a real websiteId. Admin tests are READ-ONLY (no create/edit/delete). Creds come from env (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) — never hardcoded.

### Two gotchas (fixed in test code — reuse, don't re-discover)
1. **First-visit cohort banner is a modal that intercepts pointer events** → blocks form clicks. Suppressed by `e2e/support/fixtures.ts`, which `addInitScript`s `localStorage['spanbix-cohort-banner-dismissed-2'] = Date.now()` before every load. ALL Spanbix specs import `{ test, expect }` from `../support/fixtures` (not `@playwright/test`) to get this.
2. **Forms fetch `websiteId` async on mount** (`GET /api/websites/public/<slug>`); submitting before it resolves trips the "Still connecting" guard → no success. `gotoReady(page, url)` waits for that response (+300ms React-commit settle) before interacting. Use it for any test that actually submits a form.

### Status (June 19, 2026)
- Spanbix: **40/40 pass** on chromium desktop, **7/7** on mobile chromium, against prod. Zero real leads created.
- WebKit projects not yet run (only chromium installed locally) — `npx playwright install` adds WebKit/Firefox for the full 4-project matrix.
- Admin projects not yet validated — need `ADMIN_BASE_URL` + `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Admin selectors are resilient but may need tuning to the live login/leads UI.

### Run
`npm run test:e2e` (all) · `:spanbix` · `:admin` · `:ui` (headed) · `:report` (open HTML report) · `:trace`.

---

## Phase 8 — Analytics live + AI Mastery course + banner (June 22, 2026)

### Analytics wired end-to-end (GTM-first, verified in Tag Assistant)
- **Architecture decision: one GTM container drives GA4 + Google Ads.** No raw `gtag.js` on the site — everything is added inside the GTM web UI. Repeatedly declined Google's in-product nudges to "install a Google tag / paste code" (they cause double-tagging).
- **IDs:** GTM `GTM-WW4R4C8P` · GA4 `G-CSG5H7FDG7` · Google Ads conversion `AW-18231051715` + label `hXXrCKL9lMIcEMOLn_VD` (conversion action "Submit lead form", set up "Manually with code → Use Google Tag Manager").
- **GTM container (8 tags), authored as an importable JSON at repo root `gtm-container-spanbix.json`:** Google Tag (GA4 pageviews, All Pages) · 4 GA4 Event tags (`cta_click`/`call_click`/`whatsapp_click`/`generate_lead`, each on a Custom-Event trigger) · Conversion Linker (All Pages) · Google Ads Conversion (on `generate_lead`) · Google Ads base Google Tag (`AW-…`, All Pages — clears Ads' "missing Google tag"/limited-serving warning, enables remarketing/enhanced conversions; does NOT fire the conversion, so no double count). Imported via GTM Admin → Import Container → Merge/Overwrite → Publish (live as Version 4). First import failed "File format is invalid" until the placeholder account/container IDs were replaced with the real ones (`6361809459`/`255993999`) + a bad param removed.
- **Vercel:** `NEXT_PUBLIC_GTM_ID=GTM-WW4R4C8P` on spanbix-web (Production + Preview) → redeploy baked it in (`GoogleTagManager.jsx` env-driven, no-op otherwise). Verified `GTM-WW4R4C8P` in live page source.
- **CSP fix (`next.config.mjs`):** Tag Assistant showed the Ads conversion ping to `https://ad.doubleclick.net/ccm/s/collect` blocked by `connect-src` (old allow-list only had `*.g.doubleclick.net`). Broadened `connect-src` + `frame-src` to `https://*.doubleclick.net` + `https://www.googleadservices.com`. After redeploy: Tag Assistant `generate_lead` → both **GA4 Event - generate_lead** and **Google Ads Conversion - Lead** fired & **Succeeded**, Console clean.
- **Event ownership:** `track.js` pushes `cta_click`/`call_click`/`whatsapp_click`/`generate_lead` to `dataLayer`; `form_submit` stays server-authoritative (lead controller). `generate_lead` (the conversion) fires ONLY on `LpLeadForm` (`/sap-course`) success — Contact/Enquire forms don't, so the GA4/Ads conversion counts LP leads only.
- **Pending (manual, user's accounts):** (1) GA4 → mark `generate_lead` as **Key event** (Recent events → star; appears ~24h after first event; Ads conversion independent of it). (2) Google Ads conversion shows "No recent conversions" until a real ad-driven lead arrives (campaign launched 20 Jun, `Maximise conversions`, ₹600/day, ~₹1,000 funded — flagged to top up / use the ₹20k credit). (3) Free-Render-keep-warm options were discussed (paid Starter $7/mo = real fix; free uptime pinger every ~10 min on `/api/health`; GitHub Actions cron; plus client warm-up ping + submit retry) — **no decision made, nothing implemented.**

### "How to read my tracking" (for the user)
- **GA4** = on-site behavior: Realtime (live), Pages and screens (visits + avg engagement time, filter `sap-course`), Events (`cta_click`/`call_click`/`whatsapp_click`/`generate_lead`), Traffic acquisition (source). For per-page "everything", build an **Explore** filtered to `page path contains sap-course`.
- **Search Console** = search/indexing (queries, ranking, indexed pages, sitemap). The actual keywords live ONLY in GSC, not GA4.
- **Mavro `/leads`** = the actual lead records (name/phone/consent/gclid) to follow up. GA4 = counts; `/leads` = people.
- Data lag: brand-new GA4 property → Realtime works now; standard reports/Explore fill within 24–48h.

### AI Mastery course (new, non-SAP)
- New catalog entry `code:'ai'`, `category:'ai'` in `spanbix-web/src/lib/spanbixSeo.js → SPANBIX_CAREER_PATHS` — a **how-to-USE-AI** course (prompt engineering · AI images/design · AI video/voice · content & research automation · building apps & automations with AI · capstone), 8 weeks, no coding, full schema (individual + campus timelines, instructor "Kabir Anand", includes/requirements/highlights incl. the complimentary personality module). NOT an AI-development course.
- One entry auto-surfaces everywhere via existing mappers: `/career-paths/ai` detail (CourseDetailView), `/courses`, `/career-paths`, homepage `Tracks` (new "AI Mastery" tab + "Five programs" copy), Footer link, `/sap-course` AI cross-sell strip (→ `/career-paths/ai`, `cta_click:ai_crosssell`), and `courseLd` JSON-LD. Backend `seedSpanbix.js → SPANBIX_STATIC_PAGES` adds `/career-paths/ai` (sitemap, priority 0.9). Brochure button gated to SAP codes (no AI PDF). Detail metadata made track-aware (dropped hardcoded "3-month S/4HANA"). Build verified — `/career-paths/[code]` prerenders 5 paths.

### Cohort banner + testimonials + brochures
- Banner date 15 → **30 June 2026** (Tuesday); `DISMISS_KEY` bumped `-2`→`-3` (re-shows for all); `e2e/support/fixtures.ts` seed updated to `-3` to keep tests' banner-suppression working.
- Testimonials → real alumni: **Poonam Parihar** (FICO · Capgemini), **Piyush Srivastava** (MM · Tech Mahindra), **Ankur Srivastava** (ABAP · HCL Technologies); photos `public/spanbix/<slug>.jpeg`; surfaces Outcomes / Certification / `/sap-course` reviews.
- SAP brochures: `public/brochures/<code>-course-outline.pdf` + download buttons on `/career-paths/[code]` and `/sap-course`.

---

*End of master context. All operational decisions trace back to this file.*
</content>
</invoke>