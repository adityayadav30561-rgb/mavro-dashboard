// ===================================
// Keyword Matching — single normalized matcher used everywhere
// ===================================
// One source of truth for "does this haystack contain this keyword?"
//
// Handles common real-world failure modes:
//   - HTML tags (stripped before matching)
//   - NBSP ( ), zero-width spaces, BOM
//   - Smart quotes (“ ” ‘ ’) → regular quotes
//   - Em/en dashes → ASCII hyphen
//   - Hyphens + underscores within the keyword treated as whitespace, so
//     "customer-support" matches "customer support" and vice-versa
//   - Case-insensitive
//   - Word-boundary aware so "art" doesn't match "artist"
//   - Multi-word phrases tolerated with variable whitespace between words
//
// Public API:
//   normalizeText(str)      → cleaned, lowercased, hyphens-as-spaces text
//   normalizeKeyword(str)   → cleaned keyword ready to compare
//   countOccurrences(text, kw)  → integer count using word-boundary regex
//   includesKeyword(text, kw)   → boolean
//   tokenize(text)          → words array for density calc
//
// Multi-tenant safe — pure functions, no fetches, no state.

function stripHtml(s) {
  return String(s || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    // entity decoders for common cases (full decoder is overkill here)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Normalize whitespace + invisible chars + punctuation variants. Optionally
// keep punctuation when called for non-keyword contexts; for keyword
// comparison we replace hyphen-like glyphs with spaces so token boundaries
// match across "customer-support" / "customer support" / "customer_support".
export function normalizeText(s, { preservePunctuation = false } = {}) {
  let t = stripHtml(s);

  // Invisible characters → space
  t = t.replace(/[     ​‌‍﻿]/g, ' ');

  // Smart quotes / dashes → ASCII
  t = t
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/[–—―]/g, '-');

  // For keyword comparison, hyphens / underscores / forward-slashes are
  // separators — keep word boundary semantics intact.
  if (!preservePunctuation) {
    t = t.replace(/[-_\/]+/g, ' ');
  }

  // Collapse whitespace
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return t;
}

export function normalizeKeyword(k) {
  return normalizeText(k).trim();
}

// Escape regex special chars except whitespace (which we'll relax below)
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build a word-boundary regex for the keyword that tolerates variable
// whitespace between words. Single-word keywords get a strict \b boundary
// to prevent partial-word matches ("art" in "artist").
function buildKeywordRegex(kw) {
  const safe = escapeRegex(kw).replace(/\s+/g, '\\s+');
  // Use lookarounds for word boundaries since \b doesn't work for keywords
  // that start/end with punctuation. ASCII word-boundary is fine for our
  // tokenized keyword (no punctuation by the time we reach here).
  return new RegExp(`(?:^|[^a-z0-9])${safe}(?=$|[^a-z0-9])`, 'gi');
}

export function countOccurrences(text, kw) {
  const t = normalizeText(text);
  const k = normalizeKeyword(kw);
  if (!t || !k) return 0;
  const re = buildKeywordRegex(k);
  let count = 0;
  while (re.exec(t) !== null) count++;
  return count;
}

export function includesKeyword(text, kw) {
  const t = normalizeText(text);
  const k = normalizeKeyword(kw);
  if (!t || !k) return false;
  return buildKeywordRegex(k).test(t);
}

// Token list used for density denominator. Matches "real words" only.
export function tokenize(text) {
  const t = normalizeText(text);
  return (t.match(/[a-z0-9][a-z0-9'-]*/gi) || []);
}

// Compute density (% of words taken up by the keyword phrase)
// formula: (occurrences * kwWords) / totalWords * 100
export function computeDensity(text, kw) {
  const tokens = tokenize(text);
  const total = tokens.length;
  if (!total) return { occurrences: 0, density: 0, totalWords: 0 };
  const occurrences = countOccurrences(text, kw);
  const kwWords = normalizeKeyword(kw).split(/\s+/).filter(Boolean).length || 1;
  const density = Math.min(100, (occurrences * kwWords / total) * 100);
  return { occurrences, density: Number(density.toFixed(2)), totalWords: total };
}
