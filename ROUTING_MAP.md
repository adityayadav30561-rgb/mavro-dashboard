# Mavro Platform — Routing Map

**Frontend routes:** `client/src/App.jsx`
**Backend routes:** `src/app.js` + `src/routes/*.js`

---

## 1. Frontend Routes

### Public marketing — HRMS
| Path | Component | Notes |
|---|---|---|
| `/hrms` | `pages/hrms/HrmsLanding.jsx` | 13 sections, SEO + JSON-LD wired |
| `/hrms/blog` | `pages/hrms/HrmsBlogList.jsx` | Paginated, searchable |
| `/hrms/blog/:slug` | `pages/hrms/HrmsBlogDetail.jsx` | BlogPosting JSON-LD, fires `blog_view` |

### Public marketing — Tickets
| Path | Component | Notes |
|---|---|---|
| `/tickets` | `pages/tickets/TicketsLanding.jsx` | 14 sections including Workflow Visualizer, SLA Section |
| `/tickets/blog` | `pages/tickets/TicketsBlogList.jsx` | Paginated, searchable |
| `/tickets/blog/:slug` | `pages/tickets/TicketsBlogDetail.jsx` | BlogPosting JSON-LD |

### Public marketing — Spanbix (Phase 6 — live on `spanbix-web/` Next.js App Router)

