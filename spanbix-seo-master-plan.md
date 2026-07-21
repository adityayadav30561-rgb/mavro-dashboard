# Spanbix.com — SEO & Content Optimisation Master Plan
**Audit date:** 2026-05-28  
**Current SEO score:** 57 / 100  
**Target score:** 82+  
**Stack:** Next.js 15 on Vercel  
**Category:** EdTech — SAP S/4HANA training (FICO / MM / SD / ABAP)  
**Markets:** India — Bengaluru, Hyderabad, Pune  

---

## Site Context (for Claude)

Spanbix is an SAP training platform targeting two primary audiences:

1. **Students** — BBA, BCom, MBA, BTech freshers and working professionals looking to pivot into SAP/ERP consulting careers. They search for course fees, salary outcomes, and track comparisons before booking a call.
2. **Placement cells / T&P heads** — Academic directors and training & placement officers at tier-2/3 colleges across Karnataka, Telangana, Maharashtra, and UP. They look for institutional partnerships, campus cohort programs, co-branded credentials, and curriculum proof.
3. **AI search engines** — Perplexity, ChatGPT, Gemini, which pull from well-structured, sourced, question-answer formatted content.

**Courses offered:**
- SAP FICO (Finance & Controlling) — `/career-paths/fico`
- SAP MM (Materials Management) — `/career-paths/mm`
- SAP SD (Sales & Distribution) — `/career-paths/sd`
- SAP ABAP (technical/developer track) — `/career-paths/abap`

**Key pages:**
- Homepage — `/`
- About — `/about`
- Campus Programs — `/campus-programs`
- Career Paths index — `/career-paths`
- Blog — `/blog`
- Contact — `/contact`

**Brand voice:** Direct, outcomes-first, no fluff. Speak to commerce/MBA graduates who have been overlooked by mainstream tech training. For placement cells: institutional, credibility-forward, data-backed.

---

## Current State Metrics

| Metric | Current | Target |
|--------|---------|--------|
| SEO health score | 57 / 100 | 82+ |
| URLs in sitemap | 3 | 14+ |
| Blog posts live | 1 (286 words) | 12+ (≥1500 words each) |
| Rich result eligibility | 0 | Course + FAQPage |
| Audiences clearly addressed | 2 (blended) | 3 (distinct per page) |
| Author entities on blog | 0 (Super Admin) | Real named author with schema |

---

## Phase 0 — Critical Technical Fixes (Week 1–2)
> These must be done before any content work. Content indexed under the wrong host or with spam signals wastes all effort.

### 0.1 Fix Sitemap Host
**Priority: CRITICAL**  
**File:** `sitemap.xml` + `robots.txt`

- Every `<loc>` in sitemap currently points to `spanbix-web.vercel.app` (Vercel preview domain)
- The `Sitemap:` directive in `robots.txt` also uses the preview domain
- Fix: Regenerate sitemap so every `<loc>` uses `https://www.spanbix.com`
- Fix: Update `robots.txt` Sitemap directive to `Sitemap: https://www.spanbix.com/sitemap.xml`
- Risk if not fixed: Google indexes preview domain as canonical, creating permanent duplicate-content problem

### 0.2 Fix Canonical / Host Mismatch
**Priority: CRITICAL**

