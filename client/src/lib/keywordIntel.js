// ===================================
// Keyword Intelligence — semantic SEO analysis
// ===================================
// Replaces the naive top-unigram detector. Produces:
//
//   - primary       : strongest topical phrase (1–3 grams, stopword-filtered)
//   - secondary     : supporting topical phrases
//   - variations    : same-stem variants of the primary term
//   - coverage      : semantic cluster terms surrounding the primary topic
//   - distribution  : presence across title/H1/H2/H3/intro/body/conclusion/meta/slug
//   - optimization  : adaptive band (under / balanced / aggressive / stuffing)
//   - health        : plain-language operational state + message
//   - confidence    : 0–100 derived from frequency + spread + heading hits
//
// Pure functions. No fetches. Tenant scoping is the caller's responsibility.
//
// Inputs:
//   blog: { content (HTML), title, seoTitle, seoDescription, slug, excerpt, tags?, keywords? }
//   focusKeyword: optional operator-set primary; if provided it overrides
//                 detection for primary phrase semantics.

import { normalizeText, normalizeKeyword, includesKeyword, countOccurrences, computeDensity, tokenize as kmTokenize } from './keywordMatch';

// ===================================
// Stopword + junk filters
// ===================================
const STOPWORDS = new Set([
  // articles, prepositions, conjunctions
  'the','a','an','and','or','but','if','then','than','that','this','these','those',
  'is','are','was','were','be','been','being','am','do','does','did','have','has','had',
  'of','in','on','at','to','for','from','with','by','as','into','about','over','under',
  'above','below','up','down','out','off','during','before','after','again','further',
  // pronouns
  'i','you','he','she','it','we','they','them','my','your','our','their','its','his','her',
  'us','him','me',
  // modals + aux
  'can','will','would','should','could','may','might','must','shall',
  // wh + filler
  'what','which','who','how','why','when','where','here','there',
  'not','no','so','too','also','very','just','only','more','most','some','any','all',
  'every','each','either','neither','one','two','three','first','last','next',
  'because','due','via','vs','etc','using','use','used','make','made','get','got','go',
  'going','went','say','said','says','see','seen','seem','seems','look','seems','seemed',
  // editor / paste artifacts (defensive)
  'nbsp','amp','lt','gt','quot','apos','copy','reg',
]);

// Junk character noise that may leak from corrupted paste sources
const JUNK_TOKEN = /^(?:nbsp|amp|lt|gt|quot|x[0-9a-f]+|u[0-9a-f]+|\d+)$/i;

