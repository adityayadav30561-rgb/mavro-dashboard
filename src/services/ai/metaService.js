const aiProviderService = require('./AIProviderService');
const { buildMetaPrompt, DEFAULT_CATEGORIES, CATEGORY_BRIEFS } = require('./promptBuilders/metaPrompt');

/**
 * metaService — generates blog meta-description suggestions through the
 * provider-agnostic AI orchestrator. Parsing + sanitization mirror
 * titleService so the two endpoints stay in lock-step.
 */

const MAX_META_CHARS = 170;
const MIN_META_CHARS = 110;

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) return null;
  try {
    return JSON.parse(candidate.slice(first, last + 1));
  } catch {
    return null;
  }
}

function normalize(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/^[\s"'“”‘’`]+|[\s"'“”‘’`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAcceptable(description) {
  if (!description) return false;
  if (description.length < MIN_META_CHARS) return false;
  if (description.length > MAX_META_CHARS) return false;
  const banned = [
    'ultimate guide',
    "you won't believe",
    'you wont believe',
    'shocking',
    'game-changer',
    'game changer',
    'unlock the power',
    'in todays world',
    "in today's world",
    'in the modern era',
    'discover the secrets',
    'revolutionary',
  ];
  const lower = description.toLowerCase();
  return !banned.some((b) => lower.includes(b));
}

async function generateBlogMetaDescriptions(ctx, opts = {}) {
  if (!ctx || typeof ctx !== 'object') {
    throw new Error('metaService: ctx is required');
  }
  if (!ctx.focusKeyword || !String(ctx.focusKeyword).trim()) {
    throw new Error('focus keyword is required');
  }
  const focus = String(ctx.focusKeyword).trim();

  const prompt = buildMetaPrompt(ctx);

  const result = await aiProviderService.generateText({
    prompt,
    options: {
      feature: 'meta_descriptions',
      provider: opts.provider,
      model: opts.model,
      temperature: opts.temperature ?? 0.8,
      // Meta descriptions are ~5× longer per item than titles, and Gemini
      // 2.5's "thinking" budget eats part of the cap. Set generously.
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
      responseFormat: 'json',
      systemInstruction:
        'You are a precise editorial assistant. You only respond with valid JSON matching the schema in the prompt. No prose, no markdown.',
    },
    op: 'blog_meta_descriptions',
  });

  const parsed = extractJson(result.text);
  if (!parsed || !Array.isArray(parsed.suggestions)) {
    throw new Error('AI response did not contain a valid suggestions array');
  }

  const grouped = {};
  const seenLower = new Set();

  parsed.suggestions.forEach((item) => {
    const description = normalize(item?.description);
    if (!isAcceptable(description)) return;
    const lower = description.toLowerCase();
    if (seenLower.has(lower)) return;
    if (lower === String(ctx.currentDescription || '').trim().toLowerCase()) return;
    seenLower.add(lower);

    const cat = String(item?.category || '').toLowerCase();
    const safeCat = CATEGORY_BRIEFS[cat] ? cat : 'seo';

    const rationale =
      typeof item?.rationale === 'string' ? item.rationale.trim().slice(0, 140) : '';

    if (!grouped[safeCat]) grouped[safeCat] = [];
    grouped[safeCat].push({ description, rationale });
  });

  return {
    focusKeyword: focus,
    provider: result.provider,
    model: result.model,
    usage: result.usage,
    categoriesAvailable: DEFAULT_CATEGORIES,
    suggestions: grouped,
  };
}

module.exports = { generateBlogMetaDescriptions };
