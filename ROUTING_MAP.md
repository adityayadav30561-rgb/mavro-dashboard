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

### Public marketing — Spanbix (Phase 5)
| Path | Component | Notes |
|---|---|---|
| `/spanbix` | `pages/spanbix/SpanbixLanding.jsx` | 10-section homepage, EducationalOrganization + FAQ JSON-LD, navy/accent brand, fires `setAnalyticsTenant('spanbix')` |
| `/spanbix/courses` | `pages/spanbix/SpanbixCourses.jsx` | Course catalog, emits `Course` JSON-LD per SAP track |
| `/spanbix/career-paths` | `pages/spanbix/SpanbixCareerPaths.jsx` | Udemy-style horizontal listing of the 4 active SAP tracks (FICO / MM / SD / ABAP) |
| `/spanbix/career-paths/:code` | `pages/spanbix/SpanbixCourseDetail.jsx` | **Phase 5.1** Per-track detail with Individual/Campus pill toggle. Reads `?mode=campus` via `useSearchParams` for deep-linking. Invalid `:code` → `<Navigate to="/spanbix/career-paths" replace />` |
| `/spanbix/campus-programs` | `pages/spanbix/SpanbixCampusPrograms.jsx` | Institutional partnerships + ContactForm |
| `/spanbix/placements` | `pages/spanbix/SpanbixPlacements.jsx` | Success stories + market validation |
| `/spanbix/demo-classes` | `pages/spanbix/SpanbixDemoClasses.jsx` | Free demo previews |
| `/spanbix/about` | `pages/spanbix/SpanbixAbout.jsx` | About + values + FAQs |
| `/spanbix/contact` | `pages/spanbix/SpanbixContact.jsx` | ContactForm wired to `submitPublicLead`, `formId: 'spanbix-contact'` |
| `/spanbix/blog` | `pages/spanbix/SpanbixBlogList.jsx` | Tenant-scoped via `SPANBIX_SITE.slug` |
| `/spanbix/blog/:slug` | `pages/spanbix/SpanbixBlogDetail.jsx` | BlogPosting JSON-LD, fires `blog_view` |

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