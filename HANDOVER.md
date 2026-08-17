# HANDOVER — read this first on a new machine

Cold-start guide for picking this project up somewhere else. Everything here is
about *getting oriented and running*; the deep detail lives in the other docs,
linked by task in §7.

**Last updated:** 17 Aug 2026.

> ## ⚠️ Two things to know before you copy anything
>
> **1. A zip of this folder contains secrets.** `.env` is gitignored, so
> `git clone` will NOT give you credentials — but a zip of the working directory
> WILL include `.env`, with the Mongo URI, JWT secret, API keys and the
> WordPress application password. Treat that zip like a password file: do not
> email it, do not put it in shared cloud storage, delete it after transfer.
>
> **2. No credential values are written in any committed doc, on purpose.**
> This repo is on GitHub. §4 tells you which secrets exist and where they live,
> never what they are.

---

## 1. What this project is

**Mavro** — an admin dashboard plus the public sites of two businesses.

| Surface | Stack | Lives in | Deployed to |
|---|---|---|---|
| Admin dashboard | React + Vite | `client/` | Vercel (own project) |
| Spanbix public site | Next.js 16 App Router | `spanbix-web/` | Vercel (own project) |
| Backend API | Express + Mongoose | `src/` | Render |
| Database | MongoDB Atlas | — | Atlas |

**Two live tenants, and they are different businesses:**

- **Spanbix** (`spanbix` slug) — SAP training for graduates. Public site is
  `spanbix-web/`, live at **www.spanbix.com**. Runs Google + Meta ads.
- **SaiSatwik** (`saisatwik` slug) — SAP/Salesforce/app-dev services company.
  Its public site is a **separate WordPress install** at **saisatwik.com** that
  is NOT in this repo; we publish to it over the REST API.

HRMS and Ticket Management were removed in Phase 11. Do not resurrect them.

---

## 2. Cold start

```bash
# 1. Node dependencies (root = backend, then each frontend)
npm install
cd client && npm install && cd ..
cd spanbix-web && npm install && cd ..
```

Then put `.env` in the repo root (see §4 — it is not in git).

```bash
# 2. Run the three pieces, each in its own terminal
npm run dev                    # backend  -> http://localhost:5000
cd client && npm run dev       # admin    -> http://localhost:5173
cd spanbix-web && npm run dev  # spanbix  -> http://localhost:3000
```

Health check: `curl http://localhost:5000/api/health`

**Admin login:** `admin@mavro.com` / the value of `ADMIN_PASSWORD` in `.env`.
The user is seeded on first boot by `src/utils/seeder.js`.

### Local-dev quirks that will waste your time otherwise

- **`spanbix-web` local dev points at the deployed Render backend**, because
  `NEXT_PUBLIC_API_BASE_URL` is set in `spanbix-web/.env`. Render's CORS does
  not allow `localhost:3000`, so any form on a locally-run Spanbix page fails
  its website lookup and shows **"Still connecting — try again in a moment."**
  That is environmental, not a bug. To test a form end to end, use the deployed
  site and intercept the write (see §6).
- **A stale `next start` holding port 3000 keeps serving an OLD build** while
  every restart fails with `EADDRINUSE`. It presents exactly as "my change is
  not applying" and has cost hours. Kill it by PID:
  `netstat -ano | grep :3000` then `taskkill //PID <pid> //F`.
  `pkill -f "next start"` does **not** match on Windows.
- **Mongo SRV lookup can fail on some networks** (`querySrv ECONNREFUSED`).
  Workaround for one-off scripts: preload a DNS override,
  `node -r ./dnsfix.js script.js` where `dnsfix.js` is
  `require('dns').setServers(['8.8.8.8','1.1.1.1']);`
- Windows: use `python`, not `python3`. Set `PYTHONIOENCODING=utf-8` for
  unicode output.

---

## 3. Where everything is deployed

| Thing | Where | Notes |
|---|---|---|
| Backend API | Render — `mavro-dashboard.onrender.com` | Free tier sleeps; a cron-job.org ping keeps it warm |
| Admin dashboard | Vercel project, build `npm run build`, root `client/` | |
| Spanbix site | Vercel project, build `npm run build`, root `spanbix-web/` | Custom domain www.spanbix.com |
| SaiSatwik site | WordPress + Divi, self-hosted | Not in this repo; see §5 |
| Database | MongoDB Atlas | |
| DNS / apex redirect | Cloudflare (spanbix.com) | Apex 301s to www |
| Mail | Microsoft 365 for both spanbix.com and saisatwik.com | Confirmed via MX |

`client/vercel.json` is shared by **both** Vercel projects; each project sets
its own Build Command in the Vercel UI.

---

## 4. Credentials — what exists and where it lives

**No values in this file.** All of these are keys in the root `.env`:

