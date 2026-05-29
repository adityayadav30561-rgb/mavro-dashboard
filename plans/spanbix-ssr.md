# PLAN — Spanbix SSR Migration (Next.js App Router + ISR)

**Created:** 2026-05-27
**Goal:** Server-render the Spanbix public site + blogs so meta / OG / JSON-LD / content ship in the initial HTML. Blogs published from the dashboard must become indexable **without a redeploy** (on-demand ISR revalidation). Admin dashboard (Vite) stays untouched. Express backend stays the single data source.

---

## Why this is needed (current SEO gap)

`useSEO` (`client/src/hooks/useSEO.js:60`) sets `document.title`, meta, OG, and JSON-LD **client-side inside `useEffect`** — after React mounts. The static `client/index.spanbix.html` shell carries only generic homepage meta for every URL.

| Consumer | Sees per-blog meta? | Why |
|---|---|---|
| Googlebot | ⚠️ Eventually | Renders JS in a slower 2nd wave; crawl-budget heavy, unreliable for fresh content |
| Bing / DuckDuckGo | ❌ Mostly no | Weak JS rendering; indexes the static shell meta |
| Facebook / LinkedIn / WhatsApp / Slack / Twitter | ❌ Never | No JS execution; every blog preview = generic homepage title + blue logo |

SSR fixes this by emitting real per-page meta + content in the server HTML.

## Already GOOD (reuse, do not rebuild)
- Backend blog API returns full content + all SEO fields (`src/controllers/blogController.js:597-616`)
- Sitemap lists published blogs with `lastmod` + image extensions (`src/services/sitemapService.js:111-123`)
- JSON-LD builders correct (`client/src/lib/spanbixSeo.js` → `blogPostingLd:993`, `breadcrumbLd:966`, `blogListLd:1014`)
- Blog model has `seoTitle` (70ch), `seoDescription` (160ch), `keywords`, `canonicalUrl`, `ogImage` (`src/models/Blog.js:54-77`)
- Spanbix is ALREADY a standalone deploy (separate Vercel project + entry) → migrate ONLY Spanbix; admin Vite untouched

## Why Next.js App Router + ISR (not alternatives)
- SSG / `vite-react-ssg` / react-snap → FAILS the hard requirement: a blog published after build has no HTML until next redeploy.
- prerender.io (bots-only) → band-aid, monthly cost, dual-render complexity.
- **Next.js App Router + ISR + on-demand revalidation** → server-rendered HTML for crawlers, `revalidate` keeps it fresh, dashboard publish webhook regenerates the exact page in seconds. Native `generateMetadata` puts meta/OG/JSON-LD in server HTML. Precise fit.

---

## Phase 0 — Documentation Discovery (DONE — consolidated)

**Confirmed facts / Allowed APIs:**
- Backend public endpoints (REUSE as-is):
  - `GET /api/blogs/website/:slug` → list (`blogController.js:544`)
  - `GET /api/blogs/website/:websiteSlug/:blogSlug` → detail w/ `content` HTML (`blogController.js:597`)
- Blog fields available: `seoTitle, seoDescription, keywords, canonicalUrl, ogImage, featuredImage, content, excerpt, author.name, publishedAt, updatedAt` (`Blog.js:54-77`)
- Spanbix slug constant + JSON-LD builders in `client/src/lib/spanbixSeo.js` — copy verbatim.
- Routes to recreate (`SpanbixApp.jsx:35-59`): `/`, `/courses`, `/career-paths`, `/career-paths/:code`, `/campus-programs`, `/about`, `/contact`, `/blog`, `/blog/:slug` (+ scheduler public `/book/:eventSlug`, `/manage/:token`, `/route/:slug`).
- Design system: `client/src/styles/spanbix-redesign.css` (scoped `.spanbix-scope`) + Tailwind. Sections under `client/src/components/spanbix/redesign/`.

