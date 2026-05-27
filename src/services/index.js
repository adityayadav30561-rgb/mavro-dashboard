const indexingService = require('./indexingService');
const sitemapService = require('./sitemapService');
const pingService = require('./pingService');
const schemaService = require('./schemaService');
const analyticsService = require('./analyticsService');
const anomalyService = require('./anomalyService');
const scheduledPublishService = require('./scheduledPublishService');
const revalidateService = require('./revalidateService');

module.exports = {
  indexingService,
  sitemapService,
  pingService,
  schemaService,
  analyticsService,
  anomalyService,
  scheduledPublishService,
  revalidateService,
};
