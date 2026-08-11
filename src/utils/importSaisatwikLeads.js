/**
 * Import the historical SaiSatwik leads CRM into the dashboard.
 *
 *   npm run import:saisatwik-leads -- "<path/to/Leads CRM.xlsx>"            # dry run
 *   npm run import:saisatwik-leads -- "<path>" --apply
 *   npm run import:saisatwik-leads -- "<path>" --linkedin data/x.csv --apply
 *
 * All rows land on the SaiSatwik tenant, never Spanbix — the two businesses
 * sell different things and their pipelines are reported separately.
 *
 * Idempotent: a row is matched on (website + email + name), so re-running
 * updates rather than duplicating. The sheet itself contains duplicate rows
 * (the same person submitted twice); those collapse into one lead, which is
 * the correct outcome.
 *
 * SPAM: the sheet carries obvious bot submissions — random-string names and
 * countries, "Test Email" bodies, throwaway addresses. Those are imported but
 * flagged `isSpam` so they stay out of the working list and the counts,
 * rather than being silently dropped (dropping data during an import is how
 * you lose a real lead to an over-eager rule).
 */

require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const config = require('../config');
const Lead = require('../models/Lead');
const Website = require('../models/Website');

const clean = (v) => (v === null || v === undefined ? '' : String(v).trim());

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/**
 * The sheet contains two kinds of broken email cell:
 *   - several addresses in one cell, separated by a newline
 *   - a comma typed where a dot belongs ("alfatherm,in")
 *
 * Returns { email, note }. `note` is non-empty whenever the stored value
 * differs from what was in the sheet, so the original is preserved on the
 * lead rather than quietly rewritten — a corrected address is still a guess
 * until a human confirms it.
 */
function normalizeEmail(raw) {
  const original = clean(raw);
  if (!original) return { email: '', note: '' };

  const candidates = original.split(/[\n\r;,\s]+/).map((t) => t.trim().toLowerCase()).filter((t) => t.includes('@'));
  const valid = candidates.find((c) => EMAIL_RE.test(c));
  if (valid) {
    const extra = candidates.filter((c) => c !== valid);
    return {
      email: valid,
      note: extra.length ? `Other address on the original row: ${extra.join(', ')}` : '',
    };
  }

  // Comma-for-dot before the TLD is the one typo worth repairing, and only
  // when it produces something well-formed.
  const repaired = original.toLowerCase().replace(/,/g, '.');
  if (EMAIL_RE.test(repaired)) {
    return { email: repaired, note: `Email in the sheet read "${original}" — corrected a comma to a dot. Verify before sending.` };
  }

  return { email: '', note: `Unusable email in the sheet: "${original}"` };
}

/** Their "Lead Status" wording → our pipeline enum. */
const STATUS_MAP = {
  'not contacted': 'new',
  contacted: 'contacted',
  'follow up': 'follow_up',
  closed: 'closed',
};

/** Their "Source" / "Form Source" wording → our channel enum. */
function toChannel(source, formSource) {
  const s = `${source} ${formSource}`.toLowerCase();
  if (s.includes('linkedin')) return 'linkedin';
  if (s.includes('call')) return 'manual';
  if (s.includes('google')) return 'google_organic';
  if (s.includes('website') || s.includes('form')) return 'direct';
  return 'manual';
}

function toTemperature(v) {
  const t = clean(v).toLowerCase();
  if (t === 'hot') return 'hot';
  if (t === 'cold') return 'cold';
  return undefined; // blank / N/A / "Closed" — leave unset rather than guess
}

/** Excel serial or text date → Date, or null when unparseable. */
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Heuristics for the bot rows already sitting in the sheet. */
function looksLikeSpam(row) {
  const name = clean(row.Name);
  const country = clean(row.Country);
  const notes = `${clean(row.Notes)} ${clean(row['Additional Notes'])}`;
  const email = clean(row.Email).toLowerCase();
  // 12+ chars of mixed case with no spaces and no vowel runs — keyboard mash.
  const mashed = (s) => s.length >= 12 && !s.includes(' ') && /[A-Z]/.test(s) && /[a-z]/.test(s) && !/\s/.test(s) && (s.match(/[aeiou]/gi) || []).length / s.length < 0.25;
  if (mashed(name) || mashed(country)) return true;
  if (/^test\b|test email/i.test(notes)) return true;
  if (email === 'abc@gmail.com') return true;
  if (/place your website|seo service|rank your site/i.test(notes)) return true;
  return false;
}

async function readExcel(path) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet('All Leads') || wb.worksheets[0];
  const header = [];
  ws.getRow(1).eachCell((cell, col) => { header[col] = clean(cell.value); });

  const rows = [];
  ws.eachRow((row, idx) => {
    if (idx === 1) return;
    const obj = {};
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = header[col];
      if (!key) return;
      let v = cell.value;
      if (v && typeof v === 'object' && v.text) v = v.text;      // rich text
      if (v && typeof v === 'object' && v.result !== undefined) v = v.result; // formula
      obj[key] = v;
    });
    if (clean(obj.Name)) rows.push(obj);
  });
  return rows;
}

