// ===================================
// Weighted SEO audit engine (v3 — harsh + content-dominant)
// ===================================
// Rebalances scoring so content depth dominates and metadata perfection
// cannot rescue thin content. Applies absolute content caps post-weighting,
// content-confidence multipliers, and semantic + structural analyzers.
//
// Pure functions — no React, no fetches. Caller memoizes via useMemo.

import {
  analyzeReadability,
  extractHeadings,
  extractImages,
  extractLinks,
  splitParagraphs,
  countWords,
} from './seoReadability';

// ===================================
// Constants
// ===================================
export const CATEGORY_WEIGHTS = {
  metadata:   0.20,
  content:    0.45,   // dominant
  technical:  0.15,
  ux:         0.10,
  freshness:  0.10,
};

export const CATEGORIES = Object.keys(CATEGORY_WEIGHTS);

export const CATEGORY_LABELS = {
  metadata:  'Metadata Quality',
  content:   'Content Quality',
  technical: 'Technical SEO',
  ux:        'UX / Readability',
  freshness: 'Operational Freshness',
};

export const SEVERITY = {
  critical: { tone: 'rose',  weight: 20 },
  warning:  { tone: 'amber', weight: 8  },
  notice:   { tone: 'cyan',  weight: 3  },
};

export const SEVERITIES = ['critical', 'warning', 'notice'];

// ===================================
// Content caps — applied AFTER weighted score
// ===================================
// Real-world SEO platforms harshly cap overall scores when content depth is
// missing. Perfect metadata cannot rescue a 50-word post.
function contentCap(wordCount) {
  if (wordCount < 100)  return 35;
  if (wordCount < 300)  return 55;
  if (wordCount < 700)  return 75;
  return 100;
}

// Long-form bonus — earned, not free.
function longFormBonus(wordCount, hasH2, hasStructure) {
  if (wordCount > 1500 && hasH2 && hasStructure) return 3;
  return 0;
}

// ===================================
// Confidence multipliers — non-content categories are dampened when content
// quality collapses. Reflects the SEO truth: metadata is decoration, not
// substance.
// ===================================
function confidenceMultipliers(contentScore) {
  if (contentScore < 30) {
    return { metadata: 0.4, technical: 0.4, ux: 0.3, freshness: 0.5 };
  }
  if (contentScore < 50) {
    return { metadata: 0.7, technical: 0.7, ux: 0.6, freshness: 0.75 };
  }
  return { metadata: 1, technical: 1, ux: 1, freshness: 1 };
}

// ===================================
// Interpretation bands
// ===================================
export function interpretation(score) {
  if (score >= 90) return { band: 'Excellent', tone: 'emerald' };
  if (score >= 75) return { band: 'Strong',    tone: 'cyan'    };
  if (score >= 60) return { band: 'Average',   tone: 'amber'   };
  if (score >= 40) return { band: 'Weak',      tone: 'orange'  };
  return                  { band: 'Critical',  tone: 'rose'    };
}

export function gradeLetter(score) {
  if (score >= 90) return { letter: 'A', tone: 'emerald' };
  if (score >= 80) return { letter: 'B', tone: 'cyan' };
  if (score >= 70) return { letter: 'C', tone: 'amber' };
  if (score >= 60) return { letter: 'D', tone: 'amber' };
  return                  { letter: 'F', tone: 'rose' };
}

// ===================================
// Issue builder
// ===================================
function issue(category, severity, code, message, fix, penalty) {
  return { category, severity, code, message, fix, penalty };
}

