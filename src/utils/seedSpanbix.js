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
const { Website, SeoMetadata } = require('../models');
const config = require('../config');

// Static marketing routes shipped by the Spanbix Next site. Seeded as
// SeoMetadata documents so `sitemapService.generateSitemap` picks them up
// automatically (it lists every SeoMetadata row with `includeInSitemap: true`).
// Without this, the sitemap shrinks to just `/`, `/blog`, and individual
// blog posts — fewer than 4 URLs total, well under what Google needs to crawl
// the marketing tree. New marketing pages must be added here.
const SPANBIX_STATIC_PAGES = [
  {
    pagePath: '/about',
    pageType: 'about',
    title: 'About Spanbix — Mission, Faculty, and Placement Philosophy',
    description: 'Why Spanbix exists, who we train, and how we close the gap between commerce graduates and SAP careers.',
    sitemapPriority: 0.8,
    sitemapChangefreq: 'monthly',
  },
  {
    pagePath: '/courses',
    pageType: 'service',
    title: 'SAP Courses — FICO, MM, SD, ABAP | Spanbix',
    description: 'Full Spanbix course catalog. Mentor-led SAP tracks with hands-on sandbox access and placement readiness built in.',
    sitemapPriority: 0.9,
    sitemapChangefreq: 'weekly',
  },
  {
    pagePath: '/career-paths',
    pageType: 'service',
    title: 'SAP Career Paths — FICO, MM, SD, ABAP | Spanbix',
    description: 'Choose your SAP career lane. Functional and technical paths mapped to real hiring demand.',
    sitemapPriority: 0.8,
    sitemapChangefreq: 'monthly',
  },
  {
    pagePath: '/career-paths/fico',
    pageType: 'service',
    title: 'SAP FICO Career Path — Finance & Controlling | Spanbix',
    description: 'Financial accounting, controlling, asset accounting, and treasury in SAP S/4HANA. Highest-paying functional track for commerce graduates.',
    sitemapPriority: 0.9,
    sitemapChangefreq: 'monthly',
  },
  {
    pagePath: '/career-paths/mm',
    pageType: 'service',
    title: 'SAP MM Career Path — Materials Management | Spanbix',
    description: 'Procurement, inventory, vendor evaluation, and supply chain modules in SAP S/4HANA. Industry-aligned curriculum.',
    sitemapPriority: 0.9,
    sitemapChangefreq: 'monthly',
  },
  {
    pagePath: '/career-paths/sd',
    pageType: 'service',
    title: 'SAP SD Career Path — Sales & Distribution | Spanbix',
    description: 'Order-to-cash, pricing, billing, and credit management in SAP S/4HANA. Functional career path for commerce + MBA graduates.',
    sitemapPriority: 0.9,
    sitemapChangefreq: 'monthly',
  },
  {
    pagePath: '/career-paths/abap',
    pageType: 'service',
    title: 'SAP ABAP Career Path — Custom Development | Spanbix',
    description: 'ABAP programming, data dictionary, reports, and SAP enhancements. Technical career track for engineering graduates.',
    sitemapPriority: 0.9,
    sitemapChangefreq: 'monthly',
  },
  {
    pagePath: '/career-paths/ai',
    pageType: 'service',
    title: 'AI Mastery Course — Practical AI for Work & Creation | Spanbix',
    description: 'Master how to use AI effectively — prompt engineering, AI image and video generation, content automation, and building real apps with AI. No coding required.',
    sitemapPriority: 0.9,
    sitemapChangefreq: 'monthly',
  },
  {
    pagePath: '/campus-programs',
    pageType: 'landing',
    title: 'Campus Programs — Institutional Partnerships | Spanbix',
    description: 'Partner with Spanbix to bring SAP placement readiness to your campus. Industry-aligned curriculum and mentor-led delivery.',
    sitemapPriority: 0.7,
    sitemapChangefreq: 'monthly',
  },
  {
    pagePath: '/contact',
    pageType: 'contact',
    title: 'Contact Spanbix — Talk to Us About SAP Careers',
    description: 'Get in touch with Spanbix. Course enquiries, campus partnership conversations, and placement support questions.',
    sitemapPriority: 0.5,
    sitemapChangefreq: 'yearly',
  },
];

