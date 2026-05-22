/**
 * faqPrompt — structured prompt builder for blog FAQ generation.
 * Pure function. Provider-agnostic. Mirrors title/meta prompt architecture.
 *
 * Output contract (strict JSON):
 *   {
 *     "suggestions": [
 *       {
 *         "question": "<10-18 words, ends with ?, no quotes>",
 *         "answer":   "<35-90 words, 2-3 sentences, plain prose>",
 *         "intent":   "informational|comparative|operational|troubleshooting|definition",
 *         "coverage": "<short tag describing the topical area it fills>",
 *         "rationale":"<<=18 words>"
 *       }
 *     ]
 *   }
 */

// Tenant brief is built dynamically from the Website document. No
// hardcoded tenant map — scales automatically with new properties.
const { renderTenantBrief } = require('./tenantContext');

function summarizeContent(html, headings, charBudget = 4500) {
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
    .slice(0, 20)
    .map((h) => `  H${h.level}: ${h.text.slice(0, 140)}`)
    .join('\n');
  return { plain: head, headings: headingLines };
}

/**
 * @param {object} ctx
 * @param {string} ctx.tenantSlug
 * @param {string} ctx.tenantName
 * @param {string} ctx.focusKeyword
 * @param {string} [ctx.blogTitle]
 * @param {string} [ctx.contentHtml]
 * @param {{level:number,text:string}[]} [ctx.headings]
 * @param {string[]} [ctx.tags]
 * @param {string[]} [ctx.semanticKeywords]
 * @param {string} [ctx.category]
 * @param {string[]} [ctx.existingQuestions]  -- avoid duplicating
 * @param {number} [ctx.count]                -- default 6
 * @param {string} [ctx.tone]                 -- default 'operational'
 */
function buildFaqPrompt(ctx) {
  const {
    tenantSlug,
    tenantName,
    tenant,            // optional full Website doc
    focusKeyword,
    blogTitle,
    contentHtml,
    headings = [],
    tags = [],
    semanticKeywords = [],
    category,
    existingQuestions = [],
    count = 6,
    tone = 'operational',
  } = ctx;

  const summary = summarizeContent(contentHtml, headings);
  const existing = (existingQuestions || [])
    .filter(Boolean)
    .slice(0, 12)
    .map((q) => `  • ${String(q).replace(/^Q[.:]\s*/i, '').slice(0, 140)}`)
    .join('\n');

  const tenantDoc = tenant || { slug: tenantSlug, name: tenantName };
  return [
    'You are a senior SEO + editorial strategist generating FAQ schema content for a multi-tenant B2B SaaS blog.',
    `Tenant: ${tenantName || tenantSlug || 'unknown'} (slug: ${tenantSlug || 'unknown'}).`,
    renderTenantBrief(tenantDoc),
    `Tone: ${tone}. Avoid hype, emojis, marketing fluff.`,
    '',
    blogTitle ? `Article title: "${blogTitle}"` : '',
    `Focus keyword (anchor the FAQ set; do NOT stuff it into every question): "${focusKeyword || '—'}".`,
    category ? `CMS category: ${category}` : '',
    tags.length ? `Tags: ${tags.slice(0, 10).join(', ')}` : '',
    semanticKeywords.length ? `Semantic / supporting terms: ${semanticKeywords.slice(0, 10).join(', ')}` : '',
    '',
    'Article context — headings:',
    summary.headings || '  (no headings yet)',
    '',
    'Article context — body (first 4.5k chars):',
    summary.plain || '  (no body content yet)',
    '',
    existing ? 'Existing FAQs already in the article (DO NOT regenerate or paraphrase these):' : '',
    existing,
    '',
    'Rules — apply to EVERY FAQ:',
    '  1. Question 10-18 words. Plain English. End with "?". No quotes around the string.',
    '  2. Answer 35-90 words, 2-3 sentences. Operator-voiced. Directly answer the question.',
    '  3. Match the actual article above. Do NOT invent metrics, prices, integrations, or claims.',
    '  4. People-Also-Ask style: practical, intent-led ("what / how / why / can / does / is").',
    '  5. No marketing fluff. No "ultimate", "revolutionary", "game-changer", "discover the secrets".',
    '  6. Do not stuff the focus keyword. Use it naturally in 1-2 questions max.',
    '  7. Each FAQ must fill a topical gap — surface a sub-area the article touches but does not fully cover.',
    '  8. No duplicates. No paraphrases of the existing FAQs listed above.',
    '  9. Each question should be answerable from the article scope — no hallucinated outside features.',
    '',
    `Generate exactly ${count} unique FAQs.`,
    '',
    'Output strict JSON only — no markdown, no commentary. Schema:',
    '{',
    '  "suggestions": [',
    '    {',
    '      "question": "<string ending with ?>",',
    '      "answer": "<2-3 sentence string>",',
    '      "intent": "informational | comparative | operational | troubleshooting | definition",',
    '      "coverage": "<short tag>",',
    '      "rationale": "<<=18 words>"',
    '    }',
    '  ]',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = { buildFaqPrompt };
