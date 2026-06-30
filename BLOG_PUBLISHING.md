# Publishing a Spanbix Blog — Process

**This is the file to follow every time you publish a Spanbix blog.**
One command does it all: content → formatted page → schema → sitemap → live.

Spanbix blogs are **database content**, not git-tracked pages. You write a small
data file, run one command, and the live Next.js site (`www.spanbix.com`) renders
it server-side with all SEO/AEO/GEO wiring applied automatically.

> ## ⛔ NEVER edit a CLI-published post in the admin Blog Editor
> The admin editor uses **Quill**, which **destroys** this HTML on save: it merges
> table `<th>`/`<td>` cells, converts every space to `&nbsp;` (breaks mobile
> wrapping), and strips heading `id`s. A post that took an hour to wire renders
> broken after one accidental save there.
> **Edit the data file (`src/utils/blogs/<slug>.js`) and re-run the CLI. Always.**
> If a post already got mangled, just re-run the CLI — it overwrites the DB content
> with the clean data-file version.

---

## TL;DR

```bash
# 1. Copy the template to a new file named after the URL slug you want:
cp src/utils/blogs/_TEMPLATE.js src/utils/blogs/my-post-slug.js

# 2. Edit my-post-slug.js — fill in title, meta, content (semantic HTML, <h2> sections), faq[].

# 3. Publish:
npm run create:spanbix-blog -- my-post-slug
```

That's it. The post is live, in the sitemap, with full schema. (Omit the slug arg
to publish the default SAP-module post.)

---

## What you write (the data file)

One file in `src/utils/blogs/<slug>.js`. The filename's job is just to be a handle
for the command — **the actual URL comes from the `slug` field inside.** Required
shape (see `_TEMPLATE.js` for a working skeleton):

| Field | Purpose | Rule |
|---|---|---|
| `slug` | The live URL: `/blog/<slug>` | clean, hyphenated, keyword-rich |
| `title` | H1 + schema headline | full title |
| `seoTitle` | Google SERP title | **≤ 70 chars** |
| `seoDescription` | Meta description | **≤ 160 chars**, lead with the answer |
| `excerpt` | Sub-headline + OG/social fallback | 1 sentence |
| `category` | Eyebrow label above H1 | short |
| `tags` / `keywords` | Topical signals | arrays of strings |
| `readingTime` | Reading-time badge | minutes (int) |
| `featuredImage` | Cover + `BlogPosting.image` | URL or `''` |
| `ogImage` | Social card | defaults to `featuredImage` |
| `content` | The article body (HTML) | semantic, see conventions |
| `faq` | `[{question, answer}]` | **drives FAQPage schema** |

### Content conventions (load-bearing)