| Purpose | Env var(s) |
|---|---|
| Database | `MONGO_URI` |
| Auth signing | `JWT_SECRET`, `JWT_EXPIRE` |
| Seeded admin | `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| CORS allow-list | `CORS_ORIGIN`, `CLIENT_URL` |
| AI providers | `GEMINI_API_KEY`, `OPENROUTER_API_KEY` |
| Spanbix ISR cache-bust | `SPANBIX_WEB_URL`, `REVALIDATE_SECRET` |
| GA4 + Search Console (Spanbix) | `GOOGLE_SERVICE_ACCOUNT_JSON` (base64), `GA4_PROPERTY_ID`, `GSC_SITE_URL` |
| GA4 (SaiSatwik — different GCP project) | `GOOGLE_SERVICE_ACCOUNT_JSON_SAISATWIK` |
| MBR report sources | `MBR_SOURCES` (JSON array) |
| **WordPress publishing** | `SAISATWIK_WP_URL`, `SAISATWIK_WP_USER`, `SAISATWIK_WP_APP_PASSWORD` |

Frontend env, set in the **Vercel UI** for the spanbix-web project (and mirrored
in `spanbix-web/.env` for local):

| Purpose | Env var |
|---|---|
| Backend origin | `NEXT_PUBLIC_API_BASE_URL` |
| Google Tag Manager | `NEXT_PUBLIC_GTM_ID` |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` |

**`REVALIDATE_SECRET` must match** across Render, the spanbix-web Vercel
project, and local `.env`. When it drifts, blog publishes stop busting the
cache and edits appear not to apply — the single most common cause of "my
change isn't showing".

### Dashboard accounts

- **Superadmin:** `admin@mavro.com` — password is `ADMIN_PASSWORD`.
- **Four lead-capture staff** (`leads_agent` role, Lead Capture only):
  Bhumika, Naveen, Kareena, Shikha at `<name>@spanbix.com`. Passwords were
  generated and printed once by `npm run create:leads-agents` and are **not
  stored anywhere in the repo**. Re-run with `-- --reset` to regenerate.

### Third-party consoles you will need (owner's own logins)

Google Ads · Google Analytics + Search Console · Google Cloud (service
accounts) · Meta Events Manager + Ads Manager · Vercel · Render · MongoDB
Atlas · Cloudflare · WordPress admin at saisatwik.com · Microsoft 365.

---

## 5. SaiSatwik: publishing and redesigning the WordPress site

This is the part that is easiest to get wrong, because the site is not in this
repo.

### Publishing a blog post

Posts are **data modules in this repo**, pushed to WordPress over the REST API.
Never written in the WordPress editor.

```bash
# 1. copy src/utils/saisatwik-blogs/_TEMPLATE.js to <slug>.js and write it
# 2. dry run / draft, then publish
npm run create:saisatwik-blog -- <slug>
npm run create:saisatwik-blog -- <slug> --publish
```

Idempotent — re-running updates the same post rather than duplicating. To fix a
mangled post, **edit the data file and re-run**; do not edit in WordPress.

Auth is a WordPress **Application Password** for user `aditya2`. Critical
gotcha: **LiteSpeed strips the Authorization header**, so the install needs an
`.htaccess` forwarding rule or auth fails with `rest_not_logged_in`. The rule is
documented in `SAISATWIK_BLOG_PUBLISHING.md` and in the runner's header
comment.

Full writing standards (SEO/AEO/GEO, readability, anti-AI-detection, clusters,
tags, pre-publish checklist) are in **`SAISATWIK_BLOG_PUBLISHING.md`** — 835
lines, and it is the authority. Cluster and tag registries live in
`src/utils/saisatwik-blogs/CLUSTERS.md` and `TAGS.md`.

### Redesigning the blog page (or anything visual)

The site runs **WordPress + Divi**. Visual changes are made by pasting
head-injection blocks into **Divi → Theme Options → Integration → head**.

Those blocks are **repo-canonical** — edit the file here, then re-paste the
whole box into WordPress:

- `saisatwik-tracking-snippet.html` — first-party analytics tracker
- `saisatwik-blog-enhance.html` — blog design v2 + the v2.1 hero hotfix

Never edit them only inside WordPress; the repo copy is the source of truth and
the next paste would overwrite your change. Two constraints that will bite:
the hero override must stay **longhand** background properties at
`html body.single-post div.et_pb_section…` specificity (the theme's cached
wave-PNG rule ties and beats a shorthand), and the featured-image pull-up of
`-9vw` requires the hero to keep `padding-bottom: calc(56px + 9vw)`.

### SaiSatwik in the dashboard

- The tenant auto-bootstraps on backend boot (`src/utils/seedSaisatwik.js`).
  The slug must stay `saisatwik` — MBR sources, the tracking snippet and
  analytics aggregations all key on it.
- `Website.wordpressUrl` is the flag that makes the SEO engine read the WP
  corpus instead of the local Blog collection. Branch on that field, never on a
  hardcoded slug.
