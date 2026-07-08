/**
 * Mavro Admin — SaiSatwik Tenant Seeder
 *
 * Creates the SaiSatwik Technologies website tenant. SaiSatwik's public site
 * is an external WordPress install (saisatwik.com, Divi theme) — blogs live
 * in WordPress, not the Mavro Blog collection. The `wordpressUrl` field on the
 * Website row gates the WordPress-sourced corpus path in the SEO Engine.
 *
 * Analytics events arrive from a tracking snippet pasted into Divi → Theme
 * Options → Integrations (see saisatwik-tracking-snippet.html at repo root),
 * firing POST /api/analytics/track with websiteSlug 'saisatwik'.
 *
 * Idempotent — same contract as seedSpanbix.js. Safe on every boot.
 *
 * Usage:
 *   node src/utils/seedSaisatwik.js       (CLI)
 *   called from src/server.js on boot     (silent: true)
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const { Website } = require('../models');
const config = require('../config');

const SAISATWIK = {
  // name 'SaiSatwik' → slugify → 'saisatwik'. The slug MUST stay 'saisatwik':
  // the MBR source registry, the WP tracking snippet, and the analytics
  // aggregations all key on it.
  name: 'SaiSatwik',
  domain: 'saisatwik.com',
  description:
    'SaiSatwik Technologies is a B2B IT services company delivering SAP EPPM/PS implementations, technology and process consulting, custom software development, KPO/BPO services, and staff augmentation for mid-market and enterprise clients across India, the Middle East, and Southeast Asia.',
  status: 'active',
  branding: {
    primaryColor: '#0b517c',   // SaiSatwik blue (matches site heading color)
    secondaryColor: '#f97316', // vivid orange accent used across the WP theme
    fontFamily: 'Inter',
  },
  // Blogs live in WordPress — this is the gate the SEO Engine checks.
  wordpressUrl: 'https://saisatwik.com',
  seoDefaults: {
    title: 'SaiSatwik Technologies | Redefining IT for you',
    description:
      'SAP EPPM and PS implementation, IT consulting, custom software development, BPO services, and staff augmentation for enterprises across India, the Middle East, and APAC.',
    keywords: [
      'SAP EPPM',
      'SAP PS',
      'SAP implementation partner',
      'IT consulting',
      'custom software development',
      'BPO services',
      'staff augmentation',
      'digital transformation',
      'enterprise portfolio management',
    ],
  },
  aiContext: {
    audience: 'CTOs, CFOs, PMO heads, and operations leaders at mid-market and enterprise companies evaluating outsourced IT delivery',
    industry: 'B2B IT services — SAP consulting, software development, BPO, staff augmentation',
    tone: 'Direct, operator-savvy, evidence-backed; no marketing fluff',
    vocabulary: [
      'SAP EPPM',
      'SAP PS',
      'portfolio governance',
      'implementation partner',
      'capital projects',
      'staff augmentation',
    ],
    avoid: [
      'seamless',
      'powerful',
      'ecosystem',
      'cutting-edge marketing language',
    ],
  },
  blogSlugPrefix: '', // WordPress posts live at the root: saisatwik.com/<slug>/
};

/**
 * Idempotent upsert of the SaiSatwik Website tenant.
 * Same contract as upsertSpanbixTenant: `silent` suppresses the verbose
 * snapshot only — status (success/failure) ALWAYS prints.
 */
const upsertSaisatwikTenant = async ({ silent = false } = {}) => {
  const verbose = (...args) => { if (!silent) console.log(...args); };

  try {
    const existing = await Website.findOne({
      $or: [{ name: SAISATWIK.name }, { slug: 'saisatwik' }, { domain: SAISATWIK.domain }],
    });

    if (existing) {
      // Content fields always refresh; branding stays only-if-empty/default.
      if (!existing.branding?.primaryColor || existing.branding.primaryColor === '#7c3aed') {
        existing.branding = { ...(existing.branding?.toObject?.() || {}), ...SAISATWIK.branding };
      }
      existing.description = SAISATWIK.description;
      existing.aiContext = SAISATWIK.aiContext;
      existing.seoDefaults = SAISATWIK.seoDefaults;
      existing.wordpressUrl = SAISATWIK.wordpressUrl;
      if (!existing.domain) existing.domain = SAISATWIK.domain;

      await existing.save();
      console.log(`✅ [bootstrap] SaiSatwik tenant refreshed — slug: ${existing.slug}, id: ${existing._id}`);
      verbose('   (existing row matched on name/slug/domain; content fields refreshed)');
      return existing;
    }

    const created = await Website.create(SAISATWIK);
    console.log(`✅ [bootstrap] SaiSatwik tenant created — slug: ${created.slug}, id: ${created._id}`);
    return created;
  } catch (err) {
    console.error(`❌ [bootstrap] SaiSatwik tenant upsert failed — ${err.message}`);
    if (err.errors) {
      for (const [field, e] of Object.entries(err.errors)) {
        console.error(`   ${field}: ${e.message}`);
      }
    }
    if (silent) return null;
    throw err;
  }
};

module.exports = { upsertSaisatwikTenant, SAISATWIK };

// CLI runner
if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(config.mongo.uri);
      console.log('📦 Connected to MongoDB...\n');
      await upsertSaisatwikTenant({ silent: false });
      console.log('\n🎉 Done.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Failed:', err.message);
      process.exit(1);
    }
  })();
}
