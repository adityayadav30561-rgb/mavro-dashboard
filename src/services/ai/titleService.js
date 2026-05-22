const aiProviderService = require('./AIProviderService');
const { buildTitlePrompt, DEFAULT_CATEGORIES, CATEGORY_BRIEFS } = require('./promptBuilders/titlePrompt');

/**
 * titleService — high-level orchestration for blog title suggestions.
 *
 * Responsibilities:
 *   • Take editor-shaped context (focus keyword, content, tenant, etc.)
 *   • Build the structured prompt via the prompt-builder module
 *   • Call AIProviderService.generateText (provider-agnostic)
 *   • Parse + sanitize the model's JSON response
 *   • Group by category, deduplicate, enforce hard rules
 *
 * No provider-specific code lives here. Swapping Gemini for OpenAI/Claude/
 * Groq does NOT touch this file.
 */

const MAX_TITLE_CHARS = 70;
const MIN_TITLE_CHARS = 18;

/**
 * Lenient JSON extractor — Gemini sometimes wraps JSON in ``` fences or
 * adds a stray prose line. Pull the largest balanced {...} block.
 */
function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  // Try fenced code first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  // Find first { ... last }
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) return null;
  const slice = candidate.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

function normalizeTitle(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/^[\s"'“”‘’`]+|[\s"'“”‘’`]+$/g, '') // strip surrounding quotes/whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

function isAcceptable(title) {
  if (!title) return false;
  if (title.length < MIN_TITLE_CHARS) return false;
  if (title.length > MAX_TITLE_CHARS) return false;
  // Reject obvious spam phrasing the prompt told the model to avoid
  const banned = [
    'ultimate guide',
    "you won't believe",
    'you wont believe',
    'shocking',
    'game-changer',
    'game changer',
    'unlock the power',
    "here's the secret",
    'the secret to',
  ];
  const lower = title.toLowerCase();
  return !banned.some((b) => lower.includes(b));
}

/**
 * @param {object} ctx — editor context (see titlePrompt.buildTitlePrompt)
 * @param {object} [opts]
 * @param {string} [opts.provider]
 * @param {string} [opts.model]
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxOutputTokens]
 */
async function generateBlogTitles(ctx, opts = {}) {
  if (!ctx || typeof ctx !== 'object') {
    throw new Error('titleService: ctx is required');
  }
  if (!ctx.focusKeyword || !String(ctx.focusKeyword).trim()) {
    throw new Error('focus keyword is required');
  }
  const focus = String(ctx.focusKeyword).trim();

  const prompt = buildTitlePrompt(ctx);

  const result = await aiProviderService.generateText({
    prompt,
    options: {
      feature: 'titles',
      provider: opts.provider,
      model: opts.model,
      temperature: opts.temperature ?? 0.85,
      // Gemini 2.5 reserves a "thinking" budget out of maxOutputTokens.
      // A full 7-category × 2 set with rationales needs ~3k headroom.
      // OpenRouter models don't have this overhead but will simply emit
      // fewer tokens — cap is a ceiling, not a floor.
      maxOutputTokens: opts.maxOutputTokens ?? 3072,
      responseFormat: 'json',
      systemInstruction:
        'You are a precise editorial assistant. You only respond with valid JSON matching the schema in the prompt. No prose, no markdown.',
    },
    op: 'blog_titles',
  });

  const parsed = extractJson(result.text);
  if (!parsed || !Array.isArray(parsed.suggestions)) {
    throw new Error('AI response did not contain a valid suggestions array');
  }

  const grouped = {};
  const seenLower = new Set();

  parsed.suggestions.forEach((item) => {
    const title = normalizeTitle(item?.title);
    if (!isAcceptable(title)) return;
    const lower = title.toLowerCase();
    if (seenLower.has(lower)) return;
    if (lower === String(ctx.currentTitle || '').trim().toLowerCase()) return;
    seenLower.add(lower);

    const cat = String(item?.category || '').toLowerCase();
    const safeCat = CATEGORY_BRIEFS[cat] ? cat : 'seo';

    const rationale =
      typeof item?.rationale === 'string' ? item.rationale.trim().slice(0, 140) : '';

    if (!grouped[safeCat]) grouped[safeCat] = [];
    grouped[safeCat].push({ title, rationale });
  });

  return {
    focusKeyword: focus,
    provider: result.provider,
    model: result.model,
    usage: result.usage,
    categoriesAvailable: DEFAULT_CATEGORIES,
    suggestions: grouped, // shape: { seo: [{title,rationale}], ctr: [...], ... }
  };
}

module.exports = { generateBlogTitles };
