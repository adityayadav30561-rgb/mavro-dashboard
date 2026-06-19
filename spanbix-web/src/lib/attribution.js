'use client';

// ───────────────────────────────────────────────────────────────────────────
// Ad attribution capture (gclid / UTM).
// ───────────────────────────────────────────────────────────────────────────
// Why: a lead is only useful to Google Ads if we know which click produced it.
// `gclid` (Google Click ID) is what lets you later import "this lead actually
// enrolled" back into Ads as an offline conversion and optimise for QUALITY,
// not just form fills. UTM params tell you the campaign/keyword in the dashboard.
//
// How: capture on first page load and persist in sessionStorage (FIRST-TOUCH —
// we never overwrite, so the original ad click survives even if the user
// browses to /contact before submitting). Forms merge getAttribution() into
// the lead's customFields, so the admin Leads view shows gclid + utm_* per lead.
//
// Privacy: these are campaign identifiers, not sensitive personal data. They're
// covered by the consent the user gives on the form + the Privacy Policy.

const KEY = 'spanbix_attribution';
const PARAMS = [
  'gclid', 'gbraid', 'wbraid', // Google Ads click ids
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', // Meta, in case of cross-channel
];

export function captureAttribution() {
  if (typeof window === 'undefined') return;
  try {
    const qs = new URLSearchParams(window.location.search);
    const found = {};
    for (const p of PARAMS) {
      const v = qs.get(p);
      if (v) found[p] = v.slice(0, 200);
    }
    if (Object.keys(found).length === 0) return;
    // First-touch: only write if nothing stored yet this session.
    if (!sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, JSON.stringify(found));
    }
  } catch {
    // sessionStorage blocked (private mode) — getAttribution() still falls back
    // to reading the live URL below.
  }
}

export function getAttribution() {
  if (typeof window === 'undefined') return {};
  let obj = {};
  try {
    const stored = sessionStorage.getItem(KEY);
    if (stored) obj = JSON.parse(stored) || {};
  } catch {
    /* ignore */
  }
  // Fallback / top-up from the current URL (covers sessionStorage-blocked case
  // and same-page submits where params are still present).
  try {
    const qs = new URLSearchParams(window.location.search);
    for (const p of PARAMS) {
      const v = qs.get(p);
      if (v && !obj[p]) obj[p] = v.slice(0, 200);
    }
  } catch {
    /* ignore */
  }
  return obj;
}
