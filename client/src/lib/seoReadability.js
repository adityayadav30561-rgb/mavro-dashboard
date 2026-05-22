// ===================================
// Yoast-style readability engine
// ===================================
// Pure heuristics. No external deps. Operates on raw HTML.
// Returns Flesch Reading Ease + structural metrics + readability warnings.

// Common transition words/phrases (subset of Yoast English list)
const TRANSITION_WORDS = new Set([
  'accordingly','additionally','afterward','afterwards','also','although',
  'as a result','because','before','besides','briefly','but','consequently',
  'conversely','despite','during','earlier','equally','eventually','finally',
  'first','firstly','for example','for instance','further','furthermore',
  'generally','hence','however','if','immediately','in addition','in conclusion',
  'in contrast','in fact','in other words','in particular','in short',
  'in summary','indeed','initially','instead','later','lastly','likewise',
  'meanwhile','moreover','namely','naturally','nevertheless','next','notably',
  'obviously','of course','on the contrary','on the other hand','otherwise',
  'overall','particularly','rather','regardless','second','secondly','similarly',
  'simultaneously','since','soon','specifically','still','subsequently',
  'surprisingly','therefore','thus','to begin','to conclude','to summarize',
  'ultimately','unless','until','when','whereas','while','yet',
]);

// Regex-friendly passive marker — "be" verb + past participle (ending -ed or known irregulars)
const BE_VERBS = '\\b(am|is|are|was|were|be|been|being)\\b';
const PAST_PARTICIPLES_IRREGULAR = [
  'done','gone','seen','taken','given','made','found','known','built','run',
  'said','sent','set','put','let','met','held','told','sold','left','kept',
  'shown','grown','flown','frozen','chosen','broken','spoken','written','stolen',
];
const PASSIVE_RE = new RegExp(`${BE_VERBS}\\s+(\\w+ed|${PAST_PARTICIPLES_IRREGULAR.join('|')})\\b`, 'gi');