**Canonical host:** `https://www.spanbix.com`. Apex `spanbix.com` → 301 → www at the Cloudflare edge AND via `spanbix-web/src/proxy.js` (`NextResponse.redirect(url, 301)` — Next 16's `redirects()` only emits 307/308). Legacy `spanbix-web.vercel.app` still resolves as a preview alias. Routes are root-relative on the Next app — the historical `/spanbix/*` prefix is now a 308 redirect to root inside `next.config.mjs` (page paths only — asset extensions excluded via negative lookahead).

| Path | Component | Notes |
|---|---|---|
| `/` | `spanbix-web/src/app/page.jsx` | Homepage. Server Component. `generateMetadata` from `SPANBIX_SITE`. EducationalOrganization + FAQ JSON-LD baked into server HTML. |
| `/courses` | `spanbix-web/src/app/courses/page.jsx` | Course catalog. `Course` JSON-LD per SAP track. |
| `/career-paths` | `spanbix-web/src/app/career-paths/page.jsx` | Listing of the 4 active SAP tracks (FICO / MM / SD / ABAP). |
| `/career-paths/[code]` | `spanbix-web/src/app/career-paths/[code]/page.jsx` | Per-track detail. `generateStaticParams()` returns `fico` / `mm` / `sd` / `abap`. Individual/Campus pill toggle is a client island (`CourseDetailView.jsx`). Invalid `code` → `notFound()`. |
| `/campus-programs` | `spanbix-web/src/app/campus-programs/page.jsx` | Institutional partnerships + ContactForm island. |
| `/about` | `spanbix-web/src/app/about/page.jsx` | About + values + FAQs. |
| `/contact` | `spanbix-web/src/app/contact/page.jsx` | Server-rendered shell + client `ContactForm.jsx` island. Submits to `submitPublicLead`, `formId: 'spanbix-contact'`. |
| `/blog` | `spanbix-web/src/app/blog/page.jsx` | Blog index. Fetches `${API}/api/blogs/website/spanbix` with `revalidate: 300`. BreadcrumbList + ItemList JSON-LD. |
| `/blog/[slug]` | `spanbix-web/src/app/blog/[slug]/page.jsx` | Blog detail. `generateStaticParams()` returns every published slug at build; per-blog fetch uses `revalidate: 300`. `generateMetadata` emits per-blog title / description / canonical / og:image. JSON-LD: BreadcrumbList + BlogPosting with enriched Person schema (name, jobTitle, description, image, url, sameAs). `AuthorByline` block renders below the article. |
| `/api/revalidate` | `spanbix-web/src/app/api/revalidate/route.js` | POST + shared secret → busts `/blog`, `/blog/<slug>`, `/sitemap.xml`, `/robots.txt` ISR caches. Backend `revalidateService` fires this fire-and-forget on every publish. |
| `/sitemap.xml` | `spanbix-web/src/app/sitemap.xml/route.js` | Proxies `${API}/sitemap/spanbix.xml` (5-min ISR). |
| `/robots.txt` | `spanbix-web/src/app/robots.txt/route.js` | Proxies `${API}/robots/spanbix.txt` (1-hour ISR). |

**Edge / cross-cutting:**
- `spanbix-web/src/proxy.js` — apex → www 301 redirect (Next 16 Proxy convention, formerly `middleware.js`).
- `spanbix-web/next.config.mjs` `headers()` — CSP, HSTS+preload, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy applied to every route.
- `spanbix-web/next.config.mjs` `redirects()` — legacy `/spanbix` and `/spanbix/<page>` → root (308, page paths only).

### Scheduler — Public (no auth, `/api/public/*`)

The Mavro Scheduler (Phase 5.7 Calendly clone) ships both admin + public surfaces. Public routes serve the booker (invitee) flow without auth.

| Path | Component | Notes |
|---|---|---|
| `/book/:eventSlug` | `client/src/modules/scheduler/pages/PublicBookingAvailabilityPage.jsx` | Available-slots picker for a public event type. Each slot carries an HMAC-signed hash. Booking POST re-runs the availability engine inside `bookingService` and maps the 4 race-loss cases to a 409 (`SLOT_ALREADY_BOOKED` / `SLOT_UNAVAILABLE` / `STALE_SLOT`). |
| `/manage/:token` | `client/src/modules/scheduler/pages/BookingManagePage.jsx` | Invitee manage view (reschedule / cancel) gated by a single-use signed token. Cancellation window enforced. |
| `/route/:slug` | `client/src/modules/scheduler/pages/PublicRoutingPage.jsx` | Routing form: invitee answers, server-side rule engine evaluates (whitelisted ops, first-match wins, required-field gate, fallback target), returns the matched event type to book. |

### Scheduler — Admin (`/scheduler/*`, protected via `ProtectedRoute`)

| Path | Component | Notes |
|---|---|---|
| `/scheduler/connections` | `pages/scheduler/CalendarConnectionsPage.jsx` | Google Calendar OAuth + token-storage (AES-256-GCM, v1 envelope). Outlook stub for Phase 8. |
| `/scheduler/event-types` | `pages/scheduler/EventTypesPage.jsx` | Event-type list, soft-delete, public-link copy. |
| `/scheduler/event-types/:id` | `pages/scheduler/EventTypeEditorPage.jsx` | Editor: availability, override dates, blackouts, booking rules, team strategy, intake form. |
| `/scheduler/bookings` | `pages/scheduler/BookingsPage.jsx` | Booking inbox + filters + status transitions. Mongo partial unique index `race_guard_confirmed` protects against double-booking. |
| `/scheduler/workflows` | `pages/scheduler/WorkflowEditorPage.jsx` | Trigger + step builder (send_email / send_sms / send_slack / wait / webhook). Cumulative delay computed across the chain. |
| `/scheduler/workflows/history` | `pages/scheduler/WorkflowHistoryPage.jsx` | Per-execution audit feed (90-day TTL on `WorkflowExecution`). |
| `/scheduler/routing` | `pages/scheduler/RoutingFormsPage.jsx` | Routing-form editor: questions, ordered rules, fallback target. |

### Public marketing — Spanbix (LEGACY Vite tree — retired, still buildable)

The original Vite Spanbix surface lives in `client/src/pages/spanbix/*` and was reachable at `/spanbix/*` on the admin Vite bundle pre-Phase-6. After the cutover to `spanbix-web/`, these routes are **retired** — `www.spanbix.com` no longer serves them, and any `/spanbix/*` request to the Vercel admin project that does still serve them is shadowed by the SPA fallback. The Vite `build:spanbix` target remains available as an emergency fallback build and is **not** used for the live deploy.

| Path (legacy) | Component | Status |
|---|---|---|
| `/spanbix` and 9 sub-routes | `pages/spanbix/*` | Vite-only. Not the source of truth for SEO. Do NOT add new pages here — add them to `spanbix-web/src/app/`. |

### Admin (wrapped by `ProtectedRoute` → `DashboardLayout`)
| Path | Component | Notes |
|---|---|---|
| `/` | `pages/Dashboard.jsx` | Real analytics, range filter, **tenant-scoped via `TenantContext`** (Topbar switcher renders only here) |
| `/blogs` | `pages/blogs/BlogList.jsx` | CMS list |
| `/blogs/new` | `pages/blogs/BlogForm.jsx` | **Editor Cockpit** — sticky SEO panel + focus keyword + 7 cockpit cards + autosave |
| `/blogs/:id/edit` | `pages/blogs/BlogForm.jsx` | Same cockpit, edit mode |
| `/leads` | `pages/leads/LeadList.jsx` | Lead inbox |
| `/websites` | `pages/websites/WebsiteList.jsx` | Tenant management, Visit Website |
| `/seo` | `pages/SeoEngine.jsx` | Weighted v3 SEO audit + sitemap + robots + content intelligence |
| `/analytics` | `pages/Analytics.jsx` | **Analytics Intelligence** — overview/funnel/tenant/content/realtime/SEO/insights |
| `/calendar` | `pages/Calendar.jsx` | **Content Calendar** — Month/Agenda/Editorial Kanban views, Campaign panel, Velocity strip, Planning recommendations, Activity feed |

### Standalone
| Path | Component | Notes |
|---|---|---|
| `/login` | `pages/Login.jsx` | Redirects authed users to `/` |
| `/test-ui` | `pages/PremiumTestDashboard.jsx` | UI sandbox (dev only) |
| `*` | `pages/NotFound.jsx` | Catch-all 404 |

---

## 2. Backend Routes

### `/api/auth` — `src/routes/authRoutes.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/login` | public | authLimiter (skipped in dev) |
| GET | `/me` | protected | Returns current user |
| POST | `/logout` | protected | |

### `/api/websites` — `src/routes/websiteRoutes.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/public/:slug` | **public** | Returns `{_id, name, slug, domain, branding, description}` |
| POST | `/_cleanup-demo` | superadmin | `{dryRun:true}` for preview |
| GET | `/` | protected | List, pagination, search |
| POST | `/` | protected | Create |
| GET | `/:id` | protected | Single |
| PUT | `/:id` | protected | Update |
| DELETE | `/:id` | superadmin | Cascade-deletes blogs/leads/analytics |

### `/api/blogs` — `src/routes/blogRoutes.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/website/:slug` | **public** | Paginated published blogs for tenant |
| GET | `/website/:websiteSlug/:blogSlug` | **public** | Single published blog detail |
| GET | `/stats` | protected | Aggregate stats for dashboard |
| POST | `/bulk` | admin/superadmin | Bulk operations |
| GET | `/` | protected | List, filters: targetWebsite, status, **editorialStatus** (5-col kanban), search, **includeContent=true**. `status` + `editorialStatus` both accept comma-separated values (`$in`). |
| POST | `/` | protected | Create |
| GET | `/:id` | protected | Single |
| PUT | `/:id` | protected | Update |
| DELETE | `/:id` | protected | Delete |
| PATCH | `/:id/status` | protected | Status transition |
| PATCH | `/:id/publish` | protected | Publish |
| PATCH | `/:id/unpublish` | protected | Unpublish |
| POST | `/:id/index` | protected | Trigger Google indexing |
| PATCH | `/:id/schedule` | protected | Reschedule (set/move scheduledAt); auto-flips draft→scheduled |
| PATCH | `/:id/workflow` | protected | Editorial transition; accepts `editorialStatus` (5-col) OR `workflowStatus` (8-col); bridges publish-state |
| PATCH | `/:id/assign` | protected | Set assignedTo/reviewer/seoReviewer/dueAt/priority/completionPercentage |
| PATCH | `/:id/approve` | protected | Approve content (writes to reviewNotes + sets approvedAt/approvedBy) |
| PATCH | `/:id/request-revision` | protected | Return to drafting w/ note (required body: `note`) |
| PATCH | `/:id/reject` | protected | Reject + archive |
| GET | `/activity` | protected | Cross-corpus activity feed flattened from per-blog `activityLog[]` (filter `?targetWebsite=&limit=&since=`) |
| POST | `/import-docx` | protected | Multipart .docx upload → mammoth + heading inference → `{html, detectedTitle, wordCount, readingTime, structure, warnings}` |

### `/api/leads` — `src/routes/leadRoutes.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/submit` | **public** | leadSubmitLimiter + 6-layer spam protection |
| POST | `/` | **public** | Backward-compat alias for `/submit` |
| GET | `/stats` | protected | |
| GET | `/export` | admin/superadmin | CSV export |
| PATCH | `/mark-spam` | protected | Bulk mark spam |
| POST | `/bulk-delete` | superadmin | Bulk delete |
| GET | `/` | protected | List, filters |
| GET | `/:id` | protected | |
| PUT | `/:id` | protected | |
| DELETE | `/:id` | admin/superadmin | |
| PATCH | `/:id/status` | protected | Status transition |

### `/api/seo` — `src/routes/seoRoutes.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/page/:websiteSlug/*` | **public** | Meta tags for a page |
| GET | `/schema/blog/:websiteSlug/:blogSlug` | **public** | JSON-LD for blog |
| GET | `/stats` | protected | SeoMetadata rollups |
| GET | `/` | protected | List SeoMetadata |
| POST | `/` | protected | Create SeoMetadata |
| GET | `/:id` | protected | |
| PUT | `/:id` | protected | |
| DELETE | `/:id` | admin/superadmin | |

### `/api/analytics` — `src/routes/analyticsRoutes.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/track` | **public** | trackLimiter (60/min/IP), beacon-friendly body parser, skipped from global apiLimiter |
| GET | `/overview` | protected | `?range=day\|week\|month\|year&websiteSlug=` |
| GET | `/timeseries` | protected | Bucketed series, UTC-aligned `$dateTrunc` |
| GET | `/top-pages` | protected | `?range=&limit=&websiteSlug=` |
| GET | `/recent` | protected | `?limit=&websiteSlug=` |
| GET | `/breakdown` | protected | Device + referrer breakdown |
| GET | `/funnel` | protected | 3-stage session funnel (visitors → cta_click → form_submit) |
| GET | `/tenant-comparison` | protected | Per-tenant rollups + delta + top page |
| GET | `/top-blogs` | protected | `blog_view` aggregates hydrated with Blog metadata |
| GET | `/content-performance` | protected | Blog corpus × analytics, with `isStale` flag |
| GET | `/realtime` | protected | `?minutes=&limit=` — last N min events + activeNow |
| GET | `/landing-pages` | protected | First page_view per session |
| GET | `/exit-pages` | protected | Last page_view per session |
| GET | `/engagement` | protected | **Burst-session model** — avg duration / pages / bounce % |
| GET | `/returning` | protected | **Phase 2.0** returning visitor % (sessionId intersection across windows) |
| GET | `/page-conversion` | protected | **Phase 2.0** per-page conversion rate |
| GET | `/page-bounce` | protected | **Phase 2.0** per-page bounce rate (first-page landing) |
| GET | `/anomalies` | protected | **Phase 2.0** 7-detector anomaly engine — severity-sorted output |
| GET | `/blog-trends` | protected | **Phase 3.1** per-blog current vs previous-window view + session deltas (drives Content Decay engine) |
| GET | `/_debug` | protected | Diagnostic: storage state, window, timeseries preview |

### `/api/ai` — `src/routes/aiRoutes.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | protected | Providers + 8-model registry + 9 routing chains + log stats |
| GET | `/recent?limit=` | protected | Metadata-only AI request log (no prompt bodies) |
| POST | `/test` | protected + role (`superadmin`/`admin`/`seo_manager`) | Free-form prompt; accepts `feature` for routing |
| POST | `/model-test` | protected + role | Direct single-model probe; bypasses routing + fallback |
| POST | `/route-test` | protected + role | Exercise feature chain incl. cross-provider fallover |
| POST | `/blog/titles` | protected | 7-category AI title suggestions (`feature: 'titles'`) |
| POST | `/blog/meta-descriptions` | protected | 7-category AI meta descriptions (`feature: 'meta_descriptions'`) |

All AI routes share a dedicated `aiLimiter` (`20/min/IP`, prod-only) mounted before the router. Keys are backend-only; the orchestrator (`AIProviderService`) resolves the model chain via `modelRegistry` + `routingStrategy`. Frontend never sees provider credentials.

### `/api/campaigns` — `src/routes/campaignRoutes.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | protected | List (filter `?targetWebsite=&status=&websiteSlug=`); hydrates progress + velocity (publishedPerWeek, overdueDrafts, daysRemaining, completionPct, risk) |
| POST | `/` | protected | Create — requires `name`, `targetWebsite`; accepts targetSeoScore + assignedTeam |
| GET | `/:id` | protected | Single — hydrates `blogs[]` list |
| PUT | `/:id` | protected | Update (targetWebsite immutable post-create to preserve tenant isolation) |
| DELETE | `/:id` | protected | Delete (detaches all blogs first — no cascade) |
| POST | `/:id/assign-blogs` | protected | Bulk-assign blogs to campaign — tenant-scoped (only same-tenant blogs accepted) |

### `/sitemap` — `src/routes/sitemapRoutes.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/index.xml` | **public** | Master sitemap |
| GET | `/:slug.xml` | **public** | Per-tenant sitemap XML |
| GET | `/stats/:websiteId` | protected | URL counts |
| POST | `/ping/:websiteSlug` | protected | Pings Google + Bing |

### `/robots` — inline in `src/app.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/:slug.txt` | **public** | Per-tenant robots.txt |

### `/api/health` — inline in `src/app.js`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | **public** | Health check, exempt from rate limiter |

---

## 3. Middleware Chains (Highest-Risk Routes)

### `POST /api/leads/submit`
```
trustProxy → cors → compression → morgan
  → apiLimiter (skipped dev, skipped for /api/analytics/track + /api/health)
  → bodyParser
  → leadSubmitLimiter (10/15min/IP)
  → spamProtection (6 layers)
  → leadSubmitRules (express-validator)
  → validate
  → submitLead
    ├─ Website.findById verification
    ├─ Lead.create()
    └─ emitFormSubmitEvent() ← server-authoritative AnalyticsEvent
```

### `POST /api/analytics/track`
```
trustProxy → cors → compression → morgan
  → apiLimiter SKIP (excluded by path match)
  → trackLimiter (60/min/IP)
  → beacon body parser (text/plain + application/json, 8kb cap)
  → trackEvent
    ├─ parse body defensively (handles sendBeacon Blob)
    ├─ validate eventType + websiteSlug + sessionId
    ├─ parseUA → drops bots
    └─ AnalyticsEvent.create()
```

### `POST /api/auth/login`
```
trustProxy → cors → compression → morgan
  → apiLimiter (skipped dev)
  → authLimiter (20/15min/IP, skipped dev)
  → bodyParser
  → loginRules → validate
  → loginController → bcrypt.compare → jwt.sign → response
```

---

## 4. Rate Limiter Inventory

| Limiter | Scope | Window | Max | Skip rule |
|---|---|---|---|---|
| `apiLimiter` | `/api/*` | 15 min | 100 | `!isProd` OR path is `/api/health` OR `/api/analytics/track` |
| `authLimiter` | `/api/auth/login` | 15 min | 20 | `!isProd` |
| `leadSubmitLimiter` | `/api/leads/submit` + `/api/leads/` (POST) | 15 min | 10 | none — protects against bot floods even in dev |
| `trackLimiter` | `/api/analytics/track` | 1 min | 60 | none |
| `aiLimiter` | `/api/ai/*` | 1 min | 20 (`AI_RATE_LIMIT_MAX` overrides) | `!isProd` |

`isProd` = `config.env === 'production'` from `src/config/index.js`.

---

## 5. Critical Route Ordering

`src/app.js` must mount in this order to avoid collisions:

1. `app.use('/api', apiLimiter)` — before route mounts
2. `app.use('/api/auth/login', authLimiter)` — before `/api/auth` mount
3. `app.use('/api/auth', authRoutes)`
4. `app.use('/api/websites', websiteRoutes)`
5. `app.use('/api/blogs', blogRoutes)`
6. `app.use('/api/leads', leadRoutes)`
7. `app.use('/api/seo', seoRoutes)`
8. `app.use('/api/analytics', analyticsRoutes)`
8a. `app.use('/api/campaigns', campaignRoutes)`
8b. `app.use('/api/ai', aiLimiter)` then `app.use('/api/ai', aiRoutes)` — limiter MUST mount before the router
9. `app.use('/sitemap', sitemapRoutes)` — `/index.xml` route MUST be defined before `/:slug.xml` inside the router
10. `app.get('/robots/:slug.txt', ...)` — inline handler. MUST be mounted before any catch-all
11. Static asset serving (if any)
12. `app.use((req, res) => ...)` — 404 fallback
13. `app.use(errorHandler)` — must be last

Breaking this order can cause:
- robots.txt being eaten by sitemap catch-all (PROJECT_CONTEXT §15 item 1 historical)
- 404 fallback firing before legitimate routes
- Rate limiter bypassed if mounted after routes

---

## 6. Vite Dev Proxy (`client/vite.config.js`)

```js
proxy: {
  '/api':     { target: 'http://localhost:5000', changeOrigin: true },
  '/sitemap': { target: 'http://localhost:5000', changeOrigin: true },
  '/robots':  { target: 'http://localhost:5000', changeOrigin: true },
}
```

All three prefixes proxy to the backend so the frontend can call them with relative URLs in both dev and prod.

---

## 7. CORS Whitelist

`src/app.js` CORS config (driven by `CORS_ORIGIN` env):
- `http://localhost:5173`
- `http://localhost:5174`
- Future: production hostnames added via env

---

## 8. Public vs Protected Summary

**Public (no auth required):**
- All sitemap + robots routes
- All marketing site pages (`/hrms*`, `/tickets*`)
- `GET /api/websites/public/:slug`
- `GET /api/blogs/website/:slug` and `:websiteSlug/:blogSlug`
- `GET /api/seo/page/...` and `/schema/blog/...`
- `POST /api/leads/submit` (rate-limited)
- `POST /api/analytics/track` (rate-limited)
- `GET /api/health`

**Protected (JWT required):**
- All admin pages (`/`, `/blogs`, `/leads`, `/websites`, `/seo`, etc.)
- All admin API endpoints under `/api/*` except those explicitly listed as public above
- `GET /sitemap/stats/:websiteId`
- `POST /sitemap/ping/:websiteSlug`

**Superadmin-only:**
- `DELETE /api/websites/:id`
- `POST /api/websites/_cleanup-demo`
- `POST /api/leads/bulk-delete`

---

*End of routing map.*
</content>
</invoke>