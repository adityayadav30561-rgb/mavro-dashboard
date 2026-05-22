const config = require('../../config');
const GeminiProvider = require('./providers/GeminiProvider');
const OpenRouterProvider = require('./providers/OpenRouterProvider');
const aiLogger = require('./aiLogger');
const { MODELS, getModel, listModels } = require('./config/modelRegistry');
const { planFor, MODEL_PLAN } = require('./config/routingStrategy');

/**
 * AIProviderService — central orchestrator for ALL AI calls in Mavro.
 *
 * Responsibilities (post multi-model expansion):
 *   • Provider registry      — instantiates each BaseProvider once
 *   • Feature-based routing  — feature key → ordered model chain
 *   • Cross-provider fallback— DeepSeek → Nemotron → GLM, etc.
 *   • Retries + timeout      — per-attempt with exponential backoff
 *   • Logging                — structured records + ring buffer
 *   • Sanitization           — prompt hygiene + hard char cap
 *
 * Consumers (controllers, services) never import providers directly. They
 * pass a `feature` key (e.g. 'titles', 'meta_descriptions', 'seo_audit')
 * and the orchestrator picks the right model. Adding a provider OR a model
 * never requires touching consumer code.
 */

// ---- Sanitization ---------------------------------------------------------

const MAX_PROMPT_CHARS = 24000;

function sanitizePrompt(prompt) {
  if (typeof prompt !== 'string') throw new Error('prompt must be a string');
  const trimmed = prompt.trim();
  if (!trimmed) throw new Error('prompt is empty');
  if (trimmed.length > MAX_PROMPT_CHARS) {
    throw new Error(`prompt exceeds ${MAX_PROMPT_CHARS}-char limit`);
  }
  return trimmed;
}

// ---- Retry helpers --------------------------------------------------------

function isRetryable(err) {
  // Note: we intentionally exclude 'timed out' — a slow upstream model is
  // better served by chain fallover than 3× same-model retries.
  const msg = String(err?.message || '').toLowerCase();
  if (msg.includes('rate limit')) return true;
  if (msg.includes('429')) return true;
  if (msg.includes('503')) return true;
  if (msg.includes('504')) return true;
  if (msg.includes('network')) return true;
  if (msg.includes('fetch failed')) return true;
  return false;
}

