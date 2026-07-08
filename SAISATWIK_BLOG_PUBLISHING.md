# Publishing a SaiSatwik Blog — SEO / AEO / GEO Playbook

**This file is the authoring standard for every blog published to `saisatwik.com`.**
Read it before writing a post. Follow it end-to-end — every rule earns its place.

SaiSatwik blogs push over the WordPress REST API from a local data file. WordPress owns
rendering; this playbook owns the *shape and quality* of what lands there.

> This file supersedes the SaiSatwik section at the bottom of `BLOG_PUBLISHING.md`
> for anything content-related. The publish mechanics in that file still apply.

---

## 1. What SaiSatwik Is (write for this reader)

**SaiSatwik Technologies** — B2B IT services company. Tagline: "Redefining IT for you".
Live service lines (from `saisatwik.com` nav — do not invent new ones):

- **Consulting** — Technology · Business · Process · Digital Transformation
- **Software Development** — Custom · Mobile · Web · Enterprise · E-commerce
- **Enterprise Applications** — SAP
- **KPO & BPO** — BPO · Customer Service · Telemarketing · Technical Support · Chat · Email · Data Entry
- **Staff Augmentation** — Permanent · Contractual · Bulk Hiring

**Buyer profile:** decision-makers at SMBs and mid-market enterprises evaluating
outsourced IT delivery. Titles: CTO, VP Engineering, Head of Ops, IT Director,
Procurement Lead, Founder. India-primary market with global reach.

**Voice:** direct, operator-savvy, evidence-backed. Not marketing-agency prose.
Not startup breezy. Never "we're passionate about" or "cutting-edge solutions".

---

## 2. Blog Intent — Pick One Before Writing

Every post serves ONE of three intents. Pick before drafting. Structure changes accordingly.

| Intent | Signal in title | Target reader stage | Primary metric | CTA density |
|---|---|---|---|---|
| **Traffic** | "How to X", "What is Y", "X vs Y", "X in 2026" | Awareness — problem research | organic clicks + AI citations | 1 CTA, footer only |
| **Lead** | "X checklist for Y", "X pricing / cost / ROI", "hire X", "X guide for [role]" | Consideration — vendor eval | form submits | 2 CTAs — mid + end |
| **Authority** | "State of X 2026", "X benchmark report", "X case study" | Late-stage validation + backlinks | citations + backlinks + brand searches | 1 soft CTA at end |

**Decide the intent when I give you the title.** If title is ambiguous, I flag it back
before writing. Do not blend intents — a lead-blog with authority framing dilutes both.

---

## 3. AEO / GEO Foundations — Every Post Ships With These

AI Overviews, ChatGPT web search, Perplexity, Gemini, Claude search, Bing Copilot
all extract answers *at the passage level*. Rank is not enough — the passage has
to be self-contained, entity-anchored, and cite-worthy.

### 3.1 The "Quick Answer" opener is mandatory

Every post opens with:

```html
<h2>Quick Answer</h2>
<p>[Direct 2-3 sentence answer to the title's question. First sentence answers.
Second sentence adds the differentiator or condition. Third sentence names
SaiSatwik + service line.]</p>
```

Rules:
- **Answer in the FIRST 40 words.** Do not build up to it.
- Include the primary keyword phrase from the title, verbatim, in sentence one.
- Name **SaiSatwik** by proper noun in the closing sentence — this is the LLM
  citation hook (see §5).
- 134–167 words total is the featured-snippet sweet spot; Quick Answer itself
  stays tighter (60–120 words), because the full passage gets amplified by the
  section below.

### 3.2 Every H2 must be a question a real buyer types

Not "Benefits of SAP for Manufacturing" → *"What does SAP offer a mid-market
manufacturer in India?"*.
Not "Our Approach" → *"How does SaiSatwik deliver an SAP rollout in 90 days?"*.
Not "Conclusion" → replace with `<h2>What to do next</h2>` or drop entirely.

**Question headings must contain the entity (proper noun) the answer names.**
When the answer is about SaiSatwik, put "SaiSatwik" in the heading. When about
a service line, name it. LLMs match heading → answer during extraction;
generic headings ("The Approach", "Why It Matters") lose the match and the citation.

