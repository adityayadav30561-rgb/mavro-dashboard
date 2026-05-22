# Mavro Platform — SEO Engine Specification

**Version:** v3 (Content-Dominant, Confidence-Multiplied)
**Module:** `client/src/lib/seoHealth.js` + `client/src/lib/seoReadability.js`
**Consumer:** `client/src/pages/SeoEngine.jsx`

---

## 1. Why This Engine Exists

Real SEO platforms (Ahrefs, Semrush, SurferSEO, RankMath, Yoast) score harshly when content depth is missing. Earlier engine versions allowed perfect metadata to mask thin content (11-word blog still scored 84). v3 rebalances scoring so content quality dominates, applies absolute caps based on word count, and dampens non-content category influence when content collapses.

**Design principles:**
1. Content depth is the primary SEO signal — perfect metadata cannot rescue an empty post
2. Penalties are weighted; severity has economic meaning (critical = 12–35 pts)
3. Caps reflect operational truth: <100 words cannot rank competitively
4. All scores derive from actual HTML/metadata analysis — no random numbers
5. Pure functions only — no fetches, no React, easy to migrate server-side later

---

## 2. Category Weights

```
content    45%
metadata   20%
technical  15%
ux         10%
freshness  10%
```

Content's 45% weight + hard caps means metadata can never bring a thin post above its cap.

---

## 3. Scoring Algorithm

```
1. Run all check functions → list of issues
   Each issue: { category, severity, code, message, fix, penalty }

2. Per-category score:
   byCategory[cat].score = max(0, 100 − Σ(penalty within category))

3. Confidence multipliers based on content score:
   if contentScore < 30:  metadata=0.4, technical=0.4, ux=0.3, freshness=0.5
   elif contentScore < 50: metadata=0.7, technical=0.7, ux=0.6, freshness=0.75
   else:                   all categories at 1.0

4. Effective weights:
   effW[cat] = baseWeight[cat] × confidence[cat]
   Re-normalize: normW[cat] = effW[cat] / Σ(effW)

5. Weighted score:
   weighted = Σ(score[cat] × normW[cat])

6. Content cap:
   cap = contentCap(wordCount):
     <100  → 35
     <300  → 55
     <700  → 75
     >=700 → 100

7. Long-form bonus:
   bonus = (wc > 1500 && h2Count > 0 && hasStructure) ? 3 : 0

8. Final:
   overall = round(max(0, min(cap, weighted + bonus)))
   grade   = A (≥90), B (≥80), C (≥70), D (≥60), F (<60)
   interp  = Excellent (≥90), Strong (≥75), Average (≥60), Weak (≥40), Critical (<40)
```

---

## 4. Penalty Table

### Metadata (max contribution 100, weight 20%)

| Code | Severity | Penalty | Condition |
|---|---|---|---|
| `meta_title_missing` | critical | 20 | `!seoTitle` |
| `meta_title_long` | critical | 12 | `>70 chars` |
| `meta_title_short` | warning | 8 | `<30 chars` |
| `meta_title_borderline` | notice | 3 | `60–70 chars` |
| `meta_desc_missing` | critical | 20 | `!seoDescription` |
| `meta_desc_short` | warning | 6 | `<80 chars` |
| `meta_desc_long` | warning | 6 | `>170 chars` |
| `canonical_missing` | notice | 4 | `!canonicalUrl` |
| `canonical_invalid` | warning | 8 | not valid absolute URL |
| `og_image_missing` | warning | 8 | `!ogImage && !featuredImage` |
| `og_title_missing` | critical | 12 | `!seoTitle && !title` |
| `og_desc_missing` | warning | 5 | `!seoDescription && !excerpt` |
| `twitter_image_missing` | notice | 3 | same as og_image_missing |

### Content (max contribution 100, weight 45%)

