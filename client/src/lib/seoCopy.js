// ===================================
// SEO Copy Registry
// ===================================
// Centralized contextual help dictionary for every metric, score, category,
// issue code, and operational panel on the /seo page. Mirrors the pattern
// established in `analyticsCopy.js → METRIC_INFO`, but adds:
//
//   1. Severity-aware variants (issue codes return tone + structured copy)
//   2. Score-band-aware variants (call getSeoInfo(key, {score:42}) to flip
//      between healthy / caution / critical phrasing)
//   3. Single shape — every entry is { title, text } so the existing
//      `<InfoPopover title={...} text={...} />` primitive can render it
//      without code changes.
//
// Future surfaces (GSC, Bing, AI audits, backlinks) can register new keys
// here without touching component code.

// ---- Static dictionary --------------------------------------------------
export const SEO_INFO = {
  // ─── Page-level sections ─────────────────────────────────────────────
  section_overview: {
    title: 'Weighted SEO audit',
    text: 'A multi-tenant rollup of every published blog scored across 5 categories (content, metadata, technical, UX, freshness). The overall number is the weighted average, capped by content length so thin posts cannot inherit perfect metadata scores.',
  },
  section_internal_linking: {
    title: 'Content relationship intelligence',
    text: 'Maps how blogs link to each other inside this tenant. Healthy sites form tight topical clusters with very few orphans. We score the link graph, surface broken patterns, and recommend specific anchors to add.',
  },
  section_sitemap: {
    title: 'Sitemap operations',
    text: 'Per-tenant sitemap.xml lists every public URL search engines should crawl. Submitting it to Google and Bing accelerates discovery of new blogs and lets you spot indexing gaps fast.',
  },
  section_metadata: {
    title: 'Metadata coverage',
    text: 'Tracks how many published blogs have all the SEO basics filled in — title tag, meta description, canonical URL, and Open Graph image. Missing fields directly hurt SERP appearance and social previews.',
  },
  section_health: {
    title: 'SEO health',
    text: 'Every issue the auditor surfaced across the corpus, severity-sorted. Critical issues likely affect rankings today. Warnings are optimization opportunities. Notices are best-practice tweaks.',
  },
  section_content_intel: {
    title: 'Per-blog operational readiness',
    text: 'A scoreboard of every blog in scope with its per-category breakdown. Sort columns to triage: low SEO score, weak metadata, stale freshness, or short content first.',
  },
  section_robots: {
    title: 'Robots & indexing',
    text: 'robots.txt controls which paths search engine crawlers may visit. Disallowing critical paths blocks indexing entirely — verify your tenant directives before going live.',
  },
  section_future: {
    title: 'External search intelligence',
    text: 'Reserved hooks for upcoming Google Search Console and Bing Webmaster integrations. Once connected, real impressions, clicks, CTR, average position, and top queries surface here.',
  },

  // ─── Overview tiles ──────────────────────────────────────────────────
  indexed_pages: {
    title: 'Indexed pages',
    text: 'URLs exposed in your sitemap that search engines can discover. Each published blog plus the blog index plus the homepage. More high-quality indexed pages usually improves total search visibility.',
  },
  published_blogs: {
    title: 'Published blogs',
    text: 'Total live blog posts for the selected tenant. Excludes drafts and archived posts. Steady cadence of new published content is one of the strongest organic-growth signals.',
  },
  avg_content_length: {
    title: 'Average content length',
    text: 'Mean word count across published blogs. Competitive topics typically need 700–1500 words to rank. Under 300 words is considered thin content and rarely ranks.',
  },
  readability_avg: {
    title: 'Average readability',
    text: 'Flesch Reading Ease across the corpus. 60–70 is the sweet spot — easy enough for most readers, deep enough to feel authoritative. Under 50 often signals jargon-heavy, hard-to-skim prose.',
  },
  sitemap_status: {
    title: 'Sitemap status',
    text: 'Live = sitemap.xml is being generated and contains URLs. Empty = no published blogs yet, so search engines have nothing to crawl. Sitemap.xml is auto-regenerated on every blog publish.',
  },
  critical_count: {
    title: 'Critical issues',
    text: 'Problems that likely affect rankings today — missing titles, thin content, missing H1, duplicate URLs. Always triage these first. Each critical penalty is worth 12–35 points.',
  },
  warning_count: {
    title: 'Warning issues',
    text: 'Optimization opportunities — short meta descriptions, missing OG images, sparse headings, slow internal-link velocity. Resolving these moves rankings on the margin.',
  },
  notice_count: {
    title: 'Notice issues',
    text: 'Best-practice suggestions — extra transitions, list usage, image variety. Low SEO impact individually but compound across the corpus.',
  },

  // ─── SEO score itself ────────────────────────────────────────────────
  seo_score: {
    title: 'SEO score',
    text: 'A 0–100 quality rating per blog. We score 5 categories (content 45%, metadata 20%, technical 15%, UX 10%, freshness 10%), apply confidence multipliers if content is thin, then cap by word count so empty posts cannot score above 35.',
  },
  grade_letter: {
    title: 'Letter grade',
    text: 'Quick visual band: A ≥90 · B ≥80 · C ≥70 · D ≥60 · F <60. Same scale used by Ahrefs and Semrush so the grade is comparable to industry tools.',
  },
  interpretation: {
    title: 'Score interpretation',
    text: 'Plain-English band: Excellent (≥90) · Strong (≥75) · Average (≥60) · Weak (≥40) · Critical (<40). Helps non-SEO stakeholders read the score at a glance.',
  },

  // ─── Category bars ───────────────────────────────────────────────────
  category_content: {
    title: 'Content quality (45% weight)',
    text: 'Strongest signal in our model. Counts word depth, heading hierarchy, paragraph density, image coverage, lexical diversity, internal links, and semantic relevance to declared keywords.',
  },
  category_metadata: {
    title: 'Metadata quality (20% weight)',
    text: 'SEO title length, meta description length, canonical URL, Open Graph + Twitter image. Controls how the page renders in search results and on social. Cannot rescue thin content alone.',
  },
  category_technical: {
    title: 'Technical SEO (15% weight)',
    text: 'Slug structure, featured image, declared keywords, and corpus-level duplicates (duplicate titles or slugs across the tenant). Foundation work — once correct, rarely changes.',
  },
  category_ux: {
    title: 'UX / readability (10% weight)',
    text: 'Flesch Reading Ease, average sentence length, passive-voice rate, and transition-word coverage. Easier-to-read content holds attention longer, reducing pogo-sticking back to the SERP.',
  },
  category_freshness: {
    title: 'Operational freshness (10% weight)',
    text: 'How recently each post was updated. Posts untouched >180 days lose ranking strength gradually; >365 days takes a sharper hit. Refresh your top performers quarterly.',
  },

  // ─── Internal linking signals ────────────────────────────────────────
  linking_score: {
    title: 'Internal linking quality',
    text: 'Mean of 5 measured signals: outbound density, non-orphan rate, anchor diversity, cluster cohesion, and inbound coverage. Pure measurements from the live graph — no hardcoded numbers.',
  },
  linking_outbound: {
    title: 'Outbound link density',
    text: 'Average number of internal links each blog contains. Target ≥3 per post for healthy topical authority. Too few signals weak topical depth; too many dilutes link equity.',
  },
  linking_non_orphan: {
    title: 'Non-orphan rate',
    text: 'Percentage of blogs that have at least one internal link in or out. Orphans (zero links either direction) are invisible to internal crawlers and waste their crawl budget.',
  },
  linking_anchor_diversity: {
    title: 'Anchor diversity',
    text: 'Ratio of unique anchor texts to total anchors. If every inbound link uses the same phrase, search engines suspect manipulation. Vary anchors naturally to look like real human linking.',
  },
  linking_cohesion: {
    title: 'Cluster cohesion',
    text: 'Percentage of internal links that stay inside their topical cluster. High cohesion signals tight topical authority. Low cohesion means clusters exist but blogs do not link to their siblings.',
  },
  linking_coverage: {
    title: 'Inbound coverage',
    text: 'Percentage of blogs that receive at least one inbound link. Every published blog should be reachable from at least one other post. Target ≥90% coverage.',
  },
  hub_node: {
    title: 'Hub page',
    text: 'A blog that receives well above-average inbound links. Hubs concentrate topical authority — useful as pillar pages and as targets for new supporting articles.',
  },
  orphan_node: {
    title: 'Orphan page',
    text: 'A blog with zero internal links pointing to it AND zero outbound internal links. Search engines treat orphans as low-priority. Fix by linking from a relevant supporting post.',
  },

  // ─── Orphan severity ─────────────────────────────────────────────────
  orphan_critical: {
    title: 'Critical orphan',
    text: 'Published >30 days, ≥300 words, and zero internal links anywhere. This page is invested content that nobody can discover from inside your own site. Highest-impact fix.',
  },
  orphan_warning: {
    title: 'Warning orphan',
    text: 'Published >14 days but recently enough that some isolation may be normal. Still worth adding 1–2 inbound links from related posts.',
  },
  orphan_healthy: {
    title: 'Healthy orphan',
    text: 'Recently published — internal linking gaps are expected for new posts. Loop it into the right cluster within the first 30 days for full SEO benefit.',
  },

  // ─── Cluster metrics ─────────────────────────────────────────────────
  cluster_strength: {
    title: 'Cluster strength',
    text: 'Average pairwise topical similarity between members of this cluster, measured on titles + tags + headings. >50% is strong; <30% indicates the cluster is loose and may merit a tighter taxonomy.',
  },
  cluster_cohesion_card: {
    title: 'Link cohesion',
    text: 'Of the internal links between cluster members, how many stay inside the cluster. If members exist topically but do not link to each other, you have unrealized topical authority.',
  },

  // ─── Metadata coverage bars ──────────────────────────────────────────
  coverage_seo_title: {
    title: 'SEO title coverage',
    text: 'Percentage of published blogs with a custom seoTitle. Without it the system falls back to the post title — usually weaker for clickthrough. Target 100%.',
  },
  coverage_meta_desc: {
    title: 'Meta description coverage',
    text: 'Percentage of published blogs with a custom meta description (140–160 chars ideal). Drives clickthrough from SERPs and is the only first impression for most searchers.',
  },
  coverage_og_image: {
    title: 'Open Graph image coverage',
    text: 'Percentage with a custom OG/featured image (1200×630 ideal). Controls how the page previews on Twitter, LinkedIn, Slack, iMessage. Missing here = bare text card.',
  },
  coverage_canonical: {
    title: 'Canonical URL coverage',
    text: 'Percentage with an explicit canonical URL. Prevents duplicate-content dilution when the same blog is reachable via multiple paths. Critical when syndicating.',
  },

  // ─── Severity badges ─────────────────────────────────────────────────
  severity_critical: {
    title: 'Critical severity',
    text: 'Likely affecting rankings today. Each critical issue carries a 12–35 point penalty in the category score. Triage these before warnings or notices.',
  },
  severity_warning: {
    title: 'Warning severity',
    text: 'Optimization opportunities. Each warning is 5–10 points in category penalty. Resolving these moves rankings on the margin and improves long-tail discoverability.',
  },
  severity_notice: {
    title: 'Notice severity',
    text: 'Best-practice tweaks. 1–4 points each. Individually small; valuable as a polish pass once critical/warning queues are empty.',
  },

  // ─── Issue code dictionary (severity-aware copy via getSeoInfo) ──────
  // These entries deliberately use what / why / how structure.
  issue_content_thin: {
    title: 'Thin content',
    text: 'WHAT: This article has very little written content (under 300 words).\nWHY: Search engines often struggle to understand or rank pages with low information depth.\nFIX: Expand to at least 300–800 meaningful words. Add headings, examples, and internal links.',
  },
  issue_content_extremely_thin: {
    title: 'Extremely thin content',
    text: 'WHAT: Under 100 words. Effectively unindexable.\nWHY: Google rarely surfaces pages this short — there is not enough text to evaluate topical authority.\nFIX: Either expand to a real article (≥300 words minimum) or delete and consolidate into a stronger post.',
  },
  issue_no_headings: {
    title: 'No semantic headings',
    text: 'WHAT: Content has no H1–H6 tags.\nWHY: Headings tell search engines the structural outline of your page. Without them every paragraph looks equally important.\nFIX: Add one H1 for the title and 2–4 H2 sections covering the main subtopics.',
  },
  issue_multiple_h1: {
    title: 'Multiple H1 tags',
    text: 'WHAT: More than one H1 detected.\nWHY: A page should have exactly one H1 — it acts as the document title. Multiple H1s confuse the topical hierarchy.\nFIX: Demote the extras to H2.',
  },
  issue_missing_h2: {
    title: 'No H2 sections',
    text: 'WHAT: The post has no H2 headings.\nWHY: Long-form content needs section anchors to be scannable. Readers skim for H2s before deciding to read.\nFIX: Break the content into 2–4 H2 sections with descriptive titles.',
  },
  issue_keyword_stuffing: {
    title: 'Keyword stuffing',
    text: 'WHAT: A single term repeats above 3.5% of total words.\nWHY: Over-using one word looks unnatural and triggers spam signals.\nFIX: Diversify vocabulary. Target 0.5–2.5% density for the primary keyword. Use synonyms and variations.',
  },
  issue_no_focus_keyword: {
    title: 'No detectable focus keyword',
    text: 'WHAT: No single term appears often enough to act as a focus keyword.\nWHY: Search engines need a clear topical signal. Without one, the page ranks weakly for everything.\nFIX: Identify the primary search term and use it 2–4 times naturally in the body.',
  },
  issue_meta_title_missing: {
    title: 'Missing SEO title',
    text: 'WHAT: No custom seoTitle set.\nWHY: The SEO title is the blue clickable line in Google. Without a custom one, the post title is used — usually less optimized.\nFIX: Write a unique 50–60 character seoTitle with the focus keyword near the start.',
  },
  issue_meta_title_long: {
    title: 'SEO title too long',
    text: 'WHAT: SEO title exceeds 70 characters.\nWHY: Google truncates titles around 60 characters in the SERP. Past that, your message gets cut off.\nFIX: Tighten to 50–60 characters, leading with the focus keyword.',
  },
  issue_meta_title_short: {
    title: 'SEO title too short',
    text: 'WHAT: Under 30 characters.\nWHY: Short titles miss the chance to include keywords, brand, and a value hook.\nFIX: Expand to 50–60 characters. Include the focus keyword and a benefit.',
  },
  issue_meta_desc_missing: {
    title: 'Missing meta description',
    text: 'WHAT: No meta description set.\nWHY: This is the snippet under the title in search results — your primary clickthrough lever.\nFIX: Write 140–160 characters that summarize the post and entice the click.',
  },
  issue_canonical_missing: {
    title: 'Canonical URL missing',
    text: 'WHAT: No canonicalUrl set on the blog.\nWHY: Canonical tags prevent duplicate-content issues when the same page is reachable via multiple URLs.\nFIX: Set canonical to the preferred absolute URL of this blog.',
  },
  issue_og_image_missing: {
    title: 'Missing Open Graph image',
    text: 'WHAT: No OG/featured image.\nWHY: Social platforms (Twitter, LinkedIn, Slack) show a generic preview without it. Massively hurts share clickthrough.\nFIX: Upload a 1200×630 image. It also auto-fills the Twitter card.',
  },
  issue_no_internal_links: {
    title: 'No internal links',
    text: 'WHAT: The post links to no other pages on your site.\nWHY: Internal links spread crawl equity, keep readers engaged, and build topical authority.\nFIX: Add 2–4 contextual links to related posts in the same cluster.',
  },
  issue_no_external_links: {
    title: 'No outbound links',
    text: 'WHAT: The post cites no external sources.\nWHY: Linking to authoritative sources signals trustworthiness to search engines.\nFIX: Cite 1–2 reputable sources where claims need backing.',
  },
  issue_image_missing_alt: {
    title: 'Images missing alt text',
    text: 'WHAT: One or more <img> tags have no alt attribute.\nWHY: Alt text is required for accessibility and helps Google index image content.\nFIX: Add descriptive alt text describing the image content (avoid keyword stuffing).',
  },
  issue_orphan_seo: {
    title: 'Orphan SEO config',
    text: 'WHAT: Published post with zero SEO fields filled in.\nWHY: It will show up in search results with default/missing tags, lowering CTR sharply.\nFIX: Add seoTitle, seoDescription, and at least one tag or keyword before next publish.',
  },
  issue_duplicate_title: {
    title: 'Duplicate title',
    text: 'WHAT: Multiple blogs share this exact title.\nWHY: Search engines deduplicate the SERP — only one of your duplicates can rank for a query.\nFIX: Make every seoTitle unique. Differentiate by audience, format, or angle.',
  },
  issue_duplicate_slug: {
    title: 'Duplicate slug',
    text: 'WHAT: Two blogs share the same URL slug.\nWHY: Same URL cannot point at two pages — one will overwrite the other in routing.\nFIX: Rename one slug. Set a canonical or 301 redirect if the old slug had traffic.',
  },
  issue_stale_content_year: {
    title: 'Stale content (>1 year)',
    text: 'WHAT: Not updated in over 365 days.\nWHY: Older content loses ranking strength as fresher competitors publish.\nFIX: Refresh the post — update stats, examples, and screenshots. Resave to bump updatedAt.',
  },
  issue_stale_content_6mo: {
    title: 'Stale content (>6 months)',
    text: 'WHAT: Not updated in over 180 days.\nWHY: Mild freshness decay starts around this point for competitive topics.\nFIX: Plan a refresh cycle. Aim to update top performers every 90–180 days.',
  },
  issue_flesch_very_difficult: {
    title: 'Very difficult to read',
    text: 'WHAT: Flesch Reading Ease under 30.\nWHY: Reads at college-postgrad level — alienates most B2B and consumer audiences.\nFIX: Shorten sentences. Replace jargon with plain language. Target Flesch 60–70.',
  },
  issue_long_sentences: {
    title: 'Sentences too long',
    text: 'WHAT: Average sentence length over 25 words.\nWHY: Long sentences hurt scanability and comprehension — readers lose the thread.\nFIX: Break into shorter sentences. Aim for 15–20 words on average.',
  },
  issue_passive_voice_high: {
    title: 'Too much passive voice',
    text: 'WHAT: Passive constructions used in >25% of sentences.\nWHY: Passive sentences feel detached and harder to parse than active voice.\nFIX: Rewrite to active voice: "The team launched the product" instead of "The product was launched by the team".',
  },

  // ─── Content intel table column hints ────────────────────────────────
  col_words: {
    title: 'Word count',
    text: 'Total words in the published content. Competitive topics typically need 700+; expert long-form 1500+.',
  },
  col_flesch: {
    title: 'Reading ease',
    text: 'Flesch score — higher is easier. 60–70 is the operational sweet spot for most audiences.',
  },
  col_meta: {
    title: 'Metadata score',
    text: 'How complete the SEO fields are for this blog (title, description, canonical, OG image).',
  },
  col_content: {
    title: 'Content score',
    text: 'Depth + structure + semantic relevance. Dominant component (45% of overall score).',
  },
  col_tech: {
    title: 'Technical score',
    text: 'Slug quality, featured image, keyword presence, and corpus-level duplicates.',
  },
  col_ux: {
    title: 'UX / readability score',
    text: 'Sentence length, passive voice, transition use, and Flesch readability.',
  },
  col_fresh: {
    title: 'Freshness score',
    text: 'How recently the post was updated. Decays at 90 / 180 / 365 days.',
  },

  // ─── Robots & sitemap hints ──────────────────────────────────────────
  robots_txt: {
    title: 'robots.txt',
    text: 'Tells crawlers (Googlebot, Bingbot, etc.) which paths they may visit. A misplaced "Disallow: /" blocks your entire site from being indexed.',
  },
  sitemap_xml: {
    title: 'sitemap.xml',
    text: 'A machine-readable index of every URL search engines should crawl. Auto-regenerated when blogs publish; pingable to Google + Bing on demand.',
  },
  indexing_ping: {
    title: 'Indexing ping',
    text: 'Manually notifies Google and Bing to recrawl your sitemap.xml now instead of waiting for their normal cadence. Useful after major content drops.',
  },

  // ─── Future surfaces ─────────────────────────────────────────────────
  gsc_summary: {
    title: 'Google Search Console',
    text: 'Once connected, real impressions, clicks, CTR, average position, top queries, and top pages from Google appear here. OAuth integration planned.',
  },
  bing_summary: {
    title: 'Bing Webmaster',
    text: 'Once connected, Bing impressions, clicks, and crawl errors surface here. Bing carries non-trivial enterprise + Edge default traffic.',
  },

  // ─── Content decay system ────────────────────────────────────────────
  section_decay: {
    title: 'Content decay monitoring',
    text: 'Detects blogs losing engagement, going stale, or drifting in SEO quality. Each blog is scored 0–100 by a weighted blend of engagement trend, freshness, SEO drift, internal linking, metadata completeness, and content body depth. Higher = more decay.',
  },
  decay_panel: {
    title: 'Decay panel',
    text: 'Per-blog decay rollup. Expand a row to see the sub-score breakdown, the specific reasons that triggered decay, and prioritized recommendations with confidence + effort estimates.',
  },
  decay_score: {
    title: 'Decay risk score',
    text: '0–100 weighted score. Engagement trend 30%, freshness 25%, SEO drift 20%, internal linking 10%, metadata 10%, content body 5%. HIGHER score = more decay. Scores derive from measured signals, never hardcoded.',
  },
  decay_state_fresh: {
    title: 'Fresh',
    text: 'Recently updated AND engagement holding. No action required. Continue normal publishing cadence.',
  },
  decay_state_stable: {
    title: 'Stable',
    text: 'Solid performance with mild aging. Refresh within the next quarter to stay competitive.',
  },
  decay_state_aging: {
    title: 'Aging',
    text: 'Showing freshness or engagement slippage. Plan a refresh in the next 30–60 days — focus on stats, metadata, and internal links.',
  },
  decay_state_declining: {
    title: 'Declining',
    text: 'Engagement or SEO is actively dropping. Refresh now — update stats, rewrite the meta description, expand thin sections, and add 2–4 internal links.',
  },
  decay_state_critical: {
    title: 'Critical',
    text: 'Multiple decay signals stacked: stale + falling traffic + weak SEO. This is rescue-or-retire territory. Decide: invest in a deep refresh or consolidate into a stronger pillar post.',
  },
  decay_queue: {
    title: 'Refresh queue',
    text: 'Prioritized list of blogs needing refresh. Priority = decay score × traffic potential. Blogs that historically drew traffic but have decayed appear first because refreshing them recovers the most upside.',
  },
  decay_alerts: {
    title: 'Decay alerts',
    text: 'Top decay signals across the corpus this period. Critical entries usually mean ≥25% engagement drop OR multiple stacked decay reasons. Treat critical alerts as same-week operator work.',
  },
};