function isQuotaError(err) {
  const msg = String(err?.message || '').toLowerCase();
  return msg.includes('quota') || msg.includes('429') || msg.includes('exhausted');
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- Service --------------------------------------------------------------

class AIProviderService {
  constructor() {
    this.providerRegistry = new Map();
    this._initProviders();
  }

  _initProviders() {
    const cfg = config.ai;

    // Gemini
    this.providerRegistry.set(
      'gemini',
      new GeminiProvider({
        apiKey: cfg.providers.gemini.apiKey,
        defaultModel: cfg.providers.gemini.defaultModel,
        timeoutMs: cfg.requestTimeoutMs,
      })
    );

    // OpenRouter (multi-model gateway)
    this.providerRegistry.set(
      'openrouter',
      new OpenRouterProvider({
        apiKey: cfg.providers.openrouter.apiKey,
        baseURL: cfg.providers.openrouter.baseURL,
        referer: cfg.providers.openrouter.referer,
        appTitle: cfg.providers.openrouter.appTitle,
        defaultModel: cfg.providers.openrouter.defaultModel,
        timeoutMs: cfg.requestTimeoutMs,
      })
    );
  }

  getProvider(name) {
    const target = name || config.ai.defaultProvider;
    const provider = this.providerRegistry.get(target);
    if (!provider) {
      throw new Error(`AIProviderService: provider "${target}" is not registered`);
    }
    return provider;
  }

  /**
   * Resolve the routing chain for a call.
   *
   * Order of precedence:
   *   1. Explicit options.model (registry id OR raw provider model id)
   *   2. Explicit options.modelId + options.provider
   *   3. Explicit options.provider only → use that provider's default model
   *   4. options.feature → planFor(feature) → filter through active registry
   *   5. Fallback to env AI_DEFAULT_PROVIDER + AI_DEFAULT_MODEL
   *
   * Returns an array of { provider: BaseProvider, modelId: string, registryId: string|null }.
   */
  _resolveChain({ feature, provider: providerHint, model: modelHint, modelId: rawModelId } = {}) {
    const chain = [];

    // Case 1 — explicit registry id
    if (modelHint && getModel(modelHint)) {
      const entry = getModel(modelHint);
      const inst = this.providerRegistry.get(entry.provider);
      if (inst && inst.isConfigured()) {
        chain.push({ provider: inst, modelId: entry.modelId, registryId: entry.id });
      }
    }
    // Case 2 — explicit raw provider+modelId
    if (chain.length === 0 && providerHint && rawModelId) {
      const inst = this.providerRegistry.get(providerHint);
      if (inst && inst.isConfigured()) {
        chain.push({ provider: inst, modelId: rawModelId, registryId: null });
      }
    }
    // Case 3 — explicit raw model on default provider
    if (chain.length === 0 && modelHint && !getModel(modelHint)) {
      // Treat modelHint as a raw provider model id, pick provider by guess.
      // If providerHint supplied use it; otherwise default provider.
      const targetProvider = providerHint || config.ai.defaultProvider;
      const inst = this.providerRegistry.get(targetProvider);
      if (inst && inst.isConfigured()) {
        chain.push({ provider: inst, modelId: modelHint, registryId: null });
      }
    }
    // Case 4 — provider hint only
    if (chain.length === 0 && providerHint) {
      const inst = this.providerRegistry.get(providerHint);
      if (inst && inst.isConfigured()) {
        chain.push({
          provider: inst,
          modelId: inst.defaultModel,
          registryId: null,
        });
      }
    }
    // Case 5 — feature plan
    if (chain.length === 0) {
      const plan = planFor(feature);
      for (const id of plan) {
        const entry = getModel(id);
        if (!entry || !entry.active) continue;
        const inst = this.providerRegistry.get(entry.provider);
        if (!inst || !inst.isConfigured()) continue;
        chain.push({ provider: inst, modelId: entry.modelId, registryId: entry.id });
      }
    }
    // Final fallback — env default
    if (chain.length === 0) {
      const inst = this.providerRegistry.get(config.ai.defaultProvider);
      if (inst && inst.isConfigured()) {
        chain.push({
          provider: inst,
          modelId: config.ai.defaultModel,
          registryId: null,
        });
      }
    }

    if (chain.length === 0) {
      throw new Error('AIProviderService: no configured provider/model resolved');
    }
    return chain;
  }

  /**
   * Free-form text generation through the resolved routing chain.
   *
   * @param {object} params
   * @param {string} params.prompt
   * @param {object} [params.options]
   * @param {string} [params.options.feature]            -- routing key (preferred)
   * @param {string} [params.options.model]              -- registry id
   * @param {string} [params.options.provider]
   * @param {string} [params.options.modelId]            -- raw provider model id
   * @param {number} [params.options.temperature]
   * @param {number} [params.options.maxOutputTokens]
   * @param {string} [params.options.systemInstruction]
   * @param {'json'|null} [params.options.responseFormat]
   * @param {string} [params.op]
   */
  async generateText({ prompt, options = {}, op = 'generate' }) {
    const cleaned = sanitizePrompt(prompt);
    const cfg = config.ai;

    const chain = this._resolveChain(options);
    const maxRetries = options.maxRetries ?? cfg.maxRetries;

    const callOptions = {
      temperature: options.temperature ?? cfg.temperature,
      maxOutputTokens: options.maxOutputTokens ?? cfg.maxOutputTokens,
      systemInstruction: options.systemInstruction,
      timeoutMs: options.timeoutMs ?? cfg.requestTimeoutMs,
      responseFormat: options.responseFormat || null,
    };

    let lastError = null;

    for (let i = 0; i < chain.length; i += 1) {
      const { provider, modelId, registryId } = chain[i];
      const perCallOpts = { ...callOptions, model: modelId };

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const start = Date.now();
        try {
          const result = await provider.generate({ prompt: cleaned, options: perCallOpts });

          // Empty completion = treat as failure so chain can fall over.
          if (!result.text || !result.text.trim()) {
            throw new Error('empty completion');
          }

          aiLogger.logRequest({
            op,
            feature: options.feature || null,
            provider: provider.name,
            model: result.model,
            registryId,
            status: 'ok',
            latencyMs: Date.now() - start,
            usage: result.usage,
            attempt,
          });
          return {
            text: result.text,
            usage: result.usage,
            provider: provider.name,
            model: result.model,
            registryId,
          };
        } catch (err) {
          const latency = Date.now() - start;
          const quotaHit = isQuotaError(err);
          aiLogger.logRequest({
            op,
            feature: options.feature || null,
            provider: provider.name,
            model: modelId,
            registryId,
            status: 'error',
            latencyMs: latency,
            attempt,
            error: err.message,
            quotaHit,
          });
          lastError = err;

          // Quota / 429 — don't waste retries on the same model. Move on.
          if (quotaHit) break;
          if (!isRetryable(err) || attempt === maxRetries) break;
          await wait(250 * Math.pow(2, attempt));
        }
      }
      // Log fallover between models for observability.
      if (i < chain.length - 1) {
        const next = chain[i + 1];
        aiLogger.logRequest({
          op,
          feature: options.feature || null,
          provider: provider.name,
          model: modelId,
          registryId,
          status: 'fallover',
          latencyMs: 0,
          attempt: -1,
          fallover: {
            from: registryId || modelId,
            to: next.registryId || next.modelId,
          },
        });
      }
    }

    throw lastError || new Error('AIProviderService: all providers failed');
  }

  // -------------------------------------------------------------------------
  // High-level helpers — each tags its `feature` for routing.
  // The deeper services (titleService, metaService) call generateText
  // directly with the correct feature key; these helpers are convenience
  // entry points for ad-hoc consumers.
  // -------------------------------------------------------------------------

  generateTitles({ topic, count = 5, options }) {
    const prompt = [
      'You are a senior content editor.',
      `Write ${count} SEO-friendly, click-worthy article titles for: "${topic}".`,
      'Each title under 70 characters. Return as a JSON string array. No commentary.',
    ].join('\n');
    return this.generateText({ prompt, options: { ...options, feature: 'titles' }, op: 'titles' });
  }

  generateMetaDescriptions({ topic, summary, count = 3, options }) {
    const prompt = [
      'You are an SEO copywriter.',
      `Topic: "${topic}".`,
      summary ? `Page summary: ${summary}` : '',
      `Write ${count} meta descriptions, each 140-160 characters, action-oriented.`,
      'Return as a JSON string array. No commentary.',
    ]
      .filter(Boolean)
      .join('\n');
    return this.generateText({
      prompt,
      options: { ...options, feature: 'meta_descriptions' },
      op: 'meta_descriptions',
    });
  }

  generateFAQs({ topic, count = 5, options }) {
    const prompt = [
      'You are an SEO content strategist generating FAQ schema content.',
      `Topic: "${topic}".`,
      `Generate ${count} high-intent questions and concise answers (2-3 sentences each).`,
      'Return JSON array of objects with keys: question, answer. No commentary.',
    ].join('\n');
    return this.generateText({ prompt, options: { ...options, feature: 'faqs' }, op: 'faqs' });
  }

  generateOutline({ topic, targetWordCount = 1500, options }) {
    const prompt = [
      'You are an editorial planner producing a long-form article outline.',
      `Topic: "${topic}".`,
      `Target length: ${targetWordCount} words.`,
      'Return JSON with keys: h1, intro, sections (array of { h2, h3s, talkingPoints }), conclusion.',
      'No commentary outside the JSON.',
    ].join('\n');
    return this.generateText({ prompt, options: { ...options, feature: 'outline' }, op: 'outline' });
  }

  generateSEOAudit({ topic, content, options }) {
    const prompt = [
      'You are a senior SEO auditor.',
      `Topic: "${topic}".`,
      'Audit the following article. Return strict JSON with keys: strengths, weaknesses, opportunities, risks, recommendations. Each is an array of <=8 short strings.',
      '---',
      String(content || '').slice(0, 8000),
    ].join('\n');
    return this.generateText({
      prompt,
      options: { ...options, feature: 'seo_audit', responseFormat: 'json' },
      op: 'seo_audit',
    });
  }

  generateSemanticSuggestions({ topic, content, options }) {
    const prompt = [
      'You are a semantic SEO analyst.',
      `Topic: "${topic}".`,
      'Read the article and return strict JSON with keys: relatedEntities (8), supportingTerms (10), missingSubtopics (6), userIntents (4). Each is an array of short strings.',
      '---',
      String(content || '').slice(0, 8000),
    ].join('\n');
    return this.generateText({
      prompt,
      options: { ...options, feature: 'semantic_suggestions', responseFormat: 'json' },
      op: 'semantic_suggestions',
    });
  }

  // ---- Diagnostics --------------------------------------------------------

  /**
   * Health snapshot for /api/ai/health.
   * Reports providers + models + routing + logger stats.
   */
  async health() {
    const providers = {};
    for (const [name, provider] of this.providerRegistry.entries()) {
      providers[name] = {
        configured: provider.isConfigured(),
        defaultModel: provider.defaultModel,
        connectivity: provider.isConfigured()
          ? await provider.healthCheck()
          : { ok: false, reason: 'not_configured' },
      };
    }

    const models = MODELS.map((m) => ({
      id: m.id,
      provider: m.provider,
      modelId: m.modelId,
      strengths: m.strengths,
      useCases: m.useCases,
      rateTier: m.rateTier,
      active: m.active,
      callable: m.active && providers[m.provider]?.configured === true,
    }));

    // Resolve each feature's chain so operators see what routing will pick.
    const routing = {};
    for (const feature of Object.keys(MODEL_PLAN)) {
      try {
        const chain = this._resolveChain({ feature });
        routing[feature] = chain.map((c) => ({
          provider: c.provider.name,
          registryId: c.registryId,
          modelId: c.modelId,
        }));
      } catch (e) {
        routing[feature] = { error: e.message };
      }
    }

    return {
      defaultProvider: config.ai.defaultProvider,
      defaultModel: config.ai.defaultModel,
      providers,
      models,
      routing,
      stats: aiLogger.snapshot(),
    };
  }

  /**
   * Direct test of a specific registry model — used by /api/ai/model-test.
   * Bypasses routing/fallback so we can attribute errors to a single model.
   */
  async modelTest({ registryId, prompt, options = {} }) {
    const entry = getModel(registryId);
    if (!entry) throw new Error(`Unknown registry id "${registryId}"`);
    const provider = this.providerRegistry.get(entry.provider);
    if (!provider || !provider.isConfigured()) {
      throw new Error(`Provider "${entry.provider}" not configured`);
    }
    const start = Date.now();
    try {
      const out = await provider.generate({
        prompt: prompt || 'Reply with the word: OK',
        options: {
          model: entry.modelId,
          maxOutputTokens: options.maxOutputTokens ?? 256,
          temperature: options.temperature ?? 0,
        },
      });
      const latency = Date.now() - start;
      aiLogger.logRequest({
        op: 'model_test',
        provider: provider.name,
        model: out.model,
        registryId,
        status: 'ok',
        latencyMs: latency,
        usage: out.usage,
      });
      return { ok: true, latencyMs: latency, text: out.text, usage: out.usage, model: out.model };
    } catch (e) {
      const latency = Date.now() - start;
      aiLogger.logRequest({
        op: 'model_test',
        provider: provider.name,
        model: entry.modelId,
        registryId,
        status: 'error',
        latencyMs: latency,
        error: e.message,
      });
      return { ok: false, latencyMs: latency, error: e.message };
    }
  }

  /**
   * Run a feature through routing — used by /api/ai/route-test. Useful for
   * verifying fallback by temporarily disabling a model in the registry.
   */
  async routeTest({ feature, prompt, options }) {
    return this.generateText({
      prompt: prompt || 'Reply with one word: OK',
      options: { ...(options || {}), feature, maxOutputTokens: options?.maxOutputTokens ?? 256 },
      op: `route_test:${feature || 'default'}`,
    });
  }
}

const aiProviderService = new AIProviderService();

module.exports = aiProviderService;
module.exports.AIProviderService = AIProviderService;
