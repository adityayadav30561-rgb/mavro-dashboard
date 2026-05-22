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

*End of roadmap.*
</content>
</invoke>