const SPANBIX = {
  name: 'Spanbix',
  // Production canonical host. Backend sitemap/robots URL generators
  // (sitemapService.buildBaseUrl) build `https://${domain}/...` from this field,
  // so it MUST match the public site origin. `www.spanbix.com` is the chosen
  // canonical; apex `spanbix.com` 301-redirects to www via spanbix-web's
  // middleware.js — keeping both code, sitemap, and JSON-LD pointed at the
  // same host so search engines see one consistent signal.
  domain: 'www.spanbix.com',
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

      // One-way migration of the historical dev / pre-cutover domains to the
      // canonical production host. The backend sitemap/robots URL generators
      // read this field, so the wrong value silently breaks SEO output.
      // Hand-edited custom domains beyond this set are preserved.
      //
      // Normalize the stored value (strip scheme + trailing slash + lowercase)
      // before comparing — the admin /websites form sometimes saves the domain
      // with a `https://` prefix or trailing `/`, which would otherwise defeat
      // exact-match and leave the migration silently skipped. (Real example
      // observed in prod: stored value `"https://spanbix-web.vercel.app/"`.)
      const LEGACY_DOMAINS = new Set([
        'localhost:5173/spanbix',
        'spanbix-web.vercel.app',
        'spanbix.vercel.app',
        // Pre-www-canonical state (apex was canonical before the cutover-day flip).
        'spanbix.com',
      ]);
      const normalizedDomain = String(existing.domain || '')
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '');
      if (!normalizedDomain || LEGACY_DOMAINS.has(normalizedDomain)) {
        existing.domain = SPANBIX.domain;
      }

      await existing.save();
      console.log(`✅ [bootstrap] Spanbix tenant refreshed — slug: ${existing.slug}, id: ${existing._id}`);
      verbose('   (existing row matched on name/slug/domain; content fields refreshed)');
      await upsertSpanbixStaticPages(existing._id, { silent });
      return existing;
    }

    const created = await Website.create(SPANBIX);
    console.log(`✅ [bootstrap] Spanbix tenant created — slug: ${created.slug}, id: ${created._id}`);
    await upsertSpanbixStaticPages(created._id, { silent });
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

/**
 * Idempotent SeoMetadata upsert for every Spanbix marketing page.
 *
 * Uses `$setOnInsert` so existing rows (admin-tweaked title / description / OG
 * fields) are preserved verbatim — only newly created rows pick up the seed
 * values. The sitemap visibility (`includeInSitemap: true`) is part of the
 * insert payload, so as long as someone hasn't manually toggled it off in the
 * admin UI, the page stays in the sitemap output.
 */
const upsertSpanbixStaticPages = async (websiteId, { silent = false } = {}) => {
  let inserted = 0;
  let existing = 0;

  for (const page of SPANBIX_STATIC_PAGES) {
    try {
      const result = await SeoMetadata.findOneAndUpdate(
        { website: websiteId, pagePath: page.pagePath },
        {
          $setOnInsert: {
            website: websiteId,
            pagePath: page.pagePath,
            pageType: page.pageType,
            title: page.title,
            description: page.description,
            includeInSitemap: true,
            isActive: true,
            robotsIndex: true,
            robotsFollow: true,
            sitemapPriority: page.sitemapPriority,
            sitemapChangefreq: page.sitemapChangefreq,
          },
        },
        { upsert: true, new: false, setDefaultsOnInsert: true }
      );
      if (result === null) inserted += 1;
      else existing += 1;
    } catch (err) {
      console.error(`❌ [bootstrap] SeoMetadata upsert failed for ${page.pagePath} — ${err.message}`);
    }
  }

  console.log(`✅ [bootstrap] Spanbix static pages: ${inserted} created, ${existing} already present (sitemap will list all).`);
  if (!silent && inserted > 0) {
    console.log('   New pages auto-listed in /sitemap/spanbix.xml — submit it to Search Console after the next deploy.');
  }
};

// Public export so server.js (or any other consumer) can run the upsert
// without spawning a child process.
module.exports = { upsertSpanbixTenant, upsertSpanbixStaticPages, SPANBIX, SPANBIX_STATIC_PAGES };

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