**Anti-patterns to avoid:**
- Do NOT use `useSEO` (client-side) for SSR pages — use Next `generateMetadata`.
- Keep `dangerouslySetInnerHTML` for blog body (backend HTML already sanitized) — do not double-process.
- Do NOT duplicate mentor/track data — copy `spanbixSeo.js` as one module.
- Do NOT pull admin-only deps (recharts, react-quill-new, radix) — Spanbix never used them.

**Decision gate (confirm before Phase 1):** Separate Next.js app `spanbix-web`, own Vercel project, points at the same Render API via `NEXT_PUBLIC_API_BASE_URL`. (Recommended over in-monorepo to keep build systems clean.)

---

## Phase 1 — Scaffold Next.js App Router project
**Implement:**
- `npx create-next-app@latest spanbix-web` — App Router, JS, Tailwind yes, `src/` yes.
- Copy Tailwind config + `spanbix-redesign.css`. Import CSS in `app/layout.jsx`.
- Add Google Fonts via `next/font` (Instrument Serif, Geist, JetBrains Mono, DM Serif Display, Sora) — families from `index.spanbix.html:42-47`.
- Env: `NEXT_PUBLIC_API_BASE_URL=https://mavro-dashboard.onrender.com`.

**Verify:** `npm run dev` renders styled page; fonts + Tailwind apply; `.spanbix-scope` tokens resolve.
**Anti-pattern guard:** No admin-only deps.

---

## Phase 2 — Port design system + shared components (COPY, don't rewrite)
**Implement:**
- Copy `client/src/lib/spanbixSeo.js` → `src/lib/spanbixSeo.js` verbatim.
- Copy `client/src/components/spanbix/redesign/**`, `Navbar.jsx`, `Footer.jsx`, `SpanbixLayout.jsx`.
- Add `'use client'` to interactive components (useState/useEffect/framer-motion/forms/carousels/accordions). Static sections stay Server Components.
- Swap `react-router-dom` `<Link>`/`useParams`/`useSearchParams` → `next/link` + `next/navigation`. Drop `withSpanbixBase()` (Next routes are root-relative).
- Move `lib/analytics` calls into `'use client'` components only.

**Verify:** Components render; `grep` confirms no `react-router-dom` import; every hook-using component has `'use client'`.
**Anti-pattern guard:** Don't make the whole tree client — only leaf interactive bits.

---

## Phase 3 — Marketing routes (static / SSG)
**Implement:**
- `app/page.jsx`, `app/courses/page.jsx`, `app/career-paths/page.jsx`, `app/career-paths/[code]/page.jsx`, `app/campus-programs/page.jsx`, `app/about/page.jsx`, `app/contact/page.jsx`.
- `[code]` uses `generateStaticParams()` from `SPANBIX_CAREER_PATHS` codes (fico/mm/sd/abap).
- Per-page `generateMetadata()` copied from each current `useSEO({...})` call.
- JSON-LD via server-rendered `<script type="application/ld+json">`.

**Verify:** `curl /career-paths/fico | grep -i "<title>\|og:title\|application/ld+json"` → present in raw HTML. View-source shows full content.
**Anti-pattern guard:** No `useSEO`. Use `metadata`/`generateMetadata`.

---

## Phase 4 — Blog routes with ISR (SEO-critical)
**Implement:**
- `app/blog/page.jsx` — Server Component. `fetch(\`${API}/api/blogs/website/spanbix?page=...\`, { next: { revalidate: 300 } })`. `generateMetadata` from `SpanbixBlogList.jsx:45-61`.
- `app/blog/[slug]/page.jsx` — Server Component:
  - `generateStaticParams()` → fetch all published slugs.
  - Body: `fetch(\`${API}/api/blogs/website/spanbix/${slug}\`, { next: { revalidate: 300 } })`; render header + `dangerouslySetInnerHTML={{ __html: blog.content }}`.
  - `generateMetadata({ params })` → `{ title: blog.seoTitle||blog.title, description: blog.seoDescription||blog.excerpt, alternates:{canonical: blog.canonicalUrl||url}, openGraph:{ images:[blog.ogImage||blog.featuredImage], type:'article' }, keywords: blog.keywords }`. Field fallbacks from `SpanbixBlogDetail.jsx:62-79`.
  - Server `<script type="application/ld+json">` with `blogPostingLd(blog,url)` + `breadcrumbLd(...)`.
  - `notFound()` on API 404.

