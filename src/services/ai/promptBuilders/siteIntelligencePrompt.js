/**
 * siteIntelligencePrompt — structured prompt builder for tenant-scoped
 * SEO strategy intelligence. Pure function. Provider-agnostic.
 *
 * Input:
 *   ctx.tenantSlug      — tenant identifier
 *   ctx.tenantName      — tenant display name
 *   ctx.summary         — deterministic corpus summary (from
 *                         siteIntelligenceService.computeCorpusSummary)
 *   ctx.blogSamples     — [{title, slug, category, tags, headings[], excerpt}]
 *   ctx.deterministic   — additional caller-supplied signals (avg score,
 *                         decay flags, link-graph metrics, etc.)
 *
 * Output (strict JSON):
 *   {
 *     "topicalAuthority": { "strong": [...], "weak": [...] },
 *     "semanticGaps": [...],
 *     "contentOpportunities": [...],
 *     "audit": { "strengths": [...], "weaknesses": [...], "opportunities": [...], "risks": [...] },
 *     "linkingIntelligence": { "narrative": "...", "actions": [...] },
 *     "searchIntentCoverage": { "informational":N, "commercial":N, "comparative":N, "educational":N, "imbalances":[...] },
 *     "clusterStrength": [...],
 *     "decayInterpretation": [...],
 *     "publishingStrategy": { "cadence": "...", "nextActions": [...], "imbalanceWarnings": [...] },
 *     "executiveSummary": "..."
 *   }
 */

// Tenant brief is built dynamically from the Website document. No
// hardcoded tenant map — scales automatically with new properties.
const { renderTenantBrief } = require('./tenantContext');