### 3.3 Passage self-containment

Each `<h2>` section must be *readable and citable without the rest of the post*.
- Do not open with a pronoun that refers to the previous section ("It solves
  this by…" — no. "SaiSatwik's process consulting solves this by…" — yes).
- Restate the subject (proper noun) at least once per 3 paragraphs.
- Numbers, sources, and definitions stay inside the section that uses them —
  do not force the reader to scroll up.

### 3.4 Citation-hook patterns

Structure content the way LLMs quote it back:

- **Sourced statistics.** Every number gets an inline hyperlink to a
  first-party source (NASSCOM, Gartner, IDC, Statista, government portals,
  vendor whitepapers). Format: `<p>India's IT-BPM industry crossed
  <a href="https://…">$254 billion in FY 2024 (NASSCOM)</a>…</p>`. Unsourced
  numbers are the #1 reason a passage is skipped by AI answer engines.
- **Comparative tables.** `<table>` with a `<caption>` — AI extractors love
  tables for "X vs Y" queries. Two-column max, labels short.
- **Definition boxes.** Short `<p>` immediately after an H2, formatted as
  `<p><strong>Definition:</strong> [term] is …</p>`. Gets pulled as the answer
  to "what is [term]" queries.
- **Ordered "steps" lists.** `<ol>` for procedural content. LLMs rank
  procedural passages higher for how-to queries.
- **Named entities in every section.** "SaiSatwik", the client industry
  ("SMB manufacturer", "D2C brand"), the specific technology ("SAP S/4HANA",
  "Zoho Creator", "Node.js"). LLMs use entity co-occurrence to decide who
  gets cited when the answer is generic.

### 3.5 FAQ block at the end (drives FAQPage schema)

Close every post with:
```html
<h2>FAQs about [topic]</h2>
<h3>[Question 1 — high-intent, buyer-typed]</h3>
<p>[45–90 word direct answer]</p>
<h3>[Question 2]</h3>
<p>[…]</p>
```

3–5 questions. Each question is a real search phrase (check Google's
"People also ask" for the target keyword). Each answer opens with the answer,
not with setup. The WordPress SEO plugin (Yoast/Rank Math if installed) will
emit FAQPage JSON-LD from this structure automatically.

---

## 4. Readability Rules — Non-Negotiable

Better than most B2B blogs on the internet. Measurable targets:

| Metric | Target | Why |
|---|---|---|
| Average sentence length | **≤ 18 words** | Every extra word past 20 drops comprehension ~7% (Nielsen Norman) |
| Long sentences (>25 words) | **< 15% of total** | AEO extractors clip long sentences mid-idea |
| Paragraph length | **≤ 3 sentences** (or ≤ 60 words) | White space signals scannability; passes retention research |
| Flesch Reading Ease | **60–70** (target 65) | "Plain English" band — same range HBR / McKinsey Insights hit |
| Passive voice | **< 10%** of sentences | Active voice quotes cleaner |
| Transition-word coverage | **≥ 40% of paragraphs** | AEO extractors prefer flowed prose over blocky lists |

**Structure rules on top of the numbers:**

- Every H2 followed by exactly ONE paragraph before any list or table.
- Never two paragraphs in a row without a subordinate H3 or a list breaking them.
- No paragraph exceeds 60 words. If it does, split.
- Numbers under 10 spelled out except in tables and comparative stats.
- Never `<br>` — use `<p>` for line breaks.

---

## 5. Anti-AI-Detection — Write Like a Person Who Has Done This

AI-detectors (Originality.ai, GPTZero, Copyleaks) flag on: uniform sentence rhythm,
GPT-sig phrases, safe-hedging language, generic openings. Also: humans notice.
Every one of these gets the post skipped for citation.

### 5.1 Banned phrases (delete on sight)

If any of these appear in a draft, they get replaced or cut:

- "In today's fast-paced world"
- "In the ever-evolving landscape of"
- "It's important to note that"
- "It's worth noting that"
- "Delve into", "delving into"
- "Unlock the power of"
- "Game-changer", "revolutionize", "cutting-edge", "state-of-the-art"
- "Robust", "seamless", "holistic", "leverage" (as a verb), "synergy"
- "Whether you're a startup or an enterprise"
- "In this comprehensive guide"
- "Let's dive in"
- "Ultimate guide to"
- "Discover the secrets of"
- "Empower your business"
- "Streamline your operations" (unless quoting a client)
- "Tapestry", "landscape" (as metaphor), "realm", "journey" (as metaphor)
- "Furthermore" as a sentence opener (use "Also" or start a new paragraph)
- "Moreover" as a sentence opener (same fix)

### 5.2 Rhythm — vary sentence length deliberately

Uniform-length sentences are the #1 AI tell. Every paragraph mixes:
- One short sentence (5–9 words).
- One medium (12–18 words).
- One longer that carries the argument (20–24 words), with a clear pivot.

Example (good rhythm):
> "SaiSatwik has run this playbook for eleven mid-market SAP rollouts. Nine of
> those went live inside 90 days. The two that slipped both stalled at
> master-data cleanup, which is why the first two weeks of every current
> engagement are spent on master-data validation before the config work starts."

Example (bad — flat AI rhythm):
> "SaiSatwik is a leading provider of SAP implementation services. Our team
> delivers robust solutions to enterprise clients. We leverage cutting-edge
> technology to streamline your operations. Contact us today for a free
> consultation."

### 5.3 Specifics over generalities

Every claim gets a number, a name, or a scenario. "Fast turnaround" is dead;
"delivered a Zoho-to-Salesforce migration for a Bengaluru D2C brand in six
weeks" is alive. AI detectors and human readers both respect specificity.
Vague B2B language gets flagged as synthetic.

### 5.4 Opening lines — banned template

Never open a post's Quick Answer with:
- "In an era of…"
- "As businesses navigate…"
- "The rapid growth of…"

Open with the direct answer. Period.

---

## 6. Keyword Handling — No Stuffing, Full Coverage

Target ONE primary keyword per post (from the title). Support with 5–10
semantically related terms. Never over-repeat the primary.

### 6.1 Density targets

- **Primary keyword:** 0.8%–1.5% of total word count. Below 0.5% = under-optimized;
  above 2% = stuffing signal.
- **Secondary/LSI terms:** each appears 1–3 times naturally.
- **Primary in:** `<title>` (title field), Quick Answer sentence one, at least
  one `<h2>`, first 100 words, meta description, URL slug. That's the placement
  ceiling — no need to sprinkle further.

### 6.2 LSI + entity coverage

Google and LLMs both use entity co-occurrence to score topical authority.
For every post, list 8–12 co-occurring entities BEFORE drafting:
- **Technologies** touched (SAP S/4HANA, Ariba, Fiori, Node.js, React, Zoho…)
- **Roles** buying/using (CTO, CFO, plant manager, warehouse ops)
- **Industries** in scope (manufacturing, retail, BFSI, healthcare)
- **Geographies** (India — Bengaluru, Hyderabad, Pune, Chennai; and global
  where SaiSatwik operates)
- **Adjacent processes** (procurement, order-to-cash, record-to-report)

Weave these throughout — never a keyword-list dump.

### 6.3 One primary phrase — many surface forms

If primary keyword is "SAP implementation for SMEs", accept these surface forms
in the wild without penalty: "SAP rollout for a mid-market business", "S/4HANA
implementation for SMBs", "SAP go-live for an SME". Google clusters them as one
intent; humans read variety as fluency.

---

## 7. Internal Links, Outbound Links, Tags, and Clusters

Every SaiSatwik post is a node in a topic graph. Rank, citations, and human
retention all follow from that graph, not from any single post. Rules below are
mandatory on every draft.

### 7.1 Inbound and outbound link counts per post

Every published post ships with:

| Link type | Minimum | Sweet spot | Ceiling | Where they live |
|---|---|---|---|---|
| **Outbound to authoritative sources** | 3 | 5–7 | 10 | Inline in prose, on the anchor phrase that names the source or statistic |
| **Internal (to other SaiSatwik posts + service pages)** | 3 | 5–8 | 12 | Inline in prose, on descriptive anchor text — never "click here" |
| **Inbound from other SaiSatwik posts** (earned) | 0 at publish; 3+ within 60 days | 5–10 | — | Retro-added by editing older posts in the same cluster |

**Outbound authority ladder** — always prefer the higher rung when both exist:

1. Government / regulator (RBI, MeitY, SEBI, GSTN, IRDAI, MCA, EPFO)
2. Standards bodies (ISO, IEEE, W3C, NIST)
3. Industry associations (NASSCOM, CII, FICCI, ASSOCHAM)
4. Vendor first-party (SAP News Center, Microsoft Learn, AWS docs, Google Cloud docs, Oracle docs)
5. Primary research (Gartner, IDC, Forrester, McKinsey, BCG, Deloitte, EY)
6. Trade press / verified data (Statista, Bloomberg, Reuters, Livemint, Economic Times)
7. Peer-reviewed papers (arXiv, ACM, IEEE Xplore)

Blog aggregators, listicles, Medium posts, and other agencies' blogs are NOT
authoritative sources — do not cite them. If the only source is an agency
blog, find the original and cite that.

**Outbound link mechanics:**
- Every outbound link opens in a new tab: `target="_blank" rel="noopener"`
- Anchor text = the actual source name or the specific claim, never bare URLs
- No `nofollow` on authority citations (we WANT link equity flowing to real sources
  — Google reads this as trust)
- Add `rel="sponsored"` only if the link is paid/affiliate (SaiSatwik posts do not use these)

**Internal link mechanics:**
- Anchor text is a descriptive phrase that matches the target post's primary
  keyword — never "click here", "read more", "this post"
- Same tab: no `target="_blank"` for internal links
- Never link a phrase twice in the same post — first mention wins
- Every post links to at least one **service page**
  (`/services/`, `/consulting-services/*`, `/software-development/*`, `/kpo-bpo/*`,
  `/staff-augmentation/*`) — this is the lead conversion path

### 7.2 Anchor-text discipline

Anchor text is a ranking signal AND a citation signal. Get it right:

- **Exact-match** (anchor = target's primary keyword) — max 20% of internal
  anchors to any given target. Google flags over-optimized anchor profiles.
- **Partial-match** (anchor contains target keyword + context) — 40–50%.
  Example: "SaiSatwik's SAP implementation for mid-market manufacturers"
  linking to the SAP rollout post.
- **Branded** ("SaiSatwik's SAP practice", "the SaiSatwik process consulting team") — 20–30%.
- **Natural language** ("what the numbers actually look like", "the checklist
  we walk clients through") — remainder. Reads human; hard to over-optimize.

Repeat this discipline outbound too: the source name is stronger anchor text
than "according to a recent report".

### 7.3 Retro-linking — closing the inbound loop

At publish time a new post has zero inbound links. That's fine. **Within 7 days
of publish**, edit 2–3 older SaiSatwik posts in the same cluster (see §7.5) and
insert a natural inline link to the new post — descriptive anchor, in-context
paragraph. Update the old post's data file, re-run the CLI. Idempotent.

Result: every 30 days, every post in an active cluster has 3–5 inbound links
from siblings. That is what drives PageRank flow inside SaiSatwik's own graph
and what LLMs pick up as topical authority.

Track retro-linking in `src/utils/saisatwik-blogs/CLUSTERS.md` (see §7.5).

### 7.4 Tags — discipline, not decoration

Every post has 4–8 tags. NEVER 0. NEVER >10. Tag rules:

- **One tag per axis.** Axes: technology (`SAP S/4HANA`, `Node.js`), service line
  (`SAP implementation`, `custom software development`), buyer industry
  (`manufacturing`, `retail`, `BFSI`, `healthcare`, `D2C`), buyer role (`for CTOs`,
  `for CFOs`, `for COOs`), geography (`India`, `Bengaluru`), format (`case study`,
  `pricing guide`, `benchmark`, `checklist`).
- **Consistent casing.** Title Case for multi-word tags. `SAP S/4HANA`, not
  `sap s/4hana` or `Sap S4hana`. WordPress dedupes by slug, but display casing
  matters on tag archive pages.
- **No pluralization drift.** `Manufacturing`, not `Manufacturer` in one post
  and `Manufacturers` in another. Pick the archive form and stick to it.
- **Register in `TAGS.md`** (see §7.5) before using a new tag. Anything not in
  the registry is a candidate to consolidate.

**Tags feed clusters** — the tag archive page (`/tag/sap-s4hana/`) is a
low-effort but real cluster hub. Google indexes tag pages. Keep them clean.

### 7.5 Topic clusters — hub-and-spoke, planned up front

SaiSatwik's blog is organized as **hub-and-spoke clusters**. Each cluster =
one topic authority zone. Structure:

```
Cluster hub (one authoritative pillar post OR a service page)
        │
        ├── Spoke 1 (specific angle) ──┐
        ├── Spoke 2                    │  every spoke links UP to the hub
        ├── Spoke 3                    │  hub links DOWN to every spoke
        └── Spoke 4 ───────────────────┘
                    │
                    └── spokes link laterally when directly related
```

**Rules:**
- Every new post is assigned to exactly ONE cluster before drafting.
- Every spoke links to its hub with descriptive anchor text — always.
- The hub links to every spoke as it publishes — retro-edit the hub each time
  a new spoke lands (re-run the CLI to update the hub's data file).
- Spokes link laterally only when the content genuinely connects — never
  round-robin auto-linking.
- Each cluster targets ONE primary intent bucket (traffic / lead / authority
  — see §2). Mixed-intent clusters dilute rank.

**Cluster registry lives at:** `src/utils/saisatwik-blogs/CLUSTERS.md`.
Create it if missing. Shape:

```markdown
# SaiSatwik Blog Cluster Registry

## Cluster: SAP Implementation for Indian Mid-Market
**Hub:** `sap-implementation-mid-market-india` (pillar post) OR
       `/software-development/enterprise-application/sap/` (service page)
**Intent:** lead
**Primary keyword:** SAP implementation India
**LSI/entities:** SAP S/4HANA, ERP rollout, Ariba, Fiori, GST, Indian tax, 90-day go-live

**Spokes:**
- [x] `sap-s4hana-cost-mid-market-manufacturer-india` (published 2026-07-08, retro-linked from hub ✓)
- [ ] `sap-implementation-mistakes-to-avoid`
- [ ] `sap-vs-oracle-erp-india-mid-market`
- [ ] `sap-fiori-adoption-checklist-for-india`

**Retro-linking log:**
- 2026-07-08 — inbound to sap-s4hana-cost… added from hub

---

## Cluster: [next cluster]
...
```

**Cluster planning is done BEFORE writing spokes.** If a title lands and there's
no cluster to attach it to, either:
1. Create a new cluster with a hub candidate (pillar post or service page), OR
2. Reject the title as off-strategy and pick one that fits an active cluster.

Off-strategy posts are the biggest cause of "site has content but no rank".
A cluster gets to rank; orphan posts don't.

### 7.6 Tag registry file

Register every new tag in `src/utils/saisatwik-blogs/TAGS.md`:

```markdown
# SaiSatwik Blog Tag Registry

## Technology
- SAP S/4HANA
- SAP Ariba
- SAP Fiori
- Node.js
- React
- Zoho Creator
- Microsoft Dynamics 365
- Salesforce

## Service Line
- SAP Implementation
- Custom Software Development
- Mobile App Development
- Digital Transformation Consulting
- BPO Services
- Staff Augmentation

## Industry
- Manufacturing
- Retail
- BFSI
- Healthcare
- D2C
- Logistics

## Role
- For CTOs
- For CFOs
- For COOs
- For Founders

## Geography
- India
- Bengaluru
- Hyderabad
- Pune
- Chennai

## Format
- Case Study
- Pricing Guide
- Benchmark
- Checklist
- Comparison
```

Adding a tag not on this list → add it here first. Consolidate duplicates on sight.

### 7.7 Orphan-post audit (monthly)

Once a month, run this check:

```bash
# Find posts published >30 days ago with fewer than 3 inbound internal links.
# (Manual pass in wp-admin OR run a quick GA4 + WP REST script — either works.)
```

Every orphan gets:
1. Assigned to a cluster (if it isn't in one)
2. At least 3 inbound links added from siblings
3. Its own outbound-to-hub link verified

Orphans are dead SEO weight. Fix or unpublish.

---

## 8. Structural Templates — Pick By Intent

### 8.1 Traffic-intent template (targets "how / what / vs" queries)

```
<h2>Quick Answer</h2>
[60–120 words, direct]

<h2>What does [topic] mean for [buyer / industry]?</h2>
[Definition + 1 concrete scenario]

<h2>How does [thing] actually work?</h2>
[Ordered steps / process]

<h2>[Comparative H2 — e.g. "How is X different from Y in India?"]</h2>
<table><caption>[X vs Y — quick comparison]</caption>…</table>

<h2>Which businesses see the strongest fit with [thing]?</h2>
[Named industries + team-size ranges]

<h2>What does SaiSatwik do differently on [topic]?</h2>
[This is where the brand shows up. One paragraph. Named metrics.]

<h2>FAQs about [topic]</h2>
[3–5 Q&A]

[Single soft CTA at very end — one line, hyperlink to /contact/]
```

### 8.2 Lead-intent template (targets buyers actively shortlisting)

```
<h2>Quick Answer</h2>
[Include a price/timeline/scope signal]

<h2>What does [service] typically cost for a [company profile]?</h2>
[Real ballpark — "₹X–₹Y range" or "$A–$B for a team of N". Cite source or
label as "SaiSatwik pricing bracket". No pricing = no lead.]

<h2>What is included in SaiSatwik's [service] engagement?</h2>
[Scope table — deliverables, timeline, ownership matrix]

<h2>How long does a SaiSatwik [service] engagement take?</h2>
[Ranges by scope]

<h2>What are the common mistakes to avoid before starting [thing]?</h2>
[3–5 concrete warnings — this is the passage that gets bookmarked + shared]

<h2>How do you know SaiSatwik is the right fit for [thing]?</h2>
[Qualification checklist. Ends with the CTA.]

[Mid-CTA after "How long" section — one line]

<h2>FAQs about [service] pricing and delivery</h2>
[4–5 Q&A — include one on pricing, one on timeline, one on vendor comparison]

[Final CTA — one line, hyperlink to /contact/]
```

### 8.3 Authority-intent template (backlink / thought-leadership plays)

```
<h2>Quick Answer</h2>
[Include the headline finding / stat]

<h2>What did SaiSatwik find in [dataset / research topic]?</h2>
[Top-line summary + chart or table of the finding]

<h2>How was the [data / research] gathered?</h2>
[Method disclosure — sample size, source, dates. This is the trust signal
that unlocks citations from research aggregators + journalists.]

<h2>What does this mean for [buyer role]?</h2>
[Interpretation section]

<h2>What are the limitations of this analysis?</h2>
[Honest limits. Counter-intuitively, this INCREASES citation rate — LLMs
weight self-limiting research higher for authoritativeness.]

<h2>FAQs about [research topic]</h2>

[Soft CTA — link to related deep-dive or /contact/]
```

---

## 9. Data-File Schema (maps to WordPress REST fields)

Every post is one file: `src/utils/saisatwik-blogs/<slug>.js`.

```js
module.exports = {
  // WP post title — 55–60 chars, primary keyword near the front
  title: 'What SAP S/4HANA Costs for a Mid-Market Manufacturer in India (2026)',

  // URL slug — hyphenated, keyword-rich, ≤ 60 chars
  slug: 'sap-s4hana-cost-mid-market-manufacturer-india',

  // WP excerpt + default meta description on most SEO plugins.
  // 150–160 chars. Lead with the answer.
  excerpt:
    'SAP S/4HANA rollout costs for a mid-market Indian manufacturer land ' +
    'between ₹X–₹Y crore; SaiSatwik ships a 90-day go-live path — here is what drives the range.',

  // WP categories + tags by NAME. Runner creates missing terms.
  // Categories = broad (usually one). Tags = topical, 4–8.
  categories: ['SAP'],
  tags: ['SAP S/4HANA', 'ERP for manufacturing', 'SAP implementation cost', 'mid-market ERP'],

  // Article body. Semantic HTML. NO <h1> (WP renders title as h1).
  // Quick Answer h2 first. FAQ h2 last.
  content: `
<h2>Quick Answer</h2>
<p>…</p>

<h2>[Question H2]</h2>
<p>…</p>

<h2>FAQs about [topic]</h2>
<h3>[Q1]</h3>
<p>[A1]</p>
`,
};
```

**Fields the runner does NOT send yet** (add via wp-admin after publish, or
extend the runner if this becomes routine):
- Featured image (upload once via wp-admin — the URL sticks across re-runs)
- Yoast/Rank Math focus keyword (WP plugin field — set once)
- Custom author (if not the publisher account)

---

## 10. Pre-Publish Checklist (I run this on every draft before push)

**Intent + structure**
- [ ] Intent (traffic / lead / authority) declared and matches the title
- [ ] Quick Answer `<h2>` first, ≤ 120 words, answers in first 40
- [ ] Every H2 is a buyer-typed question containing the entity
- [ ] "SaiSatwik" appears by proper noun in Quick Answer + at least 2 other sections
- [ ] FAQ `<h2>` at the end with 3–5 Q&A
- [ ] Correct CTA density for the intent (see §2 table)

**AEO / GEO**
- [ ] At least 3 sourced statistics with hyperlinks to first-party sources
- [ ] At least one `<table>` OR `<ol>` procedural list
- [ ] Definition box for the primary term
- [ ] Every section self-contained (no "as we discussed above")
- [ ] Named entities (technologies, roles, industries, geographies) in every section

**Readability**
- [ ] Average sentence length ≤ 18 words
- [ ] No paragraph over 60 words
- [ ] Flesch score 60–70 (check via Hemingway / Readable)
- [ ] Sentence-length variety within every paragraph (short + medium + long)
- [ ] Transition-word coverage ≥ 40% of paragraphs

**AI-detection avoidance**
- [ ] Zero banned phrases from §5.1
- [ ] Rhythm mixed — no run of ≥ 3 same-length sentences
- [ ] Every claim has a number, name, or scenario attached
- [ ] Opening line is NOT a "In today's / In an era of / As businesses" template
- [ ] Optional: run through Originality.ai or GPTZero — target < 15% AI-detected

**Keyword handling**
- [ ] Primary keyword density 0.8%–1.5%
- [ ] Primary appears in title + slug + first `<h2>` + first 100 words + excerpt
- [ ] 5–10 LSI/entity terms surface naturally across sections
- [ ] No repeated keyword within a single sentence

**Linking, tags, clusters**
- [ ] Cluster assigned in `CLUSTERS.md` BEFORE drafting (§7.5)
- [ ] 3–10 outbound links to authority sources per §7.1 ladder
- [ ] Every outbound: `target="_blank" rel="noopener"`, descriptive anchor, no `nofollow` on citations
- [ ] 3–12 internal links — every post links to at least one service page
- [ ] Every spoke links UP to its cluster hub with descriptive anchor
- [ ] Cluster hub retro-edited + re-pushed to link DOWN to this new spoke
- [ ] Anchor-text mix per §7.2 (≤20% exact-match, 40–50% partial, 20–30% branded, remainder natural)
- [ ] No anchor text is "click here" / "read more" / "this post"
- [ ] 4–8 tags, all registered in `TAGS.md`, consistent casing + form
- [ ] Retro-linking scheduled — 2–3 sibling posts to edit within 7 days of publish
- [ ] Retro-linking log entry added to `CLUSTERS.md`

**Technical**
- [ ] Slug matches primary keyword pattern
- [ ] `seoTitle` ≤ 60 chars (post title itself doubles as this in WP)
- [ ] Excerpt / meta description ≤ 160 chars, ends with a benefit or hook
- [ ] Categories exist or are safe to create
- [ ] All hyperlinks resolve (no 404s — check before publishing)
- [ ] Every named source in the post is hyperlinked

---

## 11. Publish Flow

```bash
# 1. Copy template
cp src/utils/saisatwik-blogs/_TEMPLATE.js src/utils/saisatwik-blogs/<slug>.js

# 2. Edit <slug>.js — fill fields per §9

# 3. DRAFT first (default). Land in wp-admin for a visual sanity check.
npm run create:saisatwik-blog -- <slug>

# 4. Open the returned edit URL. In wp-admin:
#    - Upload + set the Featured Image (1200×630, JPG/PNG, keyword in filename)
#    - Set the Yoast/Rank Math focus keyword (if plugin present)
#    - Preview — confirm tables, lists, hyperlinks render correctly
#    - Confirm the FAQ block renders (schema plugin picks it up)

# 5. Publish
npm run create:saisatwik-blog -- <slug> --publish

# 6. Post-publish verification
#    - Open the live URL — everything renders as previewed
#    - Google Rich Results Test — expect BlogPosting (+ FAQPage if plugin emits it)
#    - Bing IndexNow ping — if SaiSatwik has IndexNow wired, it fires automatically
#    - GSC → URL Inspection → Request Indexing (optional, speeds crawl)
```

**Idempotent CLI — safe to re-run.** The runner matches by slug and updates the
same post. Typo fixes, section rewrites, source-link swaps — all re-runs. Never
duplicates. Never edit CLI-published posts inside the WordPress block/classic
editor for content changes — edit the data file and re-run instead. (Exceptions
that are fine to do in wp-admin: featured image, category tick, tag toggle,
Yoast focus keyword — these fields the runner does not touch.)

---

## 12. Do / Don't

**Do**
- Pick ONE intent per post and match the template
- Assign the post to a cluster in `CLUSTERS.md` BEFORE writing
- Answer the question in the first sentence of every section
- Cite every statistic to a first-party source with a hyperlink
- Name SaiSatwik and the service line by proper noun in the passages you want
  cited
- Vary sentence length deliberately, paragraph by paragraph
- Write like an operator who has done this eleven times, not like a marketer
- Keep paragraphs ≤ 3 sentences and ≤ 60 words
- Use `<table>` for comparisons, `<ol>` for procedures
- Close with an FAQ that answers real search queries
- Re-run the CLI to update — never open the post in the WP editor to edit body copy
- Retro-link from 2–3 sibling posts within 7 days of publish
- Retro-link the cluster hub down to every new spoke on the day of publish
- Register every new tag in `TAGS.md` before using it

**Don't**
- Ship any of the banned phrases from §5.1
- Use "we", "our team", "us" more than 5 times total — brand as SaiSatwik by proper noun
- Repeat the primary keyword more than 1.5% of total words
- Stack same-length sentences — kills the human rhythm signal
- Write "conclusion", "in conclusion", "to sum up" — drop or replace with a
  "What to do next" H2
- Blend traffic + lead intent in one post — split into two
- Publish without at least three sourced statistics
- Publish without the FAQ block
- Publish with a placeholder statistic or unverified claim
- Publish with any broken outbound link
- Edit a CLI-published post's body inside WordPress — data file + re-run only
- Publish an orphan post — every post belongs to a cluster on day one
- Use "click here" / "read more" / bare-URL anchors
- Ship a post with fewer than 3 outbound authority links or 3 internal links
- Cite an agency blog / listicle / Medium post as a source — find the first-party
- Add nofollow to authority citations — trust flow is the point
- Invent a new tag without registering it in `TAGS.md` first
- Skip retro-linking the hub down to the new spoke — the cluster only works both ways

---

## 13. When I Get a Title From You

The moment you hand me a title + rough content, I do this:

1. **Classify intent** (traffic / lead / authority) — flag back if ambiguous.
2. **Pull the primary keyword** and list 5–10 LSI terms + 8–12 co-occurring entities.
3. **Draft the outline** — every H2 as a buyer-typed question with the entity.
4. **Write the post** to this playbook — full checklist §10 satisfied.
5. **Show you the draft** before pushing. You approve or redirect.
6. **Push as draft** (`npm run create:saisatwik-blog -- <slug>`) — you review in
   wp-admin.
7. **Publish** on your green light (`--publish`).

Nothing goes live without your green light. Every push is idempotent — you can
ask for a rewrite of any section and I re-push the same URL.

---

*Ready. Send the first title + content.*
