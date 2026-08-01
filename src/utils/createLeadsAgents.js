/**
 * Create (or repair) the lead-capture-only staff accounts.
 *
 * Usage:
 *   npm run create:leads-agents            # create missing accounts, print creds
 *   npm run create:leads-agents -- --reset # also reset passwords for existing ones
 *
 * These accounts carry role `leads_agent`, which can ONLY reach Lead Capture:
 * every other admin router blocks it via blockRoles() in middleware/auth.js and
 * the client hides the rest of the nav. They can read leads and change lead
 * status; they cannot delete or export leads, or touch any other module.
 *
 * Passwords are generated here and printed once. Nothing is stored in the repo.
 */

require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const config = require('../config');
const AdminUser = require('../models/AdminUser');

const AGENTS = [
  { name: 'Bhumika', email: 'bhumika@spanbix.com' },
  { name: 'Naveen', email: 'naveen@spanbix.com' },
  { name: 'Kareena', email: 'kareena@spanbix.com' },
  { name: 'Shikha', email: 'shikha@spanbix.com' },
];

/**
 * Readable but genuinely random password: Name + 6 base32-ish chars + symbol.
 * The AdminUser pre-save hook bcrypts it; the plaintext exists only in the
 * console output of this run.
 */
function generatePassword(name) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 lookalikes
  const bytes = crypto.randomBytes(6);
  const suffix = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return `${name}@${suffix}`;
}

async function run() {
  const reset = process.argv.includes('--reset');
  await mongoose.connect(config.mongo.uri);

  const results = [];
  for (const agent of AGENTS) {
    const existing = await AdminUser.findOne({ email: agent.email });

    if (existing && !reset) {
      results.push({ ...agent, password: '(unchanged — account already existed)', status: 'exists' });
      continue;
    }

    const password = generatePassword(agent.name);

    if (existing) {
      existing.name = agent.name;
      existing.password = password; // pre-save hook hashes it
      existing.role = 'leads_agent';
      existing.isActive = true;
      await existing.save();
      results.push({ ...agent, password, status: 'password reset' });
    } else {
      await AdminUser.create({
        name: agent.name,
        email: agent.email,
        password,
        role: 'leads_agent',
        isActive: true,
      });
      results.push({ ...agent, password, status: 'created' });
    }
  }

  console.log('\n  Lead Capture accounts (role: leads_agent)\n');
  for (const r of results) {
    console.log(`  ${r.name}`);
    console.log(`    email:    ${r.email}`);
    console.log(`    password: ${r.password}`);
    console.log(`    status:   ${r.status}\n`);
  }
  console.log('  These accounts see Lead Capture only. Share each password directly');
  console.log('  with its owner and have them change it after first sign-in.\n');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed to create lead-capture accounts:', err.message);
  process.exit(1);
});