- **Use clear `<h2>` headings for each section.** The Table of Contents + anchor
  links are generated automatically — the page derives an `id` from each `<h2>`'s
  text at render time, so you do **not** need to add `id` attributes yourself
  (and it wouldn't matter if the editor stripped them). Just write good `<h2>`s.
- **Wrap tables** in `<div class="sx-table-wrap">…</div>` so they scroll on mobile.
- **Internal links**: relative, to real Spanbix pages —
  `/career-paths/fico`, `/career-paths/mm`, `/career-paths/sd`, `/career-paths/abap`,
  `/career-paths/ai`, `/courses`, `/about`, `/contact`.
- **External links**: `target="_blank" rel="noopener"`, to authoritative sources only.
- **Open with a "Quick Answer"** `<h2>` — 2-3 sentence direct answer. This is the
  passage Google AI Overviews and LLMs extract. Non-negotiable for GEO/AEO.
- **`faq[]` must mirror the visible FAQ** `<h3>`/`<p>` pairs verbatim — Google
  rejects FAQPage schema that doesn't match on-page content.

---

## What happens automatically (don't hand-build these)

Running the command + the deployed site handle all of this:

- **JSON-LD schema** (SSR, in `<head>`): `BlogPosting` + `Person` author +
  `FAQPage` (from `faq[]`) + `BreadcrumbList`.
- **Table of Contents**: generated from your `<h2>` headings (ids auto-injected at render).
- **Prose styling**: headings, tables, lists, links, blockquotes via `.sx-blog-content`.
- **Sitemap**: the post is added to `/sitemap.xml` automatically.
- **Canonical + OG + Twitter** meta tags.
- **Author byline** block (avatar, jobTitle, bio, LinkedIn) from the AdminUser.
- **ISR revalidate** fired on publish (instant refresh — *if* the secret is aligned,
  see Troubleshooting).

---

## Pre-publish checklist

- [ ] `seoTitle` ≤ 70 chars, `seoDescription` ≤ 160 chars
- [ ] Each section has a clear `<h2>` (TOC + anchors auto-generated — no manual ids)
- [ ] `faq[]` mirrors the visible FAQ section exactly
- [ ] **Dates/tense are correct as of today** (e.g. "ends in 2027", not "ended")
- [ ] Any stats/numbers are current — refresh on publish day if time-sensitive
- [ ] `featuredImage` set (blank = no social card image, weaker `BlogPosting.image`)
- [ ] Internal links point to live pages; external links are authoritative
- [ ] Quick-Answer `<h2>` is first

---

## Publish + verify

```bash
npm run create:spanbix-blog -- my-post-slug
```

Confirm the output says **`[published]`** (not `[draft]` — never pass `--draft`
unless you want it held for review). The command is idempotent: re-run it after
any edit to update the live post (matches on slug **or** title, so it won't
duplicate).

Then verify:
1. Open `https://www.spanbix.com/blog/<slug>` — TOC, tables, FAQ render.
2. Google **Rich Results Test** on that URL → expect `BlogPosting`, `FAQPage`,
   `BreadcrumbList`, no errors.
3. `https://www.spanbix.com/sitemap.xml` lists the post.
4. Google Search Console → URL Inspection → paste the blog URL → **Request Indexing**.

### Google Search Console — one-time only

Submit the sitemap **once**, ever: GSC → Sitemaps → `sitemap.xml` → Submit.
After that you **never resubmit** — the sitemap is generated live and every new
post appears in it automatically; Google rechecks the same URL on its own schedule.
A freshly verified property shows "Couldn't fetch" / "unknown to Google" for ~1–2
days — that's Google's crawl latency, not a fault. Per new post, just Request
Indexing on the post URL for a priority crawl (optional; speeds it up).

---

## Author byline (one-time / when it changes)

The schema `author` + byline come from the AdminUser, set via env-driven CLI:

```bash
SPANBIX_AUTHOR_NAME="Lalit Mohan Parihar" \
SPANBIX_AUTHOR_JOBTITLE="SAP Entrepreneur · Spanbix" \
SPANBIX_AUTHOR_BIO="18+ years across SAP implementations and consulting." \
SPANBIX_AUTHOR_LINKEDIN="https://www.linkedin.com/in/lalitmohan-parihar-405759140/" \
npm run set:spanbix-author
```

Use the **full name** ("Lalit Mohan Parihar") for a stronger `Person` entity.

---

## Troubleshooting

- **Tables collapsed / spaces became `&nbsp;` / TOC vanished** → the post was
  opened + saved in the admin Blog Editor (Quill mangles the HTML). Fix: re-run
  `npm run create:spanbix-blog` — it overwrites the DB with the clean data-file
  content. Then never open it in that editor again.
- **Post is live but missing from the sitemap** → it's a `draft`. Re-run the
  command **without** `--draft`. Confirm `[published]`.
- **Edits/sitemap not reflecting on the live site within ~5 min** → the
  on-demand cache-bust 401'd. Fix: set **`REVALIDATE_SECRET` to the same value**
  in all three places — Render backend env, Vercel `spanbix-web` env, local `.env`.
  Until aligned, changes fall back to the 300s ISR timer or need a redeploy.
- **Renamed the slug, old URL still 200** → it 404s once its ISR window rolls
  (~5 min). The new slug is canonical; the sitemap only lists the new one.
- **DB connection error (`querySrv ECONNREFUSED`)** → expected; the CLI sets
  Google DNS resolvers itself, just re-run.

---

## Do NOT

- **Don't EVER edit a CLI-published post in the admin Blog Editor (Quill).** It
  merges table cells, `&nbsp;`-ifies spaces, strips ids. Data file + CLI only.
- Don't pass `--draft` for a normal publish.
- Don't resubmit the sitemap in GSC — submit once, it auto-updates forever.
- Don't hand-write JSON-LD, sitemap entries, or a TOC — all automatic.
- Don't hardcode the URL anywhere; the `slug` field is the single source.
- Don't stuff form/SEO data into `content` that belongs in the typed fields.
