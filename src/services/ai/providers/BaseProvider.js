/**
 * BaseProvider — abstract contract every AI provider must implement.
 *
 * Adding a new provider:
 *   1. Subclass BaseProvider in this folder
 *   2. Implement generate({prompt, options}) returning { text, usage, model, raw }
 *   3. Register the class in AIProviderService → providerRegistry
 *
 * Consumers (controllers, services) never import providers directly.
 * They go through AIProviderService so provider selection, retries,
 * timeout, logging, and fallback behave uniformly across providers.
 */
class BaseProvider {
  /**
   * @param {object} cfg
   * @param {string} cfg.name         - lowercase id e.g. "gemini"
   * @param {string} cfg.defaultModel - default model identifier
   * @param {string|null} cfg.apiKey
   * @param {number} cfg.timeoutMs
   */
  constructor(cfg) {
    if (this.constructor === BaseProvider) {
      throw new Error('BaseProvider is abstract — instantiate a concrete subclass.');
    }
    this.name = cfg.name;
    this.defaultModel = cfg.defaultModel;
    this.apiKey = cfg.apiKey;
    this.timeoutMs = cfg.timeoutMs;
  }

  /**
   * True when this provider has the credentials/config it needs to make a real call.
   * Used by health checks and the orchestrator before routing a request.
   */
  isConfigured() {
    return Boolean(this.apiKey);
  }

  /**
   * Free-form text generation. Must be implemented by subclasses.
   *
   * @param {object} params
   * @param {string} params.prompt
   * @param {object} [params.options]
   * @param {string} [params.options.model]
   * @param {number} [params.options.temperature]
   * @param {number} [params.options.maxOutputTokens]
   * @param {string} [params.options.systemInstruction]
   * @returns {Promise<{text:string, usage:object, model:string, raw:any}>}
   */
  // eslint-disable-next-line no-unused-vars
  async generate({ prompt, options }) {
    throw new Error(`${this.constructor.name} must implement generate()`);
  }

  /**
   * Lightweight connectivity check — must be cheap (no large generation).
   * Subclasses may override. Default does a 1-token "ping" via generate().
   */
  async healthCheck() {
    if (!this.isConfigured()) {
      return { ok: false, reason: 'not_configured' };
    }
    try {
      const start = Date.now();
      const out = await this.generate({
        prompt: 'ping',
        options: { maxOutputTokens: 4, temperature: 0 },
      });
      return {
        ok: true,
        latencyMs: Date.now() - start,
        model: out.model,
      };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }
}

module.exports = BaseProvider;