- Current: `<link rel="canonical">` = `https://spanbix.com` (apex)
- Served as: `https://www.spanbix.com` (www) via 307 redirect
- Fix: Pick `www.spanbix.com` as canonical host (it's already where traffic lands)
- Change apex → www redirect from **307 (temporary)** to **301 (permanent)**
- Update all `<link rel="canonical">` tags site-wide to use `https://www.spanbix.com/[path]`
- Update `og:url` meta tags to match

### 0.3 Expand Sitemap to All Pages
**Priority: CRITICAL**  
Current sitemap: 3 URLs (homepage + blog index + 1 post)

Add these URLs to sitemap:
```
https://www.spanbix.com/
https://www.spanbix.com/about
https://www.spanbix.com/courses
https://www.spanbix.com/career-paths
https://www.spanbix.com/career-paths/fico
https://www.spanbix.com/career-paths/mm
https://www.spanbix.com/career-paths/sd
https://www.spanbix.com/career-paths/abap
https://www.spanbix.com/campus-programs
https://www.spanbix.com/contact
https://www.spanbix.com/blog
[all published blog posts]
```

### 0.4 Replace "Super Admin" Blog Author
**Priority: CRITICAL**

- Google's Sept 2025 Quality Rater Guidelines explicitly flag anonymous / "Super Admin" bylines as a spam signal
- Every blog post must have a real named author
- Required: author full name, profile photo, short bio (2–3 sentences), LinkedIn URL, and `schema.org/Person` entity in JSON-LD
- Create an author page or at minimum an author bio block below each post
- Update the blog CMS / MDX frontmatter to include `author` field

### 0.5 Add Security Headers
**Priority: HIGH**  
**File:** `next.config.js`

Add via `headers()` in `next.config.js`:
```js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          // Tighten this progressively — start permissive, harden over 2 weeks
        },
      ],
    },
  ];
}
```

### 0.6 Fix sameAs Social URLs in Organization Schema
**Priority: HIGH**

- Current: `sameAs: ["https://www.linkedin.com"]` — this is LinkedIn's homepage, not Spanbix's profile
- Fix: Replace with actual Spanbix profile URLs:
  ```json
  "sameAs": [
    "https://www.linkedin.com/company/spanbix",
    "https://www.instagram.com/spanbix",
    "https://www.youtube.com/@spanbix",
    "https://twitter.com/spanbix"
  ]
  ```
- Use the real URLs — don't fill placeholders with homepage URLs

### 0.7 HSTS Preload
**Priority: HIGH**

- Already have HSTS but missing `includeSubDomains` and `preload`
- Header should be: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- After deploying: submit domain at https://hstspreload.org
- Do NOT submit until the header is live and correct — removal from the preload list is very slow

---

## Phase 1 — On-Page & Schema Fixes (Week 2–4)
> Unlock rich results, fix trust signals, and correct content quality issues

### 1.1 Course Schema — Add hasCourseInstance + Offer
**Priority: HIGH**  
**Pages:** `/career-paths/fico`, `/mm`, `/sd`, `/abap`

Google Course rich results require both `hasCourseInstance` and `Offer`. Currently neither is present → zero rich result eligibility.

Add to each course page's JSON-LD:
```json
{
  "@type": "Course",
  "name": "SAP FICO — Finance & Controlling",
  "description": "...",
  "provider": { "@type": "EducationalOrganization", "name": "Spanbix" },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": ["online", "onsite"],
    "location": "Bengaluru, India",
    "startDate": "2026-07-01",
    "endDate": "2026-09-30",
    "instructor": {
      "@type": "Person",
      "name": "Aman Patil",
      "url": "[LinkedIn URL]"
    }
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "price": "[actual price]",
    "availability": "https://schema.org/InStock",
    "url": "https://www.spanbix.com/career-paths/fico"
  }
}
```

### 1.2 Rewrite All Meta Descriptions (≤155 chars)
**Priority: HIGH**

Current homepage meta description is ~380 chars — Google truncates at 160. Rewrite all:

| Page | Target keyword in first 60 chars | Max length |
|------|----------------------------------|------------|
| Homepage | SAP training India | 155 chars |
| /career-paths/fico | SAP FICO course India | 155 chars |
| /career-paths/mm | SAP MM training | 155 chars |
| /career-paths/sd | SAP SD course India | 155 chars |
| /career-paths/abap | SAP ABAP training | 155 chars |
| /campus-programs | SAP campus training colleges | 155 chars |
| /about | Spanbix SAP training institute | 155 chars |

Example for FICO: `"SAP FICO training in India — 3-month S/4HANA program for BCom, BBA and MBA graduates. Live mentor sessions, capstone, and placement support. Bengaluru, Hyderabad, Pune."`

### 1.3 About Page — Full Trust Signal Rewrite
**Priority: HIGH**  
**Current state:** 461 words, no founder name, duplicated homepage content, zero institutional trust signals

Required additions:
- **Founder full name** + LinkedIn URL + verifiable SAP project history (company names, years, modules worked on)
- **Registered company name** (e.g. Spanbix Technologies Pvt. Ltd. or equivalent)
- **CIN number** (from MCA filing)
- **GST number**
- **Physical office address** in Bengaluru (street address, not just "Bengaluru")
- **Founding year**
- **Mentor grid** — real names, photos, current employer, SAP module specialisation, LinkedIn URL per mentor
- **Campus cohorts completed** — number of colleges, number of students placed
- Remove the "Why ERP Careers" section entirely — it's verbatim copy from homepage

### 1.4 Consolidate Organization Schema
**Priority: MEDIUM**

- Currently two overlapping JSON-LD blocks: `Organization` + `EducationalOrganization`
- `EducationalOrganization` is a subtype of `Organization` — merge into one block
- The single block should include: registered name, address (with PostalAddress), telephone, email, foundingDate, sameAs array, url, logo

Example structure:
```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Spanbix Technologies Private Limited",
  "legalName": "[Registered company name]",
  "url": "https://www.spanbix.com",
  "logo": "https://www.spanbix.com/spanbix/spanbix-blue.png",
  "foundingDate": "[year]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[actual address]",
    "addressLocality": "Bengaluru",
    "addressRegion": "Karnataka",
    "postalCode": "[pin]",
    "addressCountry": "IN"
  },
  "sameAs": [
    "[real LinkedIn company URL]",
    "[real YouTube URL]",
    "[real Instagram URL]"
  ]
}
```

### 1.5 Add BlogPosting Schema on Every Blog Post
**Priority: HIGH**

Each blog post needs:
```json
{
  "@type": "BlogPosting",
  "headline": "[post title]",
  "author": {
    "@type": "Person",
    "name": "[real author name]",
    "url": "[author LinkedIn or profile page]"
  },
  "datePublished": "[ISO date]",
  "dateModified": "[ISO date]",
  "image": "[post featured image URL]",
  "publisher": {
    "@type": "EducationalOrganization",
    "name": "Spanbix",
    "logo": "https://www.spanbix.com/spanbix/spanbix-blue.png"
  },
  "mainEntityOfPage": "[post URL]"
}
```

### 1.6 Add WebSite + SearchAction Schema (Homepage)
**Priority: MEDIUM**

Enables sitelinks search box in Google results:
```json
{
  "@type": "WebSite",
  "url": "https://www.spanbix.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.spanbix.com/blog?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### 1.7 Add hreflang="en-IN" on All Pages
**Priority: MEDIUM**

Add to `<head>` on every page:
```html
<link rel="alternate" hreflang="en-IN" href="https://www.spanbix.com/[path]" />
<link rel="alternate" hreflang="x-default" href="https://www.spanbix.com/[path]" />
```

Signals to Google this is English content targeted at India. Important for ranking in Indian SERPs over generic English results.

### 1.8 Performance Fixes
**Priority: MEDIUM**

**Images:**
- Convert all PNG images to WebP using `next/image` — expected 60–80% size reduction
- Logo (86KB PNG) → WebP target: ~18KB
- Partner logos (~500KB total PNG) → WebP target: ~100KB
- Add `priority` prop and `fetchpriority="high"` to the hero poster image / LCP element
- Hero uses a video — ensure a `poster` attribute is set with an optimised WebP image

**Fonts:**
- Currently 7 woff2 fonts in `<link rel="preload">` — LCP penalty
- Keep maximum 2: regular (400) and bold (700) of one font family
- Subset to Latin + Devanagari characters only
- Remove remaining 5 from preload list

**Caching:**
- Hashed static assets under `/spanbix/*` currently have `Cache-Control: max-age=0, must-revalidate`
- Set `Cache-Control: public, max-age=31536000, immutable` for any asset whose filename includes a content hash
- Implement in `next.config.js` headers config

**Blog ISR:**
- Blog index is SSR per-request (`Cache-Control: no-store`)
- Switch to ISR: add `export const revalidate = 3600` to the blog index page
- Static generation for individual blog posts (they don't change after publish)

---

## Phase 2 — Content & AI Indexing (Week 4–8)
> Content rewrites per audience, Q&A blocks for AI search, llms.txt, IndexNow

### 2.1 Audience Framework
Every page must be written with a primary audience in mind. Secondary audiences can be addressed in later sections of the page, but the hero/intro copy and primary CTA must target one person.

| Page | Primary audience | Secondary audience |
|------|-----------------|-------------------|
| `/` | Students (TOFU awareness) | AI search citation |
| `/career-paths/fico` | Students (consideration) | AI search |
| `/career-paths/mm` | Students (consideration) | AI search |
| `/career-paths/sd` | Students (consideration) | AI search |
| `/career-paths/abap` | Students — BTech/BCA | AI search |
| `/campus-programs` | Placement cells / T&P heads | — |
| `/about` | Placement cells (trust check) | Students (credibility) |
| `/blog` | Students (TOFU) | AI search (citation) |

---

### 2.2 Homepage Content Updates

**Stats block — add inline citations:**
- "50,000+ ERP roles unfilled / year" → add `(Source: NASSCOM 2024)` as a linked footnote
- "₹4.7L+ Starting CTC, certified" → add `(Source: Naukri JobSpeak Q4 2025)` as linked footnote
- "38M+" grads figure → add `(Source: AISHE 2023-24 report)` as linked footnote
- LLMs cite sourced statistics 3–5× more than unsourced ones

**Add Q&A blocks (H2 format):**  
These match the AI Overviews retrieval pattern. Each answer should be 134–167 words, self-contained, and directly answer the question.

Add these three sections to the homepage (below the hero, above or within the FAQ):

```
H2: What is SAP training, and who is it for?
[134–167 word direct answer]

H2: Is SAP a good career in India in 2026?
[134–167 word answer — cite salary data, job volume, NASSCOM]

H2: Can a BCom or BBA graduate get an SAP job without coding knowledge?
[134–167 word answer — address the most common objection]
```

**CTA duplication:**  
"30 minutes with a strategist" CTA appears 3+ times. Keep only 1 per page — ideally at the bottom. The repetition is a low-quality signal.

---

### 2.3 About Page — Full Rewrite Plan

This page is seen by two different audiences at different stages:
- **Students** check it for credibility before booking a call
- **Placement cell heads** check it for institutional legitimacy before reaching out

Required content blocks (in order):

1. **Founder story** — Name, LinkedIn URL, years in SAP, specific project types handled (e.g. "led FICO implementation for 3 manufacturing clients"), why Spanbix was started
2. **Company details** — Registered name, CIN, GST, physical Bengaluru address, founding year
3. **Mentor grid** — Each mentor: full name, photo, current employer, SAP module, years of experience, LinkedIn URL
4. **Track record** — Number of campus cohorts completed, number of students placed, cities covered
5. **Campus partnerships** — Named colleges (even 1–2) or "X colleges across Karnataka and Telangana" with a quote from a T&P head if available
6. **Remove** — Delete the "Why ERP Careers" section entirely. It's a homepage section pasted here. About should be about *who Spanbix is*, not what ERP is.

---

### 2.4 Campus Programs Page — Dedicated T&P Audience Page

This page is currently **not in the sitemap** and is the biggest missed opportunity. The placement cell audience is a B2B conversion with very different needs from a student.

Required sections (write for T&P head, not student):

1. **Hero headline** — e.g. "Make SAP placement a line in your prospectus" — not "our platform trains students"
2. **What the cohort includes:**
   - Curriculum outline (downloadable PDF)
   - Duration and weekly time commitment
   - Mentors and their credentials
   - Assessment and capstone structure
   - Certificate — co-branded, QR-verifiable
3. **How it works for your college:**
   - Free awareness workshop (no commitment)
   - Cohort aligned to your academic calendar
   - T&P team gets a cohort progress report
   - Placement pipeline handed back to the college placement cell
4. **Pricing model** — Be transparent: "Per-batch pricing, scales with cohort size. Typically ₹X–Y per student for a batch of Z. Exact quote follows the scoping call." Placement cells can't move forward without a ballpark.
5. **Named college partners** — Even one or two with permission. A quote from a T&P head is worth more than any marketing copy.
6. **CTA** — Not "Book Consultation." Use: "Request a Campus Program Walkthrough" with a separate form that asks for: college name, city, approx student count, preferred timeline.

**Schema for this page:**  
Add `EducationalOrganization` JSON-LD here with `hasOfferCatalog` pointing to campus-specific course offerings.

---

### 2.5 Course Page Rewrites (FICO, MM, SD, ABAP)

Apply the same pattern to all four course pages. FICO is the highest-traffic potential, so start there.

**Fee transparency:**  
Students will not book a call without a ballpark fee. Add: "Course fees start from ₹[X]. Instalment options available. Exact pricing shared during the 30-minute consultation call." The fear of wasting time on a sales call is the #1 reason students bounce.

**Salary data with source:**  
- FICO: "₹6L–₹22L range (Source: Naukri.com SAP FICO salary data, Jan 2026)"
- MM: "₹5L–₹18L range (Source: LinkedIn Salary Insights, Q4 2025)"
- SD: cite similarly
- ABAP: cite Naukri developer salary data

**Mentor credibility:**  
"Mentor · Aman Patil" currently has no URL or employer. Add: current employer, years in SAP, modules worked, LinkedIn link. This is E-E-A-T for course pages.

**Batch dates:**  
Add the next available batch start date. Even "Next batch: August 2026" is better than nothing. Students want to know if they can start now or have to wait.

**FAQPage schema block — add to each course page:**

FICO example questions:
1. What is the SAP FICO course fee at Spanbix?
2. Can a BCom graduate get an SAP FICO job without work experience?
3. How long does the SAP FICO course take?
4. What is the average SAP FICO salary for freshers in India?
5. SAP FICO vs SAP MM — which is better for a commerce graduate?

**Q&A comparison block (FICO page):**
Add an H2: "SAP FICO vs SAP MM — which track is right for a BCom graduate?"  
Write a 200–300 word direct comparison. This targets one of the highest-intent keywords for your audience and is heavily cited by AI engines.

---

### 2.6 Blog Content Plan — 12 Cornerstone Posts

Google treats a blog with 1 post as not a real blog. Target: 8–12 posts before scaling. Every post must have:
- ≥1500 words
- Real data with source citation (not just "industry reports say")
- Named author with Person schema
- Featured image with alt text
- FAQPage schema at the bottom (3–5 questions)

**Priority blog posts (in order):**

| # | Title | Target keyword | Word count | Source data needed |
|---|-------|---------------|------------|-------------------|
| 1 | SAP FICO Salary in India 2026 — Real Numbers from Naukri and LinkedIn | SAP FICO salary India 2026 | 1800 | Naukri JobSpeak, LinkedIn Salary |
| 2 | SAP MM vs SAP FICO — Which Track is Better for BCom Graduates? | SAP MM vs FICO BCom | 1600 | Placement outcomes, role comparison |
| 3 | How Priya Went from ₹3.4L Accounts Executive to ₹9.2L SAP Consultant in 5 Months | SAP FICO success story India | 1500 | Priya's story (alumni, named) |
| 4 | What Does a SAP Campus Training Partnership Look Like? A Guide for Placement Cells | campus placement SAP training | 1500 | Campus cohort data from Spanbix |
| 5 | Can a BBA Graduate Get an SAP Job? Complete 2026 Guide | SAP training for BBA graduates | 1700 | Alumni outcomes, Naukri job data |
| 6 | SAP ABAP for BTech Graduates — Career Path, Salaries, and What to Expect | SAP ABAP career India | 1600 | ABAP salary data, hiring partner list |
| 7 | SAP SD Training in India — Everything a Commerce Graduate Needs to Know | SAP SD training India | 1600 | SD salary, order-to-cash explained |
| 8 | How to Choose the Right SAP Course in India in 2026 | best SAP course India 2026 | 2000 | Comparison of all 4 tracks |
| 9 | What Hiring Managers Look for in Junior SAP Consultants (From SI Insiders) | SAP job interview India | 1500 | Quotes from hiring partners |
| 10 | Tier-2 City to SAP Consultant — How the Remote ERP Training Shift Changed Everything | SAP training tier 2 cities | 1500 | Geographic data from Spanbix cohorts |
| 11 | SAP S/4HANA vs SAP ECC — Why the Migration Wave Is Your Career Opportunity | SAP S/4HANA migration India | 1700 | SAP migration statistics, 2028 deadline |
| 12 | The Honest Guide to SAP Certification in India — What It Costs and Whether It's Worth It | SAP certification India cost | 1800 | SAP certification fee, ROI data |

**Every post must include:**
- Author bio block at the bottom (name, photo, LinkedIn)
- 3–5 FAQPage schema questions at the end
- Internal links to relevant course pages
- Sourced statistics with hyperlinks (not just "according to reports")

---

### 2.7 Q&A H2 Block Pattern (AI Overviews + Featured Snippets)

Apply this pattern to all course pages and the homepage. AI search engines retrieve content formatted this way.

**Format:**
```markdown
## [Natural language question?]
[Direct 2-sentence answer — the most important answer goes in the first 40 words]

[Expand to 134–167 words total. Add specifics, numbers, nuance. End with a sentence that leads naturally to the next section or to a CTA.]
```

**Rules:**
- Answer the question directly in the first sentence — do not build up to the answer
- Use the exact keyword phrase from the H2 in the first 40 words of the answer
- 134–167 words is the sweet spot for featured snippet extraction
- Do not put the answer behind a "click to expand" — it must be visible on page load

---

### 2.8 Publish /llms.txt
**Priority: MEDIUM**

Create the file at `https://www.spanbix.com/llms.txt` listing the canonical URLs you want AI systems to index:

```
# Spanbix — SAP Training Platform India
# llms.txt — canonical URL index for AI systems

## Core pages
https://www.spanbix.com/
https://www.spanbix.com/about
https://www.spanbix.com/campus-programs
https://www.spanbix.com/career-paths/fico
https://www.spanbix.com/career-paths/mm
https://www.spanbix.com/career-paths/sd
https://www.spanbix.com/career-paths/abap

## Blog (update as posts are added)
https://www.spanbix.com/blog
[individual post URLs]

## FAQ
https://www.spanbix.com/about#faqs
```

### 2.9 Implement IndexNow
**Priority: MEDIUM**

1. Generate a key (any UUID string)
2. Host the key file at `https://www.spanbix.com/{key}.txt` containing just the key string
3. Ping on every new page publish or blog post:
   ```
   POST https://api.indexnow.org/indexnow
   {
     "host": "www.spanbix.com",
     "key": "{your-key}",
     "urlList": ["https://www.spanbix.com/new-page-url"]
   }
   ```
4. Bing and Yandex both support IndexNow — reduces indexing lag from weeks to hours

---

## Phase 3 — Authority & Growth (Month 3+)

### 3.1 City Landing Pages
Target queries: "SAP FICO training Hyderabad", "SAP course Bengaluru", "SAP training Pune"

Create three pages:
- `/locations/bengaluru`
- `/locations/hyderabad`
- `/locations/pune`

Each page needs:
- City-specific H1: "SAP Training in Hyderabad — Online + Classroom"
- Local alumni quote (named, with cohort)
- Batch info for that city (or "online batch available")
- Local schema: `LocalBusiness` or `EducationalOrganization` with city address
- Internal links to all 4 course pages

### 3.2 Alumni Case Study Posts
Tushar, Priya, Rahul, and Anjali are on the homepage with strong outcome numbers. Each needs a dedicated blog post (500+ words) for full E-E-A-T impact:
- Named alumnus (with permission)
- Before/after CTC with employer name
- What specifically they did in the course (capstone topic, which modules)
- Linked to their LinkedIn post about the role if they shared it
- These are the highest-trust conversion assets on the site

### 3.3 College Partnership Directory
Once 3–5 campus cohorts have completed:
- Publish a named list of partner colleges
- Include: college name, city, cohort size, module, placement outcome count
- This is a high-authority signal for placement cell prospects and for Google's `EducationalOrganization` trust evaluation

### 3.4 Google Search Console + Bing Webmaster Tools
- Verify both properties with the www canonical
- Submit the expanded sitemap in both
- Monitor after Phase 1 schema work: use GSC's Rich Result Test and check "Enhancements" tab for Course and FAQ rich results
- Check Bing Webmaster for crawl errors and indexing status
- Review Core Web Vitals report weekly for the first month

### 3.5 Drop Unnecessary robots.txt Directives
- Remove `Crawl-delay: 1` — Google and Bing ignore this directive
- Remove any `Disallow:` rules that are blocking content pages (check current robots.txt)
- Keep `Disallow: /api/` and similar non-content routes blocked

---

## Page-by-Page Priority Matrix

### Homepage (/)
**SEO score: 62 | Priority: High**

| Issue | Severity | Fix |
|-------|----------|-----|
| Sitemap host mismatch | Critical | Phase 0.1 |
| Canonical mismatch (apex vs www) | Critical | Phase 0.2 |
| Meta description ~380 chars | High | Phase 1.2 |
| Stats unsourced inline | High | Phase 2.2 |
| No WebSite schema | Medium | Phase 1.6 |
| Hero video — no poster with fetchpriority | Medium | Phase 1.8 |
| No Q&A H2 blocks | Medium | Phase 2.2 |
| CTA duplicated 3× | Low | Phase 2.2 |

---

### About (/about)
**SEO score: ~40 | Priority: Critical for placement cell conversions**

| Issue | Severity | Fix |
|-------|----------|-----|
| No founder name/LinkedIn/history | Critical | Phase 1.3 |
| No company reg/CIN/GST/address | Critical | Phase 1.3 |
| Duplicated "Why ERP Careers" block | High | Phase 1.3 |
| Only 461 words | High | Phase 1.3 |
| No mentor grid | High | Phase 1.3 |
| No founding year | Medium | Phase 1.3 |

---

### Campus Programs (/campus-programs)
**SEO score: ~20 | Priority: Highest-value untapped page**

| Issue | Severity | Fix |
|-------|----------|-----|
| Not in sitemap | Critical | Phase 0.3 |
| Copy speaks to students, not T&P heads | High | Phase 2.4 |
| No institutional contact form | High | Phase 2.4 |
| No pricing signal | High | Phase 2.4 |
| No named college partners | Medium | Phase 2.4 |
| No course schema for campus variant | Medium | Phase 1.1 |

---

### SAP FICO (/career-paths/fico)
**SEO score: ~55 | Priority: Highest organic traffic potential**

| Issue | Severity | Fix |
|-------|----------|-----|
| No hasCourseInstance + Offer schema | Critical | Phase 1.1 |
| No fee visibility | High | Phase 2.5 |
| Salary range unsourced | High | Phase 2.5 |
| No FAQPage schema | High | Phase 2.5 |
| Mentor has no LinkedIn/employer | Medium | Phase 2.5 |
| No batch dates | Medium | Phase 2.5 |
| No "FICO vs MM" comparison block | Medium | Phase 2.5 |

---

### SAP MM, SD, ABAP (/career-paths/*)
**Same fixes as FICO — apply in order: MM → SD → ABAP**

Additional ABAP-specific:
- Copy must speak to BTech/BCA graduates, not commerce grads
- ABAP salary data from different Naukri category (developer, not consultant)

---

### Blog (/blog + posts)
**SEO score: ~30 | Priority: Long-term traffic engine**

| Issue | Severity | Fix |
|-------|----------|-----|
| "Super Admin" byline | Critical | Phase 0.4 |
| 1 post, 286 words | Critical | Phase 2.6 |
| No BlogPosting schema | High | Phase 1.5 |
| ISR not enabled | Medium | Phase 1.8 |
| Not in sitemap | Critical | Phase 0.3 |
| No category taxonomy | Low | Phase 3 |

---

## Keyword Priority Map

### Student audience (individual enrolment)

| Keyword | Intent | Target page |
|---------|--------|-------------|
| SAP FICO training India | Transactional | /career-paths/fico |
| SAP FICO course fees | Informational | /career-paths/fico |
| SAP FICO salary India 2026 | Informational | Blog post #1 |
| SAP MM vs FICO for BCom | Commercial | Blog #2 + FICO FAQ |
| SAP training for BBA graduates | Informational | Homepage / blog |
| SAP course Hyderabad online | Transactional | /locations/hyderabad |
| SAP training Bengaluru | Transactional | /locations/bengaluru |
| SAP ABAP training for BTech | Informational | /career-paths/abap |
| SAP SD course for MBA India | Informational | /career-paths/sd |
| SAP certification fees India | Informational | Blog post #12 |

### Placement cell audience

| Keyword | Intent | Target page |
|---------|--------|-------------|
| campus placement partner SAP | Commercial | /campus-programs |
| ERP training for college students India | Informational | /campus-programs |
| SAP training institute for colleges | Commercial | /campus-programs |
| industry tie-up BBA college Karnataka | Navigational | /campus-programs |
| co-branded SAP certificate for colleges | Commercial | /campus-programs |

### AI search / LLM citation targets

| Keyword | Target page |
|---------|-------------|
| best SAP training institute India | Homepage / blog |
| how to get SAP job with BCom degree | Blog post #5 |
| SAP S/4HANA training for freshers India | Course pages + blog |
| what is SAP FICO used for | Homepage FAQ / FICO page |
| SAP career path for commerce graduates | Homepage / blog |

---

## 12-Week Execution Timeline

### Week 1
- [ ] Regenerate sitemap with correct `www.spanbix.com` host — deploy
- [ ] Change apex → www redirect from 307 to 301
- [ ] Update all canonical tags to `https://www.spanbix.com/[path]`
- [ ] Add security headers in `next.config.js`
- [ ] Replace "Super Admin" blog byline with real author + Person schema

### Week 2
- [ ] Replace `sameAs` stubs with real Spanbix social profile URLs
- [ ] About page full rewrite (founder name, company reg details, mentor grid)
- [ ] Rewrite meta descriptions on all 8 pages (≤155 chars each)
- [ ] Add HSTS `includeSubDomains; preload` header

### Week 3
- [ ] Add `hasCourseInstance` + `Offer` schema to all 4 course pages
- [ ] Add `BlogPosting` schema to existing blog post + link author entity
- [ ] Consolidate `EducationalOrganization` schema on homepage
- [ ] Add `hreflang="en-IN"` to all pages

### Week 4
- [ ] FICO page content rewrite — fees, FAQPage, Q&A blocks, sourced salary
- [ ] Homepage stat block — add inline citation links
- [ ] All images converted to WebP via `next/image`, hero `fetchpriority="high"` added
- [ ] Sitemap expanded to 14+ URLs, resubmit to GSC

### Week 5–6
- [ ] MM, SD, ABAP pages rewritten (same pattern as FICO)
- [ ] Campus programs page full rewrite — T&P-head audience, pricing signal, institutional form
- [ ] Publish `/llms.txt`
- [ ] Implement IndexNow — key deployed, Bing/Yandex pinged on every publish
- [ ] Font preloads trimmed to 2

### Week 7–8
- [ ] Blog post 1: "SAP FICO Salary in India 2026" (≥1800 words, Naukri data)
- [ ] Blog post 2: "SAP MM vs FICO for BCom" (≥1600 words)
- [ ] Blog post 3: "Priya's story" case study (≥1500 words)
- [ ] Enable ISR on blog index
- [ ] Cache-Control set to `immutable` for hashed static assets

### Week 9–10
- [ ] Blog posts 4–6 published (campus partnership guide, BBA guide, ABAP guide)
- [ ] Q&A H2 blocks added to all course pages and homepage
- [ ] WebSite + SearchAction schema on homepage
- [ ] GSC: verify Course and FAQ rich result eligibility in Rich Results Test

### Week 11–12
- [ ] Blog posts 7–12 published
- [ ] City landing pages: /locations/bengaluru, /hyderabad, /pune
- [ ] Submit domain to hstspreload.org
- [ ] GSC + Bing Webmaster: full crawl health review
- [ ] IndexNow: verify pings are firing correctly on publish

---

## Notes for Claude When Working on This Site

1. **Never rewrite a page without knowing which audience it serves** — check the audience framework in Phase 2.1 first
2. **All statistics must be cited inline** — link to NASSCOM, Naukri JobSpeak, AISHE, LinkedIn Salary Insights. Unsourced stats are ignored by AI search engines
3. **Q&A blocks must answer in the first sentence** — not build up to the answer. The direct answer goes in the first 40 words
4. **Course pages need fee signals** — without a ballpark, students do not book calls
5. **About page is a B2B document for placement cells** — write it as if a T&P head from a college is reading it before a partnership decision
6. **The campus-programs page has a completely different audience to every other page** — it should feel like a separate product for institutional buyers
7. **Schema must match visible content** — do not add schema for data (like fees or instructor names) that isn't visible on the page itself
8. **Blog author must be a real person** — every post needs a named author with LinkedIn. No anonymous bylines under any circumstances
9. **The `canonical` should always be `https://www.spanbix.com/[path]`** — www, https, no trailing slash on most routes
10. **Image tags** — always use `next/image` component, always include descriptive `alt` text, hero image needs `priority` prop
