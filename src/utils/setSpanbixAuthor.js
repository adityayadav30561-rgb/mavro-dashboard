/**
 * Mavro Admin — Spanbix Blog Author Field Setter
 *
 * One-shot CLI that updates the public-author byline fields on a single
 * AdminUser document. Driven entirely by environment variables so the
 * operator never has to touch MongoDB directly — set the env vars, run the
 * script, and the BlogPosting JSON-LD + blog detail author card on the
 * Spanbix Next site update on the very next request (no redeploy required).
 *
 * Usage:
 *   SPANBIX_AUTHOR_EMAIL=admin@mavro.com \
 *   SPANBIX_AUTHOR_NAME="LalitMohan Parihar" \
 *   SPANBIX_AUTHOR_JOBTITLE="SAP Career Strategist · Spanbix" \
 *   SPANBIX_AUTHOR_BIO="15+ years across SAP MM/SD/FICO implementations…" \
 *   SPANBIX_AUTHOR_AVATAR="https://www.spanbix.com/spanbix/authors/lalit.jpg" \
 *   SPANBIX_AUTHOR_LINKEDIN="https://www.linkedin.com/in/lalitmohan-parihar" \
 *   npm run set:spanbix-author
 *
 * Behaviour:
 *   - Looks up the user by email (defaults to ADMIN_EMAIL → admin@mavro.com).
 *   - Only assigns fields that are explicitly set in env (others stay as-is).
 *   - linkedinUrl is validated by the AdminUser schema — a bad value aborts
 *     the save and prints the validation error.
 *   - Exits 0 on success, 1 on failure. Safe to call from CI / shell hooks.
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const { AdminUser } = require('../models');
const config = require('../config');

const FIELD_MAP = {
  SPANBIX_AUTHOR_NAME: 'name',
  SPANBIX_AUTHOR_JOBTITLE: 'jobTitle',
  SPANBIX_AUTHOR_BIO: 'bio',
  SPANBIX_AUTHOR_AVATAR: 'avatar',
  SPANBIX_AUTHOR_LINKEDIN: 'linkedinUrl',
};

(async () => {
  const email = (process.env.SPANBIX_AUTHOR_EMAIL || process.env.ADMIN_EMAIL || 'admin@mavro.com').toLowerCase();

  // Build the patch from whichever env vars are present. Empty string is a
  // legitimate "clear this field" signal; only `undefined` is skipped.
  const patch = {};
  for (const [envKey, field] of Object.entries(FIELD_MAP)) {
    if (typeof process.env[envKey] === 'string') {
      patch[field] = process.env[envKey].trim();
    }
  }

  if (Object.keys(patch).length === 0) {
    console.error('❌ No SPANBIX_AUTHOR_* env vars set. Nothing to update.');
    console.error('   Expected at least one of:', Object.keys(FIELD_MAP).join(', '));
    process.exit(1);
  }

  try {
    await mongoose.connect(config.mongo.uri);
    console.log(`📦 Connected to MongoDB. Looking up user: ${email}\n`);

    const user = await AdminUser.findOne({ email });
    if (!user) {
      console.error(`❌ No AdminUser found with email "${email}".`);
      console.error('   Set SPANBIX_AUTHOR_EMAIL to the user you want to update.');
      process.exit(1);
    }

    console.log('Before:');
    for (const field of Object.values(FIELD_MAP)) {
      console.log(`   ${field}: ${JSON.stringify(user[field] || '')}`);
    }

    Object.assign(user, patch);
    await user.save();

    console.log('\nAfter:');
    for (const field of Object.values(FIELD_MAP)) {
      console.log(`   ${field}: ${JSON.stringify(user[field] || '')}`);
    }

    console.log('\n🎉 Spanbix author fields updated.');
    console.log('   Republish any blog (or hit /api/revalidate) to refresh the cached page.');
    process.exit(0);
  } catch (err) {
    console.error(`❌ Update failed — ${err.message}`);
    if (err.errors) {
      for (const [field, e] of Object.entries(err.errors)) {
        console.error(`   ${field}: ${e.message}`);
      }
    }
    process.exit(1);
  }
})();
