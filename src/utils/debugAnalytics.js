// Quick standalone diagnostic — `node src/utils/debugAnalytics.js`
require('dotenv').config();
const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/AnalyticsEvent');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await AnalyticsEvent.countDocuments({});
  const byType = await AnalyticsEvent.aggregate([
    { $group: { _id: '$eventType', count: { $sum: 1 }, last: { $max: '$timestamp' }, first: { $min: '$timestamp' } } },
  ]);
  const recent = await AnalyticsEvent.find({})
    .sort({ timestamp: -1 })
    .limit(8)
    .select('eventType page sessionId timestamp websiteSlug referrer')
    .lean();
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 3600 * 1000);
  const inWindow = await AnalyticsEvent.countDocuments({ timestamp: { $gte: weekAgo, $lte: now } });
  const distinctSlugs = await AnalyticsEvent.distinct('websiteSlug');
  const distinctSessions = await AnalyticsEvent.distinct('sessionId');

  console.log(JSON.stringify({
    total,
    byType,
    inWeekWindow: inWindow,
    distinctSlugs,
    distinctSessionsCount: distinctSessions.length,
    recent,
    serverNowUTC: now.toISOString(),
  }, null, 2));
  process.exit(0);
})();