| Code | Severity | Penalty | Condition |
|---|---|---|---|
| `content_essentially_empty` | critical | 60 | `wc < 30` |
| `content_extremely_thin` | critical | 50 | `wc < 100` |
| `content_thin` | critical | 25 | `wc < 300 && published` |
| `content_short` | warning | 8 | `wc < 700` |
| `no_headings` | critical | 12 | no h1–h6 and `wc > 50` |
| `multiple_h1` | warning | 8 | `h1Count > 1` |
| `missing_h2` | warning | 8 | `h2Count == 0 && wc > 200` |
| `heading_skip` | notice | 3 | level jumps (h2→h4) |
| `no_paragraph_structure` | warning | 8 | `paragraphCount <= 1 && wc > 80` |
| `long_paragraphs` | notice | 3 | any paragraph >150 words |
| `no_images` | notice | 3 | `images.length == 0 && wc > 300` |
| `image_missing_alt` | warning | min(12, missingCount × 4) | imgs without alt |
| `no_internal_links` | notice | 5 | `internalLinks == 0 && wc > 300` |
| `no_external_links` | notice | 2 | `externalLinks == 0 && wc > 700` |
| `keyword_stuffing` | warning | 6 | top word density > 3.5% |
| `no_focus_keyword` | notice | 4 | top density <0.5%, no repetition |
| `heading_keyword_mismatch` | warning | 6 | <30% headings reference primary keywords |
| `tags_not_in_body` | warning | 6 | declared tags absent from body |
| `low_diversity` | notice | 3 | lexical diversity <35% on 200+ words |
| `repetitive_sentence_starts` | notice | 2 | top sentence start used 5+ times |
| `no_sections_in_long_post` | critical | 12 | `wc > 500 && h2Count == 0` |
| `sparse_sections` | warning | 6 | `wc > 1000 && h2Count < 3` |
| `no_lists` | notice | 3 | `wc > 600 && (ul+ol) == 0` |
| `no_formatting` | notice | 3 | `wc > 400 && no <strong/em/code/blockquote>` |
| `no_media` | warning | 5 | `wc > 800 && images == 0` |

### Technical (max contribution 100, weight 15%)

| Code | Severity | Penalty | Condition |
|---|---|---|---|
| `slug_missing` | critical | 20 | `!slug` |
| `slug_long` | notice | 3 | `slug.length > 80` |
| `no_featured_image` | warning | 5 | `published && !featuredImage && !ogImage` |
| `orphan_seo` | critical | 12 | `published && no SEO fields at all` |
| `no_keywords` | notice | 3 | `!tags && !keywords` |
| `duplicate_title` | critical | 15 | cross-corpus collision |
| `duplicate_slug` | critical | 15 | cross-corpus collision |
| `duplicate_description` | warning | 8 | cross-corpus collision |

### UX / Readability (max contribution 100, weight 10%)

Skipped entirely when `wc < 50`.

| Code | Severity | Penalty | Condition |
|---|---|---|---|
| `flesch_very_difficult` | critical | 18 | Flesch <30 |
| `flesch_difficult` | warning | 8 | Flesch <50 |
| `flesch_fairly_difficult` | notice | 4 | Flesch <60 |
| `long_sentences` | warning | 6 | avg sentence >25 words |
| `borderline_sentence_length` | notice | 2 | avg sentence >20 words |
| `too_many_long_sentences` | warning | 5 | >25% sentences over 25 words |
| `passive_voice_high` | notice | 4 | passive rate >25% |
| `low_transitions` | notice | 3 | <30% paragraphs use transitions (3+ paragraphs only) |

### Freshness (max contribution 100, weight 10%)

Skipped on non-published posts.

| Code | Severity | Penalty | Condition |
|---|---|---|---|
| `stale_content_year` | critical | 15 | not updated in >365 days |
| `stale_content_6mo` | warning | 8 | not updated in >180 days |
| `stale_content_3mo` | notice | 3 | not updated in >90 days |

---

## 5. Readability Engine

`client/src/lib/seoReadability.js` provides `analyzeReadability(html)` returning:

```
{
  flesch: 0-100,
  grade: { band, tone },
  wordCount,
  sentenceCount,
  paragraphCount,
  avgSentenceWords,
  avgParagraphWords,
  passivePct,
  transitionPct,
  longSentenceCount,
  longSentencePct,
  longParagraphCount,
}
```

### 5.1 Flesch Reading Ease

```
score = 206.835 − 1.015·(words / sentences) − 84.6·(syllables / words)
```

Bands:
- ≥80 → easy
- 70–80 → fairly easy
- 60–70 → standard (target)
- 50–60 → fairly difficult
- 30–50 → difficult
- <30 → very difficult

### 5.2 Syllable Counter

Heuristic. Word is lowercased + non-alpha stripped. <=3 chars = 1 syllable. Else strip silent endings (`-es`, `-ed`, `-e` after non-vowel), strip leading `y`, count vowel groups `[aeiouy]{1,2}`. Minimum 1.

