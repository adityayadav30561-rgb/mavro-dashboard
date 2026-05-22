# Mavro Platform — Engineering Operating System

**Scope:** rules every engineer (human or AI) must follow when contributing code to Mavro.
**Companion to:** [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md), [UI_VISION.md](./UI_VISION.md), [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1. Core Philosophy

1. **Operational realism over visual sugar.** SEO scores, analytics, and audits must behave the way an experienced operator expects. If Ahrefs / Semrush / Yoast would not produce this behavior, neither should Mavro.
2. **No fake data, ever.** Every metric on every dashboard derives from real analysis or real events. Placeholder arrays are forbidden in production code paths. If real data is missing, render an empty state — never a hardcoded number.
3. **Multi-tenant first.** Every feature is built assuming N tenants from day one. No hardcoded slugs outside `lib/<tenant>Seo.js` constants.
4. **Preserve before refactor.** When upgrading existing systems, refactor surgically. Do not rewrite routing, analytics pipeline, theme system, or auth without explicit user authorization.
5. **Document load-bearing decisions.** Anything that would survive a future "why was this done?" question belongs in [PROJECT_CONTEXT.md §15](./PROJECT_CONTEXT.md).
6. **Modular primitives over monoliths.** Reuse existing primitives. Build new primitives when a pattern appears 3 times.
7. **Cinematic but restrained.** Animation budget is tight. Motion that doesn't serve context gets removed.

---

## 2. Tech Stack

**Frontend (`client/`):**
- React 18 (Vite 5)
- TailwindCSS 3 with CSS-variable token system
- shadcn/ui primitives
- Framer Motion (scroll-driven, parallax, stagger)
- Lucide React (iconography)
- Recharts (data visualization)
- Axios (API clients)
- React Router v6
- React Hook Form + Zod
- React Quill New (CMS editor)
- React Hot Toast

**Backend (`src/`):**
- Node.js >=18 + Express 4
- MongoDB Atlas + Mongoose 8
- JWT auth, 7-day expiry
- Helmet + CORS + Compression
- express-rate-limit + express-validator
- bcryptjs (password hashing)
- slugify (auto slug generation)

**Stack lock:** do not introduce new state management libraries (Redux, MobX, Zustand), new UI libraries (Material UI, Chakra), or new charting libraries. Stick with what's here.

---

## 3. Frontend Engineering Standards

### 3.1 File organization

```
client/src/
├── api/          # axios clients per resource (one file per backend route group)
├── components/
│   ├── ui/       # shadcn primitives ONLY (button, card, input, badge, dialog)
│   ├── cyber/    # premium operational primitives for admin (GlassCard, MetricOrb, ...)
│   ├── layout/   # admin shell (DashboardLayout, Sidebar, Topbar)
│   ├── hrms/     # HRMS-specific components
│   └── tickets/  # Tickets-specific components
├── context/      # React Context (AuthContext, ThemeContext)
├── hooks/        # custom hooks (useSEO, useTrackPageView)
├── lib/          # pure utility modules (utils, analytics, seoHealth, seoReadability, *Seo)
└── pages/        # route-level page components grouped by tenant where applicable
```

### 3.2 Component rules

- **Reusable components**. If you write the same JSX block 3 times, extract a primitive.
- **No giant files.** Split when component exceeds ~400 LOC.
- **Semantic HTML.** Use `<section>`, `<article>`, `<nav>`, `<footer>` appropriately.
- **Accessible forms.** Every input has a `<label>`. Use `aria-*` attributes where helpful.
- **Mobile-first Tailwind.** Default classes are mobile, override at `sm:`, `md:`, `lg:`.
- **Token-driven styling.** Use `bg-card`, `text-foreground`, `border-border`. **Never hardcode** HSL/RGB values in components.
- **`cn()` helper** from `client/src/lib/utils.js` for class merging.

### 3.3 React conventions

- Function components only
- `useMemo` for expensive computations (e.g., `auditCorpus`, sorted tables)
- `useEffect` cleanup on unmount where applicable
- Custom hooks for cross-cutting concerns (tracking, SEO meta, theme)
- Co-locate `Component.jsx` with adjacent `Component.css` only if absolutely needed (rare)
- Default exports for page components; named exports for utility components

### 3.4 Routing conventions

- Public marketing routes: `/<tenant-prefix>` (no `/site/`, no `/public/`)
- Admin routes: top-level under `/` (e.g., `/blogs`, `/leads`, `/seo`)
- Auth routes: `/login`
- All admin routes wrapped in `<ProtectedRoute>` + `<DashboardLayout>`
- Public routes wrapped in tenant-specific layouts (`HrmsLayout`, `TicketsLayout`)
- Never break existing routes when adding new ones

### 3.5 Theme rules

- Both dark + light themes must work for every new component
- Use Tailwind theme tokens via CSS variables defined in `index.css`
- Do NOT add new color tokens to `tailwind.config.js` — extend the CSS variable system instead
- If a dark-only utility class (`text-white/70`, `bg-white/[0.04]`) is unavoidable, verify the light-mode utility repaint layer handles it. Add a new mapping if needed.
- Tenant-accent colors (HRMS violet, Tickets cyan) are baked into the per-tenant component files — don't try to make them theme-aware tokens.

### 3.6 Animation rules

- Framer Motion via `motion.*` components
- Use `whileInView` + `viewport={{once: true}}` for scroll reveals
- Stagger via `delay: i * 0.05–0.07` for lists
- Respect `useReducedMotion()` on Hero parallax + mouse-follow effects
- Ease curves: `[0.22, 1, 0.36, 1]` or `[0.25, 0.46, 0.45, 0.94]`
- Duration: 0.2s–0.5s; 0.6–0.8s for major reveals
- No animation longer than 1s

### 3.7 Performance expectations

- Initial bundle should remain small — avoid heavy deps
- Mongoose `.lean()` in queries that return to API
- `useMemo` for any computation over 10ms
- `React.memo` only when profiling proves it helps
- Code-splitting for routes if bundle grows beyond ~500KB gzipped

### 3.8 Accessibility standards

- WCAG AA contrast minimum (both themes verified)
- All interactive elements keyboard-accessible
- Focus visible on every button + link
- `alt` text on all decorative + informational images
- `aria-label` on icon-only buttons
- Skip-to-content link in `DashboardLayout` (future enhancement)

---

## 4. Backend Engineering Standards

### 4.1 File organization

```
src/
├── app.js          # express composition
├── server.js       # entrypoint
├── config/         # env config aggregator
├── controllers/    # request handlers (one per resource group)
├── models/         # mongoose schemas
├── routes/         # express routers (one per resource group)
├── middleware/     # auth, validators, error handlers, spam protection
├── services/       # domain logic (sitemap, indexing, ping, analytics, schema)
└── utils/          # ApiResponse, asyncHandler, paginate, debug scripts
```

### 4.2 Controller conventions

- Always wrap in `asyncHandler` to forward errors
- Return via `ApiResponse.success/error/notFound/created/paginated`
- Validate input in middleware (`validate` + a rule set from `validators.js`), not in controller
- Keep controller thin — push domain logic to services
- Never expose internal fields in public API responses

### 4.3 Model conventions

- Required fields marked with validation messages
- Indexes on every foreign key + every common filter field
- Compound indexes for known query shapes
- TTL indexes for time-series collections (`AnalyticsEvent`)
- Pre-save hooks for slug generation, timestamps, derived fields
- `.lean()` reads everywhere outside the editor

### 4.4 Route conventions

- Public routes mounted at top of router
- `router.use(protect)` separates public from protected sections
- Authorize-then-validate pipeline: `protect → authorize('role') → rules → validate → controller`
- Use express-validator rules from `middleware/validators.js`
- Mount rate limiters at the right scope (route-specific vs global)

### 4.5 Service conventions

- Pure-ish functions — minimize internal state
- Export named functions, not classes (unless state is truly required)
- Services consume models; controllers consume services
- Cross-service imports are OK; controller-to-controller imports are not

### 4.6 Error handling

- `errorHandler` middleware is the catch-all — formats Mongoose, JWT, validation errors uniformly
- `asyncHandler` wraps every async controller
- Analytics + indexing failures swallowed silently (logs warn, must not block UX)
- 404 fallback as second-to-last middleware
- `errorHandler` as last middleware

### 4.7 Performance

- All query filters on indexed fields
- Aggregation pipelines use `$facet` for parallel branches in single round-trip
- Heavy fields (`Blog.content`) excluded by default in list views
- Opt-in `?includeContent=true` for SEO audit use case
- Use `.distinct()` over `$group` when only unique count is needed
- TTL indexes auto-purge stale data — no manual cleanup

---

## 5. SEO Engine Standards

See [SEO_ENGINE.md](./SEO_ENGINE.md) for full spec.

### Integrity rules

1. **All scores must derive from actual analysis.** No `Math.random()`. No "feels right" offsets.
2. **Penalties are deterministic.** Same blog → same score every time.
3. **Content cap is sacred.** Never bypass `contentCap(wordCount)`. Real-world platforms behave this way.
4. **Category weights stay at 45/20/15/10/10.** Adjust only if user explicitly authorizes a rebalance.
5. **Confidence multipliers required when adding new categories.** Non-content categories must dampen when content collapses.
6. **Engine is pure-function only.** No fetches, no React, no global state inside `seoHealth.js` / `seoReadability.js`. Easy to migrate server-side later.
7. **Cross-corpus checks via closure pattern** — `corpusDuplicates(blogs)` returns a `(blog) => issues[]` function. Don't compute duplicates per-blog.
8. **Severity weights:** critical penalties 12–60, warning 5–8, notice 2–4. Stay in band.
9. **Issue codes are stable.** Once shipped, codes (e.g., `meta_title_missing`) are part of the public contract for future test suites and external tooling.

---

## 6. Analytics Standards

See [ANALYTICS_SYSTEM.md](./ANALYTICS_SYSTEM.md) for full spec.

### Integrity rules

1. **All analytics must derive from real events.** No placeholder timeseries arrays.
2. **`form_submit` is server-side.** Emitted by `leadController.submitLead → emitFormSubmitEvent`. Client tracking removed for forms.
3. **Bots filtered at ingestion.** UA-detected bots return `{recorded:false}`, never persisted.
4. **Tenant slug always required.** `lib/analytics.js` reads `currentTenant` set by layout. Never let an event land without a slug.
5. **UTC alignment in aggregations.** `$dateTrunc` returns UTC midnight. `generateBuckets()` must use `setUTCHours/setUTCMonth/Date.UTC()`. Mismatch broke timeseries once — don't regress.
6. **Rate limits separated.** Global `apiLimiter` excludes `/api/analytics/track` (analytics has its own 60/min limiter). Otherwise analytics floods would lock out lead submission + login.
7. **Dedupe at the source.** 1.5s key in `lib/analytics.js` prevents storm-write loops.
8. **Burst-session model required.** `getEngagement` MUST split sessionId timelines by 30-min inactivity gaps. Without it, idle tab time inflates avg session duration to hours. Each burst = one engagement session.
9. **Calendar-today day range.** `resolveRange('day')` uses server-local midnight as start, not now-24h. User expectation: "Today" pill excludes yesterday's events. Week/month/year remain rolling.
10. **Engine is shared across `/seo`, `/analytics`, and Blog Editor Cockpit.** `seoHealth.auditBlog()` is the single source of truth. `LiveSeoEngine.js` wraps it for editor; `SeoTelemetry.jsx` wraps it for analytics. No engine forks.
11. **Anomaly detectors must return `null` on insufficient data.** No false positives from empty windows. Minimum-data thresholds documented per detector in `anomalyService.js`. Each detector is pure-function — same input always produces same output.
12. **Behavior intelligence requires ≥2 sessions per page.** `getPageConversion` + `getPageBounce` filter out single-session pages to avoid noise. Real platforms (Plausible, Fathom) apply similar minimums.
13. **Single contextual-help system.** All analytics metric explanations live in `client/src/lib/analyticsCopy.js → METRIC_INFO`. `InfoPopover.jsx` is the only popover primitive — do not introduce a second tooltip implementation. Adding a new metric = append to registry, reference via `infoKey` prop.

---

## 7. Multi-Tenant Isolation Rules

See [MULTI_TENANT_SYSTEM.md](./MULTI_TENANT_SYSTEM.md) for full spec.

1. **Never hardcode tenant slugs outside `lib/<tenant>Seo.js` constants.**
2. **Every public endpoint requires slug or ID in path/body.** No subdomain-based implicit tenant.
3. **Foreign keys at the model level.** `Blog.targetWebsite`, `Lead.website` (ObjectId). `AnalyticsEvent.websiteSlug` (denormalized string, indexed).
4. **Cascade delete preserves invariant: no orphan rows.** `deleteWebsite` removes all dependent blogs/leads/analytics.
5. **Frontend tenant context via `setAnalyticsTenant(slug)`.** Layout sets it once; tracker reads it.
6. **Cross-tenant queries explicit.** `?websiteSlug=all` means cross-tenant. Default behavior depends on consumer.
7. **Adding new tenants must not require backend changes.** If a backend change is needed, the abstraction is wrong — fix the abstraction.

---

## 8. Routing Integrity Rules

See [ROUTING_MAP.md](./ROUTING_MAP.md) for full inventory.

1. **Never break existing routes.** New routes are additive.
2. **Public routes before protected** in routers (`router.use(protect)` divides them).
3. **`/sitemap/index.xml` before `/sitemap/:slug.xml`** — order matters (specific before parameterized).
4. **`/robots/:slug.txt` mounted as standalone handler** — must not be eaten by sitemap router.
5. **`/test-ui` exists outside `ProtectedRoute`** — dev sandbox, fine.
6. **Catch-all `<Route path="*" element={<NotFound />} />` always last.**
7. **Vite proxy must include `/api`, `/sitemap`, `/robots`** — required for sitemap stats endpoint.

---

## 9. Security & Privacy Standards

1. **Never commit secrets.** `.env` is gitignored. `JWT_SECRET` from env only.
2. **Bcrypt 12 rounds minimum** for password hashing.
3. **JWT tokens never logged.** No console.log on token contents.
4. **Spam protection on every public POST** — `spamProtection` middleware on `/api/leads/submit`.
5. **Rate limiters mandatory on every public ingestion endpoint.**
6. **CORS whitelist explicit** — no `*` origin in production.
7. **Helmet enforced.** CSP relaxed only as necessary (Quill needs inline styles).
8. **Input validation at the boundary** — express-validator rule sets for every public endpoint.
9. **Cascade delete for tenant removal** — no orphan PII.
10. **TTL on AnalyticsEvent** — 540-day auto-purge.

Pre-production privacy work (Phase 4):
- Hash IP addresses (daily-rotating salt)
- Cookie consent banner
- DSAR data export endpoint

---

## 10. Realism-Over-Fake-Data Philosophy

This is the highest law in the codebase.

**NEVER:**
- ❌ Hardcode fake operational metrics
- ❌ Use mock arrays in production code paths
- ❌ Generate random numbers for "demo" purposes
- ❌ Display placeholder percentages
- ❌ Inflate counts artificially
- ❌ Show data that doesn't exist
- ❌ Pre-fill dashboard tiles with fabricated trends

**ALWAYS:**
- ✅ Fetch from real APIs
- ✅ Derive from actual analysis (SEO scores, readability, audits)
- ✅ Show empty states when no data exists
- ✅ Compute period-over-period deltas from actual events
- ✅ Treat the dashboard as the canonical source of truth — if it shows a number, that number must be defensible

**If you can't get real data, the correct outcome is:**
1. Show an empty state with helpful action
2. Or remove the tile entirely
3. **Never** synthesize fake data to fill the gap

---

## 11. Folder Organization Rules

### Frontend
- `pages/` → route components only (1 file per route)
- `components/<scope>/` → scoped components per surface (admin shell, tenant sites)
- `lib/` → pure modules (no React imports in `lib/seoHealth.js`, `lib/analytics.js`, `lib/utils.js`)
- `api/` → axios clients (one file per backend route group)
- `hooks/` → custom hooks (one file per hook)
- `context/` → React Context providers (max 2-3 globally)

### Backend
- `controllers/` → request handlers only
- `services/` → domain logic
- `models/` → mongoose schemas only
- `routes/` → express router definitions
- `middleware/` → reusable middleware
- `utils/` → pure utilities + diagnostic scripts

**No "shared/" or "common/" dumps.** Place code where it belongs.

---

## 12. No-Monolith Rules

- A file exceeding 600 LOC needs to be split
- A function exceeding 60 LOC needs decomposition
- A component with more than 3 concerns needs to be split into primitives
- A controller with more than 100 LOC needs to push logic to a service
- A service with multiple unrelated capabilities should be split

---

## 13. Reusable Component Philosophy

When patterns repeat:

| Occurrences | Action |
|---|---|
| 1 | Just write it |
| 2 | Watch for emerging pattern |
| 3+ | Extract to a primitive |

Already-extracted primitives:
- `GlassCard`, `GlassPanel`, `GlassSurface`
- `MetricOrb`, `TicketMetricOrb`, `WorkforceMetricCard`
- `EditorialSection`
- `ActivityRail`, `ActivityTimeline`
- `ScrollProgress`
- `AmbientGlowLayer`
- `AnimatedGridBackground`
- `ModuleShowcaseCard`

When adding a new primitive: place in `components/cyber/` for admin, `components/<tenant>/` for tenant-specific, or `components/hrms/` for shared public-site primitives reused by both tenants.

---

## 14. Commit & PR Standards

- Commit messages: imperative mood, ≤72 char subject
- Reference the section being changed: `analytics: fix UTC bucket alignment`, `seo: rebalance content weights`, `hrms: add scroll progress`
- Atomic commits — one logical change per commit
- PR descriptions reference the relevant doc section: `Per AGENTS.md §10, no fake data in...`
- Squash on merge if PR has many small commits

---

## 15. Testing Standards (Future, Phase 4)

When test suite is added:
- Vitest + Testing Library for frontend
- Jest + Supertest for backend
- Playwright for E2E
- Required coverage: lead submission flow, blog publish, SEO audit determinism, analytics ingestion + aggregation, tenant cleanup

Until then:
- Every new feature must include a manual smoke-test verification step
- Backend changes must be probed via curl + recorded in the PR
- Frontend changes must be verified in both themes + at mobile + desktop widths

---

## 16. Don'ts (Quick Reference)

Don't:
- Add new dependencies without explicit user authorization
- Rewrite working systems "while you're at it"
- Break dashboard routes when adding new features
- Use placeholder/fake data anywhere in production paths
- Hardcode tenant slugs outside `lib/<tenant>Seo.js`
- Skip rate-limit consideration on new public endpoints
- Add motion to every element
- Generate generic Tailwind admin templates
- Use Bootstrap-style flat tables
- Forget to test in both themes
- Forget to test responsive behavior
- Bypass the SEO engine's content cap to inflate scores
- Trust frontend tenant scoping without backend re-validation

Do:
- Read PROJECT_CONTEXT.md before starting
- Read the relevant subsystem doc (SEO_ENGINE.md / ANALYTICS_SYSTEM.md / etc.)
- Reuse existing primitives
- Build new primitives when pattern recurs 3+ times
- Document load-bearing decisions in PROJECT_CONTEXT.md §15
- Preserve existing architecture
- Respect multi-tenant isolation
- Maintain the no-fake-data invariant
- Verify Vite HMR is clean before declaring "done"

---

## 17. Quick Reference Card

```
NEVER HARDCODE FAKE OPERATIONAL METRICS.
ALL ANALYTICS MUST DERIVE FROM REAL EVENTS.
ALL SEO SCORES MUST DERIVE FROM ACTUAL ANALYSIS.
MULTI-TENANT FIRST. THEME-AWARE ALWAYS. NO MONOLITHS.
PRESERVE EXISTING ARCHITECTURE. REFACTOR SURGICALLY.
```

---

*Read this. Follow it. Ship production-grade Mavro code.*
</content>
</invoke>