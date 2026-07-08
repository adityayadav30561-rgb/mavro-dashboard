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

## Phase 6 — Spanbix SSR migration: `spanbix-web/` Next.js sub-app (May 27–29, 2026)

The Spanbix public surface moved off the Vite admin bundle onto a standalone **Next.js 16 App Router** app at `spanbix-web/`. Mavro admin (Vite) is unchanged; HRMS + Tickets stay on the Vite bundle. The Next sub-app talks to the same Express backend on Render.

### Repository layout — `spanbix-web/`

```
spanbix-web/
├── next.config.mjs              # headers() — security headers + HSTS preload
│                                 # redirects() — legacy /spanbix/* → / (308, page paths only)
│                                 # poweredByHeader: false
├── package.json                 # Next 16.2.6, React 19, lucide-react 1.16, tailwindcss 4
├── tailwind.config.js
├── postcss.config.mjs
├── jsconfig.json
├── .env                         # NEXT_PUBLIC_API_BASE_URL + REVALIDATE_SECRET (server-only)
├── public/spanbix/              # asset namespace (matches /spanbix/* URLs from legacy era)
│   ├── herosection-video.mp4
│   ├── spanbix-blue.png         # blue logo (light surfaces, favicon, OG, JSON-LD)
│   ├── spanbix-white.png        # white logo (navy surfaces — Navbar + Footer)
│   ├── partners/<12 brand PNGs>
│   └── …
└── src/
    ├── proxy.js                 # Next 16 Proxy (formerly middleware.js)
    │                              apex → www explicit 301
    │                              matcher excludes _next, static assets, /spanbix/, /sitemap.xml, /robots.txt
    ├── app/
    │   ├── layout.js            # next/font (Instrument Serif, Geist, JetBrains Mono, DM Serif, Sora)
    │   │                          metadataBase = https://www.spanbix.com
    │   │                          body className="spanbix-scope"
    │   ├── globals.css
    │   ├── page.jsx             # homepage — Server Component
    │   ├── courses/page.jsx
    │   ├── career-paths/page.jsx
    │   ├── career-paths/[code]/page.jsx          # generateStaticParams over SPANBIX_CAREER_PATHS
    │   ├── career-paths/[code]/CourseDetailView.jsx   # 'use client' island (Individual/Campus toggle)
    │   ├── campus-programs/page.jsx
    │   ├── about/page.jsx
    │   ├── contact/page.jsx
    │   ├── contact/ContactForm.jsx               # 'use client' island
    │   ├── blog/page.jsx                         # blog index, revalidate: 300
    │   ├── blog/[slug]/page.jsx                  # generateStaticParams + ISR + AuthorByline
    │   ├── api/revalidate/route.js               # POST + secret → revalidatePath('/blog', '/blog/<slug>', '/sitemap.xml', '/robots.txt')
    │   ├── sitemap.xml/route.js                  # proxies backend, revalidate: 300
    │   └── robots.txt/route.js                   # proxies backend, revalidate: 3600
    ├── components/
    │   ├── spanbix/
    │   │   ├── SpanbixLayout.jsx                 # main wrapper
    │   │   ├── Navbar.jsx                        # 'use client'
    │   │   ├── Footer.jsx
    │   │   └── redesign/                         # ported verbatim from client/src/components/spanbix/redesign/
    │   │       ├── Hero.jsx                      # background video Hero
    │   │       ├── PageHero.jsx
    │   │       ├── Section.jsx
    │   │       └── sections/                     # HiringPartners, MarketValidation, WhySap, Tracks, Mentors,
    │   │                                         # LearningExperience, Placement, Outcomes, Campus,
    │   │                                         # Certification, FAQ, FinalCta, …
    │   └── JsonLd.jsx                            # <script type="application/ld+json"> emitter
    ├── lib/
    │   ├── spanbixSeo.js                         # SPANBIX_SITE, SPANBIX_MENTORS, SPANBIX_CAREER_PATHS,
    │   │                                         # JSON-LD builders (blogPostingLd, breadcrumbLd, …)
    │   ├── seoMeta.js                            # buildMetadata() — shape for Next Metadata
    │   ├── blogApi.js                            # fetchBlogDetail + fetchAllBlogSlugs
    │   └── apiBase.js                            # NEXT_PUBLIC_API_BASE_URL resolver
    └── styles/
        └── spanbix-redesign.css                  # design system, scoped to .spanbix-scope
```

