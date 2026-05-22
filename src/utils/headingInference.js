// ===================================
// Heading Inference — visual-bold → semantic H2/H3
// ===================================
// Post-processes HTML produced by mammoth (or pasted from rich-text
// sources) where users used VISUAL bold to indicate section titles instead
// of Word's "Heading X" styles. Without this step, mammoth treats those as
// regular paragraphs and downstream SEO/structure analysis misses them.
//
// Pure heuristics — no AI rewriting, no content changes, only structural
// re-tagging. Heuristic signals:
//   - Paragraph contains ONLY a single bold/strong run
//   - Line is short (<= 14 words, < 160 chars)
//   - Line does not end with sentence-terminating punctuation (. ! ?)
//   - Line is NOT inside a list / blockquote
//   - Numbered prefixes ("1.", "1)", "Section 2 —") bias toward H3
//
// Confidence levels chosen to keep false-positive rate low:
//   - H1: top-of-document line, very short, all-bold, plain title casing
//   - H2: bold-only short line, no terminal punctuation
//   - H3: numbered bold-only short line OR sub-section under a recent H2
//
// Input/output: HTML string. Returns { html, stats: {...} }.

const VOID_TAGS = new Set(['br', 'hr', 'img']);
const TERMINAL_PUNCT = /[.!?…।]$/;
const NUMBER_PREFIX  = /^(?:\d{1,2}[.)]|step\s+\d+|section\s+\d+|part\s+[ivx\d]+|chapter\s+\d+)\s*[-–—:]?\s*/i;
const ALLOWED_INLINE_INSIDE_HEADING = new Set(['strong', 'b', 'em', 'i', 'u', 'span', 'a']);

function stripInner(html) {
  return String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
function wordCount(s) {
  return (String(s).match(/\b[\w'-]+\b/g) || []).length;
}

// Returns true if the paragraph's visible content is ENTIRELY wrapped in
// bold (one or more strong/b runs, possibly nested with em/u/a/span only).
function isAllBold(innerHtml) {
  const t = String(innerHtml).trim();
  if (!t) return false;
  if (!/<(?:strong|b)\b/i.test(t)) return false;

  // Strip allowed inline wrappers and check that nothing meaningful remains
  // outside <strong> or <b>.
  let stripped = t
    .replace(/<\/?(strong|b)\b[^>]*>/gi, '') // mark bold boundaries
    .replace(/<br\s*\/?>/gi, ' ');

  // Remove other inline tags (em/i/u/a/span). Their text content stays.
  stripped = stripped.replace(/<\/?([a-z]+)\b[^>]*>/gi, (m, tag) => {
    return ALLOWED_INLINE_INSIDE_HEADING.has(tag.toLowerCase()) ? '' : m;
  });

  // Any disallowed tag still present → not all-bold
  if (/<[^>]+>/.test(stripped)) return false;

  // Outside the bold markers, only whitespace allowed
  const parts = stripped.split('');
  // parts pattern: [outside, inside, outside, inside, outside]
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i] && parts[i].replace(/\s+/g, '') !== '') return false;
  }
  // Inside parts must contain at least one non-space char
  const insideText = parts.filter((_, i) => i % 2 === 1).join(' ').trim();
  return insideText.length > 0;
}

// Decide heading level for a paragraph that already passed the all-bold test
function classifyHeading(text, indexOfBlock, totalBlocks, prevHeadingLevel) {
  const wc = wordCount(text);
  if (wc === 0 || wc > 14) return null;
  if (text.length > 160) return null;
  if (TERMINAL_PUNCT.test(text)) return null;

  // Top-of-document very short title → H1
  if (indexOfBlock === 0 && wc <= 12) return 1;

  // Numbered prefix → H3
  if (NUMBER_PREFIX.test(text)) return 3;

  // If the most recent heading was H2, this short bold line is likely H3
  if (prevHeadingLevel === 2 && wc <= 10) return 3;

  // Default: H2
  return 2;
}

// Split HTML into top-level block elements while preserving order. Naive
// but adequate for mammoth output which is flat.
function splitBlocks(html) {
  const out = [];
  const re = /<(p|h[1-6]|ul|ol|table|blockquote|pre|figure|div)\b[\s\S]*?<\/\1>/gi;
  let lastIndex = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m.index > lastIndex) {
      const gap = html.slice(lastIndex, m.index);
      if (gap.trim()) out.push({ type: 'raw', html: gap });
    }
    out.push({ type: m[1].toLowerCase(), html: m[0] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < html.length) {
    const tail = html.slice(lastIndex);
    if (tail.trim()) out.push({ type: 'raw', html: tail });
  }
  return out;
}

function inner(blockHtml) {
  const m = blockHtml.match(/^<(\w+)\b[^>]*>([\s\S]*)<\/\1>$/i);
  return m ? m[2] : blockHtml;
}

function inferHeadingsInHtml(html) {
  if (!html || typeof html !== 'string') {
    return { html: html || '', stats: { promotedH1: 0, promotedH2: 0, promotedH3: 0, scanned: 0 } };
  }
  const blocks = splitBlocks(html);
  const stats = { promotedH1: 0, promotedH2: 0, promotedH3: 0, scanned: 0 };
  let prevHeadingLevel = 0;

  const out = blocks.map((b, i) => {
    // Track existing headings so subsequent inference biases correctly
    if (/^h[1-6]$/.test(b.type)) {
      prevHeadingLevel = parseInt(b.type[1], 10);
      return b.html;
    }
    if (b.type !== 'p') return b.html;
    stats.scanned++;
    const innerHtml = inner(b.html);
    if (!isAllBold(innerHtml)) return b.html;
    const text = stripInner(innerHtml);
    const level = classifyHeading(text, i, blocks.length, prevHeadingLevel);
    if (!level) return b.html;
    prevHeadingLevel = level;
    if (level === 1) stats.promotedH1++;
    else if (level === 2) stats.promotedH2++;
    else stats.promotedH3++;
    return `<h${level}>${text}</h${level}>`;
  });

  return { html: out.join(''), stats };
}

module.exports = { inferHeadingsInHtml };