// ---- Dynamic resolver ---------------------------------------------------
// Returns `{ title, text }` for InfoPopover. Context lets us flip copy based
// on the live measurement (e.g. low vs high readability gets different
// guidance).
//
// Patterns:
//   getSeoInfo('readability_avg', { score: 82 })
//   getSeoInfo('seo_score',       { score: 38 })
//   getSeoInfo('issue', { code: 'meta_title_long' })
//   getSeoInfo('orphan', { severity: 'critical' })
//   getSeoInfo('severity_critical')
export function getSeoInfo(key, ctx = {}) {
  // Issue dispatcher
  if (key === 'issue' && ctx.code) {
    return SEO_INFO[`issue_${ctx.code}`] || {
      title: 'SEO issue',
      text: 'An auditor finding. Hover the issue row for the specific message and fix.',
    };
  }
  if (key === 'orphan' && ctx.severity) {
    return SEO_INFO[`orphan_${ctx.severity}`] || SEO_INFO.orphan_node;
  }
  // Score-band aware variants
  if (key === 'seo_score' && typeof ctx.score === 'number') {
    const s = ctx.score;
    const base = SEO_INFO.seo_score;
    if (s >= 90)  return { title: base.title, text: `Excellent. ${base.text} You are at the top of the bands — focus on freshness and link velocity.` };
    if (s >= 75)  return { title: base.title, text: `Strong. ${base.text} You are above the average for competitive niches.` };
    if (s >= 60)  return { title: base.title, text: `Average. ${base.text} The category with the lowest score is your highest-leverage fix.` };
    if (s >= 40)  return { title: base.title, text: `Weak. ${base.text} Address critical-severity content + metadata issues before publishing more.` };
    return         { title: base.title, text: `Critical. ${base.text} This score caps near content depth — usually word count, headings, or focus keyword.` };
  }
  if (key === 'readability_avg' && typeof ctx.score === 'number') {
    const s = ctx.score;
    if (s >= 70) return { title: 'Readability', text: 'Easy to read. Most audiences will scan and absorb this comfortably.' };
    if (s >= 60) return { title: 'Readability', text: 'Standard reading level — the operational sweet spot for B2B and consumer content.' };
    if (s >= 50) return { title: 'Readability', text: 'Fairly difficult. Tighten phrasing — shorter sentences and simpler verbs move this up fast.' };
    if (s >= 30) return { title: 'Readability', text: 'Difficult. Audiences will skim and bounce. Cut adjectives, split long sentences, simplify vocabulary.' };
    return         { title: 'Readability', text: 'Very difficult. Reads at postgrad level — alienates most readers. Rewrite in plain language.' };
  }
  if (key === 'linking_score' && typeof ctx.score === 'number') {
    const s = ctx.score;
    const base = SEO_INFO.linking_score;
    if (s >= 80) return { title: base.title, text: `Strong link graph. ${base.text}` };
    if (s >= 60) return { title: base.title, text: `Healthy link graph with room to grow. ${base.text}` };
    return         { title: base.title, text: `Underperforming link graph. ${base.text} Start by linking orphans and tightening clusters.` };
  }
  // Fallback to static dictionary
  return SEO_INFO[key] || null;
}

// Helper for components that just want a one-shot lookup
export function getSeoTitle(key)  { return SEO_INFO[key]?.title || null; }
export function getSeoText(key)   { return SEO_INFO[key]?.text  || null; }