### Request lifecycle on `spanbix-web/`

```
GET https://spanbix.com/career-paths/fico         (anything)
                       ▼
Cloudflare edge        ─ 301 → https://www.spanbix.com/career-paths/fico

GET https://www.spanbix.com/career-paths/fico
                       ▼
Vercel CDN             ─ matched: static? serve from cache. dynamic? handle on origin.
                       ▼
spanbix-web/src/proxy.js
  host === 'spanbix.com' ? NextResponse.redirect(301)  ← belt-and-braces (Cloudflare normally handles first)
  : NextResponse.next()
                       ▼
Next 16 App Router
  ▸ generateMetadata({ params }) → <title>, <meta>, <link rel=canonical>
  ▸ Page Server Component:
      const { blog } = await fetchBlogDetail(slug)   // fetch(backend, { next: { revalidate: 300 } })
      return <Layout>…<article dangerouslySetInnerHTML={{__html: blog.content}}/>…<AuthorByline/>…</Layout>
  ▸ JsonLd component emits BreadcrumbList + BlogPosting (with enriched Person schema)
                       ▼
Response HTML          ─ headers() injected by next.config.mjs:
                         Content-Security-Policy, Strict-Transport-Security (preload),
                         X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
```

### Publish → revalidate flow

```
Editor clicks Publish in /blogs/:id/edit (admin Vite on Vercel)
       │
       ▼ axios PATCH /api/blogs/:id/publish
Render backend (Express)
       ▼
blogController.publishBlog
       │ (Phase 6.2)
       ▼ fire-and-forget
services/revalidateService.revalidateBlog(slug)
       │
       ▼ POST https://www.spanbix.com/api/revalidate
       │  { slug: "...", secret: process.env.REVALIDATE_SECRET }
       ▼
spanbix-web /api/revalidate/route.js
       ▼ revalidatePath('/blog')
         revalidatePath('/blog/' + slug)
         revalidatePath('/sitemap.xml')
         revalidatePath('/robots.txt')
       ▼
Next ISR cache       ─ next request to any of those paths fetches fresh upstream
                       (backend sitemap regenerates per request, no backend cache)
```

Other publish paths wire the same call: `blogController.updateWorkflowStatus` (when the `becamePublished` flag is set) and `scheduledPublishService` (the cron-driven worker). The endpoint is secret-gated (401 on wrong secret) and tenant-agnostic — it cheerfully revalidates any blog slug, harmless for non-Spanbix slugs.

### Phase 6 critical invariants (Spanbix-specific)

- **Canonical host is `https://www.spanbix.com`.** Apex 301s to www at Cloudflare AND at the app layer (`spanbix-web/src/proxy.js`). Never reintroduce a www-side redirect — the May 28 redirect-loop incident was caused by Vercel doing www → apex while Cloudflare did apex → www.
- **`Website.domain` is the single source of truth** for sitemap + robots URLs (backend `sitemapService.buildBaseUrl(domain)`). Migrating the canonical host = update this field. `seedSpanbix.js → LEGACY_DOMAINS` migration normalises before comparing so scheme + trailing slash + casing variants all collapse to the canonical value.
- **Marketing pages live in `SeoMetadata` rows**, seeded by `seedSpanbix.js → upsertSpanbixStaticPages()`. Adding a new marketing page = add an entry to `SPANBIX_STATIC_PAGES`; on next boot the seeder upserts it idempotently (`$setOnInsert`, so admin tweaks survive).
- **Author byline reads from the populated `Blog.author` doc** — never hardcoded. `blogController.getPublicBlog` populates `name avatar bio linkedinUrl jobTitle`; `blogPostingLd` emits `@type: Person` with every conditional field; `AuthorByline` renders the matching block below the article.
- **`/api/revalidate` is the only on-demand cache-bust** for spanbix-web ISR. Every backend publish hits it; it busts blog routes AND `/sitemap.xml` + `/robots.txt`. Do not duplicate this logic elsewhere.
- **proxy.js, not middleware.js** — Next 16 renamed the file convention. File is `src/proxy.js`, exported function is `proxy(request)`. Vercel deploys fail with `Proxy is missing expected function export name` if either is wrong.
- **CSP `'unsafe-inline' 'unsafe-eval'` remain on `script-src`** until a nonce-based CSP is wired. Removing them today breaks Next runtime + framer-motion + Vercel analytics.
- **Apex in Vercel Domains must point DIRECTLY at the app**, not redirect to www via the Vercel UI toggle. If Vercel handles apex → www at the edge with a 308, our explicit 301 in proxy.js never fires.
- **Admin Vite + HRMS + Tickets are NOT migrated.** They stay on the Vite bundle. The architectural blueprint at `spanbix-web/` is the reference if/when HRMS or Tickets needs the same SEO treatment.

