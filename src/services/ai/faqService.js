const aiProviderService = require('./AIProviderService');
const { buildFaqPrompt } = require('./promptBuilders/faqPrompt');

/**
 * faqService — orchestration for AI FAQ generation. Same pattern as
 * titleService / metaService: structured prompt → provider-routed call →
 * JSON parse → server-side normalize + filter. The orchestrator does the
 * cross-provider fallback (feature: 'faqs' → Qwen3-Next → GPT-OSS → GLM).
 *
 * Output is normalized so that the FRONTEND can pass each item straight
 * into the existing FAQ block HTML helper without any reformatting.
 */

const MIN_Q_WORDS = 4;
const MAX_Q_WORDS = 26;
const MIN_A_WORDS = 20;
const MAX_A_WORDS = 140;

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

function normalizeQuestion(raw) {
  if (typeof raw !== 'string') return '';
  let q = raw.replace(/^[\s"'“”‘’`]+|[\s"'“”‘’`]+$/g, '').replace(/\s+/g, ' ').trim();
  // Strip any pre-existing "Q." or "Q:" prefix so the editor block can add its own.
  // Loop because the AI sometimes nests multiple prefixes ("Q. Q.").
  let prev = null;
  while (prev !== q) {
    prev = q;
    q = q.replace(/^(?:q\s*[.:]\s*)/i, '').trim();
  }
  // Ensure it ends with a question mark.
  if (q && !q.endsWith('?')) q = `${q.replace(/[.!]+$/, '')}?`;
  return q;
}

function normalizeAnswer(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/^[\s"'“”‘’`]+|[\s"'“”‘’`]+$/g, '').replace(/\s+/g, ' ').trim();
}

function countWords(s) {
  return (String(s || '').match(/\S+/g) || []).length;
}

function canonicalKey(q) {
  return String(q || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const BANNED = [
  'ultimate',
  'revolutionary',
  'game-changer',
  'game changer',
  'unlock the power',
  "you won't believe",
  'you wont believe',
  'in todays world',
  "in today's world",
  'discover the secrets',
];

function isAcceptable(question, answer) {
  if (!question || !answer) return false;
  const qw = countWords(question);
  const aw = countWords(answer);
  if (qw < MIN_Q_WORDS || qw > MAX_Q_WORDS) return false;
  if (aw < MIN_A_WORDS || aw > MAX_A_WORDS) return false;
  if (!question.endsWith('?')) return false;
  const lower = (question + ' ' + answer).toLowerCase();
  if (BANNED.some((b) => lower.includes(b))) return false;
  return true;
}

/**
 * @param {object} ctx
 * @param {object} [opts]
 */
async function generateBlogFaqs(ctx, opts = {}) {
  if (!ctx || typeof ctx !== 'object') {
    throw new Error('faqService: ctx is required');
  }
  if (!ctx.focusKeyword || !String(ctx.focusKeyword).trim()) {
    throw new Error('focus keyword is required');
  }
  const focus = String(ctx.focusKeyword).trim();

  const prompt = buildFaqPrompt(ctx);

  const result = await aiProviderService.generateText({
    prompt,
    options: {
      feature: 'faqs',
      provider: opts.provider,
      model: opts.model,
      temperature: opts.temperature ?? 0.75,
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
      responseFormat: 'json',
      systemInstruction:
        'You are a precise editorial assistant. You only respond with valid JSON matching the schema in the prompt. No prose, no markdown.',
    },
    op: 'blog_faqs',
  });

  const parsed = extractJson(result.text);
  if (!parsed || !Array.isArray(parsed.suggestions)) {
    throw new Error('AI response did not contain a valid FAQ suggestions array');
  }

  const seen = new Set();
  // Pre-seed with existing question keys so we never re-emit one.
  (ctx.existingQuestions || []).forEach((q) => seen.add(canonicalKey(normalizeQuestion(q))));

  const accepted = [];

  for (const item of parsed.suggestions) {
    const question = normalizeQuestion(item?.question);
    const answer = normalizeAnswer(item?.answer);
    if (!isAcceptable(question, answer)) continue;
    const key = canonicalKey(question);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    accepted.push({
      question,
      answer,
      intent:
        typeof item?.intent === 'string'
          ? item.intent.trim().toLowerCase().slice(0, 30)
          : null,
      coverage:
        typeof item?.coverage === 'string'
          ? item.coverage.trim().slice(0, 80)
          : null,
      rationale:
        typeof item?.rationale === 'string'
          ? item.rationale.trim().slice(0, 160)
          : '',
    });
  }

  return {
    focusKeyword: focus,
    provider: result.provider,
    model: result.model,
    usage: result.usage,
    count: accepted.length,
    suggestions: accepted,
  };
}

module.exports = { generateBlogFaqs };
