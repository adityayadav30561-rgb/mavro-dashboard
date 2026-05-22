// ===================================
// Live SEO Engine for Blog Editor (v1)
// ===================================
// Wraps the canonical `seoHealth.auditBlog()` engine with editor-specific
// concerns: focus-keyword placement analysis, task-based checklist generation,
// and 5-sub-score derivation for the live writing cockpit.
//
// IMPORTANT — does NOT replace seoHealth.js. The engine remains the source of
// truth for category scores. This module only:
//   1. Constructs an audit-ready blog shape from editor form state
//   2. Adds focus-keyword placement matrix (not in core engine)
//   3. Derives 4 sub-scores (readability, content depth, structure, metadata)
//   4. Produces task-based checklist items with completion state

import { auditBlog, interpretation, gradeLetter } from '@/lib/seoHealth';
import {
  analyzeReadability,
  extractHeadings,
  extractImages,
  extractLinks,
  splitParagraphs,
  countWords,
} from '@/lib/seoReadability';
import { analyzeInternalLinks, resolveTenantSitePath } from './InternalLinkEngine';
import {
  normalizeKeyword,
  includesKeyword,
  computeDensity,
} from '@/lib/keywordMatch';
import { analyzeKeywordIntel } from '@/lib/keywordIntel';

// ===================================
// Build audit-ready blog from editor form state
// ===================================
export function buildBlogFromForm(form) {
  return {
    title: form.title || '',
    slug: form.slug || slugifyClient(form.title || ''),
    content: form.content || '',
    excerpt: form.excerpt || '',
    seoTitle: form.seoTitle || '',
    seoDescription: form.seoDescription || '',
    canonicalUrl: form.canonicalUrl || '',
    featuredImage: form.featuredImage || '',
    ogImage: form.ogImage || form.featuredImage || '',
    tags: csvToArray(form.tags),
    keywords: csvToArray(form.keywords),
    category: form.category || '',
    status: form.status || 'draft',
    publishedAt: form.publishedAt || (form.status === 'published' ? new Date().toISOString() : null),
    updatedAt: new Date().toISOString(),
  };
}

