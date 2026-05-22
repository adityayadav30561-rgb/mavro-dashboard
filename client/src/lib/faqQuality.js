/**
 * faqQuality — DETERMINISTIC scoring for AI-generated FAQs.
 *
 * The live SEO engine (seoHealth.js + LiveSeoEngine analyzeSchemaReadiness)
 * remains canonical. After Apply, schema readiness + FAQPage JSON-LD
 * regenerate against form state. This module produces a per-FAQ signal
 * bundle the preview panel uses to compare candidates BEFORE insertion.
 *
 * Inputs derive from the project's existing keywordMatch tokenizer — no
 * new normalization is introduced.
 */

import { includesKeyword, normalizeText, tokenize } from './keywordMatch';

const PAA_LEADERS = new Set([
  'what',
  'how',
  'why',
  'can',
  'does',
  'do',
  'is',
  'are',
  'should',
  'when',
  'where',
  'which',
  'who',
  'will',
]);

function bandFromScore(s) {
  if (s >= 85) return 'excellent';
  if (s >= 70) return 'strong';
  if (s >= 55) return 'average';
  if (s >= 35) return 'weak';
  return 'critical';
}

function wordCount(s) {
  return tokenize(s).length;
}

function questionShapeSignal(question) {
  if (!question) return { score: 0, note: 'Empty' };
  let score = 50;
  const notes = [];
  const wc = wordCount(question);
  if (wc >= 6 && wc <= 16) {
    score += 18;
    notes.push(`${wc} words (PAA range)`);
  } else if (wc >= 4 && wc <= 22) {
    score += 8;
    notes.push(`${wc} words`);
  } else {
    notes.push(`${wc} words — atypical`);
    score -= 10;
  }
  const firstToken = (tokenize(question)[0] || '').toLowerCase();
  if (PAA_LEADERS.has(firstToken)) {
    score += 14;
    notes.push('PAA-style opener');
  }
  if (question.trim().endsWith('?')) {
    score += 8;
  } else {
    score -= 18;
    notes.push('Missing "?"');
  }
  score = Math.max(20, Math.min(100, score));
  return { score, note: notes.join(' · ') };
}

function answerShapeSignal(answer) {
  if (!answer) return { score: 0, note: 'Empty' };
  let score = 50;
  const notes = [];
  const wc = wordCount(answer);
  if (wc >= 35 && wc <= 90) {
    score += 22;
    notes.push(`${wc} words (ideal)`);
  } else if (wc >= 20 && wc <= 130) {
    score += 8;
    notes.push(`${wc} words`);
  } else {
    notes.push(`${wc} words — out of band`);
    score -= 14;
  }
  // Sentence shape — 2-4 sentences is ideal for FAQ answers.
  const sentences = answer.match(/[.!?]+(?=\s|$)/g) || [];
  const n = sentences.length;
  if (n >= 2 && n <= 4) {
    score += 10;
    notes.push(`${n} sentences`);
  } else if (n >= 1) {
    notes.push(`${n} sentence${n > 1 ? 's' : ''}`);
  }
  score = Math.max(20, Math.min(100, score));
  return { score, note: notes.join(' · ') };
}

function relevanceSignal(question, answer, focusKeyword, headingsText) {
  let score = 50;
  const notes = [];
  if (focusKeyword) {
    const inQ = includesKeyword(question, focusKeyword);
    const inA = includesKeyword(answer, focusKeyword);
    if (inQ) {
      score += 12;
      notes.push('Keyword in Q');
    }
    if (inA && !inQ) {
      score += 6;
      notes.push('Keyword in A');
    }
    if (!inQ && !inA) {
      score -= 6;
      notes.push('Keyword absent (may still be relevant)');
    }
  }
  // Heading token overlap → semantic alignment with article.
  if (headingsText) {
    const headingTokens = new Set(
      tokenize(headingsText).map((t) => t.toLowerCase()).filter((t) => t.length > 3)
    );
    if (headingTokens.size > 0) {
      const qTokens = tokenize(question).map((t) => t.toLowerCase());
      const overlap = qTokens.filter((t) => headingTokens.has(t)).length;
      if (overlap >= 2) {
        score += 14;
        notes.push(`${overlap} headings overlap`);
      } else if (overlap === 1) {
        score += 6;
        notes.push('1 heading overlap');
      } else {
        notes.push('No heading overlap');
      }
    }
  }
  score = Math.max(20, Math.min(100, score));
  return { score, note: notes.join(' · ') };
}

