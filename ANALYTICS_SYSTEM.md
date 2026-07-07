# Mavro Platform — Analytics System

**Backend:** `src/models/AnalyticsEvent.js`, `src/services/analyticsService.js`, `src/controllers/analyticsController.js`, `src/routes/analyticsRoutes.js`
**Frontend:** `client/src/lib/analytics.js`, `client/src/hooks/useTrackPageView.js`, `client/src/api/analytics.js`

---

## 1. Event Schema

`AnalyticsEvent` (Mongoose):

```
websiteSlug   String  required, lowercase, indexed (denormalized for fast tenant scoping)
eventType     String  required, enum ['page_view','blog_view','form_submit','cta_click']
page          String  required (path + optional query)
sessionId     String  required, max 64 chars (per-tab in sessionStorage)
ipAddress     String  nullable
referrer      String  nullable, max 1000
deviceType    String  enum ['desktop','tablet','mobile','bot','unknown']
browser       String  Chrome/Firefox/Edge/Safari/Opera
os            String  Windows/macOS/Android/iOS/Linux
userAgent     String  max 1000
country       String  nullable (reserved for future geo lookup)
meta          Mixed   per-event payload — ctaName, blogSlug, formId, leadId, etc.
timestamp     Date    default Date.now
```

**Indexes:**
- `{websiteSlug: 1, timestamp: -1}`
- `{websiteSlug: 1, eventType: 1, timestamp: -1}`
- `{websiteSlug: 1, page: 1, timestamp: -1}`
- `{sessionId: 1}`
- TTL: `{timestamp: 1, expireAfterSeconds: 540 * 86400}` → 540-day auto-purge

---

## 2. Event Types

| eventType | Fired when | Source |
|---|---|---|
| `page_view` | Route change on public site | Frontend (`useTrackPageView` in `HrmsLayout`/`TicketsLayout`) |
| `blog_view` | Blog detail page loads + blog fetched OK | Frontend (`HrmsBlogDetail`/`TicketsBlogDetail`) |
| `cta_click` | Hero / Navbar CTA buttons clicked | Frontend (`trackCtaClick` in Hero, CommandNavbar, OperationsNavbar) |
| `form_submit` | Lead document created | **Backend** (`leadController.submitLead` → `emitFormSubmitEvent`) |
| `call_click` | Phone-number tap (spanbix-web `trackCall`, `meta.location`) | Frontend (`track.js` mirror — added to enum Phase 10; earlier mirrors were silently rejected and exist only in GA4) |
| `whatsapp_click` | WhatsApp button tap (spanbix-web `trackWhatsApp`, `meta.location`) | Frontend (`track.js` mirror — added Phase 10, same caveat) |
| `generate_lead` | Reserved — GTM/GA4 conversion event; NOT mirrored to backend (`trackLead` pushes to dataLayer only; `form_submit` stays server-authoritative) | Enum-allowed Phase 10 for future use |

**Why form_submit is server-side:** guarantees `Lead.count == AnalyticsEvent.count(eventType:form_submit)`. Client-side tracking can be dropped (page-unload race, ad-blocker, network failure). Earlier implementation had this skew. Resolved by moving emission to the controller.

---

## 3. Ingestion Pipeline

```
Browser fires event
   ↓
lib/analytics.js → trackEvent({eventType, page, meta})
   ↓
Dedupe check: same eventType+page+meta within 1500ms? → drop
   ↓
Build payload: {websiteSlug, eventType, page, sessionId, referrer, deviceType, meta}
   ↓
navigator.sendBeacon('/api/analytics/track', Blob)
   ↳ fallback: fetch('/api/analytics/track', {keepalive:true})
   ↓
Vite proxy → Backend
   ↓
trackLimiter (60/min/IP, skipped in dev)
   ↓
beacon body parser (accepts text/plain + application/json)
   ↓
analyticsController.trackEvent
   ↓
Parse body (JSON.parse if string)
   ↓
Validate: eventType in enum, websiteSlug present, sessionId present
   ↓
parseUA(req.headers['user-agent']) → {browser, os, device}
   ↓
if device === 'bot' → return {recorded:false, reason:'bot'} (do not write)
   ↓
AnalyticsEvent.create({...})
   ↓
Response: {recorded:true}
```

