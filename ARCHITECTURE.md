# Mavro Platform — Architecture Reference

**Companion to:** [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
**Scope:** frontend layout · backend layout · data flow · request lifecycle · API surface

---

## 1. Repository Layout

```
custombackend/
├── src/                         # backend (Express + Mongoose)
│   ├── app.js                   # express app composition
│   ├── server.js                # boot entrypoint
│   ├── config/                  # env config aggregator
│   ├── controllers/             # request handlers
│   │   ├── authController.js
│   │   ├── blogController.js
│   │   ├── leadController.js
│   │   ├── websiteController.js
│   │   ├── seoController.js
│   │   └── analyticsController.js
│   ├── models/                  # mongoose schemas
│   │   ├── AdminUser.js
│   │   ├── Website.js
│   │   ├── Blog.js
│   │   ├── Lead.js
│   │   ├── SeoMetadata.js
│   │   └── AnalyticsEvent.js
│   ├── routes/                  # express routers
│   │   ├── authRoutes.js
│   │   ├── blogRoutes.js
│   │   ├── leadRoutes.js
│   │   ├── websiteRoutes.js
│   │   ├── seoRoutes.js
│   │   ├── sitemapRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── index.js             # barrel
│   ├── middleware/
│   │   ├── auth.js              # protect + authorize
│   │   ├── validators.js        # express-validator rule sets
│   │   ├── spamProtection.js    # 6-layer lead spam pipeline
│   │   ├── errorHandler.js
│   │   ├── websiteContext.js    # tenant resolution (future)
│   │   ├── websiteFilter.js     # auto-scope queries (future)
│   │   └── index.js
│   ├── services/
│   │   ├── sitemapService.js    # XML generation + stats
│   │   ├── indexingService.js   # Google IndexingAPI
│   │   ├── pingService.js       # Google/Bing pings
│   │   ├── schemaService.js     # JSON-LD generation
│   │   ├── analyticsService.js  # aggregation pipelines (+ behavior intelligence: returning, page-conversion, page-bounce)
│   │   ├── anomalyService.js    # 7 pure-function anomaly detectors
│   │   └── index.js
│   └── utils/
│       ├── ApiResponse.js
│       ├── asyncHandler.js
│       ├── paginate.js
│       └── debugAnalytics.js    # one-off diagnostic CLI
└── client/                      # frontend (React + Vite)
    ├── vite.config.js           # build-target switch (VITE_BUILD_TARGET) + devTargetHtmlPlugin + dev proxy
    ├── vercel.json               # Phase 5.4 — SPA fallback (negative-lookahead) + sitemap/robots backend proxy + cache + security headers
    ├── index.spanbix.html        # Phase 5.4 — standalone Spanbix entry HTML (promoted to index.html at build by closeBundle plugin)
    ├── .env.example              # VITE_API_BASE_URL + VITE_BUILD_TARGET contract
    ├── tailwind.config.js
    ├── index.html               # no-flash theme bootstrap
    └── src/
        ├── App.jsx              # route registry
        ├── main.jsx             # providers + root
        ├── index.css            # token system + layered light/dark
        ├── api/                 # axios clients
        │   ├── axios.js         # /api authed client
        │   ├── public.js        # no-auth axios for public sites
        │   ├── auth.js
        │   ├── blogs.js
        │   ├── leads.js
        │   ├── websites.js
        │   ├── seo.js
        │   └── analytics.js
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── ThemeContext.jsx
        │   └── TenantContext.jsx       # global tenant scope (dashboard switcher)
        ├── hooks/
        │   ├── useSEO.js
        │   └── useTrackPageView.js
        ├── lib/
        │   ├── utils.js         # cn() class merge
        │   ├── analytics.js     # client tracking lib
        │   ├── seoHealth.js     # weighted SEO engine
        │   ├── seoReadability.js
        │   ├── hrmsSeo.js       # HRMS site SEO constants + LD builders
        │   ├── ticketsSeo.js
        │   └── analyticsCopy.js  # METRIC_INFO registry — 18 contextual help definitions
        ├── components/
        │   ├── ui/              # shadcn primitives
        │   ├── cyber/           # premium operational primitives
        │   │   ├── GlassCard.jsx
        │   │   ├── MetricOrb.jsx
        │   │   ├── InsightWidget.jsx
        │   │   └── ActivityRail.jsx
        │   ├── layout/          # admin shell
        │   │   ├── DashboardLayout.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── Topbar.jsx
        │   ├── hrms/            # HRMS public site components
        │   │   ├── HrmsLayout.jsx
        │   │   ├── CommandNavbar.jsx
        │   │   ├── Hero.jsx
        │   │   ├── Modules.jsx
        │   │   ├── Analytics.jsx
        │   │   ├── ContactForm.jsx
        │   │   ├── BlogPreview.jsx
        │   │   ├── ScrollProgress.jsx
        │   │   ├── AmbientGlowLayer.jsx
        │   │   ├── AnimatedGridBackground.jsx
        │   │   ├── GlassSurface.jsx
        │   │   ├── EditorialSection.jsx
        │   │   ├── ModuleShowcaseCard.jsx
        │   │   ├── FloatingAnalyticsPanel.jsx
        │   │   ├── ActivityTimeline.jsx
        │   │   ├── WorkforceMetricCard.jsx
        │   │   └── ...
        │   ├── tickets/         # Tickets public site components
        │   │   ├── TicketsLayout.jsx
        │   │   ├── OperationsNavbar.jsx
        │   │   ├── Hero.jsx
        │   │   ├── SLATimerPanel.jsx
        │   │   ├── SLASection.jsx
        │   │   ├── WorkflowVisualizer.jsx
        │   │   ├── Modules.jsx
        │   │   ├── Analytics.jsx
        │   │   ├── Collaboration.jsx
        │   │   ├── Security.jsx
        │   │   ├── ContactForm.jsx
        │   │   ├── BlogPreview.jsx
        │   │   ├── FloatingIncidentFeed.jsx
        │   │   ├── TicketMetricOrb.jsx
        │   │   └── ...
        │   └── spanbix/         # Spanbix public site components
        │       ├── SpanbixLayout.jsx          # wraps every /spanbix/* route; carries `.spanbix-scope`; no top padding (heroes own clearance)
        │       ├── Navbar.jsx                 # transparent → scrolled-navy (Phase 5.6 redesign)
        │       ├── Footer.jsx                 # 5-column footer + social tiles (Phase 5.6 redesign)
        │       ├── Section.jsx                # legacy tone-aware section wrapper (still used by some sub-flows)
        │       ├── PageHero.jsx               # legacy navy hero (used by older subpages during transition)
        │       ├── Hero.jsx                   # legacy homepage hero (no longer wired — replaced by redesign/Hero.jsx)
        │       ├── { MarketValidation,WhySap,CareerPaths,IndustryExperts,LearningExperience,DemoClasses,PlacementSupport,CampusPrograms,CampusCoursesCatalog,SuccessStories,Certifications,FinalCta,ContactForm }.jsx
        │       │       # legacy v1 sections — kept for backward-compat; new homepage uses redesign/* instead
        │       └── redesign/    # Phase 5.6 editorial magazine design system
        │           ├── Arrow.jsx                  # shared Arrow + PlayIcon SVGs
        │           ├── CohortCard.jsx             # glassmorphic live-cohort snapshot (hero floating card)
        │           ├── Hero.jsx                   # homepage hero with background video + gradient stack
        │           ├── PageHero.jsx               # magazine-style subpage hero (eyebrow + serif title + lead + meta + optional photo)
        │           ├── useScrollReveal.js         # mount-only IntersectionObserver for `.sx-reveal` (with 1.6s safety net)
        │           └── sections/                  # 13 redesign sections (all .spanbix-scope-scoped)
        │               ├── HiringPartners.jsx     # logo marquee (PNGs from public/spanbix/partners/, cream-50 bg)
        │               ├── MarketValidation.jsx   # 4-stat grid + photo placeholder
        │               ├── WhySap.jsx             # locked 3×2 reasons grid with editorial photos
        │               ├── Tracks.jsx             # tabbed catalog (Functional 3-col / Technical 1-card / Campus 2-col) — sliding pill via layoutId
        │               ├── Mentors.jsx            # horizontal carousel + hover-overlay "CURRENTLY SHIPPING" description
        │               ├── LearningExperience.jsx # sticky dashboard mockup
        │               ├── Placement.jsx          # 3-step deep navy section
        │               ├── Outcomes.jsx           # before/after CTC cards
        │               ├── Campus.jsx             # institutional layer w/ navy stat panel
        │               ├── Certification.jsx     # full credential mockup
        │               ├── DemoVideos.jsx         # 3 sample-session cards + CTA
        │               ├── FAQ.jsx                # single-open accordion
        │               └── FinalCta.jsx           # closing navy CTA + form (submitPublicLead formId: 'spanbix-final-cta')
        ├── styles/
        │   └── spanbix-redesign.css           # Phase 5.6 design system (scoped to .spanbix-scope only)
        ├── SpanbixApp.jsx                   # Phase 5.4 standalone-Spanbix routing tree (root-mounted)
        ├── entries/
        │   └── spanbix.jsx                  # Phase 5.4 standalone entry — BrowserRouter + ThemeProvider + Toaster only
        ├── lib/
        │   ├── apiBase.js                   # Phase 5.3 apiPath() — VITE_API_BASE_URL resolution
        │   ├── routeBase.js                 # Phase 5.4 withSpanbixBase() — build-target-aware URL prefix
        │   └── spanbixSeo.js                # Spanbix SEO + brand tokens + JSON-LD builders + 4-track catalog
        ├── public/
        │   └── spanbix/
        │       ├── spanbix-white.png        # navy-bg variant (Navbar + Footer)
        │       └── spanbix-blue.png         # light-bg variant (favicon + OG + JSON-LD)
        ├── components/blog-editor/    # Editor Cockpit primitives
        │   ├── LiveSeoEngine.js       # pure live audit wrapper around seoHealth
        │   ├── SeoAssistantPanel.jsx  # sticky right-side cockpit composer
        │   ├── SeoScoreRing.jsx       # animated radial gauge
        │   ├── FocusKeywordCard.jsx   # keyword input + placement matrix
        │   ├── SeoChecklist.jsx       # task-based checklist with progress
        │   └── CockpitCards.jsx       # 7 cards: Content/Structure/Metadata/Readability/Links/Media/IssueFeed
        ├── components/analytics/      # Analytics Intelligence primitives
        │   ├── AnalyticsFilters.jsx   # range pills + website select + refresh + live badge
        │   ├── AnalyticsOverview.jsx  # 8-tile KPI grid with TrendPills
        │   ├── TrafficTimeline.jsx    # Recharts AreaChart of views/sessions/submits
        │   ├── ConversionFunnels.jsx  # 3-stage session funnel
        │   ├── TenantComparison.jsx   # per-tenant rollup cards
        │   ├── RealtimeEventFeed.jsx  # live stream, polled 15s
        │   ├── ContentPerformance.jsx # sortable table with stale flag
        │   ├── TrafficIntelligence.jsx# 3-up: landing/exit/top-blogs
        │   ├── SeoTelemetry.jsx       # cross-corpus SEO audit gauge
        │   ├── OperationalInsights.jsx# narrative observation generator
        │   ├── AnomalyAlerts.jsx      # severity-tagged anomaly UI (Phase 2.0)
        │   ├── BehaviorIntelligence.jsx # best-converting + highest-bounce pages (Phase 2.0)
        │   └── InfoPopover.jsx        # reusable contextual-help popover (portaled, hover/tap/keyboard)
        └── pages/
            ├── Dashboard.jsx     # admin command center (tenant-scoped via TenantContext)
            ├── Login.jsx
            ├── NotFound.jsx
            ├── SeoEngine.jsx
            ├── Analytics.jsx     # Analytics Intelligence page
            ├── blogs/{BlogList,BlogForm}.jsx  # BlogForm = Editor Cockpit
            ├── leads/LeadList.jsx
            ├── websites/WebsiteList.jsx
            ├── hrms/{HrmsLanding,HrmsBlogList,HrmsBlogDetail}.jsx
            ├── tickets/{TicketsLanding,TicketsBlogList,TicketsBlogDetail}.jsx
            └── spanbix/                       # Phase 5 Spanbix routes
                ├── SpanbixLanding.jsx         # /spanbix
                ├── SpanbixCourses.jsx         # /spanbix/courses
                ├── SpanbixCareerPaths.jsx     # /spanbix/career-paths (Udemy-style listing)
                ├── SpanbixCourseDetail.jsx    # /spanbix/career-paths/:code (Individual / Campus pill toggle)
                ├── SpanbixCampusPrograms.jsx  # /spanbix/campus-programs
                ├── SpanbixPlacements.jsx      # /spanbix/placements
                ├── SpanbixDemoClasses.jsx     # /spanbix/demo-classes
                ├── SpanbixAbout.jsx           # /spanbix/about
                ├── SpanbixContact.jsx         # /spanbix/contact
                ├── SpanbixBlogList.jsx        # /spanbix/blog
                └── SpanbixBlogDetail.jsx      # /spanbix/blog/:slug
```

---

## 2. Backend Architecture

### 2.1 Request Lifecycle

```
HTTP request
   ↓
Helmet (security headers)
   ↓
CORS (whitelist: localhost:5173/5174)
   ↓
Compression
   ↓
Morgan (logging)
   ↓
Rate limiters:
   - apiLimiter (global, /api/*, skipped in dev, skips /api/health + /api/analytics/track)
   - authLimiter (/api/auth/login, skipped in dev)
   - leadSubmitLimiter (10/15min/IP on /api/leads/submit)
   - trackLimiter (60/min/IP on /api/analytics/track)
   ↓
Body parser (10mb JSON + URL-encoded, text/plain for beacon)
   ↓
Router dispatch:
   /api/auth/*       → authRoutes
   /api/websites/*   → websiteRoutes (public /public/:slug, rest protected)
   /api/blogs/*      → blogRoutes (public /website/:slug, rest protected)
   /api/leads/*      → leadRoutes (public /submit, rest protected)
   /api/seo/*        → seoRoutes
   /api/analytics/*  → analyticsRoutes (public /track, rest protected)
   /sitemap/*        → sitemapRoutes (public XML + protected stats/ping)
   /robots/:slug.txt → inline handler in app.js
   ↓
protect middleware (JWT verify on protected routes)
   ↓
authorize middleware (role check where required)
   ↓
validate middleware (express-validator rule set)
   ↓
controller → service → mongoose model → MongoDB Atlas
   ↓
ApiResponse.success / .error / .paginated / .notFound
   ↓
errorHandler (catch-all)
```

### 2.2 Service Boundaries

| Service | Owns | Used by |
|---|---|---|
| `sitemapService` | XML generation, URL counts | `sitemapRoutes`, `seoController` |
| `indexingService` | Google IndexingAPI calls | `blogController` (on publish), `blogRoutes /:id/index` |
| `pingService` | Google + Bing ping pipeline | `sitemapRoutes /ping/:slug` |
| `schemaService` | JSON-LD builders | `seoController.getBlogSchema` |
| `analyticsService` | aggregation pipelines + behavior intelligence (returning, page-conversion, page-bounce) | `analyticsController` |
| `anomalyService` | 7 pure-function anomaly detectors orchestrated by `getAnomalies()` | `analyticsController.getAnomalies` |
| `scheduledPublishService` | 60s-poll worker that auto-publishes blogs whose `scheduledAt <= now`. Atomic `findOneAndUpdate` flip prevents races. Started in `server.js`, stopped on SIGTERM/SIGINT. | `server.js` startup |
| `analyticsService.getBlogTrends` | per-blog current vs previous-window view/session deltas — drives the Content Decay engine | `analyticsController.getBlogTrends` |
| `ai/AIProviderService` (Phase 4.0) | feature-routed AI orchestration: registry-resolved model chain → `BaseProvider` subclass → retries / backoff / quota-aware fallover / structured logging | `aiController` (health, test, model-test, route-test), `ai/titleService`, `ai/metaService` |
| `ai/titleService` | 7-category blog title suggestion pipeline. Prompt builder + JSON parser + banned-phrase + length filters. | `aiController.generateBlogTitles` |
| `ai/metaService` | 7-category meta description suggestion pipeline. Same architecture as titleService — different prompt + length rules (110-170 chars). | `aiController.generateBlogMetaDescriptions` |
| `ai/faqService` (Phase 4.0) | AI FAQ generation with deterministic dedupe against existing questions, banned-phrase filter, word-count bands. | `aiController.generateBlogFaqs` |
| `ai/siteIntelligenceService` (Phase 4.0) | Site-wide AI SEO command. Fetches tenant corpus, computes deterministic summary, builds prompt with sample blogs + headings + deterministic signals, calls AI for strategic interpretation. | `aiController.generateSiteIntelligence` |
| `ai/tenantResolver` (Phase 4.0.1) | Shared lookup. Fetches `slug name description aiContext seoDefaults` from `Website` by ObjectId or slug. Returns `{ slug, name, doc }` for every AI controller. Single source of truth — controllers never call `Website.findById` for AI prompts directly. | All AI controllers |
| `ai/promptBuilders/tenantContext` (Phase 4.0.1) | Pure function `renderTenantBrief(websiteDoc)`. Builds the per-tenant AI brief dynamically from `Website.aiContext` → derived from `description` + `seoDefaults.keywords` + `name` → generic B2B fallback. **Zero hardcoded tenant maps.** New tenants scale automatically. | All 4 AI prompt builders |

### 2.3 Critical Invariants

- `Website.slug` is auto-generated from `name` via slugify pre-validate hook
- `Blog.publishedAt` is set when status transitions to `published`
- Lead spam pipeline runs 6 layers (`spamProtection.js`): rate limit → honeypot → time-trap → field validation → text heuristics → score → optional auto-flag
- Analytics ingestion drops UA-detected bots silently (returns `{recorded:false, reason:'bot'}`)
- Cascade delete (`deleteWebsite`) removes all dependent `Blog`, `Lead`, `AnalyticsEvent` rows
- `Blog.status` (publish state) and `Blog.editorialStatus` (5-col Kanban) are KEPT IN SYNC by `updateWorkflowStatus` bridge — moving Kanban away from `published` automatically unpublishes the post; moving to `scheduled` auto-defaults `scheduledAt` to +24h when missing; `archived` is hidden from Kanban
- `Campaign.targetWebsite` is immutable post-create (preserves tenant isolation); `assignBlogs` endpoint tenant-scopes via `{targetWebsite: campaign.targetWebsite}` filter
- `Blog.activityLog[]` capped at 200 entries (LRU-style trim in `logActivity` helper) to prevent unbounded growth
- **AI provider keys are backend-only.** Frontend talks only to `/api/ai/*` JWT-protected routes; the orchestrator picks the model from the registry. Adding a new provider = `BaseProvider` subclass + registry entry, zero consumer changes.
- **AI fallover is silent + observable.** `AIProviderService.generateText` walks the chain on quota / timeout / empty-completion and emits structured `fallover` log entries. Editor consumers see one successful response — they don't know whether GPT-OSS or Gemini answered. The `provider` + `model` + `registryId` fields are surfaced in the response payload for the cockpit UI footer only.
- **AI never scores SEO.** Deterministic `seoHealth.auditBlog()` remains the canonical SEO score. Per-suggestion AI quality bundles in `titleQuality.js` + `metaQuality.js` are advisory only — they let editors compare AI options BEFORE Apply. After Apply, `LiveSeoEngine` recalculates against form state.
- **No hardcoded tenant maps anywhere.** The AI layer reads tenant context dynamically from the `Website` document (`aiContext` block + `description` + `seoDefaults.keywords`) via `renderTenantBrief()`. Adding a new tenant = new `Website` row, no code change. Reintroducing a `TENANT_BRIEFS = {...}` constant is a regression.

---

## 3. Frontend Architecture

### 3.1 Provider Tree

```
<BrowserRouter>
  <ThemeProvider>        # dark/light toggle, no-flash bootstrap
    <AuthProvider>       # JWT user state, login/logout
      <App>              # route registry
        <Routes>
          public marketing → HrmsLanding / TicketsLanding (lazy via lib/ tenant constants)
          /login → Login
          ProtectedRoute → DashboardLayout
            <Sidebar /> <Topbar /> <Outlet>
              Dashboard / BlogList / BlogForm / LeadList / WebsiteList / SeoEngine
            </Outlet>
        </Routes>
      </App>
      <Toaster />
    </AuthProvider>
  </ThemeProvider>
</BrowserRouter>
```

### 3.2 API Clients

- **`api/axios.js`** — authed client, baseURL `/api`. Injects JWT. 401 interceptor clears localStorage + redirects to `/login`.
- **`api/public.js`** — separate axios instance, no auth, no interceptors. Used by HRMS + Tickets sites.
- **`api/seo.js`** — mixes both: `getSeoStats` uses authed client; `getSitemapStats` uses a root-baseURL axios since sitemap routes live outside `/api`.

### 3.3 Tenant-Aware Tracking

`lib/analytics.js` holds module-level `currentTenant` slug. Layouts (`HrmsLayout`, `TicketsLayout`) call `setAnalyticsTenant(slug)` at module load + in `useEffect`. All `trackPageView/trackBlogView/trackCtaClick/trackFormSubmit` reads `currentTenant` unless explicit slug passed.

### 3.4 Theme System

Single token system in `index.css`:
- `:root` → light pastel tokens + `color-scheme: light`
- `.dark` → graphite tokens (preserved exactly) + `color-scheme: dark`
- Body uses `bg-background text-foreground` — flips automatically
- Light-mode `:where(html:not(.dark))` repaint layer maps `text-white/*`, `bg-white/[0.0X]`, `border-white/*`, `text-violet-300`, etc. to semantic light tokens so dark-only utility classes stay legible

Bootstrap script in `index.html` sets `.dark` class before React mounts to prevent FOUC. Default is dark.

---

## 4. Data Flow Diagrams

### 4.1 Blog Publishing → Indexing

```
Admin clicks Publish in BlogForm.jsx
   ↓
POST /api/blogs (status:'published')
   ↓
blogController.createBlog
   ↓
Blog.create() → mongoose save → publishedAt = now
   ↓
Background: indexingService.submitBlogForIndexing(id)
   ↓
Google IndexingAPI POST → status updated → lastIndexedAt
   ↓
sitemap regen — on-request when /sitemap/<slug>.xml is fetched
   ↓
optional: admin clicks "Ping Engines" in /seo
   ↓
POST /sitemap/ping/<slug>
   ↓
pingService.pingAllEngines(sitemapUrl)
   ↓
Google + Bing notified
```

### 4.2 Public Visit → Analytics → Dashboard

```
Visitor opens /hrms in browser
   ↓
HrmsLayout mounts → setAnalyticsTenant('mavro-hrms') → useTrackPageView()
   ↓
lib/analytics.js trackPageView() → navigator.sendBeacon('/api/analytics/track', payload)
   ↓
Vite proxy → backend
   ↓
trackLimiter (60/min/IP) → beacon body parser (text/plain) → trackEvent controller
   ↓
parseUA() → drops bots → AnalyticsEvent.create({ websiteSlug, eventType, sessionId, ... })
   ↓
Admin opens /
   ↓
Dashboard.jsx fetches /api/analytics/{overview,timeseries,top-pages,breakdown}?range=week
   ↓
analyticsService.getOverview/getTimeseries — $facet aggregation, UTC-aligned $dateTrunc
   ↓
MetricOrb values + Recharts AreaChart + Top Pages list render
```

### 4.3 Public Lead Submission

```
Visitor fills ContactForm.jsx on /hrms or /tickets
   ↓
getPublicWebsite(slug) on mount → websiteId resolved
   ↓
Submit → submitPublicLead({ website:id, name, email, phone, ..., sessionId, formId })
   ↓
POST /api/leads/submit
   ↓
leadSubmitLimiter → spamProtection (6 layers) → leadSubmitRules → submitLead
   ↓
Website.findById verification
   ↓
Lead.create({ ...data, ipAddress, userAgent, statusHistory })
   ↓
emitFormSubmitEvent({ lead, website, req, body })  ← server-authoritative
   ↓
AnalyticsEvent.create({ eventType:'form_submit', sessionId, meta:{leadId,formId,...} })
   ↓
Admin sees: /leads (real lead) + Dashboard form_submit count + lead count match
```

### 4.4 SEO Audit Lifecycle

```
Admin opens /seo
   ↓
SeoEngine.jsx loads
   ↓
getWebsites() → tenant list
   ↓
per-tenant parallel: getBlogs({ targetWebsite, limit:100, includeContent:true })
                   + getSitemapStats(websiteId) (via root-baseURL axios)
   ↓
getSeoStats() global SeoMetadata rollups
   ↓
auditCorpus(scopedBlogs) — useMemo
   ↓
For each blog:
   1. analyzeReadability(html) → Flesch + structural metrics
   2. metadataChecks → 8 SEO field validators
   3. contentChecks → word tiers + headings + paragraphs + images + links
   4. semanticChecks → density, keyword coverage, diversity, sentence variety
   5. structureChecks → lists, formatting, sections, media density
   6. technicalChecks → slug, featured image, orphan SEO, keywords
   7. uxChecks → Flesch bands, sentence length, passive, transitions
   8. freshnessChecks → days since update
   9. corpusDuplicates → title/slug/description collisions
   ↓
categoryScoreFromIssues → per-category 0-100
   ↓
confidenceMultipliers(content_score) — dampen non-content categories
   ↓
weighted = Σ(score × effective_weight / Σ_effective_weights)
   ↓
contentCap(wordCount) — hard ceiling
   ↓
overall = min(cap, weighted) + longFormBonus
   ↓
gradeLetter() + interpretation() bands
   ↓
UI renders: gauge + grade + interpretation pill + category bars + insights panel + critical roster + filterable health list + sortable content intelligence table
```

---

## 4.5 Editorial Operations (Phase 3)

```
                           ┌─────────────────────────┐
   /calendar Kanban drop ──┤ PATCH /:id/workflow      │
                           │  body: { editorialStatus }│
                           └────────────┬─────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
        editorialStatus           workflowStatus              Bridge to
        (5-col Kanban)            (8-col legacy)              status (publish)
        ideas/drafting/             idea/outline/             draft/published/
        review/scheduled/           draft/review/             scheduled/archived
        published                   scheduled/published/      ─────────────────
                                    updating/archived         scheduled → set
                                                              scheduledAt if missing
                                                              archived → status=archived
                                                              [idea|outline|draft|
                                                               review] → status=draft

   scheduledPublishService  ──── polls every 60s ───▶  Blog.find({
                                                          status:'scheduled',
                                                          scheduledAt: {$lte: now}
                                                        }) → atomic flip → published
                                                              → ping search engines
                                                              → log publishHistory[]

   POST /api/blogs/import-docx ─▶ multer (memoryStorage, 10MB)
                                 │
                                 ▼
                       mammoth.convertToHtml (custom styleMap:
                         Heading 1/2/3, Quote, Strong, Emphasis)
                                 │
                                 ▼
                       headingInference.inferHeadingsInHtml
                       (promotes all-bold paragraphs → h2/h3)
                                 │
                                 ▼
                       {html, detectedTitle, wordCount,
                        readingTime, structure:{h1,h2,h3,
                        lists,promoted:{...}}}
```

## 5. API Surface Map

### 5.1 Auth — `/api/auth`
- `POST /login` — public, auth limiter (skipped in dev)
- `GET /me` — protected
- `POST /logout` — protected
- `POST /refresh` — protected (planned)

### 5.2 Websites — `/api/websites`
- `GET /public/:slug` — public lookup (returns `{_id, name, slug, domain, branding, description}`)
- `GET /` — protected list (pagination, search)
- `POST /` — protected create
- `GET /:id` — protected single
- `PUT /:id` — protected update
- `DELETE /:id` — superadmin only, cascade-deletes blogs/leads/analytics
- `POST /_cleanup-demo` — superadmin, supports `{dryRun:true}` body

### 5.3 Blogs — `/api/blogs`
- `GET /website/:slug` — public list per tenant
- `GET /website/:websiteSlug/:blogSlug` — public single
- `GET /` — protected list, supports `?targetWebsite=`, `?status=`, `?search=`, `?includeContent=true`
- `POST /` — protected create
- `GET /:id` — protected single
- `PUT /:id` — protected update
- `DELETE /:id` — protected delete
- `PATCH /:id/status` — status transition
- `PATCH /:id/publish` / `/:id/unpublish`
- `POST /:id/index` — manual Google indexing trigger
- `GET /stats` — aggregates for dashboard
- `POST /bulk` — admin/superadmin bulk ops

### 5.4 Leads — `/api/leads`
- `POST /submit` — public ingestion, lead-submit limiter + 6-layer spam protection
- `POST /` — public ingestion (backward compat)
- `GET /` — protected list, filters
- `GET /stats` — protected
- `GET /export` — admin/superadmin CSV
- `PATCH /mark-spam` — bulk
- `POST /bulk-delete` — superadmin
- `GET /:id` / `PUT /:id` / `DELETE /:id`
- `PATCH /:id/status`

### 5.5 SEO — `/api/seo`
- `GET /page/:websiteSlug/*` — public meta tags
- `GET /schema/blog/:websiteSlug/:blogSlug` — public JSON-LD
- `GET /stats` — protected aggregations
- CRUD `/`, `/:id` — protected SeoMetadata

### 5.6 Analytics — `/api/analytics`
- `POST /track` — public ingestion, dedicated limiter, beacon-friendly body parser
- `GET /overview?range=` — protected, totals + period-over-period deltas
- `GET /timeseries?range=` — protected, bucketed time series
- `GET /top-pages?range=&limit=` — protected
- `GET /recent?limit=` — protected
- `GET /breakdown?range=` — protected, devices + referrers
- `GET /_debug?range=&websiteSlug=` — protected diagnostic

### 5.7 Sitemap & Robots
- `GET /sitemap/index.xml` — master
- `GET /sitemap/:slug.xml` — per-tenant
- `GET /sitemap/stats/:websiteId` — protected URL counts
- `POST /sitemap/ping/:websiteSlug` — protected ping engines
- `GET /robots/:slug.txt` — per-tenant robots

### 5.8 AI Orchestration — `/api/ai` (Phase 4.0)
- `GET /health` — provider configured/connectivity + 8-model registry + 9 routing chains + log stats
- `GET /recent?limit=` — in-process metadata log (no prompt/response bodies)
- `POST /test` — free-form prompt (accepts `feature` for routing)
- `POST /model-test` — direct single-model probe (bypasses routing, used to attribute failures)
- `POST /route-test` — exercise feature chain incl. cross-provider fallover
- `POST /blog/titles` — 7-category title suggestions (`feature: 'titles'`)
- `POST /blog/meta-descriptions` — 7-category meta descriptions (`feature: 'meta_descriptions'`)

Mount order in `app.js`: `aiLimiter` (20/min/IP, prod-only) BEFORE `aiRoutes`. Keys backend-only.

---

## 6. Database Relationships

```
AdminUser ──────────────┐
                        │ author / lastEditedBy
                        ▼
Website ───── slug ─────►  AnalyticsEvent (denormalized for fast scoping)
  ▲              ▲
  │ website      │ targetWebsite
  │              │
  └─ Lead     Blog ──────┐
                         │ (heavy content stripped on list view
                         │  unless ?includeContent=true)
                         ▼
                       sitemap URL generation
                       JSON-LD generation
                       indexing pipeline

SeoMetadata ── website ──► Website   (optional per-page SEO records)
```

Cardinality:
- 1 Website : N Blogs : N Leads : N AnalyticsEvents
- 1 AdminUser : N Blogs (authored)

---

## 7. Performance Considerations

- **Mongoose `.lean()` everywhere reads happen** — avoids hydration cost
- **`select('-content -contentPlainText')`** in blog list — content is heavy HTML
- **TTL index on AnalyticsEvent.timestamp** — 540 days, auto-purges stale rows
- **Compound indexes** on `{websiteSlug, timestamp}` and `{websiteSlug, eventType, timestamp}` for analytics aggregation
- **Vite proxy** in dev avoids CORS for `/api`, `/sitemap`, `/robots`
- **sendBeacon** for analytics ingestion — survives page unload without blocking
- **useMemo** on `auditCorpus()` in `SeoEngine.jsx` — re-runs only when scope or corpus changes
- **Framer Motion `viewport.once: true`** on scroll-triggered reveals — no thrash

---

## 8. Error Handling

- `asyncHandler(fn)` wraps every controller — catches async errors → forwards to `errorHandler`
- `errorHandler` (`src/middleware/errorHandler.js`) — formats Mongoose ValidationErrors, CastErrors, JWT errors, duplicate-key errors uniformly
- Client `axios.js` 401 interceptor — auto-logout
- Analytics ingestion failures swallowed silently — tracking must never break UX
- Server-side `emitFormSubmitEvent` wrapped in try/catch — analytics failure must never block lead creation

---

## 9. Security Considerations

- Helmet enforces security headers (CSP relaxed for inline styles required by Quill)
- CORS whitelisted explicitly to dev ports + future production hostnames via env
- JWT secret loaded from env, never committed
- Bcrypt 12 rounds for password hashing
- Lead submission has 6-layer spam pipeline (rate limit, honeypot, time-trap, regex heuristics, score)
- Analytics ingestion bot-filtered (UA pattern)
- Cascade delete cleans up tenant data — no orphan rows survive
- IP addresses captured at lead + analytics layers (consider hashing for GDPR compliance pre-prod)
- Public endpoints never return JWT-required fields

---

## 10. Adding New Capabilities

**New public marketing site:**
1. Create `Website` row (admin UI)
2. Create `client/src/lib/<slug>Seo.js` with constants + LD builders
3. Create `client/src/components/<slug>/` directory (Layout, Navbar, Hero, sections, ContactForm)
4. Create `client/src/pages/<slug>/{Landing,BlogList,BlogDetail}.jsx`
5. Register routes in `App.jsx`
6. Layout calls `setAnalyticsTenant(slug)` on mount

**New analytics event type:**
1. Add to `AnalyticsEvent` enum
2. Add corresponding `track*` helper in `lib/analytics.js`
3. Add to `analyticsService` aggregation pipelines (or rely on existing `$group _id: '$eventType'`)
4. Add to Dashboard tiles + Timeseries chart legend

**New SEO check:**
1. Add issue code + penalty in `seoHealth.js` under appropriate category function
2. Penalty subtracts from category score
3. Confidence multipliers apply automatically
4. Content cap and grade letter recompute automatically

---

## Phase 5.8 — Spanbix Tone Pass + Lead Schema Flexibility (May 26, 2026)

### Lead pipeline (cross-tenant)
```
Lead (mongoose)
  ├─ existing fields (name/email/phone/company/message/status/...)
  ├─ formId                  # NEW · indexed · max 100 chars
  └─ customFields            # NEW · Schema.Types.Mixed · default {}

leadController.js
  ├─ ALLOWED_SUBMIT_FIELDS now includes formId + customFields
  └─ sanitizeCustomFields()  # NEW · cap keys 60ch · values 1000ch · arrays 20
                             #     drop functions + nested objects
                             #     called before Lead.create() inside submitLead

LeadList.jsx (admin)
  └─ Modal renders Object.entries(customFields) as a labeled grid
                             + Form row showing formId
                             + message gets whitespace-pre-wrap
```

### Spanbix frontend component tree changes
```
client/src/lib/spanbixSeo.js
  ├─ SPANBIX_MENTORS              # NEW · 4 real mentors with photos
  │                                #     · imported by Mentors.jsx + MentorCarousel
  ├─ SPANBIX_CAREER_PATHS
  │  ├─ duration: '3 months'      # unified across all 4 tracks
  │  ├─ whatYoullLearn[]          # 5 bullets/track · personality dev added · C_TS bullets dropped
  │  └─ includes[]                # 5 bullets/track · hours/labs counts dropped
  └─ SPANBIX_CAMPUS_PROGRAM.highlights — `Individual guidance even in group class` etc.

client/src/components/spanbix/redesign/
  ├─ CohortCard.jsx               # toned · MODULES + MENTORS:4 + DURATION:3 mo (only)
  ├─ Hero.jsx                     # CTA #2 → /contact (Book Consultation)
  ├─ Mentors.jsx                  # imports SPANBIX_MENTORS · faculty rotation line dropped
  └─ sections/
     ├─ MarketValidation.jsx      # props-driven (eyebrow/title/lead/stats/sources/image/...)
     ├─ Campus.jsx                # props-driven (tone: navy|paper · showCtaStrip)
     ├─ LearningExperience.jsx    # lucide icon tiles · feature 03 = Live first, then on-demand
     ├─ Certification.jsx         # 3 points · BadgeCheck/QrCode/Target icons · QR mockup stripped
     ├─ Outcomes.jsx              # horizontal carousel · real alumni photos
     ├─ Tracks.jsx                # 4-bullet card incl. personality dev (citron marker highlight)
     ├─ WhySap.jsx                # real images · 01·REASON micro-labels dropped
     ├─ FAQ.jsx                   # 6 toned items · ERP framing
     └─ FinalCta.jsx              # copy + 2 CTAs only · form removed

client/src/pages/spanbix/
  ├─ SpanbixLanding.jsx           # Certification + DemoVideos sections dropped from flow
  ├─ SpanbixCourses.jsx           # hero meta retoned (no placed-CTC / placement count)
  ├─ SpanbixCareerPaths.jsx       # Full Catalog flat table removed · Tracks + Mentors only
  ├─ SpanbixCourseDetail.jsx      # MentorCarousel introduced (left col)
  │                                # · pricing display removed (Enrol Now → /contact)
  │                                # · timeline reads block.meta + block.title (was crash)
  │                                # · per-module 4-bullet topics dropped (general flow)
  │                                # · responsive grid stacks on mobile
  ├─ SpanbixCampusPrograms.jsx    # 5 rollout steps → 4 · icon tiles · Campus tone=paper
  ├─ SpanbixAbout.jsx             # Operating Principles section removed
  │                                # · MarketValidation override = Founder Story + lalit.png
  └─ SpanbixContact.jsx           # 2-col form (navy aside 30% / white form 70%)
                                   # · Google Maps iframe · phone +91 9211429011
                                   # · Audience lanes get "Start The Conversation" CTAs

client/src/components/spanbix/
  ├─ Navbar.jsx                   # glassmorphic cream bg · blue logo (no pill)
  ├─ Footer.jsx                   # blue logo wrapped in white pill
  │                                # · Demo Library + Placements links removed
  │                                # · track links use bare codes (fico/mm/sd/abap)
  └─ SpanbixLayout.jsx            # pt-16 sm:pt-20 md:pt-24 lg:pt-24 restored on <main>

Routes (App.jsx + SpanbixApp.jsx)
  ├─ /spanbix/demo-classes        # REMOVED
  ├─ /spanbix/placements          # REMOVED
  └─ /spanbix/career-paths/:code  # render fix · MentorCarousel + general timeline
```

### Vercel deploy topology
```
Vercel Project: Spanbix (custom domain spanbix.com attachable)
  └─ UI Build Command: npm run build:spanbix
     ▼
client/vercel.json (shared with Admin project)
  ├─ rewrite /sitemap.xml → render-backend/sitemap/spanbix.xml
  ├─ rewrite /robots.txt  → render-backend/robots/spanbix.txt
  └─ SPA fallback (last in rewrites[])

Vercel Project: Admin Dashboard
  └─ UI Build Command: npm run build
     ▼
Same client/vercel.json — sitemap proxies dead-weight on admin domain

Backend on Render (mavro-dashboard.onrender.com)
  └─ CORS allowlist in src/app.js must include every Vercel domain + custom domain
```

---

*End of architecture reference.*
</content>
</invoke>