### 5.3 Sentence Splitter

Splits on `.!?` followed by whitespace + capital. Abbreviations (`Mr.`, `Dr.`, `e.g.`, `i.e.`, etc.) protected via pre-pass that strips trailing dots.

### 5.4 Paragraph Splitter

`</p>`, `</div>`, double `<br>`, double newline boundaries. Strips HTML after split.

### 5.5 Passive Voice Estimation

Regex matches `\b(am|is|are|was|were|be|been|being)\s+(\w+ed|done|gone|seen|taken|...)\b`. Count / sentence count × 100. Heuristic — not linguistically perfect but operationally useful.

### 5.6 Transition Word Coverage

Dictionary of 90+ words/phrases (`accordingly`, `additionally`, `as a result`, ..., `yet`). Counts paragraphs containing at least one. Reports `transitionPct = withTransition / totalParagraphs × 100`.

### 5.7 HTML Extractors

- `extractHeadings(html)` — returns `[{level, text}]`
- `extractImages(html)` — returns `[{alt, hasAlt}]`
- `extractLinks(html, siteHost)` — partitions into `{internal, external}` based on hostname match

---

## 6. Semantic Depth Analysis

Pure heuristics in `seoHealth.js → semanticChecks`:

### 6.1 Keyword Density

Strip HTML → tokenize (`/\b[a-z][a-z'-]{1,}\b/g`) → filter stopwords (90+ word list) → build frequency map.

- Top word density >3.5% (on 100+ token doc) → `keyword_stuffing`
- Top word density <0.5% AND top count <=1 (on 100+ token doc) → `no_focus_keyword`

### 6.2 Heading–Keyword Coverage

Build target token set from seoTitle + title + tags + keywords. Check what fraction of headings reference any target token. <30% → `heading_keyword_mismatch`.

### 6.3 Tags-in-Body

If declared tags/keywords exist but none appear in body tokens → `tags_not_in_body`.

### 6.4 Lexical Diversity

`uniqueTokens / totalTokens`. On 200+ token doc, <35% → `low_diversity`.

### 6.5 Sentence-Start Repetition

Track first word of each sentence in lowercase. Top start used 5+ times on 8+ sentence doc → `repetitive_sentence_starts`.

---

## 7. Content Structure Intelligence

`seoHealth.js → structureChecks`:

- `<ul>` / `<ol>` / `<li>` counts
- `<strong>` / `<b>` / `<em>` / `<i>` / `<code>` / `<blockquote>` counts → `formattingHits`
- `h2Count` from headings extractor
- `images.length` from image extractor

Checks:
- Long post (>500 wc) with 0 H2 sections → critical penalty 12
- Long post (>1000 wc) with <3 H2 → warning 6
- Long post (>600 wc) with no lists → notice 3
- 400+ wc with no formatting → notice 3
- 800+ wc with no images → warning 5

`hasStructure` = `(h2Count >= 2) && (ulCount + olCount + formattingHits > 0)`. Required for long-form bonus.

---

## 8. Cross-Corpus Duplicate Detection

`seoHealth.js → corpusDuplicates(blogs)` builds three maps:
- `titleMap` keyed by lowercased `seoTitle || title`
- `slugMap` keyed by lowercased `slug`
- `descMap` keyed by lowercased `seoDescription`

Returns a closure `(blog) => issues[]` used inside `auditBlog`. Counts >1 trigger duplicate penalties.

---

## 9. Insights Extraction

`extractInsights(byCategory, signals, readability)` produces:

```
{
  topStrengths: [{ label, score }],   // categories scoring 90+, sorted desc
  topWeaknesses: [{ label, score }],  // categories scoring <50, sorted asc
}
```

Plus signal-driven highlights:
- Strong lexical diversity (>0.45 with 700+ tokens) added to strengths
- Well-structured long form (700+ wc + hasStructure) added to strengths

UI aggregates these across the corpus to surface dominant patterns.

---

## 10. UI Surfaces

### Two consumers of the canonical engine

The engine has **two production consumers** that must always render the same scores for the same input:

1. **`/seo` page** — `client/src/pages/SeoEngine.jsx`. Cross-corpus rollup view for operators. Calls `auditCorpus(blogs)` to render gauge, category bars, health list, content table, etc.
2. **Blog Editor Cockpit** — `client/src/components/blog-editor/LiveSeoEngine.js`. Per-blog live view for authors. Wraps `auditBlog(blog)` and adds:
   - Editor-form → audit-blog shape adapter (`buildBlogFromForm`)
   - Focus-keyword placement matrix (not in core engine)
   - Sub-score derivation (`deriveSubScores`)
   - Task-based checklist (`buildChecklist`)