// ===================================
// Per-blog checks — METADATA
// ===================================
function metadataChecks(blog) {
  const issues = [];

  const t = (blog.seoTitle || '').trim();
  if (!t) {
    issues.push(issue('metadata', 'critical', 'meta_title_missing',
      'Missing SEO title',
      'Add unique seoTitle (50–60 chars optimal).', 20));
  } else if (t.length < 30) {
    issues.push(issue('metadata', 'warning', 'meta_title_short',
      `SEO title only ${t.length} chars (target 50–60)`,
      'Expand title — aim for 50–60 chars.', 8));
  } else if (t.length > 70) {
    issues.push(issue('metadata', 'critical', 'meta_title_long',
      `SEO title ${t.length} chars exceeds SERP truncation`,
      'Trim to ≤70 chars.', 12));
  } else if (t.length > 60) {
    issues.push(issue('metadata', 'notice', 'meta_title_borderline',
      `Title ${t.length} chars — borderline truncation`,
      'Tighten to 50–60 chars.', 3));
  }

  const d = (blog.seoDescription || '').trim();
  if (!d) {
    issues.push(issue('metadata', 'critical', 'meta_desc_missing',
      'Missing meta description',
      'Write 140–160 char meta description.', 20));
  } else if (d.length < 80) {
    issues.push(issue('metadata', 'warning', 'meta_desc_short',
      `Meta description only ${d.length} chars`,
      'Expand to 140–160 chars.', 6));
  } else if (d.length > 170) {
    issues.push(issue('metadata', 'warning', 'meta_desc_long',
      `Meta description ${d.length} chars — likely truncated`,
      'Trim to ≤160 chars.', 6));
  }

  const c = (blog.canonicalUrl || '').trim();
  if (!c) {
    issues.push(issue('metadata', 'notice', 'canonical_missing',
      'Canonical URL not set',
      'Set canonicalUrl to consolidate duplicates.', 4));
  } else {
    try {
      const u = new URL(c);
      if (!u.protocol.startsWith('http')) throw new Error('bad protocol');
    } catch {
      issues.push(issue('metadata', 'warning', 'canonical_invalid',
        'Canonical URL is not valid absolute URL',
        'Use absolute https:// URL.', 8));
    }
  }

  if (!blog.ogImage && !blog.featuredImage) {
    issues.push(issue('metadata', 'warning', 'og_image_missing',
      'No Open Graph / featured image',
      'Upload 1200×630 image for OG + Twitter cards.', 8));
  }

  if (!blog.seoTitle && !blog.title) {
    issues.push(issue('metadata', 'critical', 'og_title_missing',
      'OG title cannot be resolved',
      'Provide either seoTitle or title.', 12));
  }
  if (!blog.seoDescription && !blog.excerpt) {
    issues.push(issue('metadata', 'warning', 'og_desc_missing',
      'OG description fallback is empty',
      'Provide seoDescription or excerpt.', 5));
  }
  if (!blog.ogImage && !blog.featuredImage) {
    issues.push(issue('metadata', 'notice', 'twitter_image_missing',
      'Twitter card image fallback missing',
      'Twitter cards default to OG image — add one.', 3));
  }

  return issues;
}

// ===================================
// SEMANTIC DEPTH ANALYZER
// ===================================
// Pure heuristics — no AI. Computes:
//   - top-word density (signals keyword stuffing or sparsity)
//   - heading-keyword relevance vs seoTitle/tags
//   - keyword-to-word ratio
//   - lexical diversity (uniqueness proxy)
//   - sentence-variety proxy
const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','then','than','that','this','these','those',
  'is','are','was','were','be','been','being','am','do','does','did','have','has','had',
  'i','you','he','she','it','we','they','me','him','her','us','them','my','your','his',
  'its','our','their','of','in','on','at','to','for','from','with','by','as','into',
  'about','over','under','again','further','before','after','above','below','up','down',
  'out','off','over','under','very','just','only','also','too','so','no','not','yes',
  'can','will','would','should','could','may','might','must','shall','here','there','where',
  'when','what','which','who','whom','how','why','any','some','few','many','more','most',
  'all','each','every','both','either','neither','one','two','three','first','last','next',
  'because','due','via','vs','etc','using','use','used','make','made','get','got','go',
  'going','went','say','said','says','see','seen','look','see','seem','seems','seemed',
]);

