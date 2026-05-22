/**
 * Mavro Admin — Spanbix Tenant Seeder
 *
 * Creates the Spanbix website tenant in MongoDB with branding + aiContext
 * populated. Idempotent: re-running updates aiContext + branding without
 * overwriting other tenant data. Safe to run on existing installs.
 *
 * Usage:
 *   node src/utils/seedSpanbix.js
 *   npm run seed:spanbix      (if added to package.json scripts)
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const { Website } = require('../models');
const config = require('../config');

const SPANBIX = {
  name: 'Spanbix',
  // Dev domain mirrors the HRMS/Tickets pattern (Website.domain resolver detects localhost*).
  // Flip to spanbix.com at production deploy time without code changes.
  domain: 'localhost:5173/spanbix',
  description:
    'Spanbix is India\'s premier enterprise career learning platform — purpose-built to bridge the gap between commerce, management, and humanities graduates and the country\'s highest-paying SAP and enterprise technology roles. Structured SAP curriculum, institutional campus partnerships, placement-ready training, and certification under one product roof.',
  status: 'active',
  branding: {
    primaryColor: '#102c56',   // deep enterprise navy
    secondaryColor: '#2764e4', // professional accent blue
    fontFamily: 'Sora',
  },
  seoDefaults: {
    title: 'Spanbix — Career Transformation Infrastructure for Enterprise Technologies',
    description:
      'Spanbix trains career-ready SAP and enterprise technology professionals through structured curriculum, mentorship, placement support, and campus partnerships.',
    keywords: [
      'SAP training',
      'SAP careers',
      'enterprise technology training',
      'SAP FICO',
      'SAP MM',
      'SAP SD',
      'SAP ABAP',
      'SAP HCM',
      'SAP BASIS',
      'SAP SuccessFactors',
      'SAP Analytics Cloud',
      'placement program',
      'campus partnership',
      'career transformation',
      'ERP careers',
    ],
  },
  aiContext: {
    audience: 'Commerce, MBA, and non-technical graduates seeking enterprise technology careers',
    industry: 'SAP training, ERP education, enterprise career transformation',
    tone: 'Premium, aspirational, enterprise-professional',
    vocabulary: [
      'SAP consulting',
      'ERP workflows',
      'enterprise systems',
      'career transformation',
      'placements',
      'business operations',
    ],
    avoid: [
      'cheap course language',
      'crypto/startup jargon',
      'overhyped marketing',
    ],
  },
  blogSlugPrefix: 'blog',
};

/**
 * Idempotent upsert of the Spanbix Website tenant.
 *
 * Used in two contexts:
 *   1. CLI seeder (`npm run seed:spanbix`) — connects + disconnects.
 *   2. Auto-bootstrap on backend boot (called from `src/server.js` after the
 *      Mongo connection is already open). Pass `silent: true` to suppress the
 *      CLI-style log noise.
 *
 * Returns the Website doc on success, or null on failure (in silent mode we
 * swallow errors so a misconfigured tenant never blocks server startup).
 */
const upsertSpanbixTenant = async ({ silent = false } = {}) => {
  // `silent` only suppresses the verbose per-field snapshot the CLI prints — it
  // still emits a single status line on success and a clear error trace on
  // failure so a server-boot bootstrap is observable in production logs.
  const verbose = (...args) => { if (!silent) console.log(...args); };

  try {
    const existing = await Website.findOne({
      $or: [{ name: SPANBIX.name }, { slug: 'spanbix' }, { domain: SPANBIX.domain }],
    });

    if (existing) {
      // Content fields (description, aiContext, seoDefaults) always refresh from the
      // seed source so re-running this picks up positioning updates. Branding stays
      // only-if-empty so any admin tweaks in the /websites UI are preserved.
      if (!existing.branding?.primaryColor || existing.branding.primaryColor === '#7c3aed') {
        existing.branding = { ...(existing.branding?.toObject?.() || {}), ...SPANBIX.branding };
      }
      existing.description = SPANBIX.description;
      existing.aiContext = SPANBIX.aiContext;
      existing.seoDefaults = SPANBIX.seoDefaults;
      if (!existing.blogSlugPrefix) existing.blogSlugPrefix = SPANBIX.blogSlugPrefix;

      await existing.save();
      console.log(`✅ [bootstrap] Spanbix tenant refreshed — slug: ${existing.slug}, id: ${existing._id}`);
      verbose('   (existing row matched on name/slug/domain; content fields refreshed)');
      return existing;
    }

    const created = await Website.create(SPANBIX);
    console.log(`✅ [bootstrap] Spanbix tenant created — slug: ${created.slug}, id: ${created._id}`);
    return created;
  } catch (err) {
    // Even in silent mode, log the error loudly. Silent bootstrap failures are
    // exactly how a missing tenant goes unnoticed in production.
    console.error(`❌ [bootstrap] Spanbix tenant upsert failed — ${err.message}`);
    if (err.errors) {
      for (const [field, e] of Object.entries(err.errors)) {
        console.error(`   ${field}: ${e.message}`);
      }
    }
    if (silent) return null;
    throw err;
  }
};

// Public export so server.js (or any other consumer) can run the upsert
// without spawning a child process.
module.exports = { upsertSpanbixTenant, SPANBIX };

// CLI runner — only fires when this file is invoked directly (e.g.
// `node src/utils/seedSpanbix.js` or `npm run seed:spanbix`).
if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(config.mongo.uri);
      console.log('📦 Connected to MongoDB for Spanbix seeding...\n');

      const tenant = await upsertSpanbixTenant();

      if (tenant) {
        console.log('\n📋 Tenant snapshot:');
        console.log(`   name:        ${tenant.name}`);
        console.log(`   slug:        ${tenant.slug}`);
        console.log(`   domain:      ${tenant.domain}`);
        console.log(`   status:      ${tenant.status}`);
        console.log(`   primary:     ${tenant.branding?.primaryColor}`);
        console.log(`   secondary:   ${tenant.branding?.secondaryColor}`);
        console.log(`   audience:    ${tenant.aiContext?.audience?.slice(0, 80)}…`);
        console.log(`   vocabSize:   ${tenant.aiContext?.vocabulary?.length || 0}`);
      }

      console.log('\n🎉 Spanbix seeding complete.');
      console.log('Next: load /spanbix in the frontend or visit /websites in the admin.');
      process.exit(0);
    } catch (error) {
      console.error('❌ Spanbix seeding failed:', error.message);
      process.exit(1);
    }
  })();
}