function csvToArray(str) {
  if (Array.isArray(str)) return str;
  if (!str) return [];
  return String(str).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function slugifyClient(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ===================================
// Focus-keyword placement matrix
// ===================================
// Returns: occurrence + placement breakdown + density + optimization signal.
export function analyzeFocusKeyword(focusKeyword, blog) {
  const kw = normalizeKeyword(focusKeyword || '');
  if (!kw) {
    return {
      keyword: '',
      density: 0,
      occurrences: 0,
      placements: {},
      densityBand: 'unknown',
      issues: [],
      score: 0,
    };
  }

  const html = blog.content || '';
  // Unified normalized matcher — handles NBSP, smart quotes, em/en dashes,
  // hyphens/underscores between words, and HTML stripping in one place.
  const { occurrences, density } = computeDensity(html, kw);

  // Placement matrix — every check uses the same matcher so headings/title/
  // slug/meta all stay in sync.
  const headings = extractHeadings(html);
  const firstParagraph = splitParagraphs(html)[0] || '';
  const placements = {
    title:            includesKeyword(blog.title, kw),
    titleStart:       startsWithKeyword(blog.title, kw, 5),
    seoTitle:         includesKeyword(blog.seoTitle, kw),
    seoDescription:   includesKeyword(blog.seoDescription, kw),
    slug:             includesKeyword(blog.slug, kw),
    excerpt:          includesKeyword(blog.excerpt, kw),
    firstParagraph:   includesKeyword(firstParagraph, kw),
    h1:               headings.filter((h) => h.level === 1).some((h) => includesKeyword(h.text, kw)),
    h2:               headings.filter((h) => h.level === 2).some((h) => includesKeyword(h.text, kw)),
    anyHeading:       headings.some((h) => includesKeyword(h.text, kw)),
  };

  // Density band
  let densityBand;
  if (occurrences === 0)        densityBand = 'missing';
  else if (density < 0.5)       densityBand = 'sparse';
  else if (density <= 2.5)      densityBand = 'optimal';
  else if (density <= 3.5)      densityBand = 'high';
  else                          densityBand = 'stuffing';

  // Issue + score derivation
  const issues = [];
  if (densityBand === 'missing') issues.push({ severity: 'critical', message: `Focus keyword "${kw}" not found in content` });
  if (densityBand === 'sparse')  issues.push({ severity: 'warning',  message: `Focus keyword used only ${occurrences}× — density ${density.toFixed(2)}%` });
  if (densityBand === 'high')    issues.push({ severity: 'warning',  message: `Keyword density ${density.toFixed(2)}% — borderline stuffing` });
  if (densityBand === 'stuffing')issues.push({ severity: 'critical', message: `Keyword stuffing — density ${density.toFixed(2)}%` });
  if (!placements.title)         issues.push({ severity: 'warning',  message: 'Focus keyword missing from title' });
  if (!placements.firstParagraph)issues.push({ severity: 'warning',  message: 'Focus keyword missing from first paragraph' });
  if (!placements.anyHeading)    issues.push({ severity: 'notice',   message: 'Focus keyword absent from headings' });

  // Score (0–100) — 8 placement signals worth 75, density band worth 25
  const placementWeight = 75;
  const placementSlots = ['title', 'seoTitle', 'seoDescription', 'slug', 'excerpt', 'firstParagraph', 'anyHeading', 'titleStart'];
  const placementScore = (placementSlots.filter((s) => placements[s]).length / placementSlots.length) * placementWeight;
  const densityScore =
    densityBand === 'optimal' ? 25 :
    densityBand === 'sparse'  ? 12 :
    densityBand === 'high'    ? 12 :
    densityBand === 'stuffing'?  4 :
    /* missing */                0;
  const score = Math.round(placementScore + densityScore);

  return { keyword: kw, density, occurrences, placements, densityBand, issues, score };
}

// Helper: keyword appears within first N words of haystack
function startsWithKeyword(haystack, kw, maxLeadingWords = 5) {
  if (!haystack) return false;
  const text = normalizeKeyword(haystack);
  const k = normalizeKeyword(kw);
  if (!text || !k) return false;
  const idx = text.indexOf(k);
  if (idx === -1) return false;
  const leadingWords = text.slice(0, idx).split(/\s+/).filter(Boolean).length;
  return leadingWords <= maxLeadingWords;
}

function stripTags(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function includesPhrase(haystack, phrase) {
  if (!haystack || !phrase) return false;
  return String(haystack).toLowerCase().includes(phrase);
}

function startsWithPhrase(haystack, phrase, maxLeadingWords = 5) {
  if (!haystack) return false;
  const lower = String(haystack).toLowerCase();
  const idx = lower.indexOf(phrase);
  if (idx === -1) return false;
  const leadingWords = lower.slice(0, idx).split(/\s+/).filter(Boolean).length;
  return leadingWords <= maxLeadingWords;
}

function countPhraseOccurrences(text, phrase) {
  if (!text || !phrase) return 0;
  let count = 0;
  let idx = text.indexOf(phrase);
  while (idx !== -1) {
    count++;
    idx = text.indexOf(phrase, idx + phrase.length);
  }
  return count;
}

// ===================================
// Sub-score derivation
// ===================================
// Build 5 surfaces shown in the live cockpit. All derive from the audit result.
export function deriveSubScores(audit, focusKw, readability) {
  // Structure score = subset of content category focused on headings + sections + lists
  const html = audit.blog.content || '';
  const headings = extractHeadings(html);
  const h2 = headings.filter((h) => h.level === 2).length;
  const wc = readability.wordCount;
  const ulCount = (html.match(/<ul[\s>]/gi) || []).length;
  const olCount = (html.match(/<ol[\s>]/gi) || []).length;
  const formatHits = (html.match(/<(strong|b|em|i|code|blockquote)[\s>]/gi) || []).length;

  let structurePenalty = 0;
  if (h2 === 0 && wc > 200) structurePenalty += 20;
  else if (h2 < 3 && wc > 1000) structurePenalty += 12;
  if (readability.paragraphCount <= 1 && wc > 80) structurePenalty += 15;
  if ((ulCount + olCount) === 0 && wc > 600) structurePenalty += 8;
  if (formatHits === 0 && wc > 400) structurePenalty += 6;
  const structureScore = Math.max(0, 100 - structurePenalty);

  return {
    overall:    audit.overall,
    readability: readability.flesch,
    contentDepth: audit.byCategory.content.score,
    structure:    structureScore,
    metadata:     audit.byCategory.metadata.score,
    focus:        focusKw.score,
  };
}

// ===================================
// Task-based checklist
// ===================================
// Each task: { id, label, done, importance: 'high'|'medium'|'low', category }
export function buildChecklist(form, blog, audit, focusKw, readability) {
  const html = blog.content || '';
  const headings = extractHeadings(html);
  const h2Count = headings.filter((h) => h.level === 2).length;
  const h3Count = headings.filter((h) => h.level === 3).length;
  const images = extractImages(html);
  const imagesWithAlt = images.filter((i) => i.alt).length;
  const { internal, external } = extractLinks(html);
  const wc = readability.wordCount;
  const titleLen = (form.seoTitle || '').length;
  const descLen = (form.seoDescription || '').length;
  const kw = (focusKw.keyword || '').trim();

  const items = [
    // Word count + structure
    task('min-words-300',  'Reach minimum 300 words', wc >= 300, 'high', 'content'),
    task('min-words-1200', 'Hit 1200+ words for depth', wc >= 1200, 'medium', 'content'),
    task('h2-3+',          'Add at least 3 H2 sections', h2Count >= 3, 'high', 'structure'),
    task('h3-present',     'Include H3 sub-headings', h3Count >= 1, 'low', 'structure'),
    task('paragraphs',     'Multiple paragraphs', readability.paragraphCount >= 4, 'medium', 'structure'),

    // Metadata
    task('seo-title',      'Set an SEO title', !!form.seoTitle?.trim(), 'high', 'metadata'),
    task('seo-title-len',  'SEO title 50–60 chars', titleLen >= 50 && titleLen <= 60, 'medium', 'metadata'),
    task('seo-desc',       'Set a meta description', !!form.seoDescription?.trim(), 'high', 'metadata'),
    task('seo-desc-len',   'Meta description 140–160 chars', descLen >= 140 && descLen <= 160, 'medium', 'metadata'),
    task('excerpt',        'Write a compelling excerpt', !!form.excerpt?.trim(), 'medium', 'metadata'),
    task('canonical',      'Set canonical URL', !!form.canonicalUrl?.trim(), 'low', 'metadata'),

    // Media
    task('featured-image', 'Set featured image', !!form.featuredImage?.trim(), 'high', 'media'),
    task('inline-images',  'Add at least 2 inline images', images.length >= 2, 'medium', 'media'),
    task('alt-text',       'All images have alt text', images.length > 0 && imagesWithAlt === images.length, 'high', 'media'),

    // Links
    task('internal-link',  'Add at least 1 internal link', internal.length >= 1, 'medium', 'links'),
    task('external-link',  'Cite 1+ authoritative source', external.length >= 1, 'low', 'links'),

    // Readability
    task('flesch-60',      'Reading ease ≥ 60', readability.flesch >= 60, 'medium', 'readability'),
    task('sentence-len',   'Avg sentence ≤ 20 words', readability.avgSentenceWords > 0 && readability.avgSentenceWords <= 20, 'medium', 'readability'),
    task('passive-low',    'Passive voice < 25%', readability.passivePct < 25, 'low', 'readability'),
    task('transitions',    'Use transitions in 30%+ paragraphs', readability.transitionPct >= 30, 'low', 'readability'),
  ];

  if (kw) {
    items.push(
      task('kw-title',       `Use "${kw}" in title`, focusKw.placements.title, 'high', 'focus'),
      task('kw-title-start', `Place "${kw}" near start of title`, focusKw.placements.titleStart, 'low', 'focus'),
      task('kw-meta-title',  `Use "${kw}" in SEO title`, focusKw.placements.seoTitle, 'high', 'focus'),
      task('kw-meta-desc',   `Use "${kw}" in meta description`, focusKw.placements.seoDescription, 'high', 'focus'),
      task('kw-slug',        `Include "${kw}" in slug`, focusKw.placements.slug, 'medium', 'focus'),
      task('kw-first-para',  `Use "${kw}" in first paragraph`, focusKw.placements.firstParagraph, 'high', 'focus'),
      task('kw-heading',     `Use "${kw}" in at least one heading`, focusKw.placements.anyHeading, 'medium', 'focus'),
      task('kw-density',     `Keyword density 0.5–2.5% (currently ${focusKw.density}%)`, focusKw.densityBand === 'optimal', 'high', 'focus'),
    );
  }

  return items;
}

function task(id, label, done, importance, category) {
  return { id, label, done: !!done, importance, category };
}

// ===================================
// Keyword Intelligence — primary + secondary + semantic variations
// ===================================
// Pure n-gram extraction. No external dependencies. Builds:
//   - primary: top single-token term by freq (after stopword filtering)
//   - secondary: top 2–4 word phrases (non-overlapping)
//   - variations: stem-cluster matches of primary token
//   - optimization: under/over/optimal banner based on primary density
//
// Activates only when wordCount >= 50 (signal noise too high below).
const KW_STOP = new Set([
  'the','a','an','and','or','but','if','then','than','that','this','these','those',
  'is','are','was','were','be','been','being','am','do','does','did','have','has','had',
  'of','in','on','at','to','for','from','with','by','as','into','about','over','under',
  'i','you','he','she','it','we','they','them','my','your','our','their','its',
  'not','no','so','too','also','very','just','only','more','most','some','any','all',
  'can','will','would','should','could','may','might','must','here','there',
  'what','which','who','how','why','when','where','use','using','used','make','made',
]);

function tokensFrom(text) {
  return (String(text).toLowerCase().match(/\b[a-z][a-z'-]{1,}\b/g) || [])
    .filter((t) => t.length > 2 && !KW_STOP.has(t));
}

function ngrams(tokens, n) {
  const out = [];
  for (let i = 0; i + n <= tokens.length; i++) {
    out.push(tokens.slice(i, i + n).join(' '));
  }
  return out;
}

function stemKey(word) {
  // Very-light stem: strip common English suffixes. Heuristic, not Porter.
  return String(word)
    .replace(/(ing|edly|ed|es|s|ly|tion|ment|ness|able|ible)$/i, '')
    .toLowerCase();
}

// Delegated to the dedicated keywordIntel engine. Operator-set focus keyword
// is passed through so detection prefers their stated topic when available.
export function analyzeKeywordIntelligence(blog, focusKeyword = '') {
  return analyzeKeywordIntel(blog, focusKeyword);
}

// ===================================
// Schema Readiness — BlogPosting + FAQ
// ===================================
// Evaluates whether the current draft has the required signals to emit a
// valid BlogPosting JSON-LD on the public site, plus detects FAQ sections
// that would qualify for an FAQPage rich-result block.
export function analyzeSchemaReadiness(form, blog) {
  const headings = extractHeadings(blog.content || '');
  const paragraphs = splitParagraphs(blog.content || '');

  const fields = [
    { key: 'headline',       label: 'Headline',       present: !!(form.title?.trim()),                                          required: true },
    { key: 'description',    label: 'Description',    present: !!((form.seoDescription || form.excerpt || '').trim()),          required: true },
    { key: 'image',          label: 'Image',          present: !!(form.featuredImage?.trim() || form.ogImage?.trim()),          required: true },
    { key: 'datePublished',  label: 'Date published', present: form.status === 'published' || !!form.publishedAt,               required: true },
    { key: 'dateModified',   label: 'Date modified',  present: true,                                                            required: false },
    { key: 'author',         label: 'Author',         present: !!(form.author?.trim() || form.authorName?.trim()),              required: false },
    { key: 'mainEntity',     label: 'Canonical URL',  present: !!(form.canonicalUrl?.trim()),                                   required: false },
    { key: 'keywords',       label: 'Keywords',       present: (form.keywords || '').split(',').filter(Boolean).length >= 1,    required: false },
  ];

  const requiredFields = fields.filter((f) => f.required);
  const requiredPresent = requiredFields.filter((f) => f.present).length;
  const requiredTotal = requiredFields.length;

  // FAQ detection — multi-pattern. Real articles encode FAQs in several
  // ways; the previous H2/H3-only check missed the most common ones.
  const html = blog.content || '';
  const QUESTION_RE = /\?\s*$|^\s*(?:Q\s*[:.\-)]|FAQ\s*[:.\-)]|(?:how|what|why|when|where|which|who|does|do|is|are|can|should|will|should|could|would)\b)/i;
  const seen = new Set();
  const faqItems = [];

  const pushQuestion = (raw, source = 'heuristic', position = -1) => {
    let text = String(raw || '')
      // Decode common HTML entities + invisible whitespace
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[  ​‌‍﻿]/g, ' ')
      // Strip any leftover inline HTML
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Strip leading Q-prefix iteratively so "Q. Q. what is bpo?" collapses
    // to "what is bpo?" rather than leaving a residual prefix that causes
    // duplicate FAQ entries with mismatched keys.
    let prev;
    do {
      prev = text;
      text = text
        .replace(/^\s*(?:Q|question|FAQ)\s*[:.\-)]\s*/i, '')
        .replace(/^\s*(?:Q\s*)?\d+(?:\.\d+)*[.):\-]?\s*/i, '')
        .replace(/^\s*(?:section|step|part|chapter)\s+\d+(?:\.\d+)*[.):\-]?\s*/i, '')
        .trim();
    } while (text !== prev);
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) {
      // Upgrade existing entry to 'explicit' if a stronger pattern matches
      // the same question.
      if (source === 'explicit') {
        const existing = faqItems.find((it) => it.question.toLowerCase() === key);
        if (existing) existing.source = 'explicit';
      }
      return;
    }
    if (text.length < 6 || text.length > 240) return;
    if (!QUESTION_RE.test(text) && !text.endsWith('?')) return;
    seen.add(key);
    faqItems.push({ question: text, source, position });
  };

  // Pattern A: H2/H3/H4 phrased as a question (HEURISTIC — many articles
  // use question headings for normal sections without FAQ intent)
  for (const h of headings) {
    if (h.level < 2 || h.level > 4) continue;
    // Locate heading position in source HTML for FAQ-section gating later
    const re = new RegExp(`<h${h.level}\\b[^>]*>[\\s\\S]*?${escapeForFind(h.text)}[\\s\\S]*?<\\/h${h.level}>`, 'i');
    const found = html.search(re);
    pushQuestion(h.text, 'heuristic', found);
  }
  // Pattern B: <strong>/<b> question paragraph — EXPLICIT
  const boldQuestionRe = /<p[^>]*>\s*<(?:strong|b)[^>]*>([^<]{6,240}?\?)<\/(?:strong|b)>/gi;
  let m;
  while ((m = boldQuestionRe.exec(html)) !== null) pushQuestion(m[1], 'explicit', m.index);
  // Pattern C: paragraphs that are themselves a question (HEURISTIC)
  for (let i = 0; i < paragraphs.length - 1; i++) {
    const p = paragraphs[i].trim();
    if (!p.endsWith('?')) continue;
    if (p.length > 240) continue;
    const next = paragraphs[i + 1] || '';
    if (next.replace(/\s+/g, '').length < 12) continue;
    const found = html.indexOf(p.slice(0, Math.min(40, p.length)));
    pushQuestion(p, 'heuristic', found);
  }
  // Pattern D: "Q:" / "Q." prefix paragraphs — EXPLICIT
  const qPrefixRe = /<p[^>]*>\s*(?:<(?:strong|b)[^>]*>\s*)?Q\s*[:.\-)]\s*([^<]{6,240}?)(?:<\/(?:strong|b)>)?\s*<\/p>/gi;
  while ((m = qPrefixRe.exec(html)) !== null) pushQuestion(m[1], 'explicit', m.index);

  // Pattern E: <li> items containing a question (HEURISTIC)
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  while ((m = liRe.exec(html)) !== null) {
    const liText = String(m[1]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!liText) continue;
    const firstSentence = liText.split(/(?<=\?)\s+/)[0] || liText;
    pushQuestion(firstSentence, 'heuristic', m.index);
  }

  // Pattern F: numbered paragraph FAQs (HEURISTIC — overlaps with normal
  // numbered sections like "2. What Is X?")
  const numberedRe = /<p[^>]*>\s*(?:Q\s*)?\d+(?:\.\d+)*[.):\-]\s*([^<]{6,240}\?)\s*<\/p>/gi;
  while ((m = numberedRe.exec(html)) !== null) pushQuestion(m[1], 'heuristic', m.index);

  // Pattern G: explicit FAQ section marker — also tracks its position so
  // we can gate which heuristic questions are inside the FAQ section vs
  // outside (e.g. normal section headings shaped like questions).
  const FAQ_SECTION_RE = /frequently\s+asked\s+questions|^\s*faqs?\s*$|\bfaq\s+section\b/i;
  let faqSectionDetected = false;
  let faqMarkerPosition = -1;
  for (const h of headings) {
    if (FAQ_SECTION_RE.test(h.text)) {
      faqSectionDetected = true;
      const re = new RegExp(`<h${h.level}\\b[^>]*>[\\s\\S]*?${escapeForFind(h.text)}[\\s\\S]*?<\\/h${h.level}>`, 'i');
      faqMarkerPosition = html.search(re);
      break;
    }
  }
  if (!faqSectionDetected) {
    const sectionStrongRe = /<p[^>]*>\s*<(?:strong|b)[^>]*>([^<]{4,80})<\/(?:strong|b)>\s*<\/p>/gi;
    while ((m = sectionStrongRe.exec(html)) !== null) {
      if (FAQ_SECTION_RE.test(m[1])) {
        faqSectionDetected = true;
        faqMarkerPosition = m.index;
        break;
      }
    }
  }

  // Pair each detected question with the answer paragraph that follows the
  // matching heading inside the body (used for JSON-LD generation).
  const enrichedItems = enrichFaqAnswers(faqItems, headings, paragraphs, html);

  // Distinguish explicit (user-authored FAQ syntax: Q., Q:, bold-Q) from
  // heuristic (any heading/paragraph ending in "?"). Heuristic matches alone
  // are unreliable — section headings like "2. What Is X?" look like
  // questions but aren't FAQ entries. Require either:
  //   - explicit "Frequently Asked Questions" section marker, OR
  //   - ≥2 EXPLICIT entries
  // When neither condition holds, treat heuristic matches as non-FAQ and
  // suppress the FAQ surface to prevent phantom Q&A pairs.
  const explicitCount = enrichedItems.filter((it) => it.source === 'explicit').length;
  const meaningfulFaqs = faqSectionDetected || explicitCount >= 2;

  // Build the reported list:
  //   - Always include explicit-source items (Q., Q:, bold-Q — author intent
  //     is unambiguous)
  //   - Include heuristic-source items ONLY when they appear after the FAQ
  //     section marker in document order. This prevents normal H2/H3 section
  //     headings ("2. What Is BPO Customer Service?") from polluting the
  //     FAQ surface just because they happen to end with "?".
  let reportedItems = [];
  if (meaningfulFaqs) {
    reportedItems = enrichedItems.filter((it) => {
      if (it.source === 'explicit') return true;
      if (!faqSectionDetected) return false;
      if (faqMarkerPosition < 0) return false;
      return typeof it.position === 'number' && it.position > faqMarkerPosition;
    });

    // Final dedupe pass — collapse on a fully-normalized question key so
    // any residual prefix artifacts ("Q. " left behind by earlier-buggy
    // content saved in localStorage drafts) merge into the single canonical
    // entry. Prefer the entry with a non-empty answer when collapsing.
    const finalSeen = new Map();
    for (const it of reportedItems) {
      const k = canonicalQuestionKey(it.question);
      if (!k) continue;
      const existing = finalSeen.get(k);
      if (!existing) {
        finalSeen.set(k, { ...it, question: prettyQuestion(it.question) });
      } else if (it.answer && !existing.answer) {
        // Upgrade to the variant that has an answer attached
        finalSeen.set(k, { ...it, question: existing.question });
      }
    }
    reportedItems = [...finalSeen.values()];
  }

  let overallState = 'missing';
  if (requiredPresent === requiredTotal && reportedItems.length >= 3) overallState = 'ready';
  else if (requiredPresent === requiredTotal) overallState = 'ready';
  else if (requiredPresent >= 2) overallState = 'partial';

  // FAQPage JSON-LD — emit when:
  //   - ≥2 Q&A pairs with non-trivial answers, OR
  //   - explicit FAQ section header + ≥2 questions (answers may be inline
  //     inside the same <li> so length-check on `answer` would miss them)
  const withAnswers = reportedItems.filter((it) => it.answer && it.answer.length >= 20).length;
  const faqQualifies = withAnswers >= 2 || (faqSectionDetected && reportedItems.length >= 2);
  const faqJsonLd = faqQualifies ? buildFaqJsonLd(reportedItems.filter((it) => it.answer)) : null;

  return {
    blogPosting: {
      fields,
      requiredPresent,
      requiredTotal,
      ready: requiredPresent === requiredTotal,
    },
    faq: {
      count: reportedItems.length,
      qualifies: faqQualifies,
      items: reportedItems,
      jsonLd: faqJsonLd,
    },
    overallState,
  };
}