function formatBlogSample(b, idx) {
  const headings = (b.headings || [])
    .slice(0, 5)
    .map((h) => `H${h.level}:${(h.text || '').slice(0, 90)}`)
    .join(' / ');
  return [
    `  ${String(idx + 1).padStart(2, '0')}. "${b.title || '<untitled>'}"`,
    `      slug=${b.slug || '?'} · cat=${b.category || '—'} · tags=${(b.tags || []).slice(0, 4).join(',') || '—'}`,
    `      wc=${b.wordCount ?? '?'} · age=${b.ageDays ?? '?'}d · status=${b.status || '?'}`,
    headings ? `      headings: ${headings}` : '',
    b.excerpt ? `      excerpt: ${b.excerpt.slice(0, 220)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildSiteIntelligencePrompt(ctx) {
  const {
    tenantSlug,
    tenantName,
    tenant,                       // full Website doc preferred
    summary = {},
    blogSamples = [],
    deterministic = {},
  } = ctx;

  const topCats = (summary.topCategories || []).map((c) => `${c.name}(${c.count})`).join(', ');
  const topTags = (summary.topTags || []).map((t) => `${t.name}(${t.count})`).join(', ');

  const tenantDoc = tenant || { slug: tenantSlug, name: tenantName };
  return [
    'You are a senior SEO + content-strategy operator producing site-wide intelligence for a multi-tenant B2B SaaS platform.',
    `Tenant: ${tenantName || tenantSlug || 'unknown'} (slug: ${tenantSlug || 'unknown'}).`,
    renderTenantBrief(tenantDoc),
    '',
    'CORPUS SUMMARY (deterministic — DO NOT contradict):',
    `  • Total blogs: ${summary.totalBlogs ?? 0}`,
    `  • Published: ${summary.publishedCount ?? 0} · Drafts: ${summary.draftCount ?? 0} · Scheduled: ${summary.scheduledCount ?? 0} · Archived: ${summary.archivedCount ?? 0}`,
    `  • Avg word count: ${summary.avgWordCount ?? 'n/a'} · Thin (<300 wc): ${summary.thinCount ?? 0}`,
    `  • Oldest published: ${summary.oldestPublished || 'n/a'} · Newest: ${summary.newestPublished || 'n/a'}`,
    `  • Stale (>180d unupdated): ${summary.staleCount ?? 0} · Recent (<30d): ${summary.recentCount ?? 0}`,
    `  • Publishing cadence: ${summary.publishesPerWeek ?? 'n/a'} per week (trailing 90d)`,
    `  • FAQ coverage: ${summary.blogsWithFaqs ?? 0} of ${summary.publishedCount ?? 0} have inline FAQ patterns`,
    `  • Metadata gaps: ${summary.missingSeoTitle ?? 0} missing seoTitle · ${summary.missingSeoDescription ?? 0} missing seoDescription · ${summary.missingOgImage ?? 0} missing ogImage`,
    topCats ? `  • Top categories: ${topCats}` : '',
    topTags ? `  • Top tags: ${topTags}` : '',
    deterministic.avgSeoScore != null ? `  • Avg SEO score (deterministic v3 engine): ${deterministic.avgSeoScore}` : '',
    deterministic.linkGraph ? `  • Link graph: ${deterministic.linkGraph.orphanCount ?? '?'} orphans · ${deterministic.linkGraph.clusterCount ?? '?'} clusters · linking-quality ${deterministic.linkGraph.qualityScore ?? '?'}/100` : '',
    deterministic.decay ? `  • Decay: ${deterministic.decay.criticalCount ?? 0} critical · ${deterministic.decay.decliningCount ?? 0} declining · ${deterministic.decay.agingCount ?? 0} aging` : '',
    '',
    'BLOG SAMPLES (random sample of corpus, includes headings + excerpt):',
    blogSamples.map((b, i) => formatBlogSample(b, i)).join('\n\n'),
    '',
    'TASK — produce strict JSON for the operator. Rules:',
    '  1. Interpret the deterministic signals. Do NOT invent metrics or rewrite scores.',
    '  2. Stay within the tenant domain. SAP/ERP vocabulary for Spanbix, IT-services vocabulary for SaiSatwik.',
    '  3. Use blog titles in your reasoning ONLY when they appear in the samples above. Never hallucinate articles.',
    '  4. Action items must be concrete (operator can execute today). Avoid vague advice ("write more content").',
    '  5. Keep each insight 1-2 sentences. Operators scan, not read.',
    '  6. Total response must remain compact — concise prose, not essays.',
    '',
    'Output strict JSON. No markdown, no commentary outside JSON. Schema:',
    '{',
    '  "executiveSummary": "<2-3 sentence opening summary for site leadership>",',
    '  "topicalAuthority": {',
    '    "strong": [ { "theme": "<short label>", "rationale": "<1 sentence>", "supportingBlogs": ["<title>", ...] } ],',
    '    "weak":   [ { "theme": "<short label>", "rationale": "<1 sentence>", "supportingBlogs": ["<title>", ...] } ]',
    '  },',
    '  "semanticGaps": [ { "cluster": "<short label>", "missingSubtopics": ["<topic>", ...], "rationale": "<1 sentence>" } ],',
    '  "contentOpportunities": [ { "title": "<proposed blog title>", "cluster": "<short>", "intent": "informational|comparative|commercial|educational", "rationale": "<1 sentence>", "priority": "high|medium|low" } ],',
    '  "audit": {',
    '    "strengths": ["<short>", ...],',
    '    "weaknesses": ["<short>", ...],',
    '    "opportunities": ["<short>", ...],',
    '    "risks": ["<short>", ...]',
    '  },',
    '  "linkingIntelligence": { "narrative": "<1-2 sentence interpretation>", "actions": [ { "action": "<short concrete action>", "rationale": "<half-sentence>" } ] },',
    '  "searchIntentCoverage": {',
    '    "informational": <int %>, "commercial": <int %>, "comparative": <int %>, "educational": <int %>,',
    '    "imbalances": [ { "observation": "<short>" } ]',
    '  },',
    '  "clusterStrength": [ { "cluster": "<short>", "strength": "strong|moderate|weak", "members": <int>, "rationale": "<short>" } ],',
    '  "decayInterpretation": [ { "blogTitle": "<must be from samples>", "interpretation": "<1 sentence>", "recommendation": "<short concrete action>" } ],',
    '  "publishingStrategy": {',
    '    "cadence": "<short observation about current cadence>",',
    '    "nextActions": [ { "action": "<short concrete action>", "priority": "high|medium|low", "rationale": "<half-sentence>" } ],',
    '    "imbalanceWarnings": ["<short>", ...]',
    '  }',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = { buildSiteIntelligencePrompt };