function tokenizeWords(text) {
  // Lowercase, normalized text — tokenize on word-like runs
  return (text.match(/[a-z][a-z'-]{1,}/g) || [])
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !JUNK_TOKEN.test(w));
}

// Build all 1/2/3-gram phrases from a token sequence, skipping any phrase
// that is entirely stopwords (defensive — the tokenizer already filtered).
function buildNGrams(tokens) {
  const out = { uni: new Map(), bi: new Map(), tri: new Map() };
  for (let i = 0; i < tokens.length; i++) {
    const u = tokens[i];
    out.uni.set(u, (out.uni.get(u) || 0) + 1);
    if (i + 1 < tokens.length) {
      const b = `${u} ${tokens[i + 1]}`;
      out.bi.set(b, (out.bi.get(b) || 0) + 1);
    }
    if (i + 2 < tokens.length) {
      const t = `${u} ${tokens[i + 1]} ${tokens[i + 2]}`;
      out.tri.set(t, (out.tri.get(t) || 0) + 1);
    }
  }
  return out;
}

// Lightweight stem to collapse plural/ed/ing/ly/tion variants when judging
// "same stem" variation. Not Porter; pragmatic.
function stemKey(word) {
  return String(word).toLowerCase()
    .replace(/(?:ation|ization|isation|ities|ements|ments|ings|ings?|ings?|ness|ness)$/, '')
    .replace(/(?:ies|ied|ying|ying)$/, 'y')
    .replace(/(?:ed|ing|ly|es|s)$/, '');
}

// ===================================
// HTML segmentation
// ===================================
function extractText(html) {
  // The shared normalizer strips HTML + invisibles + smart punct + entities
  return normalizeText(html, { preservePunctuation: true });
}
function extractHeadings(html) {
  const out = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ level: parseInt(m[1], 10), text: normalizeText(m[2]) });
  }
  return out;
}
function extractParagraphs(html) {
  const broken = String(html || '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n');
  return normalizeText(broken).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

// ===================================
// Primary phrase scoring
// ===================================
// Score each candidate phrase. Higher is more "topic-like".
//   frequency        — more uses = stronger candidate
//   phrase length    — bi/tri beats uni when frequency is similar
//   heading presence — phrase appearing in any heading boosts confidence
//   title presence   — phrase appearing in title/seoTitle boosts further
//   spread           — used across multiple paragraphs (not clumped)
function scorePhrase({ phrase, count, totalTokens, ngramSize, headingHits, titleHits, spread }) {
  const freqWeight    = count;
  const lengthWeight  = ngramSize === 1 ? 1 : ngramSize === 2 ? 2.5 : 3;
  const headingWeight = headingHits > 0 ? 4 : 0;
  const titleWeight   = titleHits   > 0 ? 5 : 0;
  const spreadWeight  = spread; // already 0–8 ish
  const lengthPenalty = phrase.length < 4 ? 0.5 : 1; // discourage 3-char terms
  return (freqWeight * lengthWeight * lengthPenalty) + headingWeight + titleWeight + spreadWeight;
}

function spreadOf(phrase, paragraphs) {
  // Count how many distinct paragraphs contain this phrase. Capped.
  const k = phrase.toLowerCase();
  let n = 0;
  for (const p of paragraphs) if (p.includes(k)) n++;
  return Math.min(8, n);
}

// ===================================
// Public: analyze
// ===================================
export function analyzeKeywordIntel(blog = {}, focusKeyword = '') {
  const html = blog.content || '';
  const bodyText = extractText(html);
  const paragraphs = extractParagraphs(html);
  const headings = extractHeadings(html);
  const headingText = headings.map((h) => h.text).join(' ');

  // Title surfaces (kept separate so we can weight title-hits in scoring)
  const titleSurface = [blog.title, blog.seoTitle, blog.seoDescription]
    .filter(Boolean).map((s) => normalizeText(s)).join(' ');

  const tokens = tokenizeWords(bodyText);
  const totalTokens = tokens.length;

  if (totalTokens < 30) {
    return {
      totalTokens,
      primary: null,
      secondary: [],
      variations: [],
      coverage: [],
      distribution: emptyDistribution(),
      optimization: { state: 'unknown', band: '—', message: 'Add more content to unlock keyword intelligence.' },
      health: { state: 'unknown', message: 'Not enough content yet.' },
      confidence: 0,
    };
  }

  const ngrams = buildNGrams(tokens);

  // Build phrase score table — combine uni/bi/tri into a single ranking
  const candidates = [];
  for (const [phrase, count] of ngrams.tri) {
    if (count < 2) continue;
    candidates.push(buildCandidate(phrase, count, 3, totalTokens, headingText, titleSurface, paragraphs));
  }
  for (const [phrase, count] of ngrams.bi) {
    if (count < 2) continue;
    candidates.push(buildCandidate(phrase, count, 2, totalTokens, headingText, titleSurface, paragraphs));
  }
  for (const [phrase, count] of ngrams.uni) {
    if (count < 3) continue; // unigrams need higher floor
    candidates.push(buildCandidate(phrase, count, 1, totalTokens, headingText, titleSurface, paragraphs));
  }

  // Sort by score
  candidates.sort((a, b) => b.score - a.score);

  // ===== Primary =====
  // If operator supplied a focus keyword, that wins. Otherwise pick the top
  // ranked candidate, preferring longer phrases when scores are close.
  let primary;
  // Shared density helper from keywordMatch ensures the focus keyword card,
  // keyword intelligence card, and SEO scoring all show the same number.
  if (focusKeyword && normalizeKeyword(focusKeyword)) {
    const fk = normalizeKeyword(focusKeyword);
    const { occurrences: occ, density } = computeDensity(html, fk);
    primary = {
      term: fk,
      count: occ,
      density,
      source: 'focus',
      confidence: occ === 0 ? 0 : Math.min(100, 50 + spreadOf(fk, paragraphs) * 6),
    };
  } else if (candidates.length > 0) {
    const top = candidates[0];
    const { occurrences: occ, density } = computeDensity(html, top.phrase);
    primary = {
      term: top.phrase,
      count: occ || top.count,
      density,
      source: 'detected',
      confidence: Math.min(100, Math.round(20 + top.score * 1.2)),
    };
  } else {
    primary = null;
  }

  // ===== Secondary terms =====
  // Top phrases that are NOT the primary and don't fully contain it.
  const primaryTokens = primary ? primary.term.split(/\s+/) : [];
  const secondary = candidates
    .filter((c) => !primary || c.phrase !== primary.term)
    .filter((c) => !primary || !c.phrase.includes(primary.term))
    .filter((c) => !primary || !primaryTokens.every((pt) => c.phrase.split(/\s+/).includes(pt)))
    .slice(0, 6)
    .map((c) => ({ term: c.phrase, count: c.count, confidence: Math.min(100, Math.round(15 + c.score * 1.1)) }));

  // ===== Variations =====
  // Same-stem variants of any primary token
  const variations = primary ? findVariations(primary, ngrams.uni) : [];

  // ===== Semantic coverage =====
  // Top topical chips across uni + bi (de-duped, primary excluded)
  const coverage = buildCoverage(ngrams, primary, secondary);

  // ===== Distribution =====
  const distribution = primary
    ? computeDistribution(primary.term, blog, html, headings, paragraphs)
    : emptyDistribution();

  // ===== Optimization band (adaptive) =====
  const optimization = classifyOptimization({
    density: primary ? primary.density : 0,
    totalTokens,
    distribution,
    variationCount: variations.length,
    headingHits: distribution.headings.total,
  });

  // ===== Health =====
  const health = buildHealth({ primary, optimization, distribution, variations });

  return {
    totalTokens,
    primary,
    secondary,
    variations,
    coverage,
    distribution,
    optimization,
    health,
    confidence: primary?.confidence || 0,
  };
}

function buildCandidate(phrase, count, size, totalTokens, headingText, titleSurface, paragraphs) {
  const headingHits = headingText && headingText.includes(phrase) ? 1 : 0;
  const titleHits   = titleSurface && titleSurface.includes(phrase) ? 1 : 0;
  const spread      = spreadOf(phrase, paragraphs);
  const score = scorePhrase({ phrase, count, totalTokens, ngramSize: size, headingHits, titleHits, spread });
  return { phrase, count, size, score, headingHits, titleHits, spread };
}

function findVariations(primary, uniMap) {
  if (!primary) return [];
  const stems = new Set(primary.term.split(/\s+/).map(stemKey));
  const out = [];
  for (const [tok, count] of uniMap) {
    if (count < 2) continue;
    if (primary.term.split(/\s+/).includes(tok)) continue;
    if (stems.has(stemKey(tok))) out.push({ term: tok, count });
  }
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, 6);
}