---

## Phase 10 — Google data layer (`src/services/google/`) + MBR module (July 7, 2026)

New backend layer for read-only Google integrations, consumed by the `/mbr` admin page:

```
src/services/google/
├── googleAuth.js   # Zero-dep service-account OAuth: RS256 JWT via node:crypto →
│                   # token exchange, in-memory cache to expiry. Parses
│                   # GOOGLE_SERVICE_ACCOUNT_JSON (raw or base64). Exposes
│                   # isConfigured() + googleApiFetch(url, {method, body}).
├── ga4Service.js   # GA4 Data API v1beta batchRunReports (5 reports/call, 12 total).
│                   # Two dateRanges per request → MoM deltas in one round-trip.
│                   # AI-referral regex filter on sessionSource. GA4_PROPERTY_ID env.
└── gscService.js   # Search Console searchAnalytics.query — totals/trend/queries/pages.
                    # GSC_SITE_URL env (must match verified property exactly).
```

- Routes: `/api/mbr/{status,ga4,gsc,buttons}` (`mbrRoutes.js`, JWT-protected). `buttons` aggregates own `AnalyticsEvent.meta` for per-button/per-location clicks — no Google dependency.
- `mbrController` owns range resolution (month clamped like-for-like vs custom same-length-previous) and a 1h in-memory response cache (bounded, clears at 200 entries).
- Design rule: **no googleapis/google-auth-library dependency** — the JWT flow is ~40 lines of node:crypto; keeps Render build light. If a future integration needs write scopes or token refresh flows beyond service accounts, revisit.
- `AnalyticsEvent.ALLOWED_EVENTS` extended with `call_click` / `whatsapp_click` / `generate_lead` (spanbix-web mirrors were silently 400-rejected before; historical counts pre-July-2026 exist only in GA4).
- Frontend: `client/src/pages/MbrReport.jsx` + `client/src/components/mbr/GeoMap.jsx` (bundled 110m GeoJSON as lazy chunk, hand-rolled equirectangular projection — zero map libraries) + `client/src/api/mbr.js` + `client/src/lib/chartTheme.js` (theme-aware validated chart series).
- Admin visual system is now **Paper Ledger / Midnight Study** (see UI_VISION.md §15) — neon Tailwind scales resolve through `--ink-*` CSS vars; `.legacy-neon` scope preserves HRMS/Tickets originals.

## Phase 10.5 — MBR suite maturation + scheduler removal + design system (July 7, 2026)

- **⛔ Scheduler removed entirely** (user decision — unused): `src/modules/scheduler/`, `src/workers/`, `client/src/modules/scheduler/`, the `/api/scheduler` + `/api/public` booking mounts, `config.scheduler`, worker scripts, and the `bullmq`/`ioredis` deps. `googleapis` retained (used by `indexingService`). All scheduler sections in this file are historical.
- **MBR is now a suite**: `/mbr` hub (Work Overview tile grid mirroring the hand-made Excel), per-source detail (`/mbr/<key>`, sticky scroll-spy section nav, 3-month comparison), `/mbr/<key>/pages` pages-built deliverables (`src/services/mbrPagesService.js` — WP REST publish dates for `wordpressUrl` sources, `SeoMetadata.createdAt` registry for spanbix; never GA4 traffic), `/mbr/blogs/<key>` per-source blogs (WP posts live / tenant-filtered Blog collection), manual workstream views (`development/ppts/projects/leads` — `MbrItem` collection + `src/config/mbrSections.js` single source of truth), combined styled Excel export (`src/services/mbrExportService.js`, exceljs). Multi-source via `MBR_SOURCES` env registry — per-source service accounts supported via `credentialsEnv` (`googleAuth.js` caches creds + tokens per env var; Spanbix and SaiSatwik live in different GCP projects); hostname-scoped + 404-excluded GA4 requests; four dateRanges per request (current / clamped-prev / full-prev / full-prev2), each trend series clamped to its own range bounds (GA4 zero-pads across the union of ranges).
- **UI primitive layer** at `client/src/components/ui/`: PageHeader, PaperButton, PaperTable, StatTile, EmptyState, IndexTabs (+ Badge stamp variants) with domain inks from `client/src/lib/inks.js`. New admin surfaces compose these — see UI_VISION.md §15.1–15.3.
- `DashboardLayout` uses contained scroll (`h-screen` + inner `overflow-auto`) — required for sticky elements; sidebar/topbar stay fixed.