function enrichFaqAnswers(items, headings, paragraphs, html) {
  // Strategy: walk the raw HTML in order, treat any element matching a
  // question (heading or bold-question paragraph) as the question marker
  // and capture the next 1–3 paragraphs as the answer until the next
  // question marker or heading.
  const out = [];
  const cleanedQuestions = new Map(items.map((it) => [it.question.toLowerCase(), it]));
  // Light HTML walker — captures p/headings/li (lists are flattened so each
  // <li> shows up as its own block at the position it appears in the doc).
  const blocks = [];
  // First pass: split top-level blocks p/h1..h6
  const topRe = /<(p|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  // Also collect li blocks in their natural order via a separate scan
  const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  // Merge by scanning the full HTML once with a combined regex
  const combinedRe = /<(p|h[1-6]|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  while ((m = combinedRe.exec(html)) !== null) {
    blocks.push({ tag: m[1].toLowerCase(), html: m[2], text: stripInline(m[2]) });
  }
  let pending = null;
  let answerBuf = [];
  const flush = () => {
    if (!pending) return;
    const key = pending.question.toLowerCase();
    if (cleanedQuestions.has(key)) {
      out.push({ question: pending.question, answer: answerBuf.join(' ').trim() });
    }
    pending = null;
    answerBuf = [];
  };
  for (const b of blocks) {
    // Self-contained <li> with both Q and A inline: split on first "?"
    if (b.tag === 'li' && /\?/.test(b.text)) {
      flush();
      const idx = b.text.indexOf('?');
      const qPart = b.text.slice(0, idx + 1);
      const aPart = b.text.slice(idx + 1).trim();
      const question = normalizeFaqText(qPart);
      if (aPart.length >= 12) {
        // Inline Q + A — emit directly
        const key = question.toLowerCase();
        if (cleanedQuestions.has(key)) {
          out.push({ question, answer: aPart });
        }
        continue;
      }
      // Otherwise treat as a question and capture the following block(s)
      pending = { question };
      continue;
    }
    const looksLikeQuestion = /\?\s*$/.test(b.text) && b.text.length <= 240;
    if (looksLikeQuestion) {
      flush();
      pending = { question: normalizeFaqText(b.text) };
    } else if (pending) {
      if (b.tag.startsWith('h')) {
        // heading interrupts answer
        flush();
      } else {
        answerBuf.push(b.text);
        if (answerBuf.join(' ').length > 1200) flush(); // cap answer length
      }
    }
  }
  flush();
  // Preserve order from original `items` list (we trust the detector's
  // de-duplication). Fall back to enriched output where matched.
  const seen = new Set();
  const finalList = [];
  for (const it of items) {
    const key = it.question.toLowerCase();
    if (seen.has(key)) continue;
    const enriched = out.find((o) => o.question.toLowerCase() === key);
    finalList.push({
      question: it.question,
      answer: enriched?.answer || '',
      source: it.source || 'heuristic',
      position: typeof it.position === 'number' ? it.position : -1,
    });
    seen.add(key);
  }
  return finalList;
}

function stripInline(html) {
  return String(html || '')
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

// Escape a piece of body text for inclusion inside a regex literal.
function escapeForFind(s) {
  return String(s || '').slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Aggressive normalization for dedupe — strips ALL question-shape prefixes
// repeatedly and drops trailing question marks so "Q. Q. What is BPO?" and
// "What is BPO?" map to the same key.
function canonicalQuestionKey(s) {
  let t = String(s || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  let prev;
  do {
    prev = t;
    t = t
      .replace(/^\s*(?:q|question|faq)\s*[:.\-)]\s*/i, '')
      .replace(/^\s*(?:q\s*)?\d+(?:\.\d+)*[.):\-]?\s*/i, '')
      .replace(/^\s*(?:section|step|part|chapter)\s+\d+(?:\.\d+)*[.):\-]?\s*/i, '')
      .trim();
  } while (t !== prev);
  return t.replace(/\?+$/, '').trim();
}

// Display-friendly variant — same strip but preserves original casing and
// re-appends a single "?" terminator.
function prettyQuestion(s) {
  let t = String(s || '').trim();
  let prev;
  do {
    prev = t;
    t = t
      .replace(/^\s*(?:Q|question|FAQ)\s*[:.\-)]\s*/i, '')
      .replace(/^\s*(?:Q\s*)?\d+(?:\.\d+)*[.):\-]?\s*/i, '')
      .replace(/^\s*(?:section|step|part|chapter)\s+\d+(?:\.\d+)*[.):\-]?\s*/i, '')
      .trim();
  } while (t !== prev);
  if (!t) return '';
  return t.replace(/\?+$/, '') + '?';
}