function buildCoverage(ngrams, primary, secondary) {
  const blocked = new Set();
  if (primary) blocked.add(primary.term);
  for (const s of secondary) blocked.add(s.term);
  // Take top uni + bi by frequency that are not already in primary/secondary
  const list = [
    ...[...ngrams.uni.entries()].filter(([w, c]) => c >= 2 && w.length > 3),
    ...[...ngrams.bi.entries()].filter(([w, c]) => c >= 2),
  ];
  // Score = frequency × length-weight
  list.sort((a, b) => {
    const aw = a[0].split(' ').length;
    const bw = b[0].split(' ').length;
    return (b[1] * (bw === 1 ? 1 : 2.2)) - (a[1] * (aw === 1 ? 1 : 2.2));
  });
  const out = [];
  for (const [term, count] of list) {
    if (blocked.has(term)) continue;
    // Skip if any block in coverage already contains it as a substring
    if (out.some((o) => o.term.includes(term) || term.includes(o.term))) continue;
    out.push({ term, count });
    if (out.length >= 8) break;
  }
  return out;
}

// ===================================
// Distribution
// ===================================
function emptyDistribution() {
  return {
    title:           false,
    seoTitle:        false,
    seoDescription:  false,
    slug:            false,
    excerpt:         false,
    headings:        { h1: 0, h2: 0, h3: 0, total: 0 },
    sections:        { intro: false, middle: false, conclusion: false },
    spreadScore:     0,
  };
}

