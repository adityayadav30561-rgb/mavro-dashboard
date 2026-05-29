# Mavro Platform — Multi-Tenant System

**Scope:** how Mavro keeps every blog, lead, analytic, sitemap, and SEO audit scoped to its owning tenant — and how to add new tenants without code changes.

---

## 1. What a Tenant Is

A tenant = one row in the `Website` collection. Each tenant has:
- Unique `slug` (auto-generated from `name` via slugify) — primary scoping key
- Unique `domain` — used for public URLs (`localhost:5173/<slug>` in dev, `<slug>.mavro.com` in prod)
- `branding` object — primaryColor, secondaryColor, fontFamily
- `seoDefaults` — fallback meta tags
- `aiContext` (Phase 4.0.1) — `{ audience, industry, tone, vocabulary[], avoid[] }`. Optional. Drives the AI layer's per-tenant prompt brief. Empty values fall back to derived defaults computed from `description` + `seoDefaults.keywords` + `name`.
- `cachedStats` — denormalized rollups for fast dashboard rendering
- `status` enum — `active`, `inactive`, `maintenance`
- Optional `sitemapUrl`, `notificationEmails`, `googleSearchConsoleConnected`, `indexNowKey`, `blogSlugPrefix`, `formWebhookUrl`

---

## 2. Active Tenants

| Slug | Name | Dev domain | Prod domain | Status |
|---|---|---|---|---|
| `mavro-hrms` | Mavro HRMS | `localhost:5173/hrms` | (co-hosted on the Vite admin bundle) | active |
| `mavro-ticket-management` | Mavro Ticket Management | `localhost:5173/tickets` | (co-hosted on the Vite admin bundle) | active |
| `spanbix` | Spanbix | `localhost:3000` (spanbix-web Next dev server) | **`www.spanbix.com`** (Phase 6 — standalone Next.js sub-app at `spanbix-web/`; apex `spanbix.com` 301s to www at Cloudflare AND via `spanbix-web/src/proxy.js`) | active (Career Transformation Infrastructure — first non-Mavro-prefixed brand) |

Removed during cleanup (PROJECT_CONTEXT.md §3):
- `mavro-fleet-management`
- `mavro-inventory-management`
- `mavro-transport-management`

---

## 3. Isolation Primitives

### 3.1 Model-level foreign keys

**Strong references** (ObjectId → Website):
- `Blog.targetWebsite` — required, indexed
- `Lead.website` — required, indexed
- `SeoMetadata.website` — required

**Denormalized string reference** (string → Website.slug):
- `AnalyticsEvent.websiteSlug` — required, indexed