function tokenize(text) {
  return (String(text).toLowerCase().match(/\b[a-z][a-z'-]{1,}\b/g) || [])
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function semanticChecks(blog, html, headings, readability) {
  const issues = [];
  const tokens = tokenize(readability.wordCount > 0 ? (html.replace(/<[^>]+>/g, ' ')) : '');
  const totalTokens = tokens.length;

  // Frequency map
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);

  // Top word density
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topWord = top[0]?.[0] || null;
  const topCount = top[0]?.[1] || 0;
  const topDensity = totalTokens ? (topCount / totalTokens) * 100 : 0;

  // Keyword density bands
  // Stuffing: >3.5% for top non-stopword. Sparsity: top word appears once in >50-word doc.
  if (totalTokens >= 100 && topDensity > 3.5) {
    issues.push(issue('content', 'warning', 'keyword_stuffing',
      `Top word "${topWord}" repeats at ${topDensity.toFixed(1)}% — risks stuffing`,
      'Diversify vocabulary. Target 0.5–2.5% for primary keyword.', 6));
  }
  if (totalTokens >= 100 && topDensity < 0.5 && topCount <= 1) {
    issues.push(issue('content', 'notice', 'no_focus_keyword',
      'No detectable focus keyword pattern',
      'Repeat the primary topic 2–4 times naturally.', 4));
  }

  // Heading–keyword relevance
  // Build target keyword set from seoTitle + tags + keywords
  const targetTokens = new Set(
    tokenize([
      blog.seoTitle || '',
      blog.title || '',
      (blog.tags || []).join(' '),
      (blog.keywords || []).join(' '),
    ].join(' '))
  );
  if (headings.length > 0 && targetTokens.size > 0) {
    const headingsWithKw = headings.filter((h) =>
      tokenize(h.text).some((t) => targetTokens.has(t))
    ).length;
    const coverage = (headingsWithKw / headings.length) * 100;
    if (coverage < 30) {
      issues.push(issue('content', 'warning', 'heading_keyword_mismatch',
        `Only ${coverage.toFixed(0)}% of headings reference primary keywords`,
        'Weave target keywords into H2/H3 anchors.', 6));
    }
  }

  // Keyword presence in body for declared tags/keywords
  const declared = [...(blog.tags || []), ...(blog.keywords || [])].map((k) => k.toLowerCase());
  if (declared.length > 0 && totalTokens > 50) {
    const missing = declared.filter((k) => !tokens.includes(k));
    if (missing.length === declared.length) {
      issues.push(issue('content', 'warning', 'tags_not_in_body',
        `Declared tags/keywords don't appear in body text`,
        'Use declared keywords naturally in the content.', 6));
    }
  }

  // Lexical diversity — unique tokens / total
  const diversity = totalTokens ? (freq.size / totalTokens) : 0;
  if (totalTokens >= 200 && diversity < 0.35) {
    issues.push(issue('content', 'notice', 'low_diversity',
      `Lexical diversity ${(diversity * 100).toFixed(0)}% — vocabulary feels repetitive`,
      'Vary word choice. Avoid redundant phrasing.', 3));
  }

  // Sentence variety — repeated sentence starts
  const sentenceStarts = new Map();
  for (const s of splitParagraphs(html).flatMap((p) => p.split(/(?<=[.!?])\s+/))) {
    const first = (s.trim().split(/\s+/)[0] || '').toLowerCase();
    if (first.length > 2) sentenceStarts.set(first, (sentenceStarts.get(first) || 0) + 1);
  }
  const topStart = [...sentenceStarts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topStart && topStart[1] >= 5 && readability.sentenceCount >= 8) {
    issues.push(issue('content', 'notice', 'repetitive_sentence_starts',
      `Sentence starts repeat "${topStart[0]}" ${topStart[1]} times`,
      'Vary sentence openers for natural rhythm.', 2));
  }

  return { issues, signals: { topWord, topDensity, diversity, totalTokens } };
}

// ===================================
// STRUCTURE INTELLIGENCE
// ===================================
function structureChecks(blog, html, headings, readability) {
  const issues = [];

  // List usage
  const ulCount = (html.match(/<ul[\s>]/gi) || []).length;
  const olCount = (html.match(/<ol[\s>]/gi) || []).length;
  const liCount = (html.match(/<li[\s>]/gi) || []).length;

  // Formatting richness
  const strong = (html.match(/<(strong|b)[\s>]/gi) || []).length;
  const em     = (html.match(/<(em|i)[\s>]/gi) || []).length;
  const code   = (html.match(/<code[\s>]/gi) || []).length;
  const quote  = (html.match(/<blockquote[\s>]/gi) || []).length;
  const formattingHits = strong + em + code + quote;

  // Sections
  const h2Count = headings.filter((h) => h.level === 2).length;
  const wc = readability.wordCount;

  // Section density — long docs need section breaks
  if (wc > 500 && h2Count === 0) {
    issues.push(issue('content', 'critical', 'no_sections_in_long_post',
      'Long-form content has zero H2 sections',
      'Break content into clearly-titled sections.', 12));
  } else if (wc > 1000 && h2Count < 3) {
    issues.push(issue('content', 'warning', 'sparse_sections',
      `${wc}-word post has only ${h2Count} H2 section(s)`,
      'Add 3+ H2 sections to aid scannability.', 6));
  }

  // List usage in long content
  if (wc > 600 && (ulCount + olCount) === 0) {
    issues.push(issue('content', 'notice', 'no_lists',
      'No bullet or ordered lists in a long post',
      'Use lists for enumerable content (steps, features, refs).', 3));
  }

  // Formatting starvation — long doc with no emphasis
  if (wc > 400 && formattingHits === 0) {
    issues.push(issue('content', 'notice', 'no_formatting',
      'No bold/italic/code/blockquote formatting',
      'Add visual emphasis to key phrases for scannability.', 3));
  }

  // Media density
  const images = extractImages(html);
  if (wc > 800 && images.length === 0) {
    issues.push(issue('content', 'warning', 'no_media',
      'No supporting media in long-form content',
      'Add at least one image, diagram, or embed per 600 words.', 5));
  }

  return {
    issues,
    signals: {
      h2Count,
      ulCount,
      olCount,
      liCount,
      formattingHits,
      imageCount: images.length,
      hasStructure: h2Count >= 2 && (ulCount + olCount + formattingHits) > 0,
    },
  };
}

// ===================================
// Per-blog checks — CONTENT (depth + base)
// ===================================
function contentChecks(blog, readability) {
  const issues = [];
  const html = blog.content || '';
  const wc = readability.wordCount;

  // ── Word count tiers — harsher penalties on published thin content ──
  if (wc < 30) {
    issues.push(issue('content', 'critical', 'content_essentially_empty',
      `Content essentially empty — ${wc} words`,
      'Content has no substance. Write ≥300 words minimum.', 60));
  } else if (wc < 100) {
    issues.push(issue('content', 'critical', 'content_extremely_thin',
      `Extremely thin content — only ${wc} words`,
      'Expand to ≥300 words. Below 100 is virtually unindexable.', 50));
  } else if (wc < 300 && blog.status === 'published') {
    issues.push(issue('content', 'critical', 'content_thin',
      `Thin content — ${wc} words`,
      'Target 700–1500 words for competitive topics.', 25));
  } else if (wc < 700) {
    issues.push(issue('content', 'warning', 'content_short',
      `Content ${wc} words — short for SEO depth`,
      'Aim for 700+ words.', 8));
  }

  // ── Headings ──
  const headings = extractHeadings(html);
  const h1s = headings.filter((h) => h.level === 1);
  const h2s = headings.filter((h) => h.level === 2);

  if (headings.length === 0 && wc > 50) {
    issues.push(issue('content', 'critical', 'no_headings',
      'No semantic headings (H1–H6) detected',
      'Structure content with H2/H3.', 12));
  } else if (headings.length > 0) {
    if (h1s.length > 1) {
      issues.push(issue('content', 'warning', 'multiple_h1',
        `${h1s.length} H1 tags — should be at most 1`,
        'Demote extra H1s to H2.', 8));
    }
    if (h2s.length === 0 && wc > 200) {
      issues.push(issue('content', 'warning', 'missing_h2',
        'No H2 headings — content lacks structural anchors',
        'Break content into H2 sections.', 8));
    }
    let prev = 0, skipped = false;
    for (const h of headings) {
      if (prev && h.level - prev > 1) { skipped = true; break; }
      prev = h.level;
    }
    if (skipped) {
      issues.push(issue('content', 'notice', 'heading_skip',
        'Heading hierarchy skips levels',
        'Use sequential heading levels.', 3));
    }
  }

  // ── Paragraph distribution ──
  if (readability.longParagraphCount > 0) {
    issues.push(issue('content', 'notice', 'long_paragraphs',
      `${readability.longParagraphCount} paragraph(s) over 150 words`,
      'Break long paragraphs into shorter ones.', 3));
  }
  if (readability.paragraphCount <= 1 && wc > 80) {
    issues.push(issue('content', 'warning', 'no_paragraph_structure',
      'Content lacks paragraph structure',
      'Split content into multiple paragraphs.', 8));
  }

  // ── Images ──
  const images = extractImages(html);
  if (images.length === 0 && wc > 300) {
    issues.push(issue('content', 'notice', 'no_images',
      'No inline images in content',
      'Add supporting imagery.', 3));
  }
  const imagesMissingAlt = images.filter((i) => !i.alt).length;
  if (imagesMissingAlt > 0) {
    issues.push(issue('content', 'warning', 'image_missing_alt',
      `${imagesMissingAlt} image(s) missing alt text`,
      'Add descriptive alt text.', Math.min(12, imagesMissingAlt * 4)));
  }

  // ── Links ──
  const { internal, external } = extractLinks(html);
  if (internal.length === 0 && wc > 300) {
    issues.push(issue('content', 'notice', 'no_internal_links',
      'No internal links detected',
      'Link to related posts.', 5));
  }
  if (external.length === 0 && wc > 700) {
    issues.push(issue('content', 'notice', 'no_external_links',
      'No outbound links — content appears isolated',
      'Cite 1–2 authoritative sources.', 2));
  }

  return { issues, headings, images };
}

// ===================================
// TECHNICAL
// ===================================
function technicalChecks(blog) {
  const issues = [];

  if (!blog.slug) {
    issues.push(issue('technical', 'critical', 'slug_missing',
      'Blog slug missing',
      'Slug required for clean URLs + sitemap.', 20));
  } else if (blog.slug.length > 80) {
    issues.push(issue('technical', 'notice', 'slug_long',
      `Slug ${blog.slug.length} chars — overly long`,
      'Shorten slug for cleaner URLs.', 3));
  }

  if (blog.status === 'published' && !blog.featuredImage && !blog.ogImage) {
    issues.push(issue('technical', 'warning', 'no_featured_image',
      'Published post has no featured image',
      'Featured image used in OG cards + blog grids.', 5));
  }

  if (
    blog.status === 'published' &&
    !blog.seoTitle &&
    !blog.seoDescription &&
    !blog.keywords?.length &&
    !blog.tags?.length
  ) {
    issues.push(issue('technical', 'critical', 'orphan_seo',
      'Published post has zero SEO metadata',
      'Add seoTitle, seoDescription, plus tag/keyword.', 12));
  }

  if (!blog.tags?.length && !blog.keywords?.length) {
    issues.push(issue('technical', 'notice', 'no_keywords',
      'No focus keywords or tags',
      'Add 3–6 focus terms.', 3));
  }

  return issues;
}

// ===================================
// UX / Readability
// ===================================
function uxChecks(readability) {
  const issues = [];

  // Skip readability analysis on empty docs — penalty already came from content
  if (readability.wordCount < 50) return issues;

  const flesch = readability.flesch;
  if (flesch < 30) {
    issues.push(issue('ux', 'critical', 'flesch_very_difficult',
      `Reading ease ${flesch} — very difficult`,
      'Shorten sentences. Simplify vocabulary.', 18));
  } else if (flesch < 50) {
    issues.push(issue('ux', 'warning', 'flesch_difficult',
      `Reading ease ${flesch} — difficult`,
      'Simplify language. Target 60–70.', 8));
  } else if (flesch < 60) {
    issues.push(issue('ux', 'notice', 'flesch_fairly_difficult',
      `Reading ease ${flesch} — fairly difficult`,
      'Tighten phrasing to reach 60–70.', 4));
  }

  if (readability.avgSentenceWords > 25) {
    issues.push(issue('ux', 'warning', 'long_sentences',
      `Avg sentence length ${readability.avgSentenceWords} words`,
      'Aim for 15–20 words per sentence.', 6));
  } else if (readability.avgSentenceWords > 20) {
    issues.push(issue('ux', 'notice', 'borderline_sentence_length',
      `Avg sentence ${readability.avgSentenceWords} words — borderline`,
      'Tighten to 15–20 words.', 2));
  }

  if (readability.longSentencePct > 25) {
    issues.push(issue('ux', 'warning', 'too_many_long_sentences',
      `${readability.longSentencePct}% of sentences over 25 words`,
      'Break up long sentences.', 5));
  }

  if (readability.passivePct > 25) {
    issues.push(issue('ux', 'notice', 'passive_voice_high',
      `Passive-voice rate ${readability.passivePct}%`,
      'Rewrite to active voice.', 4));
  }

  if (readability.transitionPct < 30 && readability.paragraphCount > 2) {
    issues.push(issue('ux', 'notice', 'low_transitions',
      `Only ${readability.transitionPct}% of paragraphs use transitions`,
      'Add transition words.', 3));
  }

  return issues;
}

// ===================================
// FRESHNESS
// ===================================
function freshnessChecks(blog) {
  const issues = [];
  if (blog.status !== 'published') return issues;
  const last = new Date(blog.updatedAt || blog.publishedAt || 0);
  if (!last.getTime()) return issues;
  const daysSince = Math.floor((Date.now() - last.getTime()) / 86400000);

  if (daysSince > 365) {
    issues.push(issue('freshness', 'critical', 'stale_content_year',
      `Not updated in ${daysSince} days (>1 year)`,
      'Refresh content — outdated posts decay.', 15));
  } else if (daysSince > 180) {
    issues.push(issue('freshness', 'warning', 'stale_content_6mo',
      `Not updated in ${daysSince} days`,
      'Refresh — aim for <180 day cadence.', 8));
  } else if (daysSince > 90) {
    issues.push(issue('freshness', 'notice', 'stale_content_3mo',
      `Not updated in ${daysSince} days`,
      'Consider refresh in next 90 days.', 3));
  }

  return issues;
}

// ===================================
// Cross-corpus duplicates
// ===================================
function corpusDuplicates(blogs) {
  const titleMap = new Map();
  const slugMap = new Map();
  const descMap = new Map();
  for (const b of blogs) {
    const t = (b.seoTitle || b.title || '').trim().toLowerCase();
    const s = (b.slug || '').trim().toLowerCase();
    const d = (b.seoDescription || '').trim().toLowerCase();
    if (t) titleMap.set(t, (titleMap.get(t) || 0) + 1);
    if (s) slugMap.set(s, (slugMap.get(s) || 0) + 1);
    if (d) descMap.set(d, (descMap.get(d) || 0) + 1);
  }
  return (b) => {
    const dupes = [];
    const t = (b.seoTitle || b.title || '').trim().toLowerCase();
    const s = (b.slug || '').trim().toLowerCase();
    const d = (b.seoDescription || '').trim().toLowerCase();
    if (t && titleMap.get(t) > 1) dupes.push(issue('technical', 'critical', 'duplicate_title',
      `Duplicate title (${titleMap.get(t)} pages share it)`,
      'Make every seoTitle unique.', 15));
    if (s && slugMap.get(s) > 1) dupes.push(issue('technical', 'critical', 'duplicate_slug',
      `Duplicate slug (${slugMap.get(s)} pages share it)`,
      'Each blog needs unique slug.', 15));
    if (d && descMap.get(d) > 1) dupes.push(issue('technical', 'warning', 'duplicate_description',
      `Duplicate meta description (${descMap.get(d)} pages)`,
      'Write unique meta description per page.', 8));
    return dupes;
  };
}

// ===================================
// Category aggregator
// ===================================
function categoryScoreFromIssues(issues) {
  const byCat = {};
  for (const cat of CATEGORIES) byCat[cat] = { score: 100, issues: [] };
  for (const it of issues) {
    if (!byCat[it.category]) byCat[it.category] = { score: 100, issues: [] };
    byCat[it.category].score = Math.max(0, byCat[it.category].score - (it.penalty || 0));
    byCat[it.category].issues.push(it);
  }
  return byCat;
}

// ===================================
// Strengths / weaknesses extractor
// ===================================
function extractInsights(byCategory, signals, readability) {
  const strengths = [];
  const weaknesses = [];

  for (const cat of CATEGORIES) {
    const s = byCategory[cat]?.score ?? 100;
    if (s >= 90) strengths.push({ label: CATEGORY_LABELS[cat], score: s });
    if (s < 50)  weaknesses.push({ label: CATEGORY_LABELS[cat], score: s });
  }

  // Signal-driven highlights
  if (signals.totalTokens && signals.totalTokens >= 700 && signals.diversity >= 0.45) {
    strengths.push({ label: 'Strong lexical diversity', score: Math.round(signals.diversity * 100) });
  }
  if (signals.hasStructure && readability.wordCount >= 700) {
    strengths.push({ label: 'Well-structured long form', score: readability.wordCount });
  }

  weaknesses.sort((a, b) => a.score - b.score);
  strengths.sort((a, b) => b.score - a.score);

  return {
    topStrengths: strengths.slice(0, 3),
    topWeaknesses: weaknesses.slice(0, 3),
  };
}

// ===================================
// Public: audit one blog
// ===================================
export function auditBlog(blog, dupCheck = () => []) {
  const html = blog.content || '';
  const readability = analyzeReadability(html);
  const headings = extractHeadings(html);

  // Run all checks
  const contentResult   = contentChecks(blog, readability);
  const semanticResult  = semanticChecks(blog, html, headings, readability);
  const structureResult = structureChecks(blog, html, headings, readability);

  const issues = [
    ...metadataChecks(blog),
    ...contentResult.issues,
    ...semanticResult.issues,
    ...structureResult.issues,
    ...technicalChecks(blog),
    ...uxChecks(readability),
    ...freshnessChecks(blog),
    ...dupCheck(blog),
  ];

  const byCategory = categoryScoreFromIssues(issues);

  // ── Weighted scoring with confidence multipliers ──
  const contentScore = byCategory.content.score;
  const conf = confidenceMultipliers(contentScore);

  // Effective weights (content keeps full weight; others scaled by confidence
  // then re-normalized so the result still sits on a 0–100 scale).
  const effW = {
    content:   CATEGORY_WEIGHTS.content,
    metadata:  CATEGORY_WEIGHTS.metadata  * conf.metadata,
    technical: CATEGORY_WEIGHTS.technical * conf.technical,
    ux:        CATEGORY_WEIGHTS.ux        * conf.ux,
    freshness: CATEGORY_WEIGHTS.freshness * conf.freshness,
  };
  const effSum = Object.values(effW).reduce((s, w) => s + w, 0);

  let weighted = 0;
  for (const cat of CATEGORIES) {
    weighted += (byCategory[cat].score) * (effW[cat] / effSum);
  }

  // ── Content cap (hard ceiling based on word count) ──
  const cap = contentCap(readability.wordCount);
  const bonus = longFormBonus(readability.wordCount, structureResult.signals.h2Count > 0, structureResult.signals.hasStructure);
  const capped = Math.min(cap, weighted + bonus);
  const overall = Math.max(0, Math.round(capped));

  const interp = interpretation(overall);
  const grade  = gradeLetter(overall);
  const insights = extractInsights(byCategory, {
    ...semanticResult.signals,
    hasStructure: structureResult.signals.hasStructure,
  }, readability);

  return {
    blog,
    issues,
    byCategory,
    overall,
    weightedRaw: Math.round(weighted),
    cap,
    bonus,
    confidence: conf,
    grade,
    interpretation: interp,
    insights,
    readability,
    wordCount: readability.wordCount,
    paragraphs: readability.paragraphCount,
    semantic: semanticResult.signals,
    structure: structureResult.signals,
  };
}

// ===================================
// Public: audit corpus
// ===================================
export function auditCorpus(blogs = []) {
  const dupCheck = corpusDuplicates(blogs);
  const audits = blogs.map((b) => auditBlog(b, dupCheck));

  const categoryAvg = {};
  for (const cat of CATEGORIES) {
    const sum = audits.reduce((s, a) => s + (a.byCategory[cat]?.score ?? 100), 0);
    categoryAvg[cat] = audits.length ? Math.round(sum / audits.length) : 100;
  }

  // Corpus overall = mean of per-blog overall (each already capped + confidence-adjusted)
  const corpusScore = audits.length
    ? Math.round(audits.reduce((s, a) => s + a.overall, 0) / audits.length)
    : 100;

  const critical = audits.reduce((s, a) => s + a.issues.filter((i) => i.severity === 'critical').length, 0);
  const warnings = audits.reduce((s, a) => s + a.issues.filter((i) => i.severity === 'warning').length, 0);
  const notices  = audits.reduce((s, a) => s + a.issues.filter((i) => i.severity === 'notice').length, 0);

  const coverage = {
    seoTitle:       audits.filter((a) => a.blog.seoTitle?.trim()).length,
    seoDescription: audits.filter((a) => a.blog.seoDescription?.trim()).length,
    ogImage:        audits.filter((a) => a.blog.ogImage || a.blog.featuredImage).length,
    canonical:      audits.filter((a) => a.blog.canonicalUrl?.trim()).length,
  };

  const avgReadability = audits.length
    ? Math.round(audits.reduce((s, a) => s + a.readability.flesch, 0) / audits.length)
    : 0;

  return {
    audits,
    totals: {
      posts: audits.length,
      published: audits.filter((a) => a.blog.status === 'published').length,
      drafts:    audits.filter((a) => a.blog.status === 'draft').length,
      critical, warnings, notices,
      coverage,
      avgWordCount: audits.length
        ? Math.round(audits.reduce((s, a) => s + a.wordCount, 0) / audits.length)
        : 0,
      avgReadability,
      categoryScores: categoryAvg,
      overall: corpusScore,
      grade: gradeLetter(corpusScore),
      interpretation: interpretation(corpusScore),
    },
  };
}