The canonical engine (`seoHealth.js` + `seoReadability.js`) is the single source of truth. Both consumers call the same `auditBlog`/`auditCorpus` functions. **No engine fork.** If a score appears different between the two surfaces, it's a UI bug, not an engine bug.

`/analytics` page also consumes the engine via `SeoTelemetry.jsx` which runs `auditCorpus()` over the tenant-scoped blog corpus for cross-page SEO health rollup.

### `/seo` page surfaces (`client/src/pages/SeoEngine.jsx`):

### Overview card
- Radial RadialBarChart gauge with weighted overall score
- Score number + grade letter (A/B/C/D/F) inside
- InterpretationBadge pill (Excellent/Strong/Average/Weak/Critical)
- 5 CategoryBar mini-gauges (score + weight badge + animated fill)
- 8 OverviewTile cells (Indexed Pages, Published Blogs, Avg Word Count, Readability, Sitemap Status, Critical, Warnings, Notices)
- Score formula footer + caps explanation

### Insights panel (3-up grid)
- Score Interpretation card — band + thin-content rate + avg WC + cap explanation
- Dominant Strengths — categories scoring 90+ across corpus
- Dominant Weaknesses — categories scoring <50 across corpus

### Critical Roster
- Renders when any blog scores <40
- Rose-tinted card grid (up to 9 visible)
- Per-blog: title, overall score, word count, cap, grade, top weaknesses list

### Sitemap Operations
- Per-tenant card: slug, status, URL counts, sitemap XML link
- Actions: Open Sitemap, Regenerate, Ping Engines, Validate XML

### Metadata Coverage
- 4 CoverageBar (SEO Title, Meta Description, OG Image, Canonical)
- 4 MiniStat from `/api/seo/stats` rollups

### SEO Health (filterable)
- Severity filter pills (All, Critical, Warning, Notice with counts)
- Category filter pills (All + 5 categories)
- Severity-sorted issue list (max 60 visible)
- Each issue: icon, message, severity badge, category badge, penalty `−N`, affected blog title, fix

### Content Intelligence Table
- 10 sortable columns: Title, Words, Read (Flesch), Meta, Cont, Tech, UX, Fresh, Status, SEO Score
- Per-category sub-scores color-graded
- Final column: overall score + grade letter

### Robots & Indexing
- Per-tenant robots.txt card with directive summary

### Future Integrations
- IntegrationCard placeholders for Google Search Console + Bing Webmaster
- Reserved hooks shown: `GET /api/seo/gsc/summary/:websiteId`, `GET /api/seo/bing/summary/:websiteId`

---

## 11. Future Integration Points

`client/src/api/seo.js`:

```js
export const getGoogleSearchConsoleSummary = (websiteId) =>
  api.get(`/seo/gsc/summary/${websiteId}`).catch(() => null);

export const getBingWebmasterSummary = (websiteId) =>
  api.get(`/seo/bing/summary/${websiteId}`).catch(() => null);
```

Both call-sites typed and rendering stubbed. Drop the `.catch()` and implement the backend endpoints when OAuth flows are wired:

**Planned backend additions:**
- `POST /api/seo/gsc/oauth/start` — initiate Google OAuth
- `GET /api/seo/gsc/oauth/callback` — token exchange
- `GET /api/seo/gsc/summary/:websiteId` — impressions, clicks, CTR, avg position
- `GET /api/seo/gsc/queries/:websiteId` — top queries
- `GET /api/seo/gsc/pages/:websiteId` — top pages

**Schema extension idea:**
- New `SeoAudit` collection — periodic server-side audit snapshots written by a cron, allowing historical score tracking
- New `KeywordRanking` collection — paired with GSC integration for SERP position over time

The current pure-function audit engine can run server-side without changes — same input shape, same output shape.

---

## 12. Performance Notes

- `analyzeReadability()` is O(n) over content length
- `auditCorpus()` is O(blogs × content_length)
- Caller (`SeoEngine.jsx`) wraps in `useMemo` keyed on `scopedBlogs`
- For 100+ blogs with 5000-word content, audit completes in <50ms on commodity hardware
- If corpus grows beyond ~500 blogs, move audit to a server-side scheduled job that writes to a `SeoAudit` collection
- Backend already ready: `seoHealth.js` is pure ES modules — copy to `src/services/` and consume from a controller