function computeDistribution(primaryTerm, blog, html, headings, paragraphs) {
  const kw = primaryTerm;
  const inHeadings = { h1: 0, h2: 0, h3: 0, total: 0 };
  for (const h of headings) {
    if (!includesKeyword(h.text, kw)) continue;
    inHeadings.total++;
    if (h.level === 1) inHeadings.h1++;
    else if (h.level === 2) inHeadings.h2++;
    else if (h.level === 3) inHeadings.h3++;
  }
  const total = paragraphs.length;
  const introCount      = paragraphs.slice(0, Math.max(1, Math.ceil(total * 0.25))).filter((p) => p.includes(kw)).length;
  const middleSlice     = paragraphs.slice(Math.ceil(total * 0.25), Math.ceil(total * 0.75));
  const middleCount     = middleSlice.filter((p) => p.includes(kw)).length;
  const conclusionCount = paragraphs.slice(Math.ceil(total * 0.75)).filter((p) => p.includes(kw)).length;

  const sections = {
    intro:      introCount > 0,
    middle:     middleCount > 0,
    conclusion: conclusionCount > 0,
  };

  const sectionsHit = (sections.intro ? 1 : 0) + (sections.middle ? 1 : 0) + (sections.conclusion ? 1 : 0);
  const headingFactor = Math.min(3, inHeadings.total);
  const spreadScore = Math.round(((sectionsHit / 3) * 60) + (headingFactor / 3) * 40);

  return {
    title:          includesKeyword(blog.title, kw),
    seoTitle:       includesKeyword(blog.seoTitle, kw),
    seoDescription: includesKeyword(blog.seoDescription, kw),
    slug:           includesKeyword(blog.slug, kw),
    excerpt:        includesKeyword(blog.excerpt, kw),
    headings:       inHeadings,
    sections,
    spreadScore,
  };
}

// ===================================
// Adaptive optimization band
// ===================================
// Long articles can sustain higher absolute density; short pieces flag faster.
function classifyOptimization({ density, totalTokens, distribution, variationCount, headingHits }) {
  // Adaptive bands by article length
  let upperOk;     // ceiling for "balanced" range
  let lowerOk;     // floor for "balanced"
  if (totalTokens < 300) {
    lowerOk = 0.8;  upperOk = 2.2;
  } else if (totalTokens < 800) {
    lowerOk = 0.5;  upperOk = 2.5;
  } else if (totalTokens < 2000) {
    lowerOk = 0.4;  upperOk = 3.0;
  } else {
    lowerOk = 0.3;  upperOk = 3.2;
  }

  // Variation reduces effective stuffing risk
  if (variationCount >= 3) upperOk += 0.5;
  if (headingHits >= 2) upperOk += 0.3;

  let state, message;
  if (density === 0) {
    state = 'under';
    message = 'Primary topic does not repeat naturally. Use it 2–4 more times in body + 1 heading.';
  } else if (density < lowerOk) {
    state = 'under';
    message = `Light usage — density ${density.toFixed(2)}% (target ${lowerOk}–${upperOk}%). Reinforce with 1–2 more contextual mentions.`;
  } else if (density <= upperOk) {
    state = 'balanced';
    message = `Density ${density.toFixed(2)}% sits inside the healthy ${lowerOk}–${upperOk}% band for this article length.`;
  } else if (density <= upperOk + 1.5) {
    state = 'aggressive';
    message = `Density ${density.toFixed(2)}% is on the high side (target ≤${upperOk}%). Vary phrasing or trim repetition.`;
  } else {
    state = 'stuffing';
    message = `Density ${density.toFixed(2)}% — keyword stuffing risk. Diversify vocabulary, swap in semantic variants.`;
  }

  return {
    state,
    band: `${lowerOk}–${upperOk}%`,
    message,
    densityValue: density,
  };
}

// ===================================
// Health state — composite signal
// ===================================
function buildHealth({ primary, optimization, distribution, variations }) {
  if (!primary) return { state: 'unknown', message: 'No dominant topic detected yet — write more focused content.' };
  if (optimization.state === 'stuffing') {
    return { state: 'stuffing', message: 'Keyword stuffing risk. Replace some occurrences with synonyms or rephrase.' };
  }
  if (optimization.state === 'aggressive') {
    return { state: 'aggressive', message: 'Repetition is concentrated — consider variation across sections.' };
  }
  if (optimization.state === 'under') {
    return { state: 'under', message: 'Topic is under-emphasized — strengthen presence in body + a heading.' };
  }
  // Balanced — refine by distribution + variation richness
  const sec = distribution.sections;
  if (!sec.intro || !sec.conclusion) {
    return { state: 'balanced-spread', message: 'Density healthy, but distribution skewed. Mention the primary topic in both intro AND conclusion.' };
  }
  if (variations.length === 0) {
    return { state: 'balanced-flat', message: 'Density healthy but vocabulary is rigid. Add 2–3 semantic variants.' };
  }
  return { state: 'balanced', message: 'Keyword usage appears natural, varied, and well distributed.' };
}
