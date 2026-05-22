const OpenAI = require('openai');
const BaseProvider = require('./BaseProvider');

/**
 * OpenRouterProvider — unified gateway to many model families through one
 * OpenAI-API-compatible endpoint. Each call routes to a specific upstream
 * model (DeepSeek, Qwen, GPT-OSS, GLM, Nemotron, ...). The provider itself
 * is stateless; routing decisions are made by AIProviderService using the
 * model registry + routing strategy.
 *
 * The provider:
 *   • Uses the official `openai` SDK pointed at OpenRouter's base URL
 *   • Carries the optional X-Title + HTTP-Referer headers OpenRouter
 *     surfaces in its dashboard for usage attribution
 *   • Wraps every call in a request-level timeout race
 *   • Normalizes response shape to match BaseProvider's contract:
 *       { text, usage, model, raw }
 */
class OpenRouterProvider extends BaseProvider {
  constructor(cfg) {
    super({ ...cfg, name: 'openrouter' });
    this.baseURL = cfg.baseURL || 'https://openrouter.ai/api/v1';
    this.referer = cfg.referer || null;
    this.appTitle = cfg.appTitle || null;
    this._client = null;
  }

  _getClient() {
    if (!this.apiKey) {
      throw new Error('OpenRouterProvider: OPENROUTER_API_KEY not configured');
    }
    if (!this._client) {
      const defaultHeaders = {};
      if (this.referer) defaultHeaders['HTTP-Referer'] = this.referer;
      if (this.appTitle) defaultHeaders['X-Title'] = this.appTitle;
      this._client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
        defaultHeaders,
      });
    }
    return this._client;
  }

  async generate({ prompt, options = {} }) {
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('OpenRouterProvider.generate: prompt must be a non-empty string');
    }

    const modelId = options.model || this.defaultModel;
    if (!modelId) {
      throw new Error('OpenRouterProvider.generate: model id is required');
    }

    const client = this._getClient();

    const messages = [];
    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const body = {
      model: modelId,
      messages,
    };
    if (options.temperature != null) body.temperature = options.temperature;
    if (options.maxOutputTokens != null) body.max_tokens = options.maxOutputTokens;
    if (options.topP != null) body.top_p = options.topP;
    if (options.responseFormat === 'json') {
      // OpenRouter passes this through to compatible providers. Models that
      // don't support it ignore the field; the orchestrator's own JSON
      // extractor handles plain-text fallback.
      body.response_format = { type: 'json_object' };
    }

    const timeoutMs = options.timeoutMs ?? this.timeoutMs;

    const requestPromise = client.chat.completions.create(body);

    const result = await Promise.race([
      requestPromise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`OpenRouterProvider: request timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);

    const text = result?.choices?.[0]?.message?.content || '';
    const usageMeta = result?.usage || {};
    const usage = {
      promptTokens: usageMeta.prompt_tokens ?? null,
      completionTokens: usageMeta.completion_tokens ?? null,
      totalTokens: usageMeta.total_tokens ?? null,
    };

    return {
      text,
      usage,
      model: result?.model || modelId,
      raw: result,
    };
  }

  /**
   * Lighter health check than the base implementation — OpenRouter charges
   * a real upstream call for each ping, so we pick a tiny free model and
   * cap output to 8 tokens.
   */
  async healthCheck(options = {}) {
    if (!this.isConfigured()) {
      return { ok: false, reason: 'not_configured' };
    }
    try {
      const start = Date.now();
      const out = await this.generate({
        prompt: 'ping',
        options: {
          model: options.model || 'openai/gpt-oss-120b:free',
          maxOutputTokens: 8,
          temperature: 0,
          timeoutMs: options.timeoutMs || 8000,
        },
      });
      return { ok: true, latencyMs: Date.now() - start, model: out.model };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }
}

module.exports = OpenRouterProvider;