function mapExcelRow(row, websiteId) {
  const { email, note: emailNote } = normalizeEmail(row.Email);
  const status = STATUS_MAP[clean(row['Lead Status']).toLowerCase()] || 'new';
  const spam = looksLikeSpam(row);

  return {
    website: websiteId,
    name: clean(row.Name).slice(0, 100),
    // The Lead schema requires an email. Rows without one get a placeholder
    // on an unroutable domain so the record survives; it is visibly fake
    // rather than a guess at a real address.
    email: email || `no-email+${clean(row['#']) || Math.random().toString(36).slice(2, 8)}@import.invalid`,
    phone: clean(row.Phone).slice(0, 30),
    country: clean(row.Country).slice(0, 80),
    service: clean(row.Service).slice(0, 120),
    l1Category: clean(row['L1 (SAP/MAVRO/Others)']).slice(0, 60),
    l2Category: clean(row['L2(SAP-Imp, HRMS,CRM,ERP)']).slice(0, 60),
    pointOfContact: clean(row['Point of Contact']).slice(0, 80),
    nextAction: clean(row.Action).slice(0, 1000),
    pendingOn: clean(row['Pending on']).slice(0, 500),
    formSource: clean(row['Form Source']).slice(0, 120),
    channel: toChannel(clean(row.Source), clean(row['Form Source'])),
    temperature: toTemperature(row['Hot/Cold']),
    status: spam ? 'spam' : status,
    isSpam: spam,
    leadType: 'corporate',
    // Nobody recorded whether these were emailed — the follow-up engine skips
    // 'unknown' rather than assuming either way.
    mailStatus: 'unknown',
    message: [clean(row.Notes), clean(row['Additional Notes']), emailNote].filter(Boolean).join('\n\n').slice(0, 5000),
    submittedAt: toDate(row.Date) || undefined,
    lastContactedAt: toDate(row['Latest update on']) || undefined,
  };
}

function parseCsv(text) {
  // Minimal RFC4180 parser — the LinkedIn export has quoted commas/newlines.
  const rows = [];
  let cur = [''], q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur[cur.length - 1] += '"'; i += 1; }
      else if (c === '"') q = false;
      else cur[cur.length - 1] += c;
    } else if (c === '"') q = true;
    else if (c === ',') cur.push('');
    else if (c === '\n') { rows.push(cur); cur = ['']; }
    else if (c !== '\r') cur[cur.length - 1] += c;
  }
  if (cur.length > 1 || cur[0]) rows.push(cur);
  const header = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.some((c) => c.trim())).map((r) => {
    const o = {};
    header.forEach((h, i) => { o[h] = (r[i] || '').trim(); });
    return o;
  });
}

function mapLinkedinRow(row, websiteId, i) {
  const { email } = normalizeEmail(row.email);
  return {
    website: websiteId,
    name: clean(row.name).slice(0, 100),
    email: email || `no-email+li${i}@import.invalid`,
    company: clean(row.company).slice(0, 200),
    jobTitle: clean(row.jobTitle).slice(0, 120),
    city: clean(row.city).slice(0, 80),
    leadType: clean(row.leadType) || 'corporate',
    requirement: clean(row.requirement).slice(0, 2000),
    service: clean(row.requirement).slice(0, 120),
    channel: 'linkedin',
    formSource: 'LinkedIn Post',
    sourceUrl: clean(row.sourceUrl).slice(0, 500),
    message: clean(row.notes).slice(0, 5000),
    status: 'new',
    mailStatus: 'not_sent',   // these are new — we know no mail has gone out
    temperature: 'warm',
  };
}

async function run() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const xlsxPath = args.find((a) => a.toLowerCase().endsWith('.xlsx'));
  const liIdx = args.indexOf('--linkedin');
  const csvPath = liIdx >= 0 ? args[liIdx + 1] : null;

  await mongoose.connect(config.mongo.uri);
  const site = await Website.findOne({ slug: 'saisatwik' }).select('_id name').lean();
  if (!site) throw new Error('SaiSatwik website row not found');

  const docs = [];
  if (xlsxPath) {
    const rows = await readExcel(xlsxPath);
    console.log(`\n  ${rows.length} row(s) read from ${xlsxPath}`);
    docs.push(...rows.map((r) => mapExcelRow(r, site._id)));
  }
  if (csvPath) {
    const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    console.log(`  ${rows.length} row(s) read from ${csvPath}`);
    docs.push(...rows.map((r, i) => mapLinkedinRow(r, site._id, i)));
  }

  const spam = docs.filter((d) => d.isSpam).length;
  const byChannel = docs.reduce((a, d) => { a[d.channel] = (a[d.channel] || 0) + 1; return a; }, {});
  const byStatus = docs.reduce((a, d) => { a[d.status] = (a[d.status] || 0) + 1; return a; }, {});
  console.log(`\n  ${docs.length} lead(s) mapped to "${site.name}"`);
  console.log('  flagged as spam:', spam);
  console.log('  by channel:', JSON.stringify(byChannel));
  console.log('  by status: ', JSON.stringify(byStatus));

  if (!apply) {
    console.log('\n  Sample:');
    docs.slice(0, 5).forEach((d) => console.log(`    ${d.name} | ${d.email} | ${d.service || '-'} | ${d.channel}`));
    console.log('\n  Dry run — nothing written. Re-run with --apply.\n');
    await mongoose.disconnect();
    return;
  }

  let created = 0; let updated = 0;
  for (const d of docs) {
    const existing = await Lead.findOne({ website: d.website, email: d.email, name: d.name });
    if (existing) {
      Object.assign(existing, d);
      await existing.save();
      updated += 1;
    } else {
      await Lead.create(d);
      created += 1;
    }
  }
  console.log(`\n  Created ${created}, updated ${updated}.\n`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