// ===================================
// HTML utilities
// ===================================
function stripTags(html = '') {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitParagraphs(html = '') {
  // Robust paragraph segmentation. Treat every block-level boundary as a
  // paragraph break so DOCX imports and Quill output both parse correctly:
  //   - </p> </div> close tags
  //   - block-level openings (<p>, <div>, <h1..h6>, <li>, <blockquote>, <tr>,
  //     <ul>, <ol>, <table>, <pre>, <figure>) when written without close tags
  //   - single OR double <br>
  //   - double newlines (raw text imports)
  const src = String(html || '');
  const broken = src
    // Close-tag boundaries (highest precedence)
    .replace(/<\/(p|div|li|blockquote|tr|pre|figure)>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Open-tag boundaries — covers content authored without close tags
    .replace(/<(p|div|li|blockquote|tr|pre|figure)\b[^>]*>/gi, '\n\n')
    .replace(/<h[1-6]\b[^>]*>/gi, '\n\n')
    // Line break runs
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n');

  return stripTags(broken)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && /[a-z0-9]/i.test(p));
}

export function splitSentences(text = '') {
  // Naive splitter — good enough for averages. Avoid abbreviations heuristically.
  return String(text)
    .replace(/\b(Mr|Mrs|Ms|Dr|St|vs|etc|e\.g|i\.e|Inc|Ltd|Co)\./g, '$1')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function countWords(text = '') {
  return (String(text).match(/\b[\w'-]+\b/g) || []).length;
}

// ===================================
// Syllable counter — heuristic
// ===================================
function syllablesInWord(word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  // Strip silent endings
  let trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  trimmed = trimmed.replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function syllableCount(text) {
  const words = text.match(/\b[\w'-]+\b/g) || [];
  return words.reduce((sum, w) => sum + syllablesInWord(w), 0);
}

// ===================================
// Headings
// ===================================
export function extractHeadings(html = '') {
  const out = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ level: parseInt(m[1], 10), text: stripTags(m[2]) });
  }
  return out;
}

export function extractImages(html = '') {
  const out = [];
  const re = /<img\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const altMatch = attrs.match(/\balt\s*=\s*"([^"]*)"|\balt\s*=\s*'([^']*)'/i);
    out.push({
      alt: altMatch ? (altMatch[1] || altMatch[2] || '').trim() : '',
      hasAlt: !!altMatch,
    });
  }
  return out;
}

export function extractLinks(html = '', siteHost = '') {
  const internal = [];
  const external = [];
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (/^https?:\/\//i.test(href)) {
      try {
        const u = new URL(href);
        if (siteHost && u.hostname.includes(siteHost)) internal.push(href);
        else external.push(href);
      } catch { external.push(href); }
    } else if (href.startsWith('/') || href.startsWith('#')) {
      internal.push(href);
    } else {
      external.push(href);
    }
  }
  return { internal, external };
}

// ===================================
// Core analysis
// ===================================
export function analyzeReadability(html = '') {
  const paragraphs = splitParagraphs(html);
  const text = paragraphs.join('\n\n');
  const sentences = splitSentences(text);
  const totalWords = countWords(text);
  const totalSentences = sentences.length || 1;
  const totalSyllables = syllableCount(text) || 1;

  // Flesch Reading Ease
  const flesch =
    206.835 -
    1.015 * (totalWords / totalSentences) -
    84.6  * (totalSyllables / totalWords || 0);
  const score = Math.max(0, Math.min(100, Math.round(flesch || 0)));

  // Avg sentence + paragraph length
  const avgSentenceWords  = totalSentences ? totalWords / totalSentences : 0;
  const avgParagraphWords = paragraphs.length
    ? totalWords / paragraphs.length
    : 0;

  // Passive voice estimation — count "to be + past participle" hits / total sentences
  const passiveMatches = (text.match(PASSIVE_RE) || []).length;
  const passivePct = totalSentences ? (passiveMatches / totalSentences) * 100 : 0;

  // Transition word usage — % of paragraphs containing at least one
  let paragraphsWithTransition = 0;
  for (const p of paragraphs) {
    const lower = p.toLowerCase();
    for (const t of TRANSITION_WORDS) {
      if (lower.includes(t)) { paragraphsWithTransition++; break; }
    }
  }
  const transitionPct = paragraphs.length
    ? (paragraphsWithTransition / paragraphs.length) * 100
    : 0;

  // Long sentence count (over 25 words)
  const longSentenceCount = sentences.filter((s) => countWords(s) > 25).length;
  const longSentencePct = totalSentences ? (longSentenceCount / totalSentences) * 100 : 0;

  // Long paragraph count (over 150 words)
  const longParagraphCount = paragraphs.filter((p) => countWords(p) > 150).length;

  return {
    flesch: score,
    grade: gradeFromFlesch(score),
    wordCount: totalWords,
    sentenceCount: totalSentences,
    paragraphCount: paragraphs.length,
    avgSentenceWords: Number(avgSentenceWords.toFixed(1)),
    avgParagraphWords: Number(avgParagraphWords.toFixed(1)),
    passivePct: Number(passivePct.toFixed(1)),
    transitionPct: Number(transitionPct.toFixed(1)),
    longSentenceCount,
    longSentencePct: Number(longSentencePct.toFixed(1)),
    longParagraphCount,
  };
}

export function gradeFromFlesch(score) {
  if (score >= 80) return { band: 'easy',            tone: 'emerald' };
  if (score >= 70) return { band: 'fairly easy',     tone: 'emerald' };
  if (score >= 60) return { band: 'standard',        tone: 'cyan' };
  if (score >= 50) return { band: 'fairly difficult',tone: 'amber' };
  if (score >= 30) return { band: 'difficult',       tone: 'amber' };
  return                  { band: 'very difficult',  tone: 'rose' };
}
