const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const {
  aiProviderService,
  aiLogger,
  titleService,
  metaService,
  faqService,
  siteIntelligenceService,
  resolveTenantContext,
} = require('../services/ai');

/**
 * GET /api/ai/health
 * Reports provider registration, configuration, default model, and live
 * connectivity for each registered AI provider. Includes a usage rollup
 * from the in-process logger ring buffer.
 */
const health = asyncHandler(async (req, res) => {
  const snapshot = await aiProviderService.health();
  return ApiResponse.success(res, snapshot, 'AI health snapshot');
});

/**
 * POST /api/ai/test
 * Free-form prompt test. Honors options.feature for routing.
 * Body: { prompt, provider?, model?, feature?, temperature?,
 *         maxOutputTokens?, systemInstruction? }
 */
const test = asyncHandler(async (req, res) => {
  const {
    prompt,
    provider,
    model,
    feature,
    temperature,
    maxOutputTokens,
    systemInstruction,
  } = req.body || {};

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return ApiResponse.error(res, 'prompt is required', 400);
  }

  try {
    const result = await aiProviderService.generateText({
      prompt,
      options: { provider, model, feature, temperature, maxOutputTokens, systemInstruction },
      op: 'test',
    });
    return ApiResponse.success(res, result, 'AI response generated');
  } catch (err) {
    return ApiResponse.error(res, err.message || 'AI request failed', 502);
  }
});

/**
 * POST /api/ai/model-test
 * Body: { registryId: string, prompt?: string, maxOutputTokens?: number, temperature?: number }
 * Bypasses routing/fallback so failures are attributable to a single model.
 */
const modelTest = asyncHandler(async (req, res) => {
  const { registryId, prompt, maxOutputTokens, temperature } = req.body || {};
  if (typeof registryId !== 'string' || !registryId.trim()) {
    return ApiResponse.error(res, 'registryId is required', 400);
  }
  const out = await aiProviderService.modelTest({
    registryId,
    prompt,
    options: { maxOutputTokens, temperature },
  });
  return ApiResponse.success(res, out, out.ok ? 'Model responded' : 'Model failed');
});

/**
 * POST /api/ai/route-test
 * Body: { feature: string, prompt?: string, maxOutputTokens?: number }
 * Runs a feature through routing + fallback. Use to verify the chain.
 */
const routeTest = asyncHandler(async (req, res) => {
  const { feature, prompt, maxOutputTokens } = req.body || {};
  if (typeof feature !== 'string' || !feature.trim()) {
    return ApiResponse.error(res, 'feature is required', 400);
  }
  try {
    const out = await aiProviderService.routeTest({
      feature,
      prompt,
      options: { maxOutputTokens },
    });
    return ApiResponse.success(res, out, `Feature "${feature}" routed`);
  } catch (e) {
    return ApiResponse.error(res, e.message || 'route_test failed', 502);
  }
});

/**
 * GET /api/ai/recent
 * Returns the last N AI request log entries (metadata only — no prompt bodies).
 * Useful while developing higher-level AI features.
 */
const recent = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
  return ApiResponse.success(res, { entries: aiLogger.recent(limit) }, 'recent AI requests');
});

/**
 * POST /api/ai/blog/titles
 * Body: {
 *   focusKeyword: string,        // required
 *   currentTitle?: string,
 *   contentHtml?: string,
 *   headings?: [{level,text}],
 *   tags?: string[],
 *   semanticKeywords?: string[],
 *   intent?: string,
 *   category?: string,
 *   targetWebsite?: string,      // ObjectId — resolves to tenant slug + name
 *   tenantSlug?: string,         // direct override
 *   categories?: string[],       // subset of supported categories
 *   perCategory?: number,
 *   model?: string,
 *   temperature?: number,
 * }
 *
 * Returns suggestions grouped by category. Backend-only — never exposes the
 * provider key. Quality scoring is done client-side via deterministic SEO
 * utilities so the AI layer cannot drift the live SEO engine.
 */