- **There is no SaiSatwik leads page.** A services CRM was built and removed on
  11 Aug 2026 at the owner's request; that pipeline is managed in the owner's
  own Excel. 105 imported lead rows remain in the database, invisible because
  every dashboard page is scoped to Spanbix.

---

## 6. Spanbix: ads, tracking and forms

- **Google Ads** runs on `/sap-course` only. That page is `noindex` (paid
  traffic), has its own minimal chrome, and no pricing anywhere.
- **All Google tags flow through GTM** — never add a raw `gtag.js`/AW snippet,
  that would double-count conversions. IDs and the container layout are in
  `CLAUDE.md` §Phase 8.
- **Meta Pixel** is env-driven and mounted from `app/layout.js`. Two things are
  load-bearing:
  - the **CSP in `next.config.mjs`** must keep `connect.facebook.net` in
    `script-src` and `www.facebook.com` + `connect.facebook.net` in
    `connect-src`, or the browser blocks `fbevents.js` **silently**;
  - **`autoConfig` is disabled on purpose.** `fbevents.js` otherwise invents
    events from button heuristics — it was logging a `Subscribe` on every click
    of "Enroll Now", including blocked clicks that saved nothing.
- **The `Lead` conversion fires from exactly one place**: the `/sap-course`
  form, after the submit API resolves. `/contact`, `/enquire` and
  `/campus-visit` deliberately do not fire it, so both ad platforms count paid
  traffic only.
- **A phantom `Subscribe` in Meta is not ours.** Check the Setup method column:
  ours reads "Manual setup", Meta's guesses read "Automatically logged".
- Every lead form requires a course choice and consent, and carries the
  `EnquiryDisclaimer` (legal copy for a Google Ads financial-services review —
  never paraphrase it). `/sap-course` also asks three qualifying questions;
  the answers are captured but **not** scored.

### Testing a form on production without polluting real data

Drive the live page and intercept the write, so no lead and no ad conversion is
created. Pattern used throughout this project: override `window.fetch` and
`XMLHttpRequest.prototype.send`, return a fake `201` for
`**/api/leads/submit`, then fill and submit the form and read the resulting
`facebook.com/tr` beacons out of `performance.getEntriesByType('resource')`.

---

## 7. Which doc to read, by task

| Task | Read |
|---|---|
| Rules and invariants for any change | **`CLAUDE.md`** — start here, always |
| Full project history and state | `PROJECT_CONTEXT.md` |
| System shape | `ARCHITECTURE.md` |
| Engineering standards | `AGENTS.md` |
| Design rules | `UI_VISION.md` |
| Routes | `ROUTING_MAP.md` |
| Deploy / env / infra | `DEPLOYMENT.md` |
| SaiSatwik blog writing + publishing | `SAISATWIK_BLOG_PUBLISHING.md` |
| Spanbix blog publishing | `BLOG_PUBLISHING.md` |
| SEO engine | `SEO_ENGINE.md` |
| Analytics + MBR | `ANALYTICS_SYSTEM.md` |
| Tenants | `MULTI_TENANT_SYSTEM.md` |
| Spanbix SEO plan | `spanbix-seo-master-plan.md` |
| What's next | `FUTURE_ROADMAP.md` |

`CLAUDE.md` phases are chronological; the newest phase reflects current
reality, and later phases explicitly supersede earlier ones. **When two docs
disagree, the newest phase in `CLAUDE.md` wins.**

---

## 8. State as of 17 Aug 2026

**Live and working:** both public sites; the admin dashboard; Lead Capture
(Spanbix only) with append-only contact log, auto-derived acquisition channel
and server-stamped submission time; the four restricted staff accounts; MBR
reporting off first-party analytics with GA4 fallback; Spanbix Google + Meta
ads with the `Lead` conversion verified end to end on production.

**Open / not done:**

- Meta side, owner's action: confirm `Subscribe` has stopped after the
  autoConfig fix, and switch the ad set's conversion event from `Contact`
  (which never fires) to **`Lead`**.
- Google Ads financial-services flag: the disclaimer is live, but the appeal
  itself has to be resubmitted in the policy console.
- MBR **Excel export still writes raw GA4 audience numbers**, so the workbook
  can disagree with the on-screen figures. Known gap.
- SaiSatwik blog pipeline: workbook `SAP-EPPM-PS-Blog-Keyword-Plan.xlsx` tracks
  progress. K01–K11 and K65 published; K12+ and all 36 Leads-sheet posts
  pending. Retro-linking backlog of roughly 31 older posts.
- Restricted `leads_agent` accounts have no Settings page, so they cannot
  change their own passwords.

**Deliberately not built** — do not add these back without a new explicit ask:
lead scoring / temperature on Lead Capture · a SaiSatwik leads CRM ·
follow-up sequencing or email logging · lead notifications of any kind
(WhatsApp/Telegram/email/SMS) · the scheduler module · HRMS · Tickets.