## Phase 11 — Two-tenant consolidation: SaiSatwik onboarding + HRMS/Tickets removal (July 8, 2026)

**Live tenants are now exactly two: Spanbix (spanbix-web Next.js) + SaiSatwik (external WordPress at saisatwik.com).**

### Removed
- `client/src/pages/{hrms,tickets}/`, `client/src/components/{hrms,tickets}/`, `client/src/lib/{hrmsSeo,ticketsSeo}.js` — deleted. `App.jsx` ships admin routes only (+ the `/spanbix/*` legacy redirect). Main chunk shrank ~1097 kB → ~233 kB.
- `.legacy-neon` scope deleted from `index.css` (definition block + all `:not(.legacy-neon *)` qualifiers).
- `lib/analytics.js` `DEFAULT_TENANT` is now `null` — tracker drops events with no tenant context instead of mis-attributing to a dead slug.
- `seeder.js` reduced to superadmin + the two tenant upserts. Demo users removed.
- Tenant rows `mavro-hrms` + `mavro-ticket-management` cascade-deleted from Atlas via `src/utils/removeLegacyTenants.js` (dry-run by default, `--apply` to execute). `_cleanup-demo` endpoint now includes both slugs.

### Added — SaiSatwik in the SEO Engine + Analytics
- **`Website.wordpressUrl`** schema field — gates the WordPress corpus path. No hardcoded tenant slugs (same invariant as the AI layer).
- **`src/utils/seedSaisatwik.js`** — `upsertSaisatwikTenant({silent})`, called from `server.js` boot after Spanbix. Slug `saisatwik`, domain `saisatwik.com`, `wordpressUrl: 'https://saisatwik.com'`.
- **`src/services/wordpressBlogService.js`** — pulls published posts from the WP REST API (`_embed=wp:term,wp:featuredmedia`, ≤300 posts), adapts each to the Blog shape `seoHealth.auditBlog()` expects (title→seoTitle, stripped excerpt→seoDescription, tags/categories from embedded terms, featured media → featuredImage/ogImage), caches 1h per origin.
- **`GET /api/blogs/wordpress/:websiteSlug`** (protected, before `/:id`) — returns `{blogs, total, source:'wordpress'}`; 502 (not 500) when WP is down; `?fresh=true` busts the cache.
- **Frontend**: `SeoEngine.jsx` + `Analytics.jsx` branch per tenant — `w.wordpressUrl ? getWordpressBlogs(w.slug) : getBlogs(...)`. `getTenantComparison` hydration now includes `wordpressUrl` so the Analytics page can branch.
- **Analytics ingestion**: `saisatwik-tracking-snippet.html` (repo root) pasted into Divi → Theme Options → Integrations fires `page_view` (+ `blog_view` on single-post pages) as **text/plain sendBeacon** (CORS-safelisted → no preflight; the track endpoint already parses text/plain). CORS baseline in `app.js` includes `https://saisatwik.com` + `https://www.saisatwik.com`.
- All existing aggregations (overview, timeseries, funnel, engagement, anomalies, tenant comparison) work unchanged — they key on `websiteSlug` and the events land with slug `saisatwik`.

### Known limits
- WP posts don't expose Rank Math meta over bare REST — audit sees title/excerpt as seoTitle/seoDescription (matches the plugin's own fallback behaviour).
- Sitemap Operations card on /seo has no data for SaiSatwik (WordPress owns its own sitemap) — the fetch fails soft to null.
- Editorial surfaces (Kanban, campaigns, decay queue → editor) don't apply to WP posts; SaiSatwik content edits go through the data-file + CLI flow (`SAISATWIK_BLOG_PUBLISHING.md`).

---

*End of architecture reference.*
</content>
</invoke>