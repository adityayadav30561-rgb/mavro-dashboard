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

*This file optimizes Claude Code's behavior. PROJECT_CONTEXT.md remains the canonical source of truth for project state.*
</content>
</invoke>