---

## 13. Testing Hooks (for future test suite)

Each check function returns issues deterministically given the same blog. To unit-test:

```js
import { auditBlog } from './seoHealth';

const blog = {
  title: 'Test',
  content: '<p>Lorem ipsum...</p>',
  seoTitle: 'A meta title between 50 and 60 chars exactly',
  seoDescription: '...140 chars meta description...',
  status: 'published',
  publishedAt: new Date().toISOString(),
  slug: 'test-blog',
};

const result = auditBlog(blog);
// result.overall, result.grade, result.byCategory.metadata.score, result.issues
```

---

## 14. Anti-Patterns

Do **not**:
- Hardcode score offsets or "feels right" adjustments
- Use Math.random() anywhere in scoring
- Compute different penalties for the same code in different places
- Skip the content cap to make a specific post score higher
- Add metadata-only "score boosts" that bypass the confidence multiplier

If a real-world SEO platform (Ahrefs, Semrush, Yoast) would not produce that behavior, the engine should not produce it either.

---

## 15. Internal Linking Engine v2 (Phase 3.2)

`client/src/lib/anchorIntel.js` + `client/src/lib/linkGraphIntel.js` power the editor's Internal Linking Assistant and the `/seo` page's Content Relationship Graph.

### 15.1 Anchor variant generation (sentence-derived)
- Splits the current draft into sentences
- For each sentence touching a target blog's signature tokens, extracts 2–5 word substrings that:
  - Contain ≥1 target token
  - Start AND end with content words (no stopword boundaries)
  - Have ≥50% content-word density
- Emits `{text, type:'exact|partial|semantic', score, band, context}` — each anchor carries the actual sentence as context for the operator UI
- Eliminates n-gram noise like "best ultimately outsourcing"

### 15.2 Link insertion (contextual replace)
`BlogForm.handleInsertLink` performs inline replacement — wraps the anchor inside an existing sentence using a `\b(?:anchor)\b` regex with negative-lookbehind on `<a>` tags. Falls back to appending a paragraph only when no in-context match exists. Result: links land in real sentences, not orphaned trailing paragraphs.

### 15.3 Link graph + clustering
- `buildLinkGraph(corpus)` — directed graph of internal links (slug → slug)
- Per-node: inbound/outbound counts, orphan flag, hub flag (≥2× avg inbound)
- `buildClusters(nodes, threshold=0.18)` — single-link agglomerative clustering on signature-token Jaccard
- `computeLinkingQuality(graph, clusters)` — 5-signal corpus score (outbound density, non-orphan rate, anchor diversity, cluster cohesion, inbound coverage)
- `analyzeLinkGraph(corpus)` — top-level bundle: graph + clusters + quality + orphans (severity-classified) + recommended targets per orphan

### 15.4 Multi-tenant
`useTenantBlogCorpus(targetWebsiteId, currentBlogId)` hook fetches with `?targetWebsite=<id>&includeContent=true&status=published&limit=100`. 5-min sessionStorage cache. Suggestions never cross tenant boundary.

---

## 16. Content Decay Engine (Phase 3.1)

`client/src/lib/contentDecay.js` — per-blog weighted decay score across 6 sub-signals.

### 16.1 Weights (higher score = MORE decay)
```
engagement  30%   — viewsDeltaPct from /api/analytics/blog-trends
freshness   25%   — days since update
seoDrift    20%   — inverse of audit.overall
linking     10%   — orphan + cluster cohesion
metadata    10%   — inverse of audit.byCategory.metadata.score
contentBody  5%   — inverse of content body score when wc<700
```

### 16.2 States
- `fresh` (<20) · `stable` (<40) · `aging` (<60) · `declining` (<80) · `critical` (≥80)

### 16.3 Backend
`GET /api/analytics/blog-trends?websiteSlug=&range=month` returns one row per published blog with `{current:{views,sessions}, previous:{views,sessions}, viewsDeltaPct, sessionsDeltaPct, ageDays, updatedDays}`. Backed by `analyticsService.getBlogTrends`.

### 16.4 Surfaces
`ContentDecayPanel` (filterable + per-blog expandable), `DecayQueueCard` (priority-sorted refresh queue), `DecayAlertsStrip` (top alerts).