**Why sendBeacon:** non-blocking, survives `unload`/`pagehide`, browser-managed retry. The fetch fallback uses `keepalive:true` for same survival guarantees.

**Tenant scoping:** `lib/analytics.js` holds `currentTenant` slug, set by layouts:
```js
// HrmsLayout.jsx
setAnalyticsTenant('mavro-hrms');
// TicketsLayout.jsx
setAnalyticsTenant('mavro-ticket-management');
```
Every `trackEvent` call reads `currentTenant` unless explicit `websiteSlug` provided.

---

## 4. Server-Side form_submit Emission

`src/controllers/leadController.js → emitFormSubmitEvent`:

```js
async function emitFormSubmitEvent({ lead, website, req, body }) {
  try {
    const page = body.sourcePage
      ? new URL(body.sourcePage).pathname + (new URL(body.sourcePage).search || '')
      : '/';
    await AnalyticsEvent.create({
      websiteSlug: website.slug,
      eventType: 'form_submit',
      page,
      sessionId: body.sessionId?.slice(0,64) || `lead_${lead._id}`,
      referrer: body.referrer || req.headers['referer'] || null,
      deviceType: classifyDevice(req.headers['user-agent']),
      userAgent: req.headers['user-agent']?.slice(0, 1000),
      ipAddress: req.clientIP || getClientIP(req),
      meta: {
        leadId: String(lead._id),
        formId: body.formId || 'lead-form',
        company: body.company || null,
        sourcePage: body.sourcePage || null,
        utmSource, utmMedium, utmCampaign,
      },
    });
  } catch (e) {
    // Swallowed — analytics failure must not block lead creation
    console.warn('[analytics] form_submit emission failed:', e.message);
  }
}
```

