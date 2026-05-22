import api from './axios';

/**
 * AI API client — all calls go through the authenticated /api/ai bucket.
 * Backend handles provider routing, rate-limiting, retries, and key safety.
 */

export const getAiHealth = () => api.get('/ai/health');

export const getAiRecent = (limit = 25) =>
  api.get('/ai/recent', { params: { limit } });

export const aiTest = (payload) => api.post('/ai/test', payload);

/**
 * Request blog title suggestions.
 *
 * @param {object} payload
 * @param {string} payload.focusKeyword         - required
 * @param {string} [payload.currentTitle]
 * @param {string} [payload.contentHtml]
 * @param {Array}  [payload.headings]           - [{level, text}]
 * @param {Array}  [payload.tags]
 * @param {Array}  [payload.semanticKeywords]
 * @param {string} [payload.intent]
 * @param {string} [payload.category]
 * @param {string} [payload.targetWebsite]      - ObjectId
 * @param {string} [payload.tenantSlug]
 * @param {Array}  [payload.categories]         - subset of supported categories
 * @param {number} [payload.perCategory]
 */
export const generateBlogTitles = (payload) =>
  api.post('/ai/blog/titles', payload);

/**
 * Request blog meta-description suggestions.
 *
 * @param {object} payload
 * @param {string} payload.focusKeyword             - required
 * @param {string} [payload.blogTitle]
 * @param {string} [payload.currentDescription]
 * @param {string} [payload.contentHtml]
 * @param {Array}  [payload.headings]
 * @param {Array}  [payload.faqs]
 * @param {Array}  [payload.tags]
 * @param {Array}  [payload.semanticKeywords]
 * @param {string} [payload.intent]
 * @param {string} [payload.category]
 * @param {string} [payload.targetWebsite]
 * @param {string} [payload.tenantSlug]
 * @param {Array}  [payload.categories]
 * @param {number} [payload.perCategory]
 */
export const generateBlogMetaDescriptions = (payload) =>
  api.post('/ai/blog/meta-descriptions', payload);

/**
 * Request blog FAQ suggestions.
 *
 * @param {object} payload
 * @param {string} payload.focusKeyword            - required
 * @param {string} [payload.blogTitle]
 * @param {string} [payload.contentHtml]
 * @param {Array}  [payload.headings]              - [{level, text}]
 * @param {Array}  [payload.tags]
 * @param {Array}  [payload.semanticKeywords]
 * @param {string} [payload.category]
 * @param {Array}  [payload.existingQuestions]
 * @param {string} [payload.targetWebsite]
 * @param {string} [payload.tenantSlug]
 * @param {number} [payload.count]
 * @param {string} [payload.tone]
 */
export const generateBlogFaqs = (payload) =>
  api.post('/ai/blog/faqs', payload);

/**
 * Generate site-wide AI SEO intelligence for a tenant.
 *
 * @param {object} payload
 * @param {string} [payload.targetWebsite]   - ObjectId (preferred)
 * @param {string} [payload.tenantSlug]      - fallback identifier
 * @param {object} [payload.deterministic]   - signals computed client-side
 * @param {number} [payload.sampleSize]
 */
export const generateSiteIntelligence = (payload) =>
  api.post('/ai/seo/site-intelligence', payload);
