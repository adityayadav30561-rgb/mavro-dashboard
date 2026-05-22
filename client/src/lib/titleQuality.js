/**
 * titleQuality — DETERMINISTIC scoring for AI-generated title suggestions.
 *
 * The AI engine never scores its own output. The live SEO engine
 * (seoHealth.js / keywordMatch.js) is the single source of truth for SEO
 * scoring. This module produces a small per-title signal bundle so users
 * can compare options side-by-side BEFORE clicking Apply. After Apply,
 * the existing LiveSeoEngine recalculates the real score against the form.
 *
 * Inputs derive from the project's existing utilities — no new tokenizers.
 * All functions are pure.
 */

import { normalizeText, normalizeKeyword, includesKeyword, tokenize } from './keywordMatch';

const POWER_WORDS = new Set([
  'best',
  'top',
  'proven',
  'essential',
  'complete',
  'modern',
  'real',
  'simple',
  'fast',
  'critical',
  'powerful',
  'strategic',
  'practical',
  'smart',
  'effective',
  'advanced',
]);

const NUMBER_TRIGGERS = /^(\d{1,3})\s+/;
const YEAR_RE = /\b(20\d{2})\b/;
const CURRENT_YEAR = new Date().getUTCFullYear();

function bandFromScore(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'average';
  if (score >= 35) return 'weak';
  return 'critical';
}

function lengthSignal(title) {
  const n = title.length;
  if (n >= 50 && n <= 65) return { score: 100, note: 'Ideal length (50-65 chars)' };
  if (n >= 40 && n <= 70) return { score: 85, note: `${n} chars — within safe range` };
  if (n > 70) return { score: 40, note: `${n} chars — risk of SERP truncation` };
  return { score: 50, note: `${n} chars — too short for ranking` };
}

function keywordSignal(title, focusKeyword) {
  if (!focusKeyword) return { score: 50, note: 'No focus keyword set', position: null };
  if (!includesKeyword(title, focusKeyword)) {
    return { score: 25, note: 'Focus keyword missing', position: null };
  }
  const lt = normalizeText(title).toLowerCase();
  const lk = normalizeKeyword(focusKeyword).toLowerCase();
  const idx = lt.indexOf(lk);
  const ratio = idx >= 0 ? idx / lt.length : 1;
  if (ratio <= 0.25) return { score: 100, note: 'Keyword at start (excellent)', position: 'front' };
  if (ratio <= 0.55) return { score: 85, note: 'Keyword in first half', position: 'middle-front' };
  if (ratio <= 0.8) return { score: 65, note: 'Keyword mid-late position', position: 'middle-back' };
  return { score: 50, note: 'Keyword near end', position: 'back' };
}

function ctrSignal(title) {
  let score = 50;
  const notes = [];
  if (NUMBER_TRIGGERS.test(title)) {
    score += 18;
    notes.push('Leading number');
  } else if (/\b\d{1,3}\b/.test(title)) {
    score += 10;
    notes.push('Contains a number');
  }
  const ym = title.match(YEAR_RE);
  if (ym && Number(ym[1]) >= CURRENT_YEAR - 1) {
    score += 8;
    notes.push('Includes current year');
  }
  const tokens = tokenize(title).map((t) => t.toLowerCase());
  const powerHits = tokens.filter((t) => POWER_WORDS.has(t)).length;
  if (powerHits > 0) {
    score += Math.min(12, powerHits * 6);
    notes.push(`${powerHits} power word${powerHits > 1 ? 's' : ''}`);
  }
  if (/[?:]/.test(title)) {
    score += 6;
    notes.push('Curiosity punctuation');
  }
  if (powerHits === 0 && !NUMBER_TRIGGERS.test(title) && !/[?:]/.test(title)) {
    notes.push('Flat phrasing — consider stronger hook');
  }
  score = Math.max(20, Math.min(100, score));
  return { score, note: notes.join(' · ') || 'Neutral CTR signals' };
}

function readabilitySignal(title) {
  const words = tokenize(title);
  if (words.length === 0) return { score: 0, note: 'Empty' };
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  const longWords = words.filter((w) => w.length >= 10).length;
  let score = 100;
  if (avgWordLen > 7.5) score -= 18;
  if (longWords > 2) score -= 12;
  if (words.length > 14) score -= 10;
  if (words.length < 5) score -= 15;
  score = Math.max(20, Math.min(100, score));
  return { score, note: `${words.length} words · avg ${avgWordLen.toFixed(1)}/word` };
}

/**
 * Aggregate per-title signal bundle used by the suggester UI.
 *
 * @param {string} title
 * @param {string} focusKeyword
 * @returns {{
 *   overall: number,
 *   band: 'excellent'|'strong'|'average'|'weak'|'critical',
 *   length: { score:number, note:string, value:number },
 *   keyword: { score:number, note:string, position:string|null },
 *   ctr: { score:number, note:string },
 *   readability: { score:number, note:string }
 * }}
 */
export function analyzeTitle(title, focusKeyword) {
  const trimmed = String(title || '').trim();
  const len = lengthSignal(trimmed);
  const kw = keywordSignal(trimmed, focusKeyword);
  const ctr = ctrSignal(trimmed);
  const read = readabilitySignal(trimmed);
  // Weighted overall — keyword + length dominate, ctr + readability flavor.
  const overall = Math.round(
    kw.score * 0.4 + len.score * 0.25 + ctr.score * 0.2 + read.score * 0.15
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

export function analyzeTitleSet(titles, focusKeyword) {
  return (titles || []).map((t) => ({
    ...t,
    quality: analyzeTitle(t.title, focusKeyword),
  }));
}

export const CATEGORY_LABELS = {
  seo: 'SEO Optimized',
  ctr: 'High CTR',
  authority: 'Professional',
  listicle: 'Listicle',
  educational: 'Educational',
  problem_solution: 'Problem-Solution',
  beginner: 'Beginner-Friendly',
};

export const CATEGORY_TONES = {
  seo: 'violet',
  ctr: 'amber',
  authority: 'cyan',
  listicle: 'emerald',
  educational: 'sky',
  problem_solution: 'rose',
  beginner: 'fuchsia',
};

export const BAND_COLORS = {
  excellent: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  strong: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  average: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  weak: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  critical: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
};
