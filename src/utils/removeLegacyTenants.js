/**
 * One-shot removal of the retired Mavro demo tenants (July 2026).
 *
 * Cascade-deletes the Website rows for mavro-hrms + mavro-ticket-management
 * (and any leftover Fleet/Inventory/Transport rows) along with every
 * dependent Blog, Lead, and AnalyticsEvent — the same cascade contract as
 * DELETE /api/websites/:id.
 *
 * Usage:
 *   node src/utils/removeLegacyTenants.js            → dry run (prints counts)
 *   node src/utils/removeLegacyTenants.js --apply    → actually deletes
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const { Website, Blog, Lead } = require('../models');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const config = require('../config');

const LEGACY_SLUGS = [
  'mavro-hrms',
  'mavro-ticket-management',
  'mavro-fleet-management',
  'mavro-inventory-management',
  'mavro-transport-management',
];

(async () => {
  const apply = process.argv.includes('--apply');
  try {
    await mongoose.connect(config.mongo.uri);
    console.log(`📦 Connected. Mode: ${apply ? 'APPLY' : 'DRY RUN'}\n`);

    const tenants = await Website.find({ slug: { $in: LEGACY_SLUGS } }).lean();
    if (!tenants.length) {
      console.log('✅ No legacy tenant rows found — nothing to do.');
      process.exit(0);
    }

    for (const t of tenants) {
      const [blogs, leads, events] = await Promise.all([
        Blog.countDocuments({ targetWebsite: t._id }),
        Lead.countDocuments({ website: t._id }),
        AnalyticsEvent.countDocuments({ websiteSlug: t.slug }),
      ]);
      console.log(`— ${t.name} (${t.slug})`);
      console.log(`    blogs: ${blogs} · leads: ${leads} · analyticsEvents: ${events}`);

      if (apply) {
        const [db, dl, de] = await Promise.all([
          Blog.deleteMany({ targetWebsite: t._id }),
          Lead.deleteMany({ website: t._id }),
          AnalyticsEvent.deleteMany({ websiteSlug: t.slug }),
        ]);
        await Website.findByIdAndDelete(t._id);
        console.log(`    ✅ deleted (blogs: ${db.deletedCount}, leads: ${dl.deletedCount}, events: ${de.deletedCount})`);
      }
    }

    if (!apply) console.log('\nRe-run with --apply to delete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
})();
