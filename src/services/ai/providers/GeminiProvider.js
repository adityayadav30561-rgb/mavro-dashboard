const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseProvider = require('./BaseProvider');

/**
 * GeminiProvider — Google Generative AI (Gemini) implementation.
 *
 * Default model: gemini-2.5-flash
 * SDK: @google/generative-ai
 *
 * Switch models per-call via options.model. The client is lazy-instantiated
 * once per process and shared across requests (the SDK is async-safe).
 */
class GeminiProvider extends BaseProvider {
  constructor(cfg) {
    super({ ...cfg, name: 'gemini' });
    this._client = null;
  }

  _getClient() {
    if (!this.apiKey) {
      throw new Error('GeminiProvider: GEMINI_API_KEY not configured');
    }
    if (!this._client) {
      this._client = new GoogleGenerativeAI(this.apiKey);
    }
    return this._client;
  }

  async generate({ prompt, options = {} }) {
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('GeminiProvider.generate: prompt must be a non-empty string');
    }

    const modelName = options.model || this.defaultModel;
    const client = this._getClient();

    const generationConfig = {
      temperature: options.temperature ?? undefined,
      maxOutputTokens: options.maxOutputTokens ?? undefined,
      topP: options.topP ?? undefined,
      topK: options.topK ?? undefined,
    };
    // Strip undefined keys so the SDK uses its own defaults where unspecified
    Object.keys(generationConfig).forEach(
      (k) => generationConfig[k] === undefined && delete generationConfig[k]
    );

    const modelOpts = { model: modelName, generationConfig };
    if (options.systemInstruction) {
      modelOpts.systemInstruction = options.systemInstruction;
    }

    const model = client.getGenerativeModel(modelOpts);

    // Timeout race — SDK does not expose a request-level timeout, so we wrap it.
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const generationPromise = model.generateContent(prompt);

    const result = await Promise.race([
      generationPromise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`GeminiProvider: request timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);

    const response = result.response;
    const text = typeof response?.text === 'function' ? response.text() : '';

    // Token accounting — present on newer SDK versions; fall back to nulls.
    const usageMeta = response?.usageMetadata || {};
    const usage = {
      promptTokens: usageMeta.promptTokenCount ?? null,
      completionTokens: usageMeta.candidatesTokenCount ?? null,
      totalTokens: usageMeta.totalTokenCount ?? null,
    };

    return {
      text,
      usage,
      model: modelName,
      raw: response,
    };
  }
}

module.exports = GeminiProvider;