**Verify:** `curl /blog/<slug>` raw HTML has real title/description/OG/body/BlogPosting JSON-LD with no JS. FB Sharing Debugger + LinkedIn Post Inspector show per-blog preview.
**Anti-pattern guard:** Fetch in Server Component, never client `useEffect`. `revalidate` on `fetch` options.

---

## Phase 5 — On-demand revalidation (dashboard publish → instant index)
**Implement:**
- `app/api/revalidate/route.js` — POST with shared secret → `revalidatePath('/blog/'+slug)` + `revalidatePath('/blog')`.
- Backend: in publish path (`blogController.js` status→published + `scheduledPublishService` worker), fire-and-forget POST to `https://<spanbix-web>/api/revalidate` with slug + secret.

**Verify:** Publish from dashboard → blog URL server-rendered within seconds, no redeploy. Scheduled publish triggers it too.
**Anti-pattern guard:** Fire-and-forget (don't block publish response). Secret-gate the endpoint.

---

## Phase 6 — Sitemap, robots, redirects
**Implement:**
- `app/sitemap.xml/route.js` proxies `https://mavro-dashboard.onrender.com/sitemap/spanbix.xml` (reuse working backend logic).
- `app/robots.js` (or proxy `/robots/spanbix.txt`).
- `next.config.js` `redirects()` for legacy `/spanbix/*` → `/*` (`SpanbixApp.jsx:64`).

**Verify:** `/sitemap.xml` lists blog URLs w/ `lastmod`; `/robots.txt` resolves; `/spanbix/about` 308 → `/about`.

---

## Phase 7 — Deploy + cutover
**Implement:**
- New Vercel project `spanbix-web` (Next preset). Env `NEXT_PUBLIC_API_BASE_URL`.
- Backend CORS allowlist (`src/app.js`) += new Vercel domain (for contact form + any client calls).
- Point `spanbix.com` DNS at the Next project; retire old Vite Spanbix project after verify.

**Verify (cutover gate):** Google Rich Results Test → BlogPosting valid. `curl -A "facebookexternalhit"` → per-blog OG. Lighthouse SEO ≥ 95. Search Console: submit sitemap, confirm indexing.

---

## Final Phase — Verification checklist
- [ ] `curl` (no JS) on home, course page, blog list, blog detail → real title + description + JSON-LD + body in raw HTML
- [ ] `grep -rL "'use client'"` confirms static sections are Server Components
- [ ] No `react-router-dom` / `useSEO` imports remain
- [ ] FB + LinkedIn debuggers show per-blog previews
- [ ] Dashboard publish → blog live + server-rendered in <60s, no redeploy
- [ ] Sitemap + robots resolve; legacy redirects work
- [ ] Admin (Vite) + HRMS/Tickets builds untouched and still deploy

---

## Effort + tradeoffs
- **Biggest cost:** Phase 2 (porting components + swapping router/Link/SEO idioms) — mechanical, not architectural.
- **Lowest-risk slice (RECOMMENDED START):** Do **blogs only** in Next.js first (Phases 1, 4, 5, 6 for `/blog/*`); keep marketing pages on current Vite site; route `spanbix.com/blog/*` to the Next app via Vercel rewrites. Blogs are the real indexing problem; marketing pages are largely static. ~80% of SEO win for ~40% of effort. Migrate marketing pages (Phase 3) later.

---

## Data shapes (reference)
**Blog detail response (`blogController.js:612-615`):**
```
{ blog: { _id, title, slug, content (HTML), excerpt, featuredImage, readingTime,
          tags[], category, seoTitle, seoDescription, keywords[], canonicalUrl,
          ogImage, author:{name}, publishedAt, updatedAt, createdAt, status },
  website: { name, slug, domain } }
```
**Blog list response (`blogController.js:585-589`):** paginated; each blog has `title, slug, excerpt, featuredImage, seoTitle, seoDescription, keywords, tags, category, readingTime, publishedAt` (NO content).

---

## ✅ ALL PHASES COMPLETE — production cutover landed May 27–29, 2026

This plan is now a historical artefact; the live state of the SSR migration is documented in:

- [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) — Phase 6 section (Phase 6.0 through 6.6) + Phase 6 invariants
- [FUTURE_ROADMAP.md](../FUTURE_ROADMAP.md) — Phase 5.9, 5.9.1, 5.9.2 (SSR migration, canonical cutover, SEO audit fixes)
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Phase 6 section (spanbix-web layout, request lifecycle, publish → revalidate flow, invariants)
- [ROUTING_MAP.md](../ROUTING_MAP.md) — Spanbix (Phase 6 — live on spanbix-web Next.js App Router)
- [DEPLOYMENT.md](../DEPLOYMENT.md) — Current live deployment block
- [spanbix-web/README.md](../spanbix-web/README.md) — per-app operating doc

### What landed vs the plan above

- **Phase 0 (discovery)** — confirmed verbatim.
- **Phase 1 (scaffold)** — done. Next 16.2.6 (Turbopack), App Router, JS, Tailwind. Fonts via `next/font`.
- **Phase 2 (design system + components)** — done. Components ported verbatim from `client/src/components/spanbix/redesign/**`. Server / client split applied. `react-router-dom` removed.
- **Phase 3 (marketing routes)** — done. `app/page.jsx`, `app/courses/page.jsx`, `app/career-paths/page.jsx`, `app/career-paths/[code]/page.jsx` (+ `CourseDetailView.jsx` client island), `app/campus-programs/page.jsx`, `app/about/page.jsx`, `app/contact/page.jsx` (+ `ContactForm.jsx` client island).
- **Phase 4 (blog routes with ISR)** — done. Plus a `Phase 6.5` `AuthorByline` block was added below the article body with enriched `schema.org/Person` JSON-LD (avatar, jobTitle, description, image, url, sameAs).
- **Phase 5 (on-demand revalidation)** — done. The endpoint was later (Phase 6 follow-up) extended to also bust `/sitemap.xml` + `/robots.txt` ISR caches so canonical-host migrations propagate end-to-end without a redeploy.
- **Phase 6 (sitemap / robots / redirects)** — done. Backend sitemap was simultaneously expanded with 9 marketing pages seeded via `SeoMetadata` rows in `seedSpanbix.js → upsertSpanbixStaticPages()` (idempotent `$setOnInsert`).
- **Phase 7 (deploy + cutover)** — done. Cutover went from `spanbix-web.vercel.app` → `spanbix.com` → `www.spanbix.com`. The `www` canonical decision (rather than the apex this plan originally listed) was finalised post-deploy; apex now 301s to www at the Cloudflare edge AND via `spanbix-web/src/proxy.js` (Next 16 Proxy convention, formerly Middleware).

### Notes for anyone re-reading this plan

- The plan said `Next.js 14`. Actual deploy is `Next.js 16.2.6`. The App Router + ISR + on-demand revalidation contract is materially unchanged, but the file convention `middleware.js` is deprecated in 16 — use `proxy.js` exporting `proxy(request)`.
- The plan said use `permanent: true` redirects (which Next emits as 308). The SEO audit later requested explicit 301 for the apex → www redirect; that lives in `proxy.js` because `next.config.mjs` `redirects()` can only emit 307/308.
- The plan stored `lib/spanbixSeo.js` once. Two copies exist now: `client/src/lib/spanbixSeo.js` (Vite admin's last-mile fallback) and `spanbix-web/src/lib/spanbixSeo.js` (the live source on www). Keep them in sync.
- `SPANBIX_WEB_URL` (backend env) was originally `https://spanbix.com`; flipped to `https://www.spanbix.com` during cutover.
- Backend CORS allowlist + preview regex in `src/app.js` already cover every Vercel domain + the apex + www.
