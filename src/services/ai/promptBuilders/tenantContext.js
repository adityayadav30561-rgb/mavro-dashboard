/**
 * tenantContext — builds the per-tenant brief block used by EVERY AI
 * prompt builder in this folder. Pure function. No hardcoded tenant map.
 *
 * Source priority (highest first):
 *   1. Explicit fields on the Website document's `aiContext` block:
 *        - audience, industry, tone, vocabulary[], avoid[]
 *   2. Auto-derived signals from the Website document:
 *        - `description` (long-form positioning)
 *        - `seoDefaults.keywords` (operator-curated topic vocabulary)
 *        - `name` (fallback identity token)
 *   3. Generic B2B SaaS operator fallback (only when even the Website
 *      record is empty — i.e. brand-new tenants pre-onboarding).
 *
 * The function returns either a string brief block ready to splice into a
 * prompt, OR a structured object the prompt builder can format itself.
 *
 * Adding a 50th tenant = create the Website row. AI prompts adapt
 * automatically. Editing `aiContext` on the Website doc tunes the AI
 * voice for that tenant — no code change, no redeploy.
 */

const GENERIC_FALLBACK = {
  audience: 'B2B SaaS operator',
  industry: 'general operations',
  tone: 'practical, operator-focused',
  vocabulary: [],
  avoid: [],
};

function asArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean).map((s) => String(s).trim()).filter(Boolean);
  return [];
}

/**
 * Normalize whatever the caller passed (could be a full Mongoose doc,
 * a `.lean()` plain object, or just a partial context payload) into a
 * canonical { slug, name, audience, industry, tone, vocabulary, avoid }
 * shape.
 */
function normalizeTenant(website = {}) {
  const ai = website.aiContext || {};
  const seo = website.seoDefaults || {};

  const audience =
    (ai.audience && ai.audience.trim()) ||
    (website.description && website.description.trim()) ||
    GENERIC_FALLBACK.audience;

  const industry =
    (ai.industry && ai.industry.trim()) ||
    (website.name && `${website.name} domain`) ||
    GENERIC_FALLBACK.industry;

  const tone = (ai.tone && ai.tone.trim()) || GENERIC_FALLBACK.tone;

  // Vocabulary merges explicit aiContext.vocabulary + SEO keywords.
  // Dedupe + cap at 20 to keep prompts compact.
  const vocab = [...new Set([...asArray(ai.vocabulary), ...asArray(seo.keywords)])]
    .map((v) => v.toLowerCase())
    .slice(0, 20);

  const avoid = asArray(ai.avoid).slice(0, 10);

  return {
    slug: website.slug || null,
    name: website.name || null,
    audience,
    industry,
    tone,
    vocabulary: vocab,
    avoid,
  };
}

/**
 * Render the brief block as plain text for splicing into a prompt.
 * Empty when no tenant supplied — caller decides whether that is
 * acceptable for the feature.
 */
function renderTenantBrief(websiteOrCtx) {
  if (!websiteOrCtx) return '';
  const t = normalizeTenant(websiteOrCtx);
  const lines = [];
  lines.push(`Audience: ${t.audience}.`);
  if (t.industry && t.industry !== GENERIC_FALLBACK.industry) {
    lines.push(`Industry / domain: ${t.industry}.`);
  }
  if (t.vocabulary.length) {
    lines.push(`Operator vocabulary to lean on: ${t.vocabulary.join(', ')}.`);
  }
  if (t.tone) {
    lines.push(`Tone: ${t.tone}.`);
  }
  if (t.avoid.length) {
    lines.push(`Avoid phrasing / topics: ${t.avoid.join(', ')}.`);
  }
  // Final guard — never invent another tenant's domain.
  if (t.name) {
    lines.push(`Stay inside the "${t.name}" product domain. Do not pivot to unrelated industries.`);
  }
  return lines.join(' ');
}

module.exports = {
  normalizeTenant,
  renderTenantBrief,
  GENERIC_FALLBACK,
};
