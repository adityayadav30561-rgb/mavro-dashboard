/**
 * Backfill `channel` on leads captured before the field existed.
 *
 * This is NOT invention: the public forms have been shipping `gclid` /
 * `fbclid` / `utm_*` inside customFields for months, so the acquisition
 * channel of an old lead is already recorded — it was just never turned into
 * a label. This reads each lead's own stored data and derives the same value
 * submitLead now writes.
 *
 * Dry run by default; pass --apply to write.
 *
 *   npm run backfill:lead-channel            # preview the distribution
 *   npm run backfill:lead-channel -- --apply # write it
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');
const Lead = require('../models/Lead');
const { deriveLeadChannel } = require('./leadChannel');

async function run() {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(config.mongo.uri);

  const leads = await Lead.find({ channel: { $exists: false } })
    .select('customFields utmSource utmMedium referrer name createdAt')
    .lean();

  const counts = {};
  const ops = [];
  for (const lead of leads) {
    const channel = deriveLeadChannel(lead);
    counts[channel] = (counts[channel] || 0) + 1;
    ops.push({ updateOne: { filter: { _id: lead._id }, update: { $set: { channel } } } });
  }

  console.log(`\n  ${leads.length} lead(s) without a channel\n`);
  for (const [channel, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(4)}  ${channel}`);
  }

  if (!apply) {
    console.log('\n  Dry run — nothing written. Re-run with --apply to save.\n');
  } else if (ops.length) {
    const res = await Lead.bulkWrite(ops);
    console.log(`\n  Updated ${res.modifiedCount} lead(s).\n`);
  } else {
    console.log('\n  Nothing to do.\n');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
