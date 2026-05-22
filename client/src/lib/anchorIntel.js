// ===================================
// Anchor Intelligence
// ===================================
// Generates multi-variant anchor proposals for a target blog given the source
// blog draft. Surfaces:
//   - exact phrase matches (target title verbatim found in source body)
//   - partial matches (target signature tokens that already appear in source)
//   - semantic anchors (n-grams from source that contain target keywords)
//   - quality score per anchor (length + specificity + naturalness)
//   - over-optimization warnings (same anchor used many times in source)
//   - duplicate anchor detection (anchor already linking somewhere else)
//
// Pure functions, no React, no fetches.

import { extractHeadings, extractLinks } from './seoReadability';

const ANCHOR_STOP = new Set([
  'the','a','an','and','or','but','if','then','than','that','this','these','those',
  'is','are','was','were','be','been','being','am','do','does','did','have','has','had',
  'of','in','on','at','to','for','from','with','by','as','into','about','over','under',
  'i','you','he','she','it','we','they','them','my','your','our','their','its',
  'not','no','so','too','also','very','just','only','more','most','some','any','all',
  'can','will','would','should','could','may','might','must','here','there',
]);

function stripTags(html = '') {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[  ​‌‍﻿]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\b(Mr|Mrs|Ms|Dr|St|vs|etc|e\.g|i\.e|Inc|Ltd|Co)\./g, '$1')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);
}

function findSentenceContaining(sentences, needleLower) {
  if (!needleLower) return null;
  for (const s of sentences) {
    if (s.toLowerCase().includes(needleLower)) return s;
  }
  return null;
}