Skipped when `data.isSpam` true (don't inflate dashboard from bot submissions).

Frontend ContactForm passes `sessionId: getOrCreateSession()` + `formId: 'hrms-contact' | 'tickets-contact'` so server-emitted events link back to the same visitor session.

---

## 5. Aggregation Pipelines

`src/services/analyticsService.js`:

### 5.1 `resolveRange(range)`

```
day   → server-local midnight today → now,        bucket: 'hour'
        previous = full calendar yesterday
week  → now-7d → now (rolling),                   bucket: 'day'
month → now-30d → now (rolling),                  bucket: 'day'
year  → now-365d → now (rolling),                 bucket: 'month'
```

**Day is calendar today, not rolling 24h.** User expectation: "Today" pill shows midnight-to-now, excludes yesterday. Week/month/year remain rolling.

Returns `{ current: [start, end], previous: [start, end], bucket, range }` where `previous` is the immediately prior equivalent window. Used for period-over-period delta calculation via `pctChange()`.

### 5.2 `getOverview({websiteSlug, range})`

Runs `aggregateWindow()` twice (current + previous):
- Groups by `eventType` for per-type counts
- Distincts `sessionId` for unique-visitor count
- Counts `Lead` rows in window separately (canonical source for lead count)

Returns:
```
{
  range,
  window: { from, to },
  metrics: {
    visitors:        { value, delta },
    pageViews:       { value, delta },
    blogViews:       { value, delta },
    ctaClicks:       { value, delta },
    formSubmits:     { value, delta },
    leads:           { value, delta },
    conversionRate:  { value, delta }   // (leads / sessions) × 100
  }
}
```

Delta is real % change: `pctChange(curr, prev) = ((curr - prev) / prev) × 100`. Zero-divisor handled (returns 100 if prev=0 and curr>0, else 0).

### 5.3 `getTimeseries({websiteSlug, range})`

Uses `$facet` to compute two parallel branches in one query:
- **events** branch: groups by `{ts: $dateTrunc(timestamp), eventType}` for per-type counts
- **sessions** branch: groups by `ts: $dateTrunc(timestamp)` with `$addToSet: $sessionId` for unique-session-per-bucket count

Merges into `series[]` with shape `{ ts, views, blogViews, ctaClicks, formSubmits, sessions }` per bucket.

**Bucket skeleton fill** — `generateBuckets(start, end, bucket)` produces UTC-aligned bucket markers matching `$dateTrunc` output exactly. Missing buckets default to zeros so the chart x-axis is continuous.

**Critical:** both `$dateTrunc` and `generateBuckets` align to **UTC**. Mismatch (e.g., `setHours(0,0,0,0)` for local midnight) caused empty traffic graph bug — see PROJECT_CONTEXT.md section 15 item 7.

Returns `{ range, bucket, series, eventCount }`.

### 5.4 `getTopPages({websiteSlug, range, limit})`

```
$match { eventType: 'page_view', timestamp window, optional slug }
$group { _id: '$page', views: $sum:1, sessions: $addToSet: '$sessionId' }
$project { page, views, sessions: $size:'$sessions' }
$sort { views: -1 }
$limit
```

### 5.5 `getBreakdown({websiteSlug, range})`

Two pipelines run in parallel:
- Device count by `deviceType`
- Referrer host count via `$ifNull: [{$arrayElemAt: [{$split: ['$referrer', '/']}, 2]}, 'direct']`

Returns `{ devices: [{device, count}], referrers: [{source, count}] }`.

### 5.6 `getRecent({websiteSlug, limit})`

Plain `.find().sort({timestamp:-1}).limit(limit)`. Used for raw event feeds + debugging.

### 5.7 `getFunnel({websiteSlug, range})` — 3-stage operational funnel

Stages: **visitors → cta_click → form_submit**. Each stage records:
- `sessions` — unique sessionIds that fired the stage's event
- `count` — total event volume
- `fromTopPct` — % of top-stage visitors that reached this stage
- `fromPrevPct` — step-conversion from previous stage

Powers `/analytics` ConversionFunnels widget. Reserved 4th stage `form_open` (when wired) plugs in without rework.

### 5.8 `getTenantComparison({range})`

For each active `Website`: in-window sessions, page views, CTA clicks, form submits, leads, conversion rate, previous-window session delta, and top page. Runs N parallel pipelines (N = active tenant count, typically ≤10). Hydrates with `branding` for UI accent strips.

### 5.9 `getTopBlogs({websiteSlug, range, limit})`

Aggregates `blog_view` events by `meta.blogSlug`, then hydrates each row with Blog metadata (title, slug, status, readingTime, publishedAt, targetWebsite). Returns sorted by views desc.

### 5.10 `getContentPerformance({websiteSlug, range, limit})`

Joins the **Blog corpus** (status: published, filtered by website) with `blog_view` aggregates. Returns per-blog `{views, sessions, ageDays, updatedDays, readingTime, isStale}` where `isStale = updatedDays > 180`. Powers the sortable content table.

### 5.11 `getRealtime({websiteSlug, limit, minutes})`

Two parallel queries:
- Last N minutes of events (default 30 min, max 1440)
- Active sessions in last 5 minutes (distinct sessionId count)

Returns `{ activeNow, sinceMinutes, events }`. Polled every 15s by the `/analytics` page.

### 5.12 `getLandingPages` / `getExitPages`

Both group page_view events by session, then pick first (landing) or last (exit) page chronologically. Group by that page, count occurrences. Returns top N.

### 5.13 `getEngagement({websiteSlug, range})` — **Burst-session model**

**Why burst-splitting:** sessionStorage-backed sessionIds persist for the entire tab lifetime including idle time. Without splitting, a single tab with intermittent activity over hours reports avg session duration of 49+ minutes.

**Algorithm:**
```
For each sessionId:
  Sort events by timestamp
  burst_start = first event's timestamp
  burst_end   = first event's timestamp
  burst_pages = (first event is page_view ? 1 : 0)

  For each subsequent event:
    If (current.ts − previous.ts) > 30 minutes:
      Record burst { duration: burst_end − burst_start, pages: burst_pages }
      Start new burst
    burst_end = current.ts
    If event is page_view: burst_pages++

  Record final burst

Return:
  sessions  = total burst count
  avgSessionDurationSec = sum(burst.duration) / total bursts
  avgPagesPerSession     = sum(burst.pages) / total bursts
  bouncePct              = bursts with ≤1 page_view / total bursts
```

Single sessionId can produce multiple bursts if there are inactivity gaps ≥30 min. The "Visitors" metric in `getOverview` remains `distinct sessionId` (counts unique people); engagement's `sessions` is bursts (counts active sittings). Different concepts deliberately.

---

## 6. Dashboard Consumption

`client/src/pages/Dashboard.jsx`:

```
on mount + on range change:
  Promise.all([
    getAnalyticsOverview({range}),
    getAnalyticsTimeseries({range}),
    getAnalyticsTopPages({range, limit:6}),
    getAnalyticsBreakdown({range}),
  ])
```

Renders:
- **MetricOrbs** with `value` + `TrendPill(delta)` for Visitors, Page Views, Blog Views, Leads
- **Traffic & Sessions chart** — Recharts AreaChart of `views` + `sessions` over time bucket
- **Conversion Engine** panel — CTA Clicks, Form Submits, Conversion Rate with real deltas
- **Top Pages** list — progress-bar rows
- **Device Mix** panel — animated bar chart
- **Top Referrers** list — host name + count

Range filter pills (day/week/month/year) re-trigger fetches.

---

## 7. Public Tracker (`client/src/lib/analytics.js`)

```js
const SESSION_KEY = 'mavro_analytics_session';
const DEDUPE_MS = 1500;
const DEFAULT_TENANT = 'mavro-hrms';

let currentTenant = DEFAULT_TENANT;
let lastKey = null;
let lastSentAt = 0;

export function setAnalyticsTenant(slug) { /* mutates currentTenant */ }
export function getAnalyticsTenant() { return currentTenant; }
export function getOrCreateSession() { /* sessionStorage-backed */ }

export function trackEvent({eventType, page, websiteSlug, meta}) {
  // dedupe → build payload → sendBeacon → fallback fetch keepalive
  // silent failure: never throws
}

export const trackPageView    = (page, meta)        => trackEvent({eventType:'page_view', page, meta});
export const trackBlogView    = (slug, page)        => trackEvent({eventType:'blog_view', page, meta:{blogSlug:slug}});
export const trackCtaClick    = (ctaName, meta)     => trackEvent({eventType:'cta_click', meta:{ctaName, ...meta}});
export const trackFormSubmit  = (formId, meta)      => trackEvent({eventType:'form_submit', meta:{formId, ...meta}});
```

`useTrackPageView()` hook: subscribes to `useLocation()`, fires `trackPageView(pathname + search)` on every change.

---

## 8. Multi-Tenant Scoping

Every aggregation accepts `websiteSlug`:
- `'all'` → no slug filter (cross-tenant)
- specific slug → filtered

**Dashboard now reads from `TenantContext`** (`client/src/context/TenantContext.jsx`):
- `Topbar` `TenantSwitcher` renders ONLY on `/` (via `useLocation()` check) — sets `selected`
- Dashboard subscribes to `selected` slug → passes `?websiteSlug=` to every analytics fetch
- Dashboard also splits initial heavy-data fetch based on scope (cross-tenant `getBlogStats/getLeadStats` vs scoped `getBlogs/getLeads`)
- Analytics Intelligence page has its own `AnalyticsFilters` with its own website selector (not tied to global Topbar context, by design — analytics is a deep-dive view, not the dashboard)

Public tracker always sends a slug (set by tenant layout). No event ever lands with mismatched tenant.

---

## 9. Privacy & Compliance Considerations

- IP addresses captured in raw form. For GDPR compliance prior to production: hash with daily-rotating salt or store only `/24` prefix.
- User agent stored in raw form (up to 1000 chars). Used for device classification.
- 540-day TTL ensures eventual purge of stale events.
- No PII in `meta` payloads by design.
- Session IDs are random per-tab, expire on tab close.

---

## 10. Debug Tooling

### 10.1 Live debug endpoint
`GET /api/analytics/_debug?websiteSlug=&range=` — auth-protected. Returns:
```
{
  serverNowUTC,
  storage: { totalEvents, distinctSessions, distinctSlugs, byType, lastEvents },
  window: { range, current, previous, eventsInWindow, bucket },
  overview: {...},
  timeseriesPreview: { eventCount, bucketCount, firstBucket, lastBucket, nonZeroBuckets }
}
```
Use for diagnosing missing events / bucket alignment / window logic.

### 10.2 CLI script
`node src/utils/debugAnalytics.js` — connects to Mongo, prints counts + recent events + window state. Useful when backend is offline.

---

## 11. Analytics Intelligence Page

`client/src/pages/Analytics.jsx` consumes 8 backend endpoints to build an operational telemetry surface:

```
GET /api/analytics/overview            — totals + period deltas + conversion rate
GET /api/analytics/timeseries          — bucketed timeline (views, sessions, blogViews, ctaClicks, formSubmits)
GET /api/analytics/funnel              — 3-stage visitors → cta_click → form_submit
GET /api/analytics/tenant-comparison   — per-tenant rollups + deltas + top page
GET /api/analytics/top-blogs           — blog_view-based ranking with hydration
GET /api/analytics/content-performance — Blog corpus × blog_view aggregates + stale flags
GET /api/analytics/landing-pages       — first-touch per session
GET /api/analytics/exit-pages          — last-touch per session
GET /api/analytics/engagement          — burst-session model
GET /api/analytics/realtime            — last N minutes events + activeNow (5-min window)
GET /api/analytics/returning           — Phase 2.0 returning visitor % (current ∩ previous sessionId sets)
GET /api/analytics/page-conversion     — Phase 2.0 per-page conversion rate
GET /api/analytics/page-bounce         — Phase 2.0 per-page bounce rate (first-page landing single-event ratio)
GET /api/analytics/anomalies           — Phase 2.0 7-detector anomaly engine
GET /api/analytics/blog-trends         — Phase 3.1 per-blog current vs previous-window view + session deltas (drives Content Decay engine on /seo)
```

**Frontend composition** (`client/src/components/analytics/`):
- `AnalyticsFilters.jsx` — range pills + website select + refresh + live `activeNow` badge
- `AnalyticsOverview.jsx` — 5 KPI tiles with TrendPills + 4 engagement tiles (Avg Session / Pages/Session / Bounce % / **Returning %**)
- `TrafficTimeline.jsx` — Recharts AreaChart of 3 series with empty state
- `ConversionFunnels.jsx` — 3-stage funnel with step + from-top conversion %
- `TenantComparison.jsx` — per-tenant cards gated to `slug === 'all'`
- `RealtimeEventFeed.jsx` — animated event stream, time-ago, polled 15s
- `ContentPerformance.jsx` — sortable table with stale flag
- `TrafficIntelligence.jsx` — 3-up: landing pages / exit pages / top blogs with progress bars
- `SeoTelemetry.jsx` — cross-corpus SEO audit gauge (reuses `seoHealth.auditCorpus`)
- `OperationalInsights.jsx` — narrative observation generator
- **`AnomalyAlerts.jsx`** (Phase 2.0) — severity-tagged anomaly cards with recommendations; all-clear ShieldCheck state when empty
- **`BehaviorIntelligence.jsx`** (Phase 2.0) — 2-up panel: Best Converting Pages (emerald) + Highest Bounce Pages (rose)
- **`InfoPopover.jsx`** — reusable contextual-help popover. Hover/tap/focus to open; portaled to `<body>`; auto-flips above when bottom-space insufficient; closes on outside-click, escape, scroll, blur. Sources copy from `lib/analyticsCopy.js` via `infoKey` prop or accepts inline `{title, text}`. Wired into every metric tile + section header across the page.

### 11.1 OperationalInsights generator

`generateInsights({tenantComparison, contentPerformance, overview, engagement, funnel})` derives narrative observations from real metrics. Pure function. No fake outputs — if a signal can't be computed, the insight is skipped.

Surfaces:
- Tenant conversion comparison ("X converts N% higher than Y")
- Dominant blog ("X drives N% of blog traffic")
- Stale content count (>180-day-update warning)
- Bounce rate flags (>70% critical, ≤30% positive)
- Funnel drop-off (CTA-to-form ratio, CTA-to-top ratio)
- Visitor growth (+50% or -30%)
- Lead capture surge (+100%)

### 11.2 Realtime poll loop

Dedicated `useEffect` in `Analytics.jsx` runs every 15s. Updates `RealtimeEventFeed` + the `liveCount` badge in `AnalyticsFilters`. Separate from the main fetch effect to avoid re-firing all 8 endpoints on each tick.

### 11.3 SEO Telemetry reuse

`SeoTelemetry.jsx` fetches `/api/blogs?includeContent=true&targetWebsite=` then runs `seoHealth.auditCorpus()` client-side. Same engine as `/seo` page → no scoring divergence.

### 11.4 Anomaly Detection Engine (Phase 2.0)

`src/services/anomalyService.js` — 7 pure-function detectors orchestrated by `getAnomalies({websiteSlug, range})`:

| Detector | Trigger | Severity |
|---|---|---|
| `detectTrafficSpike` | sessions > 2× previous (prev ≥ 3, curr ≥ 5) | notice |
| `detectTrafficDrop` | sessions < 0.5× previous (prev ≥ 8) | critical |
| `detectConversionDrop` | leads/sessions ratio < 70% of previous (prev ≥ 0.5%) | critical |
| `detectBounceSpike` | burst-session bounce > 1.5× previous (prev ≥ 10%) | warning |
| `detectInactiveTenants` | 0 events in 7d + has published blogs | warning |
| `detectStaleTenants` | no publish in 30+ days OR never published | notice |
| `detectDecliningBlogs` | top blog views < 50% of previous (prev ≥ 5) | warning |

**Rules:**
- Each detector returns `null` when insufficient data — no false positives from empty windows
- Tenant-comparison detectors (`detectInactiveTenants`, `detectStaleTenants`) only run when scope is `all` (they enumerate all websites)
- Output sorted by severity (critical → warning → notice) then alphabetically by kind
- Returns `{severity, kind, title, message, recommendation, meta}` — `meta` carries diagnostic numbers for downstream telemetry/alerting

### 11.5 Behavior Intelligence (Phase 2.0)

- **`getReturningVisitors`** — `Set.intersection` between current-window and previous-window distinct sessionId sets. Returns `{total, returning, returningPct}`.
- **`getPageConversion`** — pulls all events in window, builds `submittedSessions Set` from form_submit events, then for each page builds a `Set<sessionId>` of visitors. Conversion rate = `|visitors ∩ submittedSessions| / |visitors|`. Requires ≥2 sessions per page to include.
- **`getPageBounce`** — groups `page_view` events by session, picks first page (landing). Per page: `bouncePct = sessions with exactly 1 event / total sessions landing here`. Requires ≥2 visits per page.

### 11.7 Blog trends (Phase 3.1) — drives Content Decay engine

`src/services/analyticsService.js → getBlogTrends({websiteSlug, range})`:

- For each published blog in the tenant scope, runs TWO `$facet`-style aggregations over `blog_view` events:
  - **Current window** = `resolveRange(range).current` (default range='month')
  - **Previous window** = `resolveRange(range).previous`
- Per blog returns `{_id, title, slug, tenant, tenantSlug, publishedAt, updatedAt, ageDays, updatedDays, current:{views,sessions}, previous:{views,sessions}, viewsDeltaPct, sessionsDeltaPct}`
- Empty deltas (no events in window) → `viewsDeltaPct = 0`
- Consumed by `/seo`'s Content Decay engine (`client/src/lib/contentDecay.js`) — engagement sub-score weight 30% comes from `viewsDeltaPct`

Endpoint: `GET /api/analytics/blog-trends?websiteSlug=<slug>&range=month` (auth required).

### 11.6 Contextual Help Popover system

`client/src/components/analytics/InfoPopover.jsx` + `client/src/lib/analyticsCopy.js`:

- **Single canonical copy registry** (`METRIC_INFO`) — 18 keys covering visitors, pageViews, ctaClicks, formSubmits, leads, avgSession, pagesPerSession, bounceRate, returningPct, conversionFunnel, operationalInsights, trafficSessions, topLanding, topExit, topBlogs, anomalies, realtime, contentPerformance, tenantComparison, seoTelemetry, bestConverting, highestBounce
- **Single reusable primitive** — no tooltip code duplication across 11 consumer components
- **Usage pattern**: `<InfoPopover infoKey="visitors" />` or `<InfoPopover title="X" text="Y" />`
- **Interaction**: hover/focus on pointer devices, tap on touch devices (UA capability detected); outside-click, escape, scroll, window resize all close
- **Portaled** to `document.body` — survives clipping inside cards with `overflow: hidden` or `backdrop-blur`
- **Auto-flip** above the trigger when remaining bottom space < ~100px
- **Edge-clamped** horizontal position with 8px viewport margin
- **Premium styling**: violet accent strip on top edge, glassmorphism (`bg-popover/95 backdrop-blur-xl border border-violet-500/30`), violet-tinted soft shadow, Framer Motion opacity + scale 0.94→1 at 150ms ease
- **A11y**: semantic `<button>`, `aria-label`, `aria-describedby`, `aria-expanded`, `role="tooltip"`, keyboard navigable
- **Adding a new metric**: append to `METRIC_INFO` registry. Consumer references by key. No tooltip code changes required.

---

## 11. Performance Characteristics

- `AnalyticsEvent.create()` cost: single insert, no transactions
- `$facet` query cost: 2 parallel `$group` operations on indexed `{websiteSlug, timestamp}` — typically <100ms for week-window with 10k events
- TTL purge runs continuously, no manual cleanup needed
- Dedupe key prevents storm-write loops from misbehaving frontend
- Rate limiter caps abuse at 60/min/IP

---

## 12. Future Extensions

- **GSC/Bing import** — push GSC impressions into `AnalyticsEvent` with `eventType: 'gsc_impression'` + `meta: {query, position, clicks}`. Schema supports it (Mixed `meta`).
- **Conversion attribution** — link `cta_click` sessions to subsequent `form_submit` sessions to compute true funnel conversion.
- **Real-time WebSocket feed** — emit to admin sockets when high-priority events fire (form_submit, error events).
- **Anomaly detection** — server-side cron compares current-window vs trailing-7-day baseline, flags traffic spikes/drops.
- **Geographic enrichment** — populate `country` field via IP geolocation on ingestion.

---

## 13. MBR Report — GA4 + Search Console integration (Phase 10, July 2026)

The `/mbr` admin page ("Growth Report") complements the self-hosted analytics with the Google-side view. It replaces the manual monthly Excel MBR.

**Data sources (three, deliberately complementary):**
1. **GA4 Data API** (`src/services/google/ga4Service.js`) — audience, acquisition channels/sources, AI-assistant referrals (regex on `sessionSource`: chatgpt/perplexity/gemini/copilot/claude/…), conversion events (`call_click`, `whatsapp_click`, `cta_click`, `generate_lead`, `form_submit`, `file_download` incl. per-file brochure counts), geo/devices/countries. 12 reports per pull via `batchRunReports` (5 per call); two `dateRanges` per request give MoM deltas in one round-trip (GA4 injects a `dateRange` dimension, split by `date_range_0/1`).
2. **Search Console API** (`gscService.js`) — clicks/impressions/CTR/position totals + daily trend + top queries + top pages. GSC data lags ~2–3 days; the controller does not shift dates.
3. **Own `AnalyticsEvent` store** (`/api/mbr/buttons`) — per-button + per-location click aggregation from `meta.cta`/`meta.ctaName`/`meta.location`. This detail exists in GA4 only behind registered custom dimensions; our Mixed `meta` has it from day one.

**Auth:** zero-dependency service-account OAuth in `googleAuth.js` — RS256 JWT signed with `node:crypto`, exchanged at `oauth2.googleapis.com/token`, cached to expiry. Scopes: `analytics.readonly` + `webmasters.readonly`. Env: `GOOGLE_SERVICE_ACCOUNT_JSON` (raw or base64), `GA4_PROPERTY_ID` (numeric, `541588648`), `GSC_SITE_URL` (`https://www.spanbix.com/`). Unconfigured → 503; the page renders a setup card.

**Ranges:** `?month=YYYY-MM` (calendar month, end clamped to today, previous month clamped to the same day-count so MTD compares like-for-like) or `?start=&end=` (previous = same-length preceding window). Responses cached in-memory 1h per `(kind, range)`.

**Geography map:** `client/src/components/mbr/GeoMap.jsx` — zero map libraries. Bundled 110m GeoJSON (`client/src/assets/world-countries.geo.json`, lazy JS chunk — NOT `public/`, the Vercel SPA-fallback rewrite would swallow it), equirectangular projection, sqrt-scaled opacity ramp, GA4→GeoJSON name aliases, centroid dots for microstates missing from 110m geometry (Singapore, Hong Kong…).

**Event enum note:** `ALLOWED_EVENTS` gained `call_click`/`whatsapp_click`/`generate_lead` in Phase 10. Backend mirrors of call/WhatsApp clicks before July 7 2026 were rejected by the old enum — historical counts for those live only in GA4.

**Multi-source + report hygiene (Phase 10.5):**
- `MBR_SOURCES` env registry (`src/services/google/mbrSources.js`) — JSON array of `{key, label, ga4PropertyId, gscSiteUrl, websiteSlug?, hostname?, credentialsEnv?}`; drives hub tiles, `?source=` param, per-source export sheets. Falls back to a single spanbix source from legacy vars.
- **Per-source service accounts:** `credentialsEnv` names another env var holding that source's own key (raw or base64) — required when sources live in different GCP projects. `googleAuth.js` caches credentials AND OAuth tokens per env-var name. Live sources: **Spanbix** (default `GOOGLE_SERVICE_ACCOUNT_JSON`, property `541588648`, GSC `https://www.spanbix.com/`) and **SaiSatwik** (`GOOGLE_SERVICE_ACCOUNT_JSON_SAISATWIK`, property `368831716`, GSC `https://saisatwik.com/`, account `saisatwik-dashboard@saisatwik-analytics.iam.gserviceaccount.com`).
- **Trend zero-pad clamp:** GA4 zero-pads multi-range daily reports across the UNION of all requested dates (a July range gets 0-rows for June dates). Every trend series is clamped to its own range bounds in `ga4Service` — do not remove, or prior-month zeros bleed into the current chart.
- **Hostname scoping:** every GA4 request carries a `hostName` filter derived from the source (URL-prefix → EXACT host; sc-domain → ENDS_WITH). Protects against multi-site GA4 properties (same tag on two sites) merging pages into one report.
- **404 exclusion:** page titles containing "404"/"not found"/the bare brand label are excluded from every report — bot probes to dead URLs were creating ghost pages and inflating audience counts. spanbix-web ships a branded `not-found.jsx` titled "404 — Page Not Found | Spanbix" so misses stay identifiable.
- **Three-period ranges:** `resolveRanges` always returns `current` + `previous` (day-count-clamped, powers like-for-like MoM tile deltas) + `previousFull` + `previous2` (complete months, power the 3-month comparison table/overlay/export columns). All four ride one GA4 request (4-dateRange limit exactly used).
- **Manual workstreams:** `MbrItem` collection (section + period `YYYY-MM` + Mixed data), definitions centralized in `src/config/mbrSections.js`, CRUD at `/api/mbr/items`. `/api/mbr/export` builds the combined styled workbook via `src/services/mbrExportService.js` (exceljs — backend-only dep).

---

*End of analytics system documentation.*
</content>
</invoke>