const generateBlogTitles = asyncHandler(async (req, res) => {
  const {
    focusKeyword,
    currentTitle,
    contentHtml,
    headings,
    tags,
    semanticKeywords,
    intent,
    category,
    targetWebsite,
    tenantSlug: tenantSlugBody,
    categories,
    perCategory,
    model,
    temperature,
  } = req.body || {};

  if (typeof focusKeyword !== 'string' || !focusKeyword.trim()) {
    return ApiResponse.error(res, 'focusKeyword is required', 400);
  }

  const tenantCtx = await resolveTenantContext({
    targetWebsite,
    tenantSlug: tenantSlugBody,
  });

  try {
    const out = await titleService.generateBlogTitles(
      {
        tenantSlug: tenantCtx.slug,
        tenantName: tenantCtx.name,
        tenant: tenantCtx.doc,
        focusKeyword,
        currentTitle,
        contentHtml,
        headings,
        tags,
        semanticKeywords,
        intent,
        category,
        categories,
        perCategory,
      },
      { model, temperature }
    );
    return ApiResponse.success(res, out, 'Title suggestions generated');
  } catch (err) {
    const msg = err?.message || 'Title generation failed';
    const code =
      /timed out|rate limit|429|503|504|network/i.test(msg) ? 502 : 400;
    return ApiResponse.error(res, msg, code);
  }
});

/**
 * POST /api/ai/blog/meta-descriptions
 * Body: {
 *   focusKeyword: string,        // required
 *   blogTitle?: string,
 *   currentDescription?: string,
 *   contentHtml?: string,
 *   headings?: [{level,text}],
 *   faqs?: [{question,answer}],
 *   tags?: string[],
 *   semanticKeywords?: string[],
 *   intent?: string,
 *   category?: string,
 *   targetWebsite?: string,
 *   tenantSlug?: string,
 *   categories?: string[],
 *   perCategory?: number,
 *   model?: string,
 *   temperature?: number,
 * }
 */
const generateBlogMetaDescriptions = asyncHandler(async (req, res) => {
  const {
    focusKeyword,
    blogTitle,
    currentDescription,
    contentHtml,
    headings,
    faqs,
    tags,
    semanticKeywords,
    intent,
    category,
    targetWebsite,
    tenantSlug: tenantSlugBody,
    categories,
    perCategory,
    model,
    temperature,
  } = req.body || {};

  if (typeof focusKeyword !== 'string' || !focusKeyword.trim()) {
    return ApiResponse.error(res, 'focusKeyword is required', 400);
  }

  const tenantCtx = await resolveTenantContext({
    targetWebsite,
    tenantSlug: tenantSlugBody,
  });

  try {
    const out = await metaService.generateBlogMetaDescriptions(
      {
        tenantSlug: tenantCtx.slug,
        tenantName: tenantCtx.name,
        tenant: tenantCtx.doc,
        focusKeyword,
        blogTitle,
        currentDescription,
        contentHtml,
        headings,
        faqs,
        tags,
        semanticKeywords,
        intent,
        category,
        categories,
        perCategory,
      },
      { model, temperature }
    );
    return ApiResponse.success(res, out, 'Meta description suggestions generated');
  } catch (err) {
    const msg = err?.message || 'Meta description generation failed';
    const code = /timed out|rate limit|429|503|504|network/i.test(msg) ? 502 : 400;
    return ApiResponse.error(res, msg, code);
  }
});