function coverageSignal(question, existingQuestions = []) {
  if (!existingQuestions.length) {
    return { score: 85, note: 'Fills a new topical slot' };
  }
  const qTokens = new Set(
    tokenize(question).map((t) => t.toLowerCase()).filter((t) => t.length > 3)
  );
  let maxOverlap = 0;
  for (const ex of existingQuestions) {
    const t = new Set(
      tokenize(ex).map((x) => x.toLowerCase()).filter((x) => x.length > 3)
    );
    const overlap = [...qTokens].filter((x) => t.has(x)).length;
    if (overlap > maxOverlap) maxOverlap = overlap;
  }
  if (maxOverlap >= 4) return { score: 40, note: 'High overlap with existing FAQ' };
  if (maxOverlap >= 2) return { score: 70, note: 'Some overlap with existing FAQ' };
  return { score: 90, note: 'Fills a new topical slot' };
}

export function analyzeFaq(item, ctx = {}) {
  const q = String(item?.question || '').trim();
  const a = String(item?.answer || '').trim();
  const focusKeyword = ctx.focusKeyword || '';
  const headingsText = (ctx.headings || []).map((h) => h.text || '').join(' ');

  const qShape = questionShapeSignal(q);
  const aShape = answerShapeSignal(a);
  const relevance = relevanceSignal(q, a, focusKeyword, headingsText);
  const coverage = coverageSignal(q, ctx.existingQuestions || []);

  const overall = Math.round(
    relevance.score * 0.35 +
      coverage.score * 0.25 +
      qShape.score * 0.2 +
      aShape.score * 0.2
  );

  return {
    overall,
    band: bandFromScore(overall),
    relevance,
    coverage,
    questionShape: qShape,
    answerShape: aShape,
  };
}

export function analyzeFaqSet(items, ctx = {}) {
  return (items || []).map((it) => ({ ...it, quality: analyzeFaq(it, ctx) }));
}

export const FAQ_BAND_COLORS = {
  excellent: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  strong: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  average: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  weak: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  critical: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
};

export const INTENT_TONES = {
  informational: 'cyan',
  definition: 'violet',
  comparative: 'emerald',
  operational: 'amber',
  troubleshooting: 'rose',
};

/**
 * Build the canonical FAQ block HTML the existing FAQ detector + FAQPage
 * JSON-LD generator already understand. Mirrors `FaqBlockButton.jsx`
 * output so AI-inserted FAQs are indistinguishable from manually-inserted
 * ones once committed to the editor body.
 *
 *   <p><strong>Q. <question></strong></p>
 *   <p><answer></p>
 *
 * Caller is responsible for concatenating multiple blocks (no separator
 * needed — Quill's whitespace handling adds the gap).
 */
export function faqBlockHtml({ question, answer }) {
  const q = String(question || '').trim();
  const a = String(answer || '').trim();
  if (!q || !a) return '';
  // Strip any leading "Q. " the AI snuck in — the wrapper adds its own.
  const cleanedQ = q.replace(/^(?:q\s*[.:]\s*)+/i, '').trim();
  // Escape minimal HTML in user-visible text. Question + answer are short
  // and don't need full HTML — keep operators away from injection by
  // running them through the editor's existing sanitization on save.
  const esc = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<p><strong>Q. ${esc(cleanedQ)}</strong></p><p>${esc(a)}</p>`;
}

/**
 * If the article has no "Frequently Asked Questions" H2 marker, the FAQ
 * detector's positional-gating rule excludes heuristic items. Inserted
 * AI FAQs use explicit `Q.` prefixes so they count without a marker, but
 * including the marker future-proofs and helps the heuristic detector too.
 *
 * Returns prefix HTML to add ONCE before the first AI FAQ block when the
 * article body has no existing marker.
 */
export function buildFaqSectionMarkerIfNeeded(existingHtml) {
  if (!existingHtml) return '<h2>Frequently Asked Questions</h2>';
  const normalized = normalizeText(existingHtml).toLowerCase();
  if (/frequently\s+asked\s+questions/i.test(normalized)) return '';
  return '<h2>Frequently Asked Questions</h2>';
}
