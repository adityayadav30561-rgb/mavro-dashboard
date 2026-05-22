/**
 * metaQuality — DETERMINISTIC scoring for AI-generated meta descriptions.
 *
 * Same contract as titleQuality.js: AI never scores its own output. After
 * Apply, the live SEO engine (seoHealth.js) recalculates the real
 * metadata category score against the form. This module produces a small
 * per-description signal bundle the suggester UI uses to compare options.
 */

import { normalizeText, normalizeKeyword, includesKeyword, tokenize } from './keywordMatch';

const ACTION_VERBS = new Set([
  'learn',
  'discover',
  'compare',
  'evaluate',
  'choose',
  'plan',
  'understand',
  'measure',
  'track',
  'automate',
  'streamline',
  'reduce',
  'improve',
  'boost',
  'monitor',
  'avoid',
  'fix',
  'optimize',
  'scale',
  'build',
]);

function bandFromScore(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'average';
  if (score >= 35) return 'weak';
  return 'critical';
}

function lengthSignal(description) {
  const n = description.length;
  if (n >= 140 && n <= 160) return { score: 100, note: 'Ideal length (140-160)' };
  if (n >= 120 && n <= 170) return { score: 80, note: `${n} chars — within safe range` };
  if (n > 170) return { score: 35, note: `${n} chars — will truncate in SERP` };
  if (n >= 100) return { score: 55, note: `${n} chars — under ideal length` };
  return { score: 30, note: `${n} chars — too short to be useful` };
}

function keywordSignal(description, focusKeyword) {
  if (!focusKeyword) return { score: 50, note: 'No focus keyword set', position: null };
  if (!includesKeyword(description, focusKeyword)) {
    return { score: 20, note: 'Focus keyword missing', position: null };
  }
  const lt = normalizeText(description).toLowerCase();
  const lk = normalizeKeyword(focusKeyword).toLowerCase();
  const idx = lt.indexOf(lk);
  const ratio = idx >= 0 ? idx / lt.length : 1;
  // Count occurrences to detect stuffing
  let count = 0;
  let from = 0;
  while ((from = lt.indexOf(lk, from)) !== -1) {
    count += 1;
    from += lk.length;
  }
  if (count >= 3) {
    return { score: 35, note: `Keyword repeated ${count}× (stuffing)`, position: 'stuffed' };
  }
  if (ratio <= 0.25) return { score: 100, note: 'Keyword early (excellent)', position: 'front' };
  if (ratio <= 0.55) return { score: 85, note: 'Keyword in first half', position: 'middle-front' };
  if (ratio <= 0.8) return { score: 65, note: 'Keyword mid-late', position: 'middle-back' };
  return { score: 50, note: 'Keyword near end', position: 'back' };
}

function ctrSignal(description) {
  let score = 50;
  const notes = [];
  const tokens = tokenize(description).map((t) => t.toLowerCase());
  const verbHits = tokens.filter((t) => ACTION_VERBS.has(t)).length;
  if (verbHits > 0) {
    score += Math.min(18, verbHits * 8);
    notes.push(`${verbHits} action verb${verbHits > 1 ? 's' : ''}`);
  }
  if (/\b\d{1,4}\b/.test(description)) {
    score += 10;
    notes.push('Contains a number');
  }
  if (/[?:]/.test(description)) {
    score += 5;
    notes.push('Curiosity punctuation');
  }
  if (/^(learn|discover|compare|evaluate|choose|understand)/i.test(description)) {
    score += 8;
    notes.push('Action-led opener');
  }
  // Penalize sentence fragments that read like spam.
  if (/\!{2,}/.test(description)) score -= 12;
  if (verbHits === 0 && !/[?:]/.test(description)) {
    notes.push('Flat phrasing — consider stronger hook');
  }
  score = Math.max(20, Math.min(100, score));
  return { score, note: notes.join(' · ') || 'Neutral CTR signals' };
}

function readabilitySignal(description) {
  const words = tokenize(description);
  if (words.length === 0) return { score: 0, note: 'Empty' };
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  const longWords = words.filter((w) => w.length >= 11).length;
  let score = 100;
  if (avgWordLen > 6.5) score -= 14;
  if (longWords > 3) score -= 14;
  if (words.length > 30) score -= 10;
  if (words.length < 16) score -= 10;
  score = Math.max(20, Math.min(100, score));
  return { score, note: `${words.length} words · avg ${avgWordLen.toFixed(1)}/word` };
}

export function analyzeMeta(description, focusKeyword) {
  const trimmed = String(description || '').trim();
  const len = lengthSignal(trimmed);
  const kw = keywordSignal(trimmed, focusKeyword);
  const ctr = ctrSignal(trimmed);
  const read = readabilitySignal(trimmed);
  const overall = Math.round(
    kw.score * 0.35 + len.score * 0.3 + ctr.score * 0.2 + read.score * 0.15
  );
  return {
    overall,
    band: bandFromScore(overall),
    length: { ...len, value: trimmed.length },
    keyword: kw,
    ctr,
    readability: read,
  };
}

export function analyzeMetaSet(items, focusKeyword) {
  return (items || []).map((it) => ({ ...it, quality: analyzeMeta(it.description, focusKeyword) }));
}

export const META_CATEGORY_LABELS = {
  seo: 'SEO Optimized',
  ctr: 'High CTR',
  professional: 'Professional',
  educational: 'Educational',
  commercial: 'Commercial Intent',
  authority: 'Authority Tone',
  beginner: 'Beginner-Friendly',
};

export const META_CATEGORY_TONES = {
  seo: 'violet',
  ctr: 'amber',
  professional: 'cyan',
  educational: 'sky',
  commercial: 'emerald',
  authority: 'fuchsia',
  beginner: 'rose',
};

export const META_BAND_COLORS = {
  excellent: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  strong: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  average: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  weak: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  critical: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
};