function tokenize(text) {
  return (String(text).toLowerCase().match(/\b[a-z][a-z'-]{1,}\b/g) || [])
    .filter((t) => t.length > 2 && !ANCHOR_STOP.has(t));
}

function ngrams(words, n) {
  const out = [];
  for (let i = 0; i + n <= words.length; i++) {
    out.push(words.slice(i, i + n));
  }
  return out;
}

// Anchor signature for the target — title + tags + keywords + h1/h2 text
function targetSignature(target) {
  const parts = [
    target.seoTitle || '',
    target.title || '',
    (target.tags || []).join(' '),
    (target.keywords || []).join(' '),
    extractHeadings(target.content || '').filter((h) => h.level <= 3).map((h) => h.text).join(' '),
  ];
  return tokenize(parts.join(' '));
}

// Score an anchor candidate (0–100)
//   length: 2–6 words ideal
//   specificity: more rare target-tokens = higher score
//   naturalness: penalize if mostly stopwords/short tokens
function scoreAnchor(words, targetTokenSet) {
  if (!words.length) return 0;
  const wordCount = words.length;
  let lengthScore;
  if (wordCount === 1) lengthScore = 30;
  else if (wordCount === 2) lengthScore = 70;
  else if (wordCount <= 4) lengthScore = 95;
  else if (wordCount <= 6) lengthScore = 80;
  else lengthScore = 50;

  const targetHits = words.filter((w) => targetTokenSet.has(w)).length;
  const specificity = Math.min(100, Math.round((targetHits / wordCount) * 100));

  const meaningful = words.filter((w) => !ANCHOR_STOP.has(w) && w.length > 2).length;
  const naturalness = Math.round((meaningful / wordCount) * 100);

  return Math.round(lengthScore * 0.35 + specificity * 0.4 + naturalness * 0.25);
}

function anchorQualityBand(score) {
  if (score >= 80) return { band: 'strong', tone: 'emerald' };
  if (score >= 60) return { band: 'good',   tone: 'cyan' };
  if (score >= 40) return { band: 'fair',   tone: 'amber' };
  return                  { band: 'weak',   tone: 'rose' };
}

// ===================================
// Public: anchor variants
// ===================================
// source: { content, title, ... } — current draft
// target: { title, content, tags, keywords, slug, ... } — candidate blog
// Returns: { exact[], partial[], semantic[], best, warnings }
//
// v2 design — sentence-driven anchors. We scan the source draft for actual
// sentences that mention target-signature tokens, then extract the natural
// noun-phrase substring containing those tokens. This produces anchors that
// always exist verbatim inside a real sentence, so contextual link insertion
// in BlogForm.handleInsertLink succeeds and reads naturally.
export function generateAnchorVariants(source, target) {
  const sourceHtml = source?.content || '';
  const sourcePlain = stripTags(sourceHtml);
  const sourcePlainLower = sourcePlain.toLowerCase();

  const targetTitle = (target?.title || target?.seoTitle || '').trim();
  const targetTokens = new Set(targetSignature(target));

  if (!targetTitle || targetTokens.size === 0) {
    return { exact: [], partial: [], semantic: [], best: null, warnings: [] };
  }

  const targetTitleLower = targetTitle.toLowerCase();
  const sentences = splitSentences(sourcePlain);

  // ===== EXACT =====
  // Full title appears verbatim in source body
  const exact = [];
  if (sourcePlainLower.includes(targetTitleLower)) {
    const words = targetTitle.split(/\s+/).filter(Boolean);
    const score = scoreAnchor(words.map((w) => w.toLowerCase()), targetTokens);
    exact.push({
      text: targetTitle,
      type: 'exact',
      score,
      band: anchorQualityBand(score),
      context: findSentenceContaining(sentences, targetTitleLower),
    });
  }

  // ===== PARTIAL =====
  // Target-title 2–4 grams found verbatim in source as substrings
  const partial = [];
  const titleTokens = tokenize(targetTitle);
  const targetPhrases = new Set();
  for (let n = 4; n >= 2; n--) {
    for (const g of ngrams(titleTokens, n)) targetPhrases.add(g.join(' '));
  }
  for (const phrase of targetPhrases) {
    if (!sourcePlainLower.includes(phrase)) continue;
    if (exact.some((e) => e.text.toLowerCase() === phrase)) continue;
    const words = phrase.split(' ');
    const score = scoreAnchor(words, targetTokens);
    partial.push({
      text: phrase,
      type: 'partial',
      score,
      band: anchorQualityBand(score),
      context: findSentenceContaining(sentences, phrase),
    });
  }

  // ===== SEMANTIC =====
  // Real sentence-derived noun phrases. For each sentence that touches the
  // target topic, extract a 2–5 word substring that:
  //   - Contains ≥1 target-signature token
  //   - Starts AND ends with a content word (not a stopword)
  //   - Contains no stopwords at the boundaries
  //   - Is shorter than 6 words (anchors must be tight)
  const semanticMap = new Map();
  for (const sentence of sentences) {
    const tokens = (sentence.toLowerCase().match(/[a-z][a-z'-]{1,}/g) || []);
    if (tokens.length === 0) continue;
    if (!tokens.some((t) => targetTokens.has(t))) continue;

    for (let n = 5; n >= 2; n--) {
      for (let i = 0; i + n <= tokens.length; i++) {
        const slice = tokens.slice(i, i + n);
        // Edges must be content words
        if (ANCHOR_STOP.has(slice[0]) || ANCHOR_STOP.has(slice[slice.length - 1])) continue;
        // Need at least one target token IN the slice
        const hits = slice.filter((w) => targetTokens.has(w)).length;
        if (hits === 0) continue;
        // Require at least 50% of words to be content (non-stopword)
        const content = slice.filter((w) => !ANCHOR_STOP.has(w) && w.length > 2).length;
        if (content / slice.length < 0.5) continue;
        // Skip overlap with exact/partial
        const key = slice.join(' ');
        if (exact.some((e) => e.text.toLowerCase() === key)) continue;
        if (partial.some((p) => p.text.toLowerCase() === key)) continue;
        // Score & store best instance only
        if (semanticMap.has(key)) continue;
        const score = scoreAnchor(slice, targetTokens);
        semanticMap.set(key, {
          text: key,
          type: 'semantic',
          score,
          band: anchorQualityBand(score),
          context: sentence,
        });
      }
    }
  }
  const semantic = [...semanticMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // ===== Pick best across all =====
  // Prefer semantic + partial over single-token exact, since they sit inside
  // existing sentences and are more natural for inline insertion.
  const all = [...exact, ...partial, ...semantic].sort((a, b) => b.score - a.score);
  const best = all[0] || null;

  // ===== Warnings =====
  const warnings = [];

  // Over-optimization: anchor appears 4+ times in source body
  if (best) {
    const occurrences = countOccurrences(sourcePlain, best.text.toLowerCase());
    if (occurrences >= 4) {
      warnings.push({
        severity: 'warning',
        code: 'anchor_overuse',
        message: `Anchor "${best.text}" appears ${occurrences}× in source — risks over-optimization`,
      });
    }
  }

  // Duplicate: anchor already used for a different href in source
  const existingLinks = extractLinks(sourceHtml).internal;
  const existingAnchors = collectAnchorTexts(sourceHtml);
  if (best && existingAnchors.some((a) => a.text.toLowerCase() === best.text.toLowerCase())) {
    warnings.push({
      severity: 'notice',
      code: 'anchor_duplicate',
      message: `Anchor "${best.text}" already used elsewhere — diversify anchors`,
    });
  }

  return { exact, partial: partial.slice(0, 6), semantic, best, warnings };
}

function countOccurrences(haystack, needle) {
  if (!haystack || !needle) return 0;
  let count = 0, idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

function collectAnchorTexts(html) {
  const re = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ text: stripTags(m[1]) });
  }
  return out;
}

// ===================================
// Public: coverage warnings on the source draft
// ===================================
// Detects:
//   - too few links (long post + <2 internal)
//   - too many links (>1 internal per 100 words)
//   - repeated anchors (same anchor text >=2 times)
//   - imbalanced internal/external ratio
export function analyzeLinkCoverage(blog) {
  const html = blog?.content || '';
  const plain = stripTags(html);
  const wc = (plain.match(/\b[\w'-]+\b/g) || []).length;
  const { internal, external } = extractLinks(html);
  const anchors = collectAnchorTexts(html);

  const warnings = [];

  if (wc > 600 && internal.length < 2) {
    warnings.push({
      severity: 'warning',
      code: 'too_few_internal_links',
      message: `${wc}-word post has only ${internal.length} internal link — add 2–4 contextual links`,
    });
  }

  if (wc > 0 && internal.length > 0) {
    const per100 = internal.length / (wc / 100);
    if (per100 > 1.2) {
      warnings.push({
        severity: 'warning',
        code: 'too_many_internal_links',
        message: `Link density ${per100.toFixed(1)}/100 words — risks link dilution`,
      });
    }
  }

  // Repeated anchors
  const freq = new Map();
  for (const a of anchors) {
    const key = (a.text || '').toLowerCase().trim();
    if (!key) continue;
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  const repeats = [...freq.entries()].filter(([, c]) => c >= 2);
  if (repeats.length) {
    const [worstAnchor, worstCount] = repeats.sort((a, b) => b[1] - a[1])[0];
    warnings.push({
      severity: 'notice',
      code: 'repeated_anchors',
      message: `Anchor "${worstAnchor}" used ${worstCount}× — vary anchor text`,
    });
  }

  // Internal/external balance
  if (wc > 800 && external.length === 0) {
    warnings.push({
      severity: 'notice',
      code: 'no_external',
      message: 'No outbound authoritative links — cite 1–2 sources',
    });
  }

  return {
    wordCount: wc,
    internalCount: internal.length,
    externalCount: external.length,
    anchorRepeats: repeats.map(([text, count]) => ({ text, count })),
    warnings,
    density: wc ? Number(((internal.length / wc) * 1000).toFixed(2)) : 0, // per 1000 words
  };
}
