/**
 * titlePrompt — builds the structured prompt sent to the AI provider for
 * blog-title generation. Pure function. Provider-agnostic.
 *
 * The orchestrator (AIProviderService) does not know about title semantics —
 * it only forwards the prompt + parses the JSON response. Adding a new
 * provider does not require touching this builder.
 *
 * Output contract from the model (strict JSON):
 *   {
 *     "suggestions": [
 *       {
 *         "category": "seo|ctr|authority|listicle|educational|problem_solution|beginner",
 *         "title": "...",
 *         "rationale": "<= 18 words"
 *       }
 *     ]
 *   }
 *
 * Categories are passed in so the consumer can request a subset for
 * regeneration later (e.g. "give me 3 more listicle variants").
 */

const CATEGORY_BRIEFS = {
  seo: 'SEO Optimized — primary keyword in first 60% of title, includes year only when timely, semantic supporting term where natural, no clickbait.',
  ctr: 'High CTR — power word / number / curiosity gap. Still honest. Avoid spammy phrasing ("you won\'t believe", "shocking", "ultimate"). Promise must match content.',
  authority: 'Professional / Authority — calm, expert tone. Vocabulary feels like a senior practitioner wrote it. No emojis. No hype.',
  listicle: 'Listicle — explicit count, plural noun, year if relevant. Example shape: "<N> <noun-phrase> for <use case> in <year>".',
  educational: 'Educational — "How to", "Guide to", "What is". Teach-first framing. Beginner search intent.',
  problem_solution: 'Problem-Solution — surface the operator pain first, hint at resolution. Example: "<pain phrase>? Here\'s how to <fix>".',
  beginner: 'Beginner-Friendly — explicitly signals approachability ("Beginner\'s Guide", "Step-by-Step", "Explained Simply"). Avoid jargon in the title itself.',
};

const DEFAULT_CATEGORIES = Object.keys(CATEGORY_BRIEFS);

// Tenant brief is built dynamically from the Website document (aiContext +
// description + seoDefaults.keywords). No hardcoded tenant map — adding a
// new website automatically gets a usable AI brief.
const { renderTenantBrief } = require('./tenantContext');

/**
 * Trim content to a budget while preserving structure signals (headings).
 * Title generation does not need the full article — only enough to ground
 * the model in the actual topic + headings + first paragraphs.
 */
function summarizeForPrompt(html, headings, charBudget = 1800) {
  const plain = String(html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  const head = plain.slice(0, charBudget);
  const headingLines = (headings || [])
    .filter((h) => h && h.text)
    .slice(0, 12)
    .map((h) => `  H${h.level}: ${h.text.slice(0, 120)}`)
    .join('\n');
  return { plain: head, headings: headingLines };
}

/**
 * @param {object} ctx
 * @param {string} ctx.tenantSlug
 * @param {string} ctx.tenantName
 * @param {string} ctx.focusKeyword
 * @param {string} [ctx.currentTitle]
 * @param {string} [ctx.category]               -- content category from CMS
 * @param {string[]} [ctx.tags]
 * @param {string[]} [ctx.semanticKeywords]
 * @param {string} [ctx.intent]                 -- informational | transactional | comparative | navigational
 * @param {string} [ctx.contentHtml]
 * @param {{level:number,text:string}[]} [ctx.headings]
 * @param {string[]} [ctx.categories]           -- subset of CATEGORY_BRIEFS to include
 * @param {number} [ctx.perCategory]            -- default 2 per category
 * @param {number} [ctx.year]                   -- default current year
 */
function buildTitlePrompt(ctx) {
  const {
    tenantSlug,
    tenantName,
    tenant,            // optional full Website doc — preferred input
    focusKeyword,
    currentTitle,
    category: cmsCategory,
    tags = [],
    semanticKeywords = [],
    intent,
    contentHtml,
    headings = [],
    categories: requestedCategories,
    perCategory = 2,
    year,
  } = ctx;

  const cats = (requestedCategories && requestedCategories.length ? requestedCategories : DEFAULT_CATEGORIES).filter(
    (c) => CATEGORY_BRIEFS[c]
  );

  const summary = summarizeForPrompt(contentHtml, headings);
  const y = year || new Date().getUTCFullYear();

  const briefLines = cats.map((c) => `  - ${c}: ${CATEGORY_BRIEFS[c]}`).join('\n');

  const tenantDoc = tenant || { slug: tenantSlug, name: tenantName };
  return [
    'You are a senior SEO + editorial strategist generating blog-title variants for a multi-tenant B2B SaaS platform.',
    `Tenant: ${tenantName || tenantSlug || 'unknown'} (slug: ${tenantSlug || 'unknown'}).`,
    renderTenantBrief(tenantDoc),
    '',
    `Focus keyword (must appear naturally in EVERY title, never stuffed): "${focusKeyword || '—'}".`,
    currentTitle ? `Current working title (for reference; do not just rephrase it): "${currentTitle}"` : '',
    cmsCategory ? `CMS category: ${cmsCategory}` : '',
    tags.length ? `Tags: ${tags.slice(0, 8).join(', ')}` : '',
    semanticKeywords.length ? `Semantic / supporting terms: ${semanticKeywords.slice(0, 8).join(', ')}` : '',
    intent ? `Search intent: ${intent}` : '',
    `Current year: ${y}`,
    '',
    'Article context — headings:',
    summary.headings || '  (no headings yet)',
    '',
    'Article context — first 1.8k chars:',
    summary.plain || '  (no body content yet)',
    '',
    'Rules — apply to EVERY title:',
    '  1. 50-65 characters when possible. Never exceed 70.',
    '  2. Include the focus keyword naturally. Do not stuff. Do not append " | Brand".',
    '  3. Title must reflect the actual article above. Do not hallucinate scope.',
    '  4. Avoid spammy AI phrasing ("ultimate", "you won\'t believe", "game-changer", "revolutionary", "unlock the power", "the secret to").',
    '  5. No emojis. No surrounding quotes in the output strings.',
    '  6. Sentence case or Title Case — pick one and stay consistent per title.',
    '  7. Year only when timely (year-bound rankings, comparisons, trends).',
    '',
    'Categories to generate:',
    briefLines,
    '',
    `Generate exactly ${perCategory} unique titles PER category.`,
    '',
    'Output strict JSON only — no markdown, no commentary. Schema:',
    '{',
    '  "suggestions": [',
    '    { "category": "<one of: ' + cats.join(' | ') + '>", "title": "<string>", "rationale": "<<=18 words>" }',
    '  ]',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = {
  buildTitlePrompt,
  CATEGORY_BRIEFS,
  DEFAULT_CATEGORIES,
};