function normalizeFaqText(s) {
  let text = String(s || '').trim();
  let prev;
  do {
    prev = text;
    text = text
      .replace(/^\s*(?:Q|question|FAQ)\s*[:.\-)]\s*/i, '')
      .replace(/^\s*(?:Q\s*)?\d+(?:\.\d+)*[.):\-]?\s*/i, '')
      .replace(/^\s*(?:section|step|part|chapter)\s+\d+(?:\.\d+)*[.):\-]?\s*/i, '')
      .trim();
  } while (text !== prev);
  return text;
}

function buildFaqJsonLd(items) {
  // Returns a Schema.org-compliant FAQPage JSON-LD object. Stringification
  // is the consumer's responsibility (escape HTML when injecting).
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}

// ===================================
// Internal-link analysis wrapper
// ===================================
// Thin pass-through to `analyzeInternalLinks` that resolves the tenant site
// path from the corpus' inferred slug (so callers don't have to wire it).
export function runInternalLinkAnalysis(blog, corpus, { tenantSlug } = {}) {
  if (!Array.isArray(corpus) || corpus.length === 0) {
    return { suggestions: [], existing: [], orphans: [], coverage: { total: 0, suggested: 0, existingInternal: 0 } };
  }
  // Infer tenant slug from corpus if not explicitly passed
  const slug = tenantSlug
    || corpus[0]?.targetWebsite?.slug
    || corpus[0]?.websiteSlug
    || '';
  const tenantSitePath = resolveTenantSitePath(slug);
  return analyzeInternalLinks(blog, corpus, { tenantSitePath });
}

// ===================================
// Top-level live analyzer
// ===================================
export function runLiveSeo(form, focusKeyword, corpus = [], { tenantSlug } = {}) {
  const blog = buildBlogFromForm(form);
  const readability = analyzeReadability(blog.content || '');
  // auditBlog needs the dupCheck closure; for editor-mode there's no corpus,
  // so pass a no-op duplicate checker.
  const audit = auditBlog(blog, () => []);
  const focusKw = analyzeFocusKeyword(focusKeyword, blog);
  const subScores = deriveSubScores(audit, focusKw, readability);
  const checklist = buildChecklist(form, blog, audit, focusKw, readability);
  const keywordIntel = analyzeKeywordIntelligence(blog, focusKeyword);
  const schemaIntel = analyzeSchemaReadiness(form, blog);
  const linkIntel = runInternalLinkAnalysis(blog, corpus, { tenantSlug });

  return {
    blog,
    audit,
    focusKw,
    readability,
    subScores,
    checklist,
    keywordIntel,
    schemaIntel,
    linkIntel,
    interpretation: interpretation(audit.overall),
    grade: gradeLetter(audit.overall),
  };
}