/**
 * POST /api/ai/blog/faqs
 * Body: {
 *   focusKeyword: string,                       // required
 *   blogTitle?: string,
 *   contentHtml?: string,
 *   headings?: [{level,text}],
 *   tags?: string[],
 *   semanticKeywords?: string[],
 *   category?: string,
 *   existingQuestions?: string[],               // dedupe against current FAQs
 *   targetWebsite?: string,
 *   tenantSlug?: string,
 *   count?: number,
 *   tone?: string,
 *   model?: string,
 *   temperature?: number,
 * }
 *
 * Returns normalized FAQ suggestions ready for FAQ-block insertion by the
 * editor. The route never returns HTML — the editor wraps each item in the
 * canonical `<p><strong>Q. ...</strong></p><p>...</p>` block so the FAQ
 * detector + FAQPage JSON-LD generator pick them up automatically.
 */
const generateBlogFaqs = asyncHandler(async (req, res) => {
  const {
    focusKeyword,
    blogTitle,
    contentHtml,
    headings,
    tags,
    semanticKeywords,
    category,
    existingQuestions,
    targetWebsite,
    tenantSlug: tenantSlugBody,
    count,
    tone,
    model,
    temperature,
  } = req.body || {};

  if (typeof focusKeyword !== 'string' || !focusKeyword.trim()) {
    return ApiResponse.error(res, 'focusKeyword is required', 400);
  }

  const tenantCtx = await resolveTenantContext({
    targetWebsite,
    tenantSlug: tenantSlugBody,
  });

  try {
    const out = await faqService.generateBlogFaqs(
      {
        tenantSlug: tenantCtx.slug,
        tenantName: tenantCtx.name,
        tenant: tenantCtx.doc,
        focusKeyword,
        blogTitle,
        contentHtml,
        headings,
        tags,
        semanticKeywords,
        category,
        existingQuestions,
        count: typeof count === 'number' ? count : undefined,
        tone,
      },
      { model, temperature }
    );
    return ApiResponse.success(res, out, 'FAQ suggestions generated');
  } catch (err) {
    const msg = err?.message || 'FAQ generation failed';
    const code = /timed out|rate limit|429|503|504|network/i.test(msg) ? 502 : 400;
    return ApiResponse.error(res, msg, code);
  }
});

/**
 * POST /api/ai/seo/site-intelligence
 * Body: {
 *   targetWebsite: string,                   // ObjectId — preferred
 *   tenantSlug?: string,                     // alt identifier
 *   deterministic?: {                        // caller-supplied signals
 *     avgSeoScore?: number,
 *     linkGraph?: { orphanCount, clusterCount, qualityScore },
 *     decay?: { criticalCount, decliningCount, agingCount }
 *   },
 *   model?: string,
 *   temperature?: number,
 *   sampleSize?: number,
 * }
 *
 * Returns the deterministic corpus summary PLUS AI-interpreted strategic
 * insights (topical authority, semantic gaps, content opportunities,
 * audit, linking, intent coverage, cluster strength, decay narrative,
 * publishing strategy).
 *
 * Routes via `feature: 'seo_audit'` (DeepSeek → Nemotron → Qwen3-Coder).
 */
const generateSiteIntelligence = asyncHandler(async (req, res) => {
  const {
    targetWebsite,
    tenantSlug,
    deterministic,
    model,
    temperature,
    sampleSize,
  } = req.body || {};

  if (!targetWebsite && !tenantSlug) {
    return ApiResponse.error(res, 'targetWebsite or tenantSlug is required', 400);
  }

  try {
    const out = await siteIntelligenceService.generateSiteIntelligence({
      targetWebsite,
      tenantSlug,
      deterministic: deterministic || {},
      options: { model, temperature, sampleSize },
    });
    return ApiResponse.success(res, out, 'Site intelligence generated');
  } catch (err) {
    const msg = err?.message || 'Site intelligence failed';
    const code = /timed out|rate limit|429|503|504|network/i.test(msg) ? 502 : 400;
    return ApiResponse.error(res, msg, code);
  }
});

module.exports = {
  health,
  test,
  modelTest,
  routeTest,
  recent,
  generateBlogTitles,
  generateBlogMetaDescriptions,
  generateBlogFaqs,
  generateSiteIntelligence,
};
