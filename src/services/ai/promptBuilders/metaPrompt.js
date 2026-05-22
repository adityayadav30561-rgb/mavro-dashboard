/**
 * metaPrompt — structured prompt builder for blog meta-description generation.
 * Pure function. Provider-agnostic. Mirrors titlePrompt.js architecture so a
 * single orchestrator + parser can serve any text-suggestion endpoint.
 *
 * Output contract (strict JSON):
 *   {
 *     "suggestions": [
 *       {
 *         "category": "seo|ctr|professional|educational|commercial|authority|beginner",
 *         "description": "...",
 *         "rationale": "<= 18 words"
 *       }
 *     ]
 *   }
 */

const CATEGORY_BRIEFS = {
  seo:
    'SEO Optimized — focus keyword early, supporting semantic term, intent-matched, 145-160 chars. No fluff.',
  ctr:
    'High CTR — concrete benefit, light urgency, specific number when honest. Avoid spammy framing ("you won\'t believe", "shocking", "game-changer", "ultimate").',
  professional:
    'Professional — calm, operator-voiced, vocabulary a senior practitioner uses. No hype.',
  educational:
    'Educational — promises learning outcomes ("learn", "understand", "discover how"). Beginner search intent.',
  commercial:
    'Commercial Intent — implies evaluation / comparison / decision. Includes a soft action verb (compare, evaluate, choose, plan).',
  authority:
    'Authority Tone — confident, evidence-anchored. Hints at depth / data / framework without bragging.',
  beginner:
    'Beginner-Friendly — explicitly approachable. Avoid jargon in description. Promise plain-language explanation.',
};

const DEFAULT_CATEGORIES = Object.keys(CATEGORY_BRIEFS);

// Tenant brief is built dynamically from the Website document. No
// hardcoded tenant map — scales automatically with new properties.
const { renderTenantBrief } = require('./tenantContext');

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
 * @param {string} [ctx.blogTitle]
 * @param {string} [ctx.currentDescription]
 * @param {string} [ctx.category]
 * @param {string[]} [ctx.tags]
 * @param {string[]} [ctx.semanticKeywords]
 * @param {string} [ctx.intent]
 * @param {string} [ctx.contentHtml]
 * @param {{level:number,text:string}[]} [ctx.headings]
 * @param {{question:string,answer?:string}[]} [ctx.faqs]
 * @param {string[]} [ctx.categories]
 * @param {number} [ctx.perCategory]    -- default 2
 */
function buildMetaPrompt(ctx) {
  const {
    tenantSlug,
    tenantName,
    tenant,            // optional full Website doc — preferred input
    focusKeyword,
    blogTitle,
    currentDescription,
    category: cmsCategory,
    tags = [],
    semanticKeywords = [],
    intent,
    contentHtml,
    headings = [],
    faqs = [],
    categories: requestedCategories,
    perCategory = 2,
  } = ctx;

  const cats = (requestedCategories && requestedCategories.length ? requestedCategories : DEFAULT_CATEGORIES).filter(
    (c) => CATEGORY_BRIEFS[c]
  );

  const summary = summarizeForPrompt(contentHtml, headings);
  const briefLines = cats.map((c) => `  - ${c}: ${CATEGORY_BRIEFS[c]}`).join('\n');

  const faqLines = (faqs || [])
    .filter((f) => f && f.question)
    .slice(0, 6)
    .map((f) => `  • ${f.question}`)
    .join('\n');

  const tenantDoc = tenant || { slug: tenantSlug, name: tenantName };
  return [
    'You are a senior SEO + editorial strategist writing SERP meta descriptions for a multi-tenant B2B SaaS platform.',
    `Tenant: ${tenantName || tenantSlug || 'unknown'} (slug: ${tenantSlug || 'unknown'}).`,
    renderTenantBrief(tenantDoc),
    '',
    `Focus keyword (must appear naturally in EVERY description, never stuffed): "${focusKeyword || '—'}".`,
    blogTitle ? `Blog title: "${blogTitle}"` : '',
    currentDescription ? `Current meta description (for reference; do NOT just rephrase): "${currentDescription}"` : '',
    cmsCategory ? `CMS category: ${cmsCategory}` : '',
    tags.length ? `Tags: ${tags.slice(0, 8).join(', ')}` : '',
    semanticKeywords.length ? `Semantic / supporting terms: ${semanticKeywords.slice(0, 8).join(', ')}` : '',
    intent ? `Search intent: ${intent}` : '',
    '',
    'Article context — headings:',
    summary.headings || '  (no headings yet)',
    '',
    faqLines ? 'Article FAQs:' : '',
    faqLines,
    '',
    'Article context — first 1.8k chars:',
    summary.plain || '  (no body content yet)',
    '',
    'Rules — apply to EVERY description:',
    '  1. 140-160 characters preferred. Hard ceiling 170. Hard floor 110.',
    '  2. Include the focus keyword naturally — once, ideally in the first 90 chars.',
    '  3. Match the actual article above. Never hallucinate scope, features, or numbers.',
    '  4. Operator voice. Avoid AI tells: "in today\'s world", "in the modern era", "discover the secrets", "unlock the power", "revolutionary", "game-changer".',
    '  5. No emojis. No surrounding quotes in the output string. No trailing brand suffix.',
    '  6. Promise must match content. If the article does not deliver something, do not promise it.',
    '  7. Ground commercial intent in evaluation / comparison — never invent pricing or claims.',
    '',
    'Categories to generate:',
    briefLines,
    '',
    `Generate exactly ${perCategory} unique descriptions PER category.`,
    '',
    'Output strict JSON only — no markdown, no commentary. Schema:',
    '{',
    '  "suggestions": [',
    '    { "category": "<one of: ' + cats.join(' | ') + '>", "description": "<string>", "rationale": "<<=18 words>" }',
    '  ]',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = {
  buildMetaPrompt,
  CATEGORY_BRIEFS,
  DEFAULT_CATEGORIES,
};