---

## 17. Unified Keyword Matcher (Phase 3.3)

`client/src/lib/keywordMatch.js` is the single source of truth for "does this haystack contain this keyword?". `normalizeText` / `normalizeKeyword` / `countOccurrences` / `includesKeyword` / `computeDensity` / `tokenize` consumed by:

- `analyzeFocusKeyword` in `LiveSeoEngine.js`
- `analyzeKeywordIntel` in `client/src/lib/keywordIntel.js`
- SEO Engine semantic checks in `seoHealth.js`

Handles: NBSP, zero-width chars, smart quotes, em/en dashes, hyphens/underscores as word separators, ASCII word-boundary lookarounds (so "art" does not match "artist").

**Density now consistent** across Focus Keyword card + Keyword Intelligence card + audit scoring (previously off by ~3pp due to different tokenizers).

---

---

## 18. AI Editorial Assistance Layer (Phase 4.0)

The deterministic SEO engine (`seoHealth.js` / `seoReadability.js` / `keywordMatch.js`) remains the **single source of truth** for every blog score. The Phase 4.0 AI layer is purely assistive — it generates candidate text (titles, meta descriptions, future: FAQs, outlines, audits) that the operator can apply. Scoring those candidates is done by **deterministic** modules so the AI cannot drift the canonical score.

### 18.1 Architecture
- `src/services/ai/AIProviderService.js` — feature-routed orchestrator. Caller passes a `feature` key (e.g. `'titles'`, `'meta_descriptions'`); the orchestrator resolves the chain via `config/modelRegistry.js` + `config/routingStrategy.js` and walks it on failure.
- Providers: `GeminiProvider` (Google) + `OpenRouterProvider` (OpenAI-API-compatible gateway → DeepSeek / Nemotron / Qwen3-Next / Qwen3-Coder / GPT-OSS / GLM 4.5 Air).
- 9 feature plans wired. 8 models registered. All keys backend-only.

### 18.2 Editor surfaces
- **Title suggestions** — `client/src/components/blog-editor/AiTitleSuggester.jsx` next to title input. 7 categories (SEO / CTR / Authority / Listicle / Educational / Problem-Solution / Beginner) × 2 variants. Each surface shows a deterministic quality bundle from `client/src/lib/titleQuality.js`: overall band + length, keyword position (via `keywordMatch.js`), CTR heuristics, readability. One-click Apply mutates form state; the live SEO engine recomputes.
- **Meta description suggestions** — `client/src/components/blog-editor/AiMetaSuggester.jsx` next to the Meta Description label. 7 categories × 2 variants. Deterministic scoring via `client/src/lib/metaQuality.js`: 140-160 char ideal / 110-170 hard floor-ceiling, keyword placement + stuffing detection, action-verb CTR, readability.

### 18.3 Boundary rules
- AI never writes to the SEO engine. Scoring stays in `seoHealth.auditBlog()`.
- Per-suggestion AI quality bundles are advisory only. They let editors pick the strongest variant BEFORE Apply.
- Banned-phrase filter at the orchestrator level kills outputs containing AI-tells ("ultimate guide", "you won't believe", "shocking", "game-changer", "revolutionary", "discover the secrets", "in today's world", etc.) BEFORE they reach the UI.
- Hard length rules enforced server-side: titles 18-70 chars, meta descriptions 110-170 chars. Out-of-band suggestions are dropped from the response.
- Tenant context is built dynamically by `src/services/ai/promptBuilders/tenantContext.js → renderTenantBrief(websiteDoc)` from `Website.aiContext` + `description` + `seoDefaults.keywords` + `name`. **No hardcoded tenant map.** Every prompt builder (`titlePrompt`, `metaPrompt`, `faqPrompt`, `siteIntelligencePrompt`) accepts a `tenant` field carrying the full Website doc. Adding a new tenant = new `Website` row; AI briefs assemble automatically.

### 18.4 Endpoint contract
- `POST /api/ai/blog/titles` → `{ suggestions: { seo: [...], ctr: [...], ..., beginner: [...] }, provider, model, usage }`
- `POST /api/ai/blog/meta-descriptions` → same shape, descriptions instead of titles.
Each suggestion item: `{ title|description, rationale }`. Frontend enriches with `quality` via deterministic analyzer.

---

*End of SEO engine specification.*
</content>
</invoke>