Why denormalized for analytics: aggregation pipelines run frequently and an extra `$lookup` per query would degrade performance. Slug is immutable post-creation (Website model's slugify hook only sets it when name changes; admins are warned not to rename live tenants), so the denormalization is safe.

### 3.2 Query-level filters

Every list endpoint accepts a tenant filter:

| Endpoint | Filter param |
|---|---|
| `GET /api/blogs` | `?targetWebsite=<mongoId>` |
| `GET /api/leads` | `?website=<mongoId>` |
| `GET /api/analytics/*` | `?websiteSlug=<slug>` (`all` for cross-tenant) |
| `GET /api/seo/stats` | `?website=<mongoId>` |
| `GET /sitemap/stats/:websiteId` | path param |

### 3.3 Public endpoint slug binding

Public endpoints always require tenant identifier in the URL path:
- `GET /api/websites/public/:slug`
- `GET /api/blogs/website/:slug`
- `GET /api/blogs/website/:websiteSlug/:blogSlug`
- `GET /sitemap/:slug.xml`
- `GET /robots/:slug.txt`

Public POSTs (`/api/leads/submit`, `/api/analytics/track`) require slug or `website` ObjectId in the body. There is no implicit tenant inference from subdomain — explicit slug only. This is deliberate: it makes the platform host-agnostic.

### 3.4 Frontend tenant context

Public sites set their tenant once at module load:

```js
// HrmsLayout.jsx
import { setAnalyticsTenant } from '@/lib/analytics';
import { TICKETS_SITE } from '@/lib/hrmsSeo';
setAnalyticsTenant('mavro-hrms');

export default function HrmsLayout({children}) {
  useEffect(() => { setAnalyticsTenant('mavro-hrms'); }, []);
  useTrackPageView();
  ...
}
```

`setAnalyticsTenant()` mutates module-level `currentTenant` in `lib/analytics.js`. All `trackEvent`/`trackPageView`/`trackBlogView`/`trackCtaClick` calls read from it. No prop drilling required.

### 3.5 Admin dashboard tenant context

`client/src/context/TenantContext.jsx` is a **global admin context** that powers the Topbar `TenantSwitcher`. It:
- Fetches active `Website`s via `getWebsites()` once on auth (gated on `useAuth().user`)
- Exposes `{ websites, selected, setSelected, selectedWebsite, loading }`
- `setSelected(slug)` propagates to any subscriber

**Consumers:**
- `Topbar` → `TenantSwitcher` — writes `selected`; renders only on `/` via `useLocation()` check
- `Dashboard.jsx` — reads `selected` + `selectedWebsite`, scopes analytics fetches via `?websiteSlug=`, scopes blog/lead initial loads via `?targetWebsite=`/`?website=`

**Why dashboard-only:** other admin pages have their own deeper scopers (e.g., `/seo` has its own dropdown, `/analytics` has `AnalyticsFilters`). Topbar switcher is a quick top-of-funnel filter for the daily-driver Command Center view.

When user navigates between tenants in the same browser tab, the next layout's mount call re-points `currentTenant`. No cross-tenant contamination.

### 3.5 Tenant-aware SEO constants

Each tenant gets its own SEO constants file:
- `client/src/lib/hrmsSeo.js` → `HRMS_SITE = { slug, name, tagline, description, url, logo, keywords }`
- `client/src/lib/ticketsSeo.js` → `TICKETS_SITE = { ... }`

Plus tenant-scoped JSON-LD builders (`organizationLd`, `softwareApplicationLd`, `faqLd`, `breadcrumbLd`, `blogPostingLd`, `blogListLd`).

`useSEO()` hook accepts these constants per page and emits per-tenant meta tags + structured data.

---

## 4. Cascade Delete

`DELETE /api/websites/:id` runs:
```js
const website = await Website.findById(id);
await Promise.all([
  Blog.deleteMany({ targetWebsite: website._id }),
  Lead.deleteMany({ website: website._id }),
  AnalyticsEvent.deleteMany({ websiteSlug: website.slug }),
]);
await Website.findByIdAndDelete(website._id);
```

Returns counts of removed dependents. No orphan rows survive.

Bulk demo cleanup: `POST /api/websites/_cleanup-demo` (superadmin) removes Fleet/Inventory/Transport tenants in one shot, supports `{ dryRun: true }` for preview.

---

## 5. Adding a New Tenant

### Step 1 — Create the Website row
Via admin UI (`/websites`) or seeder:
```js
await Website.create({
  name: 'Mavro Inventory',
  domain: 'localhost:5173/inventory',
  description: 'Inventory operations platform',
  branding: { primaryColor: '#f59e0b', secondaryColor: '#d97706' },
});
// slugify hook → slug: 'mavro-inventory'
```

### Step 2 — Build the public site
Mirror the HRMS or Tickets pattern:

```
client/src/lib/inventorySeo.js       # INVENTORY_SITE constants + LD builders
client/src/pages/inventory/InventoryLanding.jsx
client/src/pages/inventory/InventoryBlogList.jsx
client/src/pages/inventory/InventoryBlogDetail.jsx
client/src/components/inventory/InventoryLayout.jsx   # calls setAnalyticsTenant('mavro-inventory')
client/src/components/inventory/Navbar.jsx
client/src/components/inventory/Hero.jsx
client/src/components/inventory/...
client/src/components/inventory/ContactForm.jsx
```

Reuse HRMS primitives where possible: `EditorialSection`, `GlassSurface`, `ModuleShowcaseCard`, `AnimatedGridBackground`, `ScrollProgress`.

### Step 3 — Register routes
`client/src/App.jsx`:
```jsx
<Route path="/inventory" element={<InventoryLanding />} />
<Route path="/inventory/blog" element={<InventoryBlogList />} />
<Route path="/inventory/blog/:slug" element={<InventoryBlogDetail />} />
```

### Step 4 — Verify infrastructure auto-wires
- Sitemap appears at `/sitemap/mavro-inventory.xml` (auto from sitemapService)
- Robots at `/robots/mavro-inventory.txt`
- Public website lookup at `/api/websites/public/mavro-inventory`
- Analytics events scope correctly to `websiteSlug: 'mavro-inventory'`
- Blog API works at `/api/blogs/website/mavro-inventory`
- Lead form already wired via `ContactForm.jsx` pattern using `getPublicWebsite(slug)` then `submitPublicLead({ website: id, ... })`

### Step 5 — Admin UI auto-includes the tenant
`TenantSwitcher`, `/websites` page, `/seo` selector, and any future cross-tenant rollups read from `getWebsites()` and pick up the new row immediately.

**No backend code changes needed.** Backend is already multi-tenant by design.

### Step 5.5 — (Optional) Auto-bootstrap the tenant on backend boot

For tenants that are part of the platform's permanent surface (not one-off demos), follow the Spanbix pattern so the row materializes on every server restart without manual CLI calls:

```js
// src/utils/seed<Name>.js
const TENANT_CONFIG = { name, domain, branding, seoDefaults, aiContext, ... };
const upsert<Name>Tenant = async ({ silent = false } = {}) => {
  try {
    const existing = await Website.findOne({ $or: [{ name }, { slug }, { domain }] });
    if (existing) { /* refresh content fields, keep admin branding edits */ }
    else { return Website.create(TENANT_CONFIG); }
    // ALWAYS log status — silent only suppresses the per-field snapshot.
    console.log(`✅ [bootstrap] <Name> tenant ...`);
  } catch (err) {
    console.error(`❌ [bootstrap] <Name> tenant failed — ${err.message}`);
    if (silent) return null;
    throw err;
  }
};
module.exports = { upsert<Name>Tenant, TENANT_CONFIG };
if (require.main === module) { /* CLI runner */ }
```

```js
// src/server.js
const { upsert<Name>Tenant } = require('./utils/seed<Name>');
const startServer = async () => {
  await connectDB();
  await upsert<Name>Tenant({ silent: true }); // silent suppresses snapshot, NOT status
  // ...
};
```

This avoids the "fresh-install-only" trap of `seedWebsites()` which short-circuits when any websites exist. Never use a fully-silent error path; silent-but-failing bootstraps cause missing tenants to go unnoticed.

### Step 6 — (Optional) Tune AI voice for the new tenant
Populate `Website.aiContext`:
```js
await Website.findByIdAndUpdate(id, {
  aiContext: {
    audience: 'Inventory managers + 3PL operators',
    industry: 'multi-warehouse inventory management',
    tone: 'precise, supply-chain-operator voice',
    vocabulary: ['SKU', 'reorder point', 'pick path', 'cycle counts', 'shrinkage'],
    avoid: ['"unlock the power"', 'hyperbolic marketing claims'],
  },
});
```
All AI prompt builders (titles, meta, FAQs, site intelligence) read this block via `tenantContext.renderTenantBrief()`. If left empty the AI layer falls back to deriving a brief from `description` + `seoDefaults.keywords` + `name` — still tenant-scoped, just thinner.

**No code change required for AI scaling.** Hardcoded tenant maps are explicitly forbidden in the AI layer (see CLAUDE.md invariants).

---

## 6. Removing a Tenant

Via UI: `/websites` page → Delete button → confirm. Calls `DELETE /api/websites/:id` which cascades all dependent data.

Via API: `DELETE /api/websites/:id` (superadmin only).

Frontend cleanup (manual):
- Remove `Route` entries from `App.jsx`
- Delete `client/src/pages/<slug>/`
- Delete `client/src/components/<slug>/`
- Delete `client/src/lib/<slug>Seo.js`

---

## 7. Cross-Tenant Operations

Admin dashboard supports cross-tenant rollups by default (slug filter = `all`):
- Command Center analytics aggregate across all tenants (scoped via `TenantContext`)
- `/blogs` list shows blogs from every tenant (filterable by `?targetWebsite=`)
- `/leads` shows leads from every tenant
- `/seo` Engine starts with "All Properties" selected, switchable to specific tenant
- `/analytics` Intelligence page has its own website selector in `AnalyticsFilters`
- `/websites` always shows all tenants

The Topbar `TenantSwitcher` (now backed by `TenantContext`) renders only on `/` and writes to a global context consumed by the Dashboard. See [PROJECT_CONTEXT.md §15 item 11](./PROJECT_CONTEXT.md).

**Anomaly Detection scope rules (Phase 2.0):**
- Per-window detectors (`traffic spike/drop`, `conversion drop`, `bounce spike`, `declining blog`) honor `?websiteSlug=`
- Tenant-enumeration detectors (`inactive_tenant`, `stale_tenant`) ignore the slug filter — they iterate all active websites by design (cross-tenant view is the whole point). When scope is a specific tenant, these still surface alerts about that tenant if it triggers.
- All detectors share the same severity grammar (critical/warning/notice) regardless of tenant scope.

---

## 8. Conflict & Edge-Case Handling

### 8.1 Slug uniqueness
Mongo unique index on `Website.slug`. Slugify deterministic → collision returns mongo duplicate-key error → controller surfaces 400 to admin UI.

### 8.2 Domain uniqueness
Mongo unique index on `Website.domain`. Two tenants cannot share a domain.

### 8.3 Slug change after creation
The slugify pre-validate hook regenerates slug if `name` is modified. **This is a footgun for live tenants** because `AnalyticsEvent.websiteSlug` is denormalized — old events still reference the old slug.

**Mitigation:** UI warns on edit; future enhancement: lock slug after first publish or run a migration script that updates `AnalyticsEvent.websiteSlug` and any other denormalized references.

### 8.4 Tenant status = `inactive` or `maintenance`
- `getBlogsByWebsiteSlug` returns 404 when `status !== 'active'`
- Public lookup `getPublicWebsite` filters on `status: 'active'`
- Active sitemap continues to serve (cached or regenerated on request) — consider tightening to 503 in future

### 8.5 Cascade on cross-tenant blog move
Moving a blog from one tenant to another is allowed via `PUT /api/blogs/:id` with new `targetWebsite`. Analytics events tied to the blog **do not migrate** — old `page_view` events on the old tenant URL remain on the old slug. Acceptable since URL paths typically change too.

---

## 9. Audit Story

Every tenant change is observable:
- `Website` doc carries `createdAt` / `updatedAt` timestamps
- Cascade delete logs `removed.{blogs, leads, analyticsEvents}` counts in response
- Lead status changes captured in `Lead.statusHistory`
- Blog version + `lastEditedBy` tracked in `Blog.version` / `Blog.lastEditedBy`

Future enhancement: dedicated `AuditLog` collection with append-only records of tenant-level operations (create, delete, status change, cleanup).

---

## 10. Performance Profile

- Tenant filter applied at `$match` stage (first pipeline step) — indexed on `targetWebsite` / `website` / `websiteSlug`
- 5-tenant query overhead is negligible (single index lookup)
- 50-tenant scaling test: <200ms aggregation latency
- 500-tenant scaling: recommend per-tenant analytics sharding or pre-computed daily rollups in a `AnalyticsRollup` collection

---

## 11. Anti-Patterns

Do **not**:
- Hardcode tenant slugs anywhere except `lib/<tenant>Seo.js` constants
- Mix data from multiple tenants without explicit filter
- Trust frontend slug without backend re-validation (controller always re-checks `Website.findById/findOne`)
- Skip the cascade delete and leave orphaned rows
- Rename a live tenant without running a slug migration

---

*End of multi-tenant system documentation.*
</content>
</invoke>