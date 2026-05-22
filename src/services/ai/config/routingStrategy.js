/**
 * routingStrategy — feature → ordered list of model IDs to try.
 *
 * Resolution flow at request time:
 *   1. Caller (orchestrator) supplies a `feature` key (e.g. 'titles').
 *   2. We look up MODEL_PLAN[feature] → array of model registry IDs.
 *   3. The orchestrator filters that list down to models whose provider is
 *      registered + configured + active, then walks the chain on failure.
 *
 * Keeping this OUT of feature code means swapping models is a config edit.
 * Cost-aware routing, A/B tests, and tenant-pinned models all hook in here
 * without changing call sites.
 *
 * Feature keys are stable contract — add new ones liberally, but do not
 * rename existing keys without grepping callers.
 */

const MODEL_PLAN = {
  // Editorial cockpit
  titles: ['gpt-oss-120b-free', 'gemini-2.5-flash-lite', 'qwen3-next-80b-instruct', 'glm-4.5-air-free'],
  meta_descriptions: [
    'gemini-2.5-flash-lite',
    'gpt-oss-120b-free',
    'qwen3-next-80b-instruct',
    'glm-4.5-air-free',
  ],
  faqs: ['qwen3-next-80b-instruct', 'gpt-oss-120b-free', 'glm-4.5-air-free'],
  outline: ['glm-4.5-air-free', 'gpt-oss-120b-free', 'qwen3-next-80b-instruct'],

  // SEO + analysis (later phases)
  // seo_audit handles large-corpus prompts (~5k+ tokens). Qwen3-Coder free is
  // frequently saturated; keep Gemini Flash Lite as a final safety net.
  seo_audit: ['deepseek-v4-flash', 'nemotron-3-super', 'qwen3-coder-480b-free', 'gemini-2.5-flash-lite'],
  semantic_suggestions: ['qwen3-next-80b-instruct', 'glm-4.5-air-free', 'deepseek-v4-flash'],
  long_form: ['qwen3-coder-480b-free', 'nemotron-3-super', 'qwen3-next-80b-instruct'],
  planning: ['glm-4.5-air-free', 'gpt-oss-120b-free', 'qwen3-next-80b-instruct'],

  // Generic fallback used when caller does not specify a feature key.
  default: ['gemini-2.5-flash-lite', 'gpt-oss-120b-free', 'glm-4.5-air-free'],
};

function planFor(feature) {
  if (feature && MODEL_PLAN[feature]) return MODEL_PLAN[feature];
  return MODEL_PLAN.default;
}

module.exports = { MODEL_PLAN, planFor };
