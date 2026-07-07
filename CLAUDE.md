# CLAUDE.md — Claude Code Session Optimization

**Scope:** session-specific guidance for Claude Code when working on Mavro.
**Read order:** this file → [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) → relevant subsystem doc.

---

## Session Start Protocol

Before doing anything else, read in this order:
1. [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) — master operational memory
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — system shape
3. [AGENTS.md](./AGENTS.md) — engineering standards
4. [UI_VISION.md](./UI_VISION.md) — design rules

Then check task-specific doc:
- SEO work (including Blog Editor Cockpit) → [SEO_ENGINE.md](./SEO_ENGINE.md)
- Analytics work (including `/analytics` page) → [ANALYTICS_SYSTEM.md](./ANALYTICS_SYSTEM.md)
- Tenant work → [MULTI_TENANT_SYSTEM.md](./MULTI_TENANT_SYSTEM.md)
- Route work → [ROUTING_MAP.md](./ROUTING_MAP.md)
- Planning → [FUTURE_ROADMAP.md](./FUTURE_ROADMAP.md)

**Critical invariants (do not regress):**
- Burst-session model in `getEngagement` (30-min gap split)
- Calendar-today for `day` range (not rolling 24h)
- UTC bucket alignment in timeseries
- Server-authoritative `form_submit` emission in lead controller
- `seoHealth.auditBlog()` is shared across `/seo`, `/analytics`, Blog Editor Cockpit — no forks
- `TenantContext` switcher renders only on `/`
- `/api/analytics/track` excluded from global rate limiter
- Dev-mode skips rate limiters entirely
- Anomaly detectors return `null` on insufficient data — no false positives from empty windows
- Behavior intelligence (per-page conversion/bounce) requires ≥2 sessions per page
- All analytics metric explanations live in `lib/analyticsCopy.js → METRIC_INFO`; all SEO metric explanations live in `lib/seoCopy.js → SEO_INFO`. `InfoPopover.jsx` is the only popover primitive — do not duplicate.
- Keyword matching has ONE matcher: `lib/keywordMatch.js`. Density must be consistent across Focus Keyword card + Keyword Intelligence card + audit scoring. Do not re-implement tokenization or includes-keyword logic elsewhere.
- `Blog.editorialStatus` (5-col Kanban) and `Blog.status` (publish state) are bridged by `updateWorkflowStatus` controller — moving away from `published` MUST unpublish; moving to `scheduled` MUST set `scheduledAt` (defaults to +24h when missing).
- `scheduledPublishService` worker is single-instance — if Mavro scales to multi-instance, add a `JobLock` collection before deploying.
- DOCX import is FORMATTING ONLY (mammoth + heading inference). NO AI rewriting. NO content generation.
- FAQ detection: heuristic patterns (H2 ending in `?`, numbered paragraphs) require an explicit "Frequently Asked Questions" section marker AND must appear AFTER it in document order. Single curiosity-style question heading does NOT trigger FAQ panel.
- Internal link suggestions are tenant-scoped via `useTenantBlogCorpus(targetWebsiteId, currentBlogId)`. Suggestions must never cross tenant boundary.
- RichTextEditor custom `ResizableImage` blot is registered ONCE at module load. Image width / alt / style persist through Quill HTML round-trip via this blot.
- Semantic Variations / Supporting Terms / Semantic Coverage UI panels in `KeywordIntelligenceCard.jsx` are currently HIDDEN pending LLM-backed semantic engine (Phase 4). Engine still computes them; re-wire is UI-only when AI layer lands. Do not delete the engine output.
- **AI provider keys are backend-only.** Never import `@google/generative-ai` or `openai` in `client/`. All AI traffic flows through `/api/ai/*` JWT-protected routes behind the dedicated `aiLimiter` (20/min/IP, prod-only).
- **AI never scores SEO.** `seoHealth.auditBlog()` + `seoReadability.js` remain canonical. AI quality bundles in `client/src/lib/titleQuality.js` + `client/src/lib/metaQuality.js` are deterministic + advisory only. After Apply, `LiveSeoEngine` recalculates against form state — do not bypass.
- **AI routing is config-driven.** Adding / removing / re-prioritizing models = edit `src/services/ai/config/modelRegistry.js` and optionally `src/services/ai/config/routingStrategy.js`. Consumer files (`titleService`, `metaService`, controllers, frontend hooks) stay provider-agnostic — do not hardcode model IDs in feature code.
- **AI fallover rules** in `AIProviderService.generateText`: quota / 429 → no retry, jump model. Timeout → no retry, jump model (excluded from retry list deliberately). 5xx / rate-limit / network → exponential backoff retry then jump. Empty completion (Gemini 2.5 thinking-budget exhaust, GLM reasoning) → treat as failure → jump. Every transition emits a `fallover` log record — do not silence.
- **AI prompt builders are pure functions** (`src/services/ai/promptBuilders/`). No fetches, no React, no DB. Tenant context flows in via `tenantSlug` → industry brief. Banned-phrase filter sits in the service-layer parser BEFORE the controller — do not move it client-side.
- **Editor AI suggesters cache by context signature for 5 minutes** (`useAiTitles` + `useAiMeta`). Reopening with the same focus keyword / content / tenant = zero quota burn. Do not add a "refresh on every open" path.
- `Blog.editorialStatus` and `Blog.status` are BOTH filterable on `GET /api/blogs` (`?editorialStatus=` for 5-col pipeline, `?status=` for publish state). `BlogList.jsx` dropdown routes the chosen value to the correct param via `PIPELINE_VALUES` — do not collapse them into one filter.
- **No hardcoded tenant maps anywhere in the AI layer.** Per-tenant AI briefs are built dynamically by `src/services/ai/promptBuilders/tenantContext.js → renderTenantBrief(websiteDoc)` from `Website.aiContext` + `description` + `seoDefaults.keywords` + `name`. Do NOT reintroduce a `TENANT_BRIEFS = { 'mavro-hrms': '...', ... }` constant in any prompt builder or service. Adding a new tenant must require only a new `Website` row — never a code edit.
- All AI controllers MUST resolve tenant context through `resolveTenantContext({ targetWebsite, tenantSlug })` from `src/services/ai/tenantResolver.js` — single source of truth for the lookup, single shape returned to services (`{ slug, name, doc }`). Do not inline `Website.findById/findOne` for AI prompts in new endpoints.
- AI prompt builders MUST accept a `tenant` field (full Website doc) and pass it to `renderTenantBrief()`. Falling back to bare `tenantSlug` + `tenantName` is allowed but produces a thinner brief — always prefer the doc.
- **Spanbix navy zones use `.spanbix-scope` to opt out of the light-mode utility repaint.** Mavro's `index.css` repaint maps `text-white*` / `bg-white/[X.X]` / `border-white/*` to dark semantic tokens when html is not `.dark` — necessary for cyber components, fatal for Spanbix navy sections that need literal white text. `SpanbixLayout` root carries class `spanbix-scope`; `index.css` contains a matching `.spanbix-scope [class*="..."]` override block placed AFTER the repaint, inside the same `:where(html:not(.dark))` selector so higher specificity (`.spanbix-scope` + attr selector = 0,2,0) wins. Do NOT remove the override. New Spanbix navy-tone components can use the same Tailwind white classes — the scope handles them.
- **Spanbix Section tones drive homepage rhythm.** `client/src/components/spanbix/Section.jsx` exposes three tones via `TONE_STYLES`: `white` / `cream` / `navy`. Each tone resolves its own caption / title / subtitle / rule colors. Homepage sequence (Hero navy → MarketValidation white → WhySap cream → CareerPaths white → IndustryExperts navy → LearningExperience cream → PlacementSupport white → CampusPrograms navy → SuccessStories cream → Certifications white → DemoClasses cream → FinalCta navy → ContactForm cream) is intentionally tuned so no two same-tone sections sit adjacent. When adding or moving Spanbix sections, preserve the alternation — re-tone surrounding sections if a swap forces a same-tone collision.
- **Spanbix SAP catalog is currently 4 tracks only** (FICO, MM, SD, ABAP). HCM / SuccessFactors / BASIS / Analytics are deferred. Re-adding a track requires the full schema in `SPANBIX_CAREER_PATHS` (`priceIndividual`, `priceMrp`, `studentsEnrolled`, `rating`, `ratingsCount`, `lastUpdated`, `language`, `instructor`, `whatYoullLearn[]`, `includes[]`, `requirements[]`, `individualTimeline[]`, `campusTimeline[]`). Partial entries break the detail page contract.
- **Spanbix pricing rule.** `priceIndividual` + `priceMrp` are surfaced ONLY in the Individual mode of `SpanbixCourseDetail`. Campus mode hides all pricing — engagements are negotiated with the college T&P in the backend, never on the public site. The `?mode=campus` deep-link from `CampusCoursesCatalog` and `useSearchParams` consumer in the detail page initialize Campus view automatically.
- **Spanbix copy is opinionated, not PDF-summary.** Marketing copy across every Spanbix homepage section + subpage PageHero was rewritten in Phase 5.1 to a market-aware, audience-specific voice. Hero headline = "There are 40,000 SAP jobs waiting. Almost nobody told graduates about them." When editing copy, preserve the directness and the dual learner+placement-head framing.
- **Spanbix tenant is auto-bootstrapped on backend boot.** `src/utils/seedSpanbix.js` exports `upsertSpanbixTenant({ silent })`; `src/server.js` calls it after `connectDB()`. Idempotent: branding stays only-if-empty; `description` / `aiContext` / `seoDefaults` always refresh from the seed source so content updates propagate on restart. **Logging contract: `silent` only suppresses the verbose per-field snapshot — status (success / failure) ALWAYS prints.** Every boot emits one `✅ [bootstrap]` line, or a `❌ [bootstrap]` + Mongoose error trace on failure. The bootstrap returns `null` on silent failure so server startup continues regardless, but the error itself is never hidden. New tenants going forward must follow the same pattern (export `upsert<Name>Tenant({ silent })` → call from `server.js`) — do NOT rely on the legacy `seedWebsites()` array which short-circuits on existing installs, and do NOT reintroduce a fully-silent error path (silent-but-failing bootstraps are how missing tenants go unnoticed). Spanbix `aiContext` in the seed is intentionally compact — keep it short to stay inside the prompt-builder budget.
- **Spanbix has full Mavro admin parity. No tenant-specific backend code.** Every admin surface fetches via `getWebsites()` and resolves Spanbix dynamically (slug or `_id`). Public infra (sitemap, robots, blog list/detail, public lookup) auto-serves Spanbix via the same slug-based pattern. Adding a tenant-only feature for Spanbix would break this pattern — avoid. If a Spanbix-only behaviour is genuinely required, gate it on a `Website` schema field (e.g., a new boolean), never on a hardcoded slug string.
- **AI blog generation for Spanbix is NOT enabled yet (operational decision).** AI infrastructure (titleService / metaService / faqService) works for any tenant via dynamic `aiContext` — but the user has explicitly held back AI-authored Spanbix blogs until the placement-data corpus matures. Do NOT auto-generate AI blog content targeting Spanbix without explicit go-ahead. No code-level block exists (we don't reintroduce hardcoded tenant maps); the rule is operational.
- **API origin lives in `client/src/lib/apiBase.js`.** `apiPath(path)` returns relative `/api/...` (dev + co-hosted prod, `VITE_API_BASE_URL` empty) or absolute `<host>/api/...` (independent deploys, Vercel + Render setup). All 4 channels — `api/axios.js`, `api/public.js`, `api/seo.js` rootApi, `lib/analytics.js` `sendBeacon` — go through it. New API calls must use this helper; do NOT hardcode `/api/...` strings or absolute URLs in client code.
- **Per-tenant build targets via `VITE_BUILD_TARGET`.** Supported values: `full` (default), `spanbix`, reserved `hrms` + `tickets`. Each non-full target needs four files: a new `index.<name>.html` shell, a new `src/entries/<name>.jsx` mount, a new `<Name>App.jsx` routing tree, and matching npm scripts. Vite reads the env var, swaps `rollupOptions.input`, and the `closeBundle` plugin promotes the target HTML to `dist/index.html`. The `devTargetHtmlPlugin` middleware MUST also be wired so `npm run dev:<name>` actually serves that target — Vite's dev server otherwise reads `<root>/index.html` regardless of `rollupOptions.input`.
- **Standalone Spanbix entry omits admin providers.** `entries/spanbix.jsx` mounts only `BrowserRouter` + `ThemeProvider` + `Toaster` — never `AuthProvider`, `TenantProvider`, or any admin-side context. Adding admin providers there reintroduces admin chunks into the public Vercel bundle and breaks the public-only contract. If you need shared state inside Spanbix, scope it to a Spanbix-specific provider, not the Mavro admin contexts.
- **All Spanbix `<Link to>` and `Navigate to` references use `withSpanbixBase()`** from `lib/routeBase.js`. Same component code works under `full` (renders `/spanbix/...` URLs to match App.jsx routes) and `spanbix` (renders `/...` to match SpanbixApp.jsx routes). Hardcoded `/spanbix/...` strings in new Spanbix components would break the standalone build. The helper applies to `trackBlogView` page arguments too.
- **No aggressive Vite `manualChunks` for the Spanbix entry.** Letting Rollup auto-split co-locates React with every React-peer (framer-motion, react-hot-toast, react-router-dom) in the same chunk. Manual chunks that separate React from libraries which call `React.createContext(...)` at module-init time cause the `Cannot read properties of undefined (reading 'createContext')` crash in production due to chunk-execution-order races. If you ever re-introduce manual chunks, NEVER separate React from its peer libraries.
- **`vercel.json` must NOT set `cleanUrls: true`.** It makes Vercel try `/<path>.html` before SPA-fallback rewrites fire → 404 on every deep-link refresh because Vite emits a single `index.html`. SPA fallback uses negative-lookahead regex `/((?!assets/|favicon\.ico|sitemap\.xml|robots\.txt).*)` → `/index.html`. Root-level `/sitemap.xml` + `/robots.txt` proxy to the Render backend with the tenant slug baked in. Future tenant deploys copy this `vercel.json` and change ONLY the tenant slug in the two SEO rewrites.
- **Backend `src/app.js` static-serve block is gated on filesystem check.** Production mode only mounts `express.static(client/dist)` + SPA fallback when `client/dist/index.html` actually exists AND `SERVE_CLIENT !== 'false'`. Backend-only deploys (Render serves API, Vercel serves frontend) skip the block cleanly — no ENOENT on root requests. Do not remove this gate.
- **Spanbix logo variants are background-driven, not target-driven.** `client/public/spanbix/spanbix-white.png` goes on navy surfaces (Navbar + Footer). `client/public/spanbix/spanbix-blue.png` goes on light surfaces (favicon, OG image, Schema.org JSON-LD). When adding a new tenant logo, namespace it under `client/public/<tenant>/` to keep variants isolated.
- **Spanbix responsive contract — navbar height + logo height + layout `pt-*` move in lockstep.** Current values: navbar `h-16 sm:h-20 md:h-24 lg:h-[116px]`, logo `h-12 sm:h-16 md:h-20 lg:h-28`, layout main `pt-16 sm:pt-20 md:pt-24 lg:pt-[116px]`. Changing one without the other two leaves either a gap below the navbar or the hero hidden behind it. The `Section` primitive owns section-level responsive padding (`py-14 sm:py-20 md:py-28`) + h2 + subtitle sizing — every section inherits automatically. Hero eyebrow pill must use `max-w-full` + inner `<span>` with `whitespace-normal break-words` so it wraps on narrow viewports; the previous no-wrap `inline-flex` overflowed `<375px`. **Phase 5.6 redesign supersedes** the `pt-*` clamp — `SpanbixLayout` now ships zero top padding because the redesigned Hero (homepage) and `PageHero` (subpages) own their own clearance under the transparent navbar. Navbar height also dropped to `lg:h-[96px]`. If you reintroduce top padding on `<main>`, the transparent navbar will paint over the hero on every refresh.
- **Spanbix redesign design system is scoped to `.spanbix-scope`.** `client/src/styles/spanbix-redesign.css` declares every token + utility (`--sx-navy`, `--sx-cream`, `--sx-citron`, `.sx-display`, `.sx-eyebrow`, `.sx-lead`, `.sx-mono`, `.sx-btn-*`, `.sx-section-*`, `.sx-photo-*`, `.sx-reveal`, `.sx-marquee`, `.sx-chip`, `.sx-hero-*`, `.sx-cohort-*`, etc.) under a `.spanbix-scope` ancestor selector. NEVER author a top-level `.sx-*` rule — it would leak into Mavro admin / HRMS / Tickets surfaces. The CSS file is imported from both entry points (`src/main.jsx` for the full build, `src/entries/spanbix.jsx` for the standalone build). New Spanbix sections must read tokens via `var(--sx-*)` and stay inside the scope.
- **Spanbix typography stack (redesign v2)** — Instrument Serif headlines, Geist UI body, JetBrains Mono labels. Loaded via Google Fonts `<link>` in both `client/index.html` and `client/index.spanbix.html` alongside the original DM Serif Display + Sora. Fallback chain inside the design system: `"Instrument Serif", "DM Serif Display", Georgia, serif` and `"Geist", "Sora", "Inter", system-ui, sans-serif` so subpages that still use the legacy `font-sora` / `font-serif` Tailwind classes render cleanly during the transition window.
- **Spanbix Hero uses a background video, not a static photo.** `/spanbix/herosection-video.mp4` plays autoplay + muted + loop + playsInline (iOS Safari autoplay contract). Two gradient layers (horizontal navy darkness for headline legibility + vertical fade-to-deep-navy for section handoff) keep text readable across any frame. CTAs / cohort card get extra text-shadow + opaque backdrops because the video can punch bright at the right edge. Do NOT replace the video with a static photo without restoring the photo's overlay opacity (`sx-hero-overlay` is no longer used).
- **Spanbix `useScrollReveal` is mount-only.** The hook installs an IntersectionObserver once + disconnects, then a 1.6s safety-net force-reveal pass. It does NOT observe DOM mutations. Cards added later (tab switches, infinite scroll, route transitions where the page stays mounted) will NEVER receive `.in` and stay at `opacity:0`. NEVER put `sx-reveal` on a per-item card inside a switcher (Tracks tabs, Outcomes carousel, future filtered grids). Let the parent `motion.div` animate the swap instead.
- **Spanbix HiringPartners logos live locally, not on a CDN.** Clearbit's free logo API was deprecated by HubSpot in 2023 and returns inconsistent assets. Final approach: 12 brand PNGs committed under `client/public/spanbix/partners/<slug>.png` (slugs in `HiringPartners.jsx` `PARTNERS` array). Section bg is `--sx-cream-50` so native brand colors stay visible without per-brand color tweaks. `onError` fallback shows the brand wordmark in serif italic. New partner = drop a transparent PNG + add one row to `PARTNERS`.
- **Mavro Scheduler module lives at `src/modules/scheduler/`, NOT under `src/routes/` or `src/services/`.** Self-contained module with `models/`, `controllers/`, `services/`, `routes/`, `providers/`, `validators/`, `utils/`, `queue/`, `workers/`. Aggregated mount via `src/modules/scheduler/routes/index.js` exporting `schedulerRoutes` (admin, JWT-protected) + `schedulerPublicRoutes` (unauthenticated, `/api/public/book/*` + `/api/public/bookings/*` + `/api/public/routing/*`). Provider adapter pattern is sacred — `OutlookCalendarProvider` plugs into the same contract as `GoogleCalendarProvider` with zero changes to the engine / booking service / workflow infra. Adding a new provider = implement the `BaseCalendarProvider` interface + add a registry entry, nothing else.
- **Scheduler tokens are encrypted at rest via AES-256-GCM (v1 envelope).** `utils/encryption.js` is the single source of truth. Token storage format: `v1:<iv_b64>:<tag_b64>:<ciphertext_b64>`. Never log decrypted tokens. `CalendarConnection.accessToken` / `refreshToken` / `tokenExpiry` are `select: false` and stripped by `toJSON` / `toObject`. The `TOKEN_ENCRYPTION_KEY` env var is required in production; dev derives a fallback via HKDF from `JWT_SECRET` so local boot doesn't crash. Versioned envelope (`v1:` prefix) supports future key rotation.
- **Scheduler race-protection is layered.** Four independent guards: (1) signed slot hash via HMAC-SHA256 returned with every slot, (2) `isSlotStillBookable` re-runs the availability engine inside booking POST, (3) Mongo partial unique index `race_guard_confirmed` on `{tenant, hostUser, startTimeUtc}` where `status='confirmed'`, (4) idempotent cancel/reschedule. Removing any of these breaks the concurrency story. The 409 mapping (`SLOT_ALREADY_BOOKED` / `SLOT_UNAVAILABLE` / `STALE_SLOT`) is consumed by `PublicBookingAvailabilityPage` to bounce the user back to slot selection after a 1.5s toast.
- **Scheduler workflow queue degrades gracefully when Redis is missing.** `src/modules/scheduler/queue/index.js` returns `null` from `getQueue()` if `REDIS_URL` is unset; `enqueue()` becomes a silent no-op + returns `{queued: false, reason: 'redis_disabled'}`. Booking creation still works end-to-end without Redis — only the side-effect layer (emails, reminders, webhook deliveries) goes quiet. Workers boot from `src/server.js` via `schedulerWorkers.start()` only when both Redis is set AND `SCHEDULER_BOOT_WORKERS !== 'false'`. Standalone worker dyno entry exists at `src/workers/scheduler-worker.js` for horizontal scaling.

---

## Frontend Preferences

- React + Tailwind only
- shadcn/ui primitives
- Framer Motion for animation
- Premium SaaS aesthetics
- Concise responses
- Focus on implementation, not exposition
- Reusable components over inline duplication
- Production-quality code

---

## Response Style

- **Concise.** Skip filler. Skip preamble. Skip closing pleasantries.
- **Implementation-first.** Show code, not theory.
- **Cite files.** Use `path/to/file.js:line` references when discussing existing code.
- **Verify before declaring done.** Check Vite HMR logs + backend logs + relevant endpoints. App MUST work after each iteration — no partial states, no broken builds.
- **NO change-log summaries.** Do not enumerate files modified / added / deleted / wired / preserved at end of turn.
- **Tiny end-of-turn note only.** One short line max — e.g. "Done. Reload editor." or "Built. Test at /blogs/new." Nothing more.
- **Working app is the deliverable.** User cares it runs, not what moved.

The Caveman skill may be active during sessions — respect its rules when on.

---

## Architecture Preservation Rules

When upgrading existing systems:

1. **Read the existing implementation first.** Do not blindly rewrite.
2. **Preserve working features.** Refactor surgically.
3. **Maintain multi-tenant separation.** Never break tenant isolation.
4. **Preserve dashboard routes.** Adding new pages should not break existing ones.
5. **Maintain the premium SaaS visual quality.** Match the existing aesthetic.
6. **Respect the no-fake-data philosophy.** See AGENTS.md §10.
7. **Document load-bearing decisions** in PROJECT_CONTEXT.md §15 if needed.
8. **Maintain CSS variable architecture.** Don't add new color tokens to `tailwind.config.js`.

---

## Modular Upgrade Pattern

Prefer this pattern when adding capability:

1. **Add a new primitive** in the appropriate `components/` subfolder if reusable
2. **Add a new hook** in `hooks/` if cross-cutting
3. **Add a new pure module** in `lib/` if no React dependency
4. **Add a new API client** in `api/` if new backend resource
5. **Wire into existing page** rather than creating parallel pages
6. **Verify HMR cleanly transforms** all modified modules
7. **Test in both themes + responsive widths**

---

## What to Avoid

- Unnecessary rewrites of working code
- Sweeping refactors across unrelated files
- New dependencies without authorization
- Fake placeholder data anywhere
- Breaking existing dashboard routes
- Hardcoded color values in components
- Hardcoded tenant slugs outside `lib/<tenant>Seo.js`
- Generic Tailwind admin templates
- Flat CRUD tables
- Cartoonish empty states
- Motion on every element

---

## Production-Grade Implementation Checklist

Before declaring a task done:

- [ ] Vite HMR shows clean transform (no error logs)
- [ ] Backend nodemon shows no errors
- [ ] Endpoints respond with expected shape (verified via curl when possible)
- [ ] Dashboard route still loads (admin not broken)
- [ ] Public site still loads (`/hrms` and `/tickets`)
- [ ] Both light + dark themes look correct
- [ ] Mobile + desktop responsive
- [ ] No hardcoded colors in new components
- [ ] Reused existing primitives where possible
- [ ] Documented decisions in relevant `.md` file if architecturally significant
- [ ] No fake data introduced
- [ ] Multi-tenant scoping preserved

---

## Long-Session Strategy

For sessions that span many turns or risk auto-compaction:

1. **Re-read PROJECT_CONTEXT.md** if any uncertainty emerges
2. **Cite docs in responses** so user can verify against source of truth
3. **Persist important decisions** by appending to PROJECT_CONTEXT.md §15
4. **Don't reinvent context.** Trust the documentation system
5. **Verify route + endpoint inventory** at task start by checking `client/src/App.jsx` and `src/app.js`

---

## Caveman Mode Compatibility

When Caveman skill active:
- Drop articles, filler, pleasantries
- Keep technical terms exact
- Code blocks unchanged
- Error strings quoted exact
- Pattern: `[thing] [action] [reason]. [next step].`

Code/commits/security: always write normal regardless of mode.

---

## Quick Command Reference

```bash
# Backend
cd custombackend && npm run dev

# Frontend
cd custombackend/client && npm run dev

# Health check
curl http://localhost:5000/api/health

# Login (admin)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mavro.com","password":"Admin@123456"}'

# Public website lookup
curl http://localhost:5000/api/websites/public/mavro-hrms

# Analytics debug (auth required)
TOKEN=$(curl ... login ...)
curl http://localhost:5000/api/analytics/_debug?range=week \
  -H "Authorization: Bearer $TOKEN"

# SEO Engine page
http://localhost:5173/seo
```

---

## Default Admin

- Email: `admin@mavro.com`
- Password: `Admin@123456`
- Role: superadmin
- Seeded via `src/utils/seeder.js`

---

## Phase 5.8 — Spanbix Tone Pass + Lead Schema Invariants (May 26, 2026)

The following invariants supersede or extend earlier ones. Honor them on every future edit.

- **Lead schema is flexible.** `customFields` is `mongoose.Schema.Types.Mixed`. Every public lead submission can carry tenant-specific keys (Spanbix `{ audience, interest }`, HRMS `{ teamSize }`, Tickets `{ teamSize, ticketVolume }`). The sanitizer in `leadController.js → sanitizeCustomFields()` is the only place values are coerced — keep keys ≤60 chars, values ≤1000 chars / 20-element arrays, drop functions + nested objects. NEVER add a typed schema field for a per-tenant form input — add it to `customFields` on the frontend submit instead. The admin `LeadList.jsx` modal auto-renders every `customFields` key as its own labeled cell; no code change needed when a new tenant ships a new field.

- **`formId` is the form identifier.** Spanbix forms send `spanbix-contact`, HRMS sends `hrms-contact`, Tickets sends `tickets-contact`. Admin can filter by `formId` (indexed). New forms must pick a unique kebab-case id and send it via `submitPublicLead`.

- **Stop stuffing form fields into `message`.** The bracket-pattern (`[Audience: X · Interest: Y]`) is dead. New tenant forms must use `customFields`. Old leads still in DB keep their bracket-stuffed messages — no migration. `LeadList.jsx` renders `message` with `whitespace-pre-wrap` so legacy multi-line strings still read cleanly.

- **`SPANBIX_MENTORS` is the single source of faculty data.** Lives in `client/src/lib/spanbixSeo.js`. Imported by homepage `Mentors.jsx` (horizontal scroll) and course-detail `MentorCarousel` (one-at-a-time, prev/next + swipe). Edit once → propagates to every surface. NEVER duplicate the mentor array inline in a component.

- **Course detail page contract.** `SpanbixCourseDetail.jsx` reads timeline blocks by `block.meta` + `block.title` only — NOT `block.label` / `block.body`. That mismatch was a runtime crash. If a future change needs to surface module topics, add a new explicit section — do not re-introduce the deep per-module bullet list, the user asked for general flow.

- **No pricing on individual course pages.** Pricing panel reads "Talk to us to enrol." + Enrol Now button → `/contact`. `priceIndividual` + `priceMrp` data still live in `spanbixSeo.js` but are no longer rendered. Do NOT surface them on the public site without explicit approval.

- **No SAP-exam-mapping claims.** Dropped sitewide. Do not re-introduce "Crack the C_TS… certification" bullets, "maps to SAP's official exam blueprints", or any phrasing that implies parity with real SAP certifications. Spanbix issues its OWN credential — frame it as that, mentor-signed, never as SAP equivalent.

- **No AICTE / NAAC / NSDC references on the public site.** All removed. If a future tenant doc surfaces these terms in copy, flag it — they represent compliance claims we don't currently make.

- **All 4 SAP tracks are 3-month duration.** `duration: '3 months'` in `spanbixSeo.js` for FICO/MM/SD/ABAP. Changing this breaks copy across hero meta, Tracks campus card, CohortCard, FAQ #2, and detail pages.

- **Personality Development Module is complimentary** and surfaces as a 4th highlight in every Tracks card + every track's `whatYoullLearn[]` + `includes[]` + campus highlights. Citron marker-style highlight (`linear-gradient(transparent 55%, var(--sx-citron) 55%)`) is applied in `Tracks.jsx` by detecting `h.toLowerCase().includes('personality')`. Adding a new highlight containing the word "personality" auto-styles it.

- **Spanbix Navbar is solid glassmorphic cream — no longer transparent at scroll-top.** `rgba(243, 237, 224, 0.72)` + `blur(22px) saturate(160%)`. Logo is a real blue PNG (`/spanbix/spanbix-blue.png`) at `clamp(56px, 9vw, 96px)` height with zero vertical padding. `SpanbixLayout` main has `pt-16 sm:pt-20 md:pt-24 lg:pt-24` to clear it. **DO NOT** restore the transparent-at-scroll-top behavior or remove the layout pt — hero will paint over.

- **Footer logo is blue PNG inside a white pill** (`bg #fff`, padding `10px 16px`, radius `12`). Required because navy footer hides the blue logo without the pill.

- **Footer track links use bare codes, not `sap-` prefix.** `withSpanbixBase('/career-paths/fico')` — NOT `/career-paths/sap-fico`. Codes in `SPANBIX_CAREER_PATHS` are `fico` / `mm` / `sd` / `abap`. A `sap-` prefix 404s.

- **Demo Classes / DemoVideos and Placements page are GONE.** Routes stripped from `App.jsx` + `SpanbixApp.jsx`. Nav + footer links removed. Files orphaned but not deleted. Don't re-introduce without explicit ask.

- **MarketValidation + Campus sections are props-driven.** Defaults preserve homepage behavior. `MarketValidation` accepts `eyebrow / title / lead / stats / sources / image / imageAlt / imageCorner`. `Campus` accepts `tone='navy'|'paper'` + `showCtaStrip`. About page passes a "Founder Story" override; CampusPrograms passes `tone='paper'` + `showCtaStrip={false}`. NEVER hardcode tone or copy inside the section components for a subpage — pass props.

- **Outcomes + Mentors + Track-detail mentor sections are horizontal-scroll carousels.** Cards size-clamped to `flex: '0 0 clamp(280px, 85vw, 380px)'`. NEVER put `sx-reveal` on a carousel card (mount-only reveal-observer invariant — items that scroll into view later never trigger). Parent animation only.

- **Contact page form is the lead-capture surface.** Homepage FinalCta is copy + 2 CTAs only — the inline form was removed. New CTAs that need to capture leads route to `/contact` (or `#contact-form` if on the contact page already).

- **`client/vercel.json` is shared by BOTH Vercel projects** (Spanbix + Admin Dashboard). `buildCommand` is NOT in the file — each Vercel project sets its UI Build Command (`npm run build:spanbix` for Spanbix, `npm run build` for admin). Sitemap + robots rewrites point to backend's actual paths (`/sitemap/spanbix.xml` + `/robots/spanbix.txt`, NOT `/api/seo/…`). SPA fallback regex is last in `rewrites[]` order.

- **Linux-safe filename casing.** Vercel + Render Linux containers are case-sensitive. Imports must match real filenames exactly: `@/components/ui/Badge` (PascalCase file), `@/components/ui/card` (lowercase file), `@/components/ui/Modal` (PascalCase file), etc. macOS / Windows dev FS is case-insensitive and hides the mismatch.

- **Hosting topology**: Frontend on Vercel (Spanbix + Admin separate projects), backend on Render, MongoDB Atlas, optional Redis for scheduler workers. Custom domain `spanbix.com` attaches to Vercel project's Domains setting — no migration required. CORS allowlist in `src/app.js` must include every Vercel domain + custom domain.

- **Lead dedup is silent.** `Lead.isDuplicate(email, websiteId, 10)` in `spamProtection.duplicateCheck` returns 200 OK + "success" without saving when same email + website hit within 10 minutes. Test forms with fresh emails or wait the window — otherwise "lead not landing in /leads" looks like a bug.

---

## Phase 6 — Spanbix SSR migration + canonical cutover (May 27–29, 2026)

The Spanbix public surface moved off the Vite admin bundle onto a standalone **Next.js 16 App Router** app at `spanbix-web/`. Mavro admin (Vite) is unchanged; HRMS + Tickets stay on the Vite bundle. The Next sub-app talks to the same Express backend on Render. The invariants below supersede or extend earlier Spanbix invariants — honor them on every future edit.

- **Spanbix live site is `https://www.spanbix.com`**, served by the standalone Next.js 16 App Router app at `spanbix-web/`. Apex `spanbix.com` 301-redirects to www at the Cloudflare edge AND via `spanbix-web/src/proxy.js` (belt-and-braces fallback). The legacy Vite Spanbix surface (`client/src/pages/spanbix/`, `client/src/components/spanbix/`, `client/src/SpanbixApp.jsx`, `client/src/entries/spanbix.jsx`, `client/src/lib/spanbixSeo.js`, `client/src/lib/routeBase.js`, `client/index.spanbix.html`, `client/public/spanbix/`) was **fully DELETED in Phase 6.7** (May 29, 2026) — 91 files removed plus the `VITE_BUILD_TARGET` build-target plumbing. The `client/src/App.jsx` route now mounts a `<SpanbixLegacyRedirect>` catch-all that hard-redirects any stale `/spanbix/<path>` hit on the admin host to `https://www.spanbix.com/<path>` via `window.location.replace`. **Never reintroduce Spanbix pages or components inside `client/` — every Spanbix page lives in `spanbix-web/src/app/`.**

- **`Website.domain` for the Spanbix row is `"www.spanbix.com"`.** Backend sitemap + robots URL generators (`sitemapService.buildBaseUrl(domain)`) read this field. Migrating the canonical host = update this field. `seedSpanbix.js → LEGACY_DOMAINS` migration normalizes both sides (strip scheme + trailing slash + lowercase) before comparing, so a stored value like `"https://spanbix-web.vercel.app/"` is caught and rewritten on the next backend boot.

- **`spanbix-web/src/proxy.js` (Next 16 Proxy convention), NOT `middleware.js`.** Next 16 deprecated the `middleware` file convention; the file is `proxy.js`, the exported function is `proxy(request)`. Vercel builds fail with `Proxy is missing expected function export name` if either is wrong. The Proxy emits explicit 301 via `NextResponse.redirect(url, 301)` because Next 16 `redirects()` only emits 307/308 and the SEO audit requested 301.

- **Apex domain in Vercel Domains must point DIRECTLY at the spanbix-web app — NEVER toggle "Redirect to www.spanbix.com" in the Vercel UI.** If Vercel handles apex → www at the edge with a 308, our explicit 301 in `proxy.js` never fires. (Symptom of misconfiguration: `ERR_TOO_MANY_REDIRECTS` when Vercel does www → apex while Cloudflare does apex → www.)

- **Canonical host is `https://www.spanbix.com` everywhere in code.** `seedSpanbix.js` domain, `SPANBIX_SITE.url` + `logo` in BOTH `client/src/lib/spanbixSeo.js` AND `spanbix-web/src/lib/spanbixSeo.js`, `spanbix-web/src/app/layout.js` `metadataBase`, `client/index.spanbix.html` `og:url` + `og:image` + `twitter:image`, `.env.example` `SPANBIX_WEB_URL`. Backend CORS baseline in `src/app.js` includes both `https://www.spanbix.com` AND `https://spanbix.com` (apex stays whitelisted for the 301 hop). Adding a new Spanbix-facing URL anywhere = use `https://www.spanbix.com`.

- **Only ONE `spanbixSeo.js` exists** post-Phase-6.7: `spanbix-web/src/lib/spanbixSeo.js`. The historical `client/src/lib/spanbixSeo.js` was deleted. The full `SPANBIX_SITE`, `SPANBIX_MENTORS`, `SPANBIX_CAREER_PATHS`, `blogPostingLd`, `breadcrumbLd`, `blogListLd`, enriched Person schema all live in `spanbix-web/` only.

- **Backend publish paths fire `revalidateService.revalidateBlog(slug)` fire-and-forget.** `blogController.publishBlog`, `blogController.updateWorkflowStatus` (when `becamePublished` flag), `scheduledPublishService` worker. The service is silent no-op if `SPANBIX_WEB_URL` / `REVALIDATE_SECRET` unset; never throws; 4s timeout; tenant-agnostic (Next endpoint cheerfully ignores unknown slugs).

- **`/api/revalidate` is the only on-demand cache-bust path** for spanbix-web ISR. It revalidates `/blog`, `/blog/<slug>`, `/sitemap.xml`, AND `/robots.txt`. Do not duplicate this fan-out elsewhere — extending it = edit `spanbix-web/src/app/api/revalidate/route.js`.

- **Marketing pages live in `SeoMetadata` rows**, seeded by `seedSpanbix.js → upsertSpanbixStaticPages()`. Adding a new marketing page (`/about`, `/courses`, `/career-paths`, `/career-paths/{fico,mm,sd,abap}`, `/campus-programs`, `/contact` are already seeded) = add an entry to `SPANBIX_STATIC_PAGES`. The upsert uses `$setOnInsert` so existing admin SEO tweaks are preserved on every boot. Backend `sitemapService.generateSitemap` picks them up automatically — no hardcoding in the sitemap service.

- **`sitemapService.buildBaseUrl` loops the scheme strip.** Single non-global replace was a bug for double-prefixed input (`https://https://...`). Do not revert.

- **Blog author byline reads from the populated `Blog.author` AdminUser doc.** Never hardcode the author. `blogController.getPublicBlog` populates `name avatar bio linkedinUrl jobTitle`. `blogPostingLd` emits `schema.org/Person` with every conditional field. `spanbix-web/src/app/blog/[slug]/page.jsx` renders the `AuthorByline` block below the article body — LinkedIn glyph is an inline brand SVG because lucide-react 1.16 in spanbix-web has NO `Linkedin` export (do not import it).

- **Author byline is updated via `npm run set:spanbix-author`** — env-driven (`SPANBIX_AUTHOR_NAME / JOBTITLE / BIO / AVATAR / LINKEDIN / EMAIL`). The admin user-edit UI doesn't expose `bio` / `linkedinUrl` / `jobTitle` yet — `updateUser` API whitelist accepts them, but the form fields aren't built. Do not introduce new write paths bypassing `updateUser`; either use the CLI or extend the admin form.

- **Security headers in `spanbix-web/next.config.mjs` `headers()`** — CSP, HSTS (max-age=63072000; includeSubDomains; preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (every unused sensor disabled), `poweredByHeader: false`. **CSP `'unsafe-inline' 'unsafe-eval'` remain on `script-src`** until a nonce-based CSP is wired (would require the Proxy to inject a per-request nonce on every render). Removing them today breaks Next runtime + framer-motion + Vercel analytics.

- **CSP `connect-src` whitelists the backend + Vercel analytics.** Adding any new client-side fetch destination = add it to `connect-src` in `next.config.mjs` before its first request, or CSP will silently block it.

- **CSP `frame-src` whitelist is `'self' https://www.google.com https://maps.google.com`** (Phase 6.8.2). Required for the `/contact` Google Maps iframe. Adding any new `<iframe>` upstream = add the exact host to `frame-src` in `next.config.mjs`, NOT a wildcard. If a third-party embed feels like it needs `frame-src https://*.example.com`, prefer replacing it with a native component first; the CSP allow-list is the brake that catches accidental embed introductions.

- **`spanbix-web/` ships ZERO admin code.** No `axios` interceptors, no admin contexts, no `react-quill-new`, no `recharts`, no radix primitives. The public bundle stays minimal. The Next app talks to the backend over `fetch` (Server Components) and over `apiPath()` from `spanbix-web/src/lib/apiBase.js` (`'use client'` islands).

- **`spanbix-web/AGENTS.md` says: "This is NOT the Next.js you know."** Next 16 has breaking changes from public training corpora. Read `node_modules/next/dist/docs/` before writing Next code in this repo. Heed deprecation notices (e.g., `middleware` → `proxy`).

- **`spanbix-web/` build target is `npm run build` from inside `spanbix-web/`.** It is NOT triggered by the existing root-level `npm run build:client` — that one only builds `client/`. The Vercel project for spanbix-web has Root Directory `spanbix-web/` so it builds correctly on push.

- **Dashboard sitemap URL helpers use `publicUrlFromDomain(domain)` + `/sitemap.xml`.** `client/src/pages/websites/WebsiteList.jsx → defaultSitemapUrl(domain)` + `client/src/pages/SeoEngine.jsx → sitemapXmlUrl(domain)` / `robotsTxtUrl(domain)`. Never reintroduce the `window.location.hostname:5000` form — it produced `https://mavro-dashboard.vercel.app:5000/sitemap/<slug>.xml` on Vercel (broken).

- **HRMS + Tickets are NOT migrated to Next.js.** They stay on the Vite admin bundle with `useSEO` injecting meta client-side. The architectural blueprint at `spanbix-web/` is the reference if/when their SEO becomes a priority. Until then, do not touch their routing tree.

---

## Phase 7 — SAP Ads landing page, consent/legal, ad tracking (June 11–19, 2026)

Invariants from this phase (all in `spanbix-web/` unless noted). Full record: PROJECT_CONTEXT.md §Phase 7.

- **`/sap-course` is a dedicated Google Ads landing page** — `metadata.robots = { index:false, follow:true }` (noindex, paid traffic only; do not index). It has its OWN minimal chrome (sticky header + footer in `SapCourseLanding.jsx`), NOT `SpanbixLayout` — no nav escape links by design. Leads post under `formId: 'spanbix-sap-lp'` + `customFields.source: 'google-ads-sap-lp'`. **No pricing** anywhere on it. Files: `src/app/sap-course/*`, `src/components/spanbix/lp/CallFloater.jsx`, `src/lib/track.js`.
- **`ConsentCheckbox` is MANDATORY on every Spanbix lead form** (`ContactForm`, `EnquireForm`, `LpLeadForm`). It blocks submit when unchecked and writes `customFields.consent` (DPDP Act 2023). Admin `LeadList` auto-renders it per new submission. Any new tenant/form MUST include it.
- **Every lead form captures ad attribution + ships a honeypot.** `getAttribution()` (from `src/lib/attribution.js`) is spread into `customFields` (first-touch `gclid`/`utm_*`, captured via `SpanbixLayout` + `SapCourseLanding`); `Honeypot` (`company_website` hidden field) drops bot submits. Keep BOTH when adding/editing any form. No backend change needed — the customFields sanitizer accepts arbitrary keys.
- **`src/lib/track.js` is the only event dispatcher** — pushes to `window.dataLayer` (GTM/GA4/Ads) AND mirrors to backend analytics. Events: `cta_click`, `call_click`, `whatsapp_click`, `generate_lead`. **Never client-emit `form_submit`** — the lead controller is server-authoritative for it. `generate_lead` is the Ads conversion signal.
- **GTM is env-driven, GA4/Ads live in the GTM UI.** `src/components/GoogleTagManager.jsx` mounts sitewide from `app/layout.js`, no-op unless `NEXT_PUBLIC_GTM_ID` is set. Adding any Google/3rd-party tag host = add it to the CSP in `next.config.mjs` (script-src/connect-src/frame-src) BEFORE it loads. PENDING: GA4 `G-…`, GTM `GTM-…`, Ads `AW-…`+label from the ads/analytics person.
- **Legal pages** `/privacy` `/terms` `/refund` via `src/components/spanbix/LegalPage.jsx` (data-driven `sections`). DPDP-aware, general, **no overcommitting** (no hard refund numbers/days). **Never add CIN/GST/foundingDate placeholders** — unverified. Founder = LalitMohan Parihar. Governing law = Gautam Buddh Nagar (Greater Noida), UP. Footer Legal links point to these real routes (not `/about#…`).
- **Course schema `offers` carries no `price`** (`courseLd`) and the LP shows no fees — the no-public-pricing rule extends to structured data. Add price only on explicit approval.
- **`/about` is founder-only** — do NOT re-add the `<Mentors/>` instructor carousel (it was added during SEO Phase 1 and reverted by user decision).
- **Font trim invariant:** only Instrument Serif / Geist / JetBrains Mono are loaded as webfonts. `globals.css` references DM Serif Display / Sora as LITERAL fallback family names — never `var(--font-dm-serif)` / `var(--font-sora)` (now undefined; would invalidate the whole font stack).
- **Live Google reviews are optional + off by default.** `src/lib/googleReviews.js` pulls via Places API only when `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID` are set; otherwise the LP carousel shows curated reviews (4 alumni + 3 real pasted Google reviews) only.
- **Lead alerts/notifications were tried and REVERTED at user request.** Do NOT rebuild any lead-notification (WhatsApp/Telegram/email/SMS) without an explicit new ask. (Future note: official WhatsApp Cloud API cannot post to groups — needs a 3rd-party gateway.)

---

## Phase 7.8 — Playwright E2E suite (June 19, 2026)

Suite at repo root: `e2e/` + `playwright.config.ts`. Targets DEPLOYED prod. Full record: PROJECT_CONTEXT.md §Phase 7.8.

- **Lead submits are ALWAYS mocked** — `mockLeadSubmit` (`e2e/support/mock.ts`) intercepts `**/api/leads/submit` so tests NEVER create a real lead, even against prod. The website-lookup (`**/api/websites/public/**`) passes through. Admin tests are READ-ONLY; creds come from env (`ADMIN_EMAIL`/`ADMIN_PASSWORD`), never hardcoded. Keep these rules for any new test.
- **All Spanbix specs import `{ test, expect }` from `e2e/support/fixtures`**, NOT `@playwright/test`. The fixture suppresses the first-visit cohort banner (a modal that intercepts pointer events) by seeding `localStorage['spanbix-cohort-banner-dismissed-2']`. New Spanbix specs must do the same or clicks will be blocked.
- **Use `gotoReady(page, url)` for any test that submits a form** — forms resolve `websiteId` from an async `/api/websites/public/` call on mount; submitting earlier trips the "Still connecting" guard.
- Recording is video + screenshot + trace ON for every test → `e2e/recordings/`; HTML report → `e2e/report/`. These plus `e2e/.auth/` are git-ignored (local artifacts — never commit).
- Admin projects only run when `ADMIN_BASE_URL` is set; admin selectors are resilient but may need tuning to the live admin UI. WebKit needs `npx playwright install`.
- Run: `npm run test:e2e` (+ `:spanbix` / `:admin` / `:ui` / `:report` / `:trace`).

---

## Phase 8 — Analytics live (GTM/GA4/Ads) + AI Mastery course + banner (June 22, 2026)

Full record: PROJECT_CONTEXT.md §Phase 8.

- **All Google tracking flows through GTM — NEVER add a raw `gtag.js`/AW snippet to the site** (double-tagging → double-counted conversions). IDs: GTM `GTM-WW4R4C8P`, GA4 `G-CSG5H7FDG7`, Google Ads conversion `AW-18231051715` + label `hXXrCKL9lMIcEMOLn_VD`. The GTM container has **8 tags**: Google Tag (GA4 pageviews), 4 GA4 event tags (`cta_click`/`call_click`/`whatsapp_click`/`generate_lead`), Conversion Linker, Google Ads Conversion (on `generate_lead`), Google Ads base Google Tag (AW). Importable container JSON lives at repo root `gtm-container-spanbix.json` (helper/source-of-truth for the GTM setup — not deployed, not loaded by the app). Any Google/3rd-party tag is added INSIDE GTM, not in code.
- **`NEXT_PUBLIC_GTM_ID=GTM-WW4R4C8P`** is set on the spanbix-web Vercel project (Production + Preview). `GoogleTagManager.jsx` stays env-driven (no-op unless set) — do not hardcode the ID.
- **CSP allows the Google Ads conversion hosts** (`next.config.mjs`): `connect-src` + `frame-src` include `https://*.doubleclick.net` + `https://www.googleadservices.com`. The Ads ping to `ad.doubleclick.net/ccm/s/collect` was CSP-blocked under the old narrower `*.g.doubleclick.net`. Do NOT narrow back. Adding any new tag host = widen the CSP first.
- **`generate_lead` fires ONLY on the `/sap-course` `LpLeadForm` success** (`track.js → trackLead`). Contact/Enquire forms do NOT fire it → the Ads/GA4 conversion counts **LP leads only** (correct for the ad campaign). To count every lead as a GA4 conversion, wire `trackLead` into Contact/Enquire too — NOT done; ask first.
- **PENDING (manual, user's GA4 account, I can't do it):** mark `generate_lead` as a **Key event** (GA4 → Admin → Events → **Recent events** → star). Only appears ~24h after the first event. The Google Ads conversion does NOT depend on this star.
- **AI Mastery course** (`code: 'ai'`, `category: 'ai'` in `spanbixSeo.js → SPANBIX_CAREER_PATHS`) is a **how-to-USE-AI course** (prompt engineering, AI image/video, content automation, building apps with AI) — **NOT an AI-development course**, 8 weeks, no coding. One catalog entry auto-flows to: `/career-paths/ai` detail, `/courses`, `/career-paths`, Footer, homepage `Tracks` ("AI Mastery" tab), and `courseLd` JSON-LD. Backend `seedSpanbix.js` static pages includes `/career-paths/ai` (sitemap). **The "SAP catalog = 4 tracks only" invariant is now extended:** AI is a 5th, **non-SAP** program — keep it `category: 'ai'` so SAP-specific filters (`Tracks.jsx` functional/technical) don't absorb it. Brochure download is gated to SAP codes (`fico/mm/sd/abap`) — AI has no PDF.
- **Cohort banner** (`CohortBanner.jsx`): batch date **30 June 2026**; `DISMISS_KEY = 'spanbix-cohort-banner-dismissed-3'`. **Bumping the key invalidates all prior dismissals** (banner re-shows) AND must be mirrored in `e2e/support/fixtures.ts` (it seeds the same key to suppress the modal in tests) — both are now `-3`. Change one → change both.
- **Testimonials use real alumni** (names/photos/employers): Poonam Parihar (FICO · Capgemini), Piyush Srivastava (MM · Tech Mahindra), Ankur Srivastava (ABAP · HCL Technologies). Photos at `public/spanbix/<slug>.jpeg`. Surfaces: `Outcomes`, `Certification`, `/sap-course` reviews. Don't revert to the old placeholder names / generic employer labels.
- **SAP course brochures**: PDFs at `public/brochures/<code>-course-outline.pdf`; download buttons on `/career-paths/[code]` (enrolment panel) + `/sap-course` "course outlines" section. Adding a brochure = drop the slugged PDF + the code is already wired.

---

## Phase 9 — Spanbix blog publishing pipeline (July 3, 2026)

Full process doc: **[BLOG_PUBLISHING.md](./BLOG_PUBLISHING.md)** (repo root). Invariants:

- **Spanbix blogs are DB content authored via a CLI, not git pages, not the admin editor.** Each post is a data module `src/utils/blogs/<slug>.js` (copy `_TEMPLATE.js`) published with `npm run create:spanbix-blog -- <slug>`. The runner (`src/utils/createSpanbixBlog.js`) resolves the Spanbix `Website` + author `AdminUser`, upserts the `Blog` (idempotent — matches on slug **or** title so a re-run corrects a mangled slug instead of duplicating), sets `status:'published'`, and fires `revalidateService.revalidateBlog(slug)`. `--draft` holds it for review.
- **⛔ NEVER open a CLI-published post in the admin Blog Editor (Quill).** Quill merges table cells, converts spaces to `&nbsp;` (breaks mobile wrap), and strips heading ids — it destroys the HTML on save. Fix a mangled post by re-running the CLI (overwrites `content` from the data file). Edit the data file, never the editor.
- **The `Blog` pre-validate hook regenerates `slug` from `title` on create**, clobbering an explicit slug — `createSpanbixBlog` re-asserts the chosen slug after save (title no longer dirty). Keep that post-save correction.
- **`Blog.faq` (structured `[{question,answer}]`) is the single FAQ source.** It drives BOTH the `schema.org/FAQPage` JSON-LD (`faqPageLd` in `spanbix-web/src/lib/spanbixSeo.js`) AND the visible **accordion dropdowns** rendered from `faq[]` in `blog/[slug]/page.jsx` (native `<details>`, appended after the article, added to the TOC). Do NOT put FAQ markup in `content` — one source, no duplication.
- **The blog Table of Contents is auto-generated at render.** `buildTocAndInjectIds` in `blog/[slug]/page.jsx` derives a slug `id` from each `<h2>`'s text and injects it (heading ids in stored content are NOT trusted — Quill strips them). Don't require manual `<h2 id>`.
- **Blog article pages open at the canonical URL + top.** `SpanbixLayout` scroll effect force-scrolls top for `/blog/*` and strips any leftover `#section` hash via `history.replaceState` on load (a TOC click leaves a hash the browser preserves across refresh). In-page TOC clicks still work (they don't change `pathname`, so the effect doesn't re-run). Non-blog deep-links (`/about#faqs`, `/contact#contact-form`) keep their hash-scroll — do not remove the `!isBlogArticle` guard.
- **The sitemap/robots/blog proxy fetches are cache-TAGGED so publishes bust them.** `spanbix-web` sitemap.xml + robots.txt routes fetch the backend with `next.tags: ['sitemap']` / `['robots']`; `blogApi` fetches carry `['blog']` (+ `blog:<slug>`). `api/revalidate` calls `revalidateTag(...)` for each — `revalidatePath` alone re-renders the route but reuses the stale cached fetch body (this is why a published blog could render yet be missing from the sitemap). Keep the tags + `revalidateTag` calls paired.
- **`REVALIDATE_SECRET` must match across Render backend + Vercel spanbix-web + local `.env`** for instant on-publish cache-busting. When it mismatches, the CLI's revalidate 401s and changes fall back to the 300s ISR timer OR need a redeploy (an empty commit). Single biggest cause of "my edit isn't showing" — align the secret.
- **Author identity is one shared `AdminUser`, set via `npm run set:spanbix-author`** (env-driven fields). Feeds the byline block AND the `Person` JSON-LD (`blogPostingLd`) on every post. Current: name "Lalit Mohan Parihar", jobTitle "SAP Entrepreneur · Spanbix", LinkedIn `…/lalitmohan-parihar-495753149/`. Blog pages cache the populated author at render — changing it needs a cache flush (redeploy while the secret is unaligned).
- **Blog content SEO/AEO/GEO conventions** (enforced in `_TEMPLATE.js` + BLOG_PUBLISHING.md): open with a "Quick Answer" `<h2>`; wrap tables in `<div class="sx-table-wrap">`; hyperlink EVERY named source (verify the URL resolves — a broken outbound link is worse than an unlinked name); closing attribution credits the **single named byline author**, never "the Spanbix team". Prose styling lives in `.sx-blog-content` (globals.css); FAQ accordion styling in `.sx-faq*`.
- **Sitemap in GSC is submit-once.** Backend generates it live from published blogs; new posts appear automatically and Google rechecks the same URL. Never resubmit. A freshly verified property showing "Couldn't fetch"/"unknown to Google" is crawl latency, not a fault.

## Phase 10 — MBR dashboard + Paper Ledger admin retheme (July 7, 2026)

- **MBR Report** (`/mbr`, `client/src/pages/MbrReport.jsx`) pulls GA4 Data API + Search Console via `src/services/google/` (zero-dep service-account JWT in `googleAuth.js`; env: `GOOGLE_SERVICE_ACCOUNT_JSON` base64, `GA4_PROPERTY_ID`, `GSC_SITE_URL`). Reports cached 1h in-memory per range. `resolveRanges` clamps the previous window to the current window's day-count — keep MoM like-for-like. GeoMap renders a bundled 110m GeoJSON (`client/src/assets/world-countries.geo.json`, imported as a lazy JS chunk — NOT `public/`, the admin Vercel SPA-fallback rewrites unknown paths to index.html). Microstates missing from 110m geometry (Singapore…) render as centroid dots via `MICRO_CENTROIDS`.
- **Admin theme is "Paper Ledger" (light) / "Midnight Study" (dark)** — cream stock + warm ink + vermilion `hsl(14 73% 44%)` primary; Fraunces display, Inter body, Caveat annotations. The cyberpunk theme is retired.
- **Neon-scale indirection is the retheme mechanism.** Tailwind's `violet/fuchsia/indigo/cyan/emerald/amber/rose/purple/blue/sky/green` scales resolve to `rgb(var(--ink-<hue>-<step>))` (tailwind.config.js → vars in index.css). Admin surfaces get paper inks from `:root`; **`.legacy-neon`** (on `HrmsLayout` + `TicketsLayout` roots) restores original Tailwind neon values so the HRMS/Tickets public pages are untouched. Never hardcode raw neon hex/hsl in admin components — use the scales or tokens; new tenants needing original hues = add `.legacy-neon` at their layout root.
- **Chart series come from `client/src/lib/chartTheme.js`** (validated vermilion/teal/olive pairs per surface). `--glow-*` vars persist by name but hold paper ink hues.
- **Signature elements:** `.hand-circle` (vermilion hand-drawn SVG ellipse — Dashboard title) and `.postit` (sidebar badges) live in index.css `@layer components`. Use sparingly — one circle per page max.
- **Pasted-note cards:** a central rule on the shared `bg-card…rounded-2xl` class signature turns every admin section card into a paper note (solid stock, 4px corners, micro-tilt via the independent `rotate` property — framer-motion's inline `transform` cannot cancel it, masking-tape `::before` with nth-child variation). New admin cards get the treatment automatically by using the same classes; don't fight it with per-card overrides.
- **MBR custom range:** header "Custom range…" option → `?start=&end=` (backend contract already existed). Comparison = preceding period of same length. End clamped to today.
- **MBR live config:** GA4 property `541588648`, GSC `https://www.spanbix.com/`, service account `mavro-dashboard@spanbix-analytics.iam.gserviceaccount.com` (GA4 Viewer + GSC Full). Env set on Render + local `.env`.
- **`AnalyticsEvent.ALLOWED_EVENTS` now includes `call_click`/`whatsapp_click`/`generate_lead`.** Pre-July-2026 call/WhatsApp counts exist only in GA4 (old enum silently rejected the mirrors). `generate_lead` stays dataLayer-only (`form_submit` remains server-authoritative — do not mirror it client-side).
- **⛔ SCHEDULER REMOVED (July 7, 2026).** The entire scheduler module (`src/modules/scheduler/`, `src/workers/`, `client/src/modules/scheduler/`, `/api/scheduler` + `/api/public` booking mounts, worker scripts, bullmq/ioredis deps, `config.scheduler` block) was deleted at user request. All scheduler invariants earlier in this file are VOID. Do not reintroduce booking/calendar-connection features without an explicit new ask. `/api/public/*` no longer exists (public website lookup lives at `/api/websites/public/:slug`, unaffected). `googleapis` stays — `indexingService` uses it.
- **UI primitives (Phase 10.5) are the standard building blocks:** `components/ui/PageHeader.jsx` (eyebrow + Fraunces title + subtitle + actions + optional backTo; `ink` prop picks the domain accent), `PaperButton.jsx`, `PaperTable.jsx`, `StatTile.jsx` (with sparkline slot), `EmptyState.jsx` (Caveat annotation + hand arrow), `IndexTabs.jsx` (file-folder tabs, `.index-tabs` CSS). New pages use these — do not hand-roll headers/tables/tiles/tabs.
- **Domain inks** (`lib/inks.js`): command/MBR=vermilion, analytics=teal, content/blogs/calendar=olive, leads=madder, seo=ochre. PageHeader + Sidebar active states consume them. Keep assignments stable — they're wayfinding.
- **`Badge` has rubber-stamp variants** (`published`/`draft`/`scheduled`/`archived` → `.stamp` class). Status chips use these, not pill styles.
- **MBR is multi-source + exportable.** `MBR_SOURCES` env (JSON array of `{key,label,ga4PropertyId,gscSiteUrl}`) drives the source tabs on `/mbr` and the per-source sheets in the export; falls back to a single spanbix source from the legacy vars. Manual workstream rows (PPTs & Videos, Work Log, Other Projects, manual/LinkedIn leads) live in the `MbrItem` collection keyed by `section` + `period` ('YYYY-MM'); section definitions are the single source of truth in `src/config/mbrSections.js` (served via `/api/mbr/sections` — the tiles UI and Excel sheets both render from it; new manual section = one entry there, zero UI code). **"Download MBR"** hits `/api/mbr/export` → styled multi-sheet exceljs workbook (Work Overview index · per-source traffic/search sheets · Blogs with views · manual sheets · Leads Log = website leads auto-merged with manual rows). exceljs is a backend dep — do not import it in `client/`.

---

*This file optimizes Claude Code's behavior. PROJECT_CONTEXT.md remains the canonical source of truth for project state.*
</content>
</invoke>