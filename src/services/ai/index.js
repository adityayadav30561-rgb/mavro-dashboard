/**
 * Barrel — every AI consumer imports through here so that swapping the
 * orchestrator implementation never touches call sites.
 */
const aiProviderService = require('./AIProviderService');
const aiLogger = require('./aiLogger');
const titleService = require('./titleService');
const metaService = require('./metaService');
const faqService = require('./faqService');
const siteIntelligenceService = require('./siteIntelligenceService');
const { resolveTenantContext } = require('./tenantResolver');

module.exports = {
  aiProviderService,
  aiLogger,
  titleService,
  metaService,
  faqService,
  siteIntelligenceService,
  resolveTenantContext,
};
