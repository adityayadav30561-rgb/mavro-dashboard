/**
 * modelRegistry — single source of truth for every model Mavro can call.
 *
 * Each entry describes:
 *   • id            unique internal key used by routing
 *   • provider      which BaseProvider instance handles the call
 *   • modelId       provider-specific model identifier
 *   • strengths     short array of capability tags (for routing + diagnostics)
 *   • useCases      feature-keys this model is appropriate for
 *   • rateTier      'free' | 'paid' (informational — used by future cost router)
 *   • fallbackRank  lower is preferred for a tie among useCase candidates
 *   • active        toggle without removing the row
 *   • notes         human note
 *
 * Adding a new model:
 *   1. Append a new entry below.
 *   2. (Optional) Reference its id in routingStrategy.js → MODEL_PLAN.
 *
 * Nothing else changes. The orchestrator picks it up automatically.
 */

const MODELS = [
  // ------------------------- OpenRouter pool -------------------------------
  {
    id: 'deepseek-v4-flash',
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-v4-flash',
    strengths: ['reasoning', 'fast', 'cheap'],
    useCases: ['seo_audit', 'semantic_suggestions', 'fallback'],
    rateTier: 'paid',
    fallbackRank: 1,
    active: true,
    notes: 'DeepSeek V4 Flash — fast reasoning, good for audit and semantic passes.',
  },
  {
    id: 'nemotron-3-super',
    provider: 'openrouter',
    modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
    strengths: ['long-context', 'analysis'],
    useCases: ['seo_audit', 'long_form', 'fallback'],
    rateTier: 'paid',
    fallbackRank: 2,
    active: true,
    notes: 'NVIDIA Nemotron 3 Super — long-form analytical fallback.',
  },
  {
    id: 'qwen3-next-80b-instruct',
    provider: 'openrouter',
    modelId: 'qwen/qwen3-next-80b-a3b-instruct',
    strengths: ['semantic', 'instruction-tuned', 'multilingual'],
    useCases: ['semantic_suggestions', 'faqs', 'titles', 'long_form'],
    rateTier: 'paid',
    fallbackRank: 1,
    active: true,
    notes: 'Qwen3 Next 80B Instruct — strong semantic + instruction following.',
  },
  {
    id: 'gpt-oss-120b-free',
    provider: 'openrouter',
    modelId: 'openai/gpt-oss-120b:free',
    strengths: ['general', 'instruction', 'editorial'],
    useCases: ['titles', 'meta_descriptions', 'faqs', 'planning'],
    rateTier: 'free',
    fallbackRank: 1,
    active: true,
    notes: 'OpenAI GPT-OSS 120B (free tier) — primary editorial generator.',
  },
  {
    id: 'glm-4.5-air-free',
    provider: 'openrouter',
    modelId: 'z-ai/glm-4.5-air:free',
    strengths: ['structured', 'planning', 'fast'],
    useCases: ['planning', 'semantic_suggestions', 'fallback'],
    rateTier: 'free',
    fallbackRank: 2,
    active: true,
    notes: 'Z.ai GLM 4.5 Air (free tier) — quick structured planning fallback.',
  },
  {
    id: 'qwen3-coder-480b-free',
    provider: 'openrouter',
    // OpenRouter lists Qwen3 Coder free as `qwen/qwen3-coder:free`
    // (no explicit 480b-a35b slug). Unversioned alias is forwarded to the
    // 480B variant. Update if OpenRouter renames it.
    modelId: 'qwen/qwen3-coder:free',
    strengths: ['long-context', 'structured', 'analytical'],
    useCases: ['long_form', 'seo_audit', 'fallback'],
    rateTier: 'free',
    fallbackRank: 2,
    active: true,
    notes: 'Qwen3 Coder 480B (free) — long-context reasoning. Also handles structured analysis.',
  },

  // ------------------------- Gemini (Google) -------------------------------
  {
    id: 'gemini-2.5-flash-lite',
    provider: 'gemini',
    modelId: 'gemini-2.5-flash-lite',
    strengths: ['fast', 'free-tier', 'editorial'],
    useCases: ['meta_descriptions', 'titles', 'fallback'],
    rateTier: 'free',
    fallbackRank: 1,
    active: true,
    notes: 'Gemini 2.5 Flash Lite — primary for meta descriptions, 200/day free.',
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    modelId: 'gemini-2.5-flash',
    strengths: ['fast', 'editorial'],
    useCases: ['titles', 'meta_descriptions', 'fallback'],
    rateTier: 'free',
    fallbackRank: 3,
    active: true,
    notes: 'Gemini 2.5 Flash — 20/day free tier cap. Higher quality than lite.',
  },
];

const MODEL_BY_ID = new Map(MODELS.map((m) => [m.id, m]));

function getModel(id) {
  return MODEL_BY_ID.get(id) || null;
}

function listModels({ provider, useCase, activeOnly = true } = {}) {
  return MODELS.filter((m) => {
    if (activeOnly && !m.active) return false;
    if (provider && m.provider !== provider) return false;
    if (useCase && !m.useCases.includes(useCase)) return false;
    return true;
  });
}

module.exports = {
  MODELS,
  MODEL_BY_ID,
  getModel,
  listModels,
};
