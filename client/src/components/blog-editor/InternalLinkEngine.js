// ===================================
// Internal Link Engine v1
// ===================================
// Pure-function suggestion engine for tenant-aware internal linking inside
// the Blog Editor Cockpit. Given the blog currently being edited + a corpus
// of published tenant blogs, returns:
//   - Suggested linkable candidates (ranked by topical overlap)
//   - Anchor text proposals (real n-grams that appear in current draft)
//   - Existing internal links already in draft
//   - Orphan candidates from the corpus (no inbound links yet)
//
// Signals: token-set overlap on title + tags + keywords + headings (Jaccard).
// No fake data. If corpus is empty, returns empty suggestions.
//
// Multi-tenant: pure function. Caller must pass tenant-scoped corpus.
//
// Performance: corpus token sets memoized lazily via WeakMap-ish closure
// keyed on per-call corpus reference. Caller wraps in useMemo with debounced
// form + corpus identity.

import {
  extractHeadings,
  extractLinks,
  countWords,
} from '@/lib/seoReadability';
import { generateAnchorVariants, analyzeLinkCoverage } from '@/lib/anchorIntel';
import { buildLinkGraph, buildClusters } from '@/lib/linkGraphIntel';

// Tight stopword list — keeps n-grams meaningful without over-filtering.
const STOP = new Set([
  'the','a','an','and','or','but','if','then','than','that','this','these','those',
  'is','are','was','were','be','been','being','am','do','does','did','have','has','had',
  'of','in','on','at','to','for','from','with','by','as','into','about','over','under',
  'i','you','he','she','it','we','they','them','my','your','our','their','its',
  'not','no','so','too','also','very','just','only','more','most','some','any','all',
  'can','will','would','should','could','may','might','must','here','there',
  'what','which','who','how','why','when','where','use','using','used','make','made',
]);

function stripTags(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text) {
  return (String(text).toLowerCase().match(/\b[a-z][a-z'-]{1,}\b/g) || [])
    .filter((t) => t.length > 2 && !STOP.has(t));
}

// Build the topical signature for a blog from title + seoTitle + tags +
// keywords + heading text. Body content tokens are NOT folded in because
// every long post would otherwise overlap with every other long post.
function signatureTokens(blog) {
  const seg = [
    blog.title || '',
    blog.seoTitle || '',
    (blog.tags || []).join(' '),
    (blog.keywords || []).join(' '),
    extractHeadings(blog.content || '').map((h) => h.text).join(' '),
  ].join(' ');
  return new Set(tokenize(seg));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

// ===================================
// Anchor proposal
// ===================================
// Look for an n-gram (2–4 words) that appears in the CURRENT draft AND in the
// candidate blog's signature tokens. Falls back to candidate title if none.
function proposeAnchor(currentPlainText, candidateTokens, candidateTitle) {
  const lower = currentPlainText.toLowerCase();

  // Pull candidate signature tokens that have >=4 chars (more anchor-worthy)
  const targets = [...candidateTokens].filter((t) => t.length >= 4);

  // Try 2–4 word phrases from the draft that contain >=1 candidate token
  // Cheap heuristic: scan a sliding window of words.
  const words = (lower.match(/[a-z][a-z'-]{1,}/g) || []);
  const grams = [];
  for (let n = 4; n >= 2; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const slice = words.slice(i, i + n);
      if (slice.every((w) => STOP.has(w) || w.length < 3)) continue;
      if (slice.some((w) => targets.includes(w))) {
        grams.push(slice.join(' '));
        if (grams.length > 80) break;
      }
    }
    if (grams.length) break;
  }

  if (grams.length) {
    // Pick the longest unique gram (more anchor-worthy)
    const sorted = [...new Set(grams)].sort((a, b) => b.length - a.length);
    return sorted[0];
  }

  return candidateTitle;
}

// ===================================
// Public: analyze
// ===================================
// currentBlog: editor blog shape (must include title, content, tags, keywords)
// corpus: array of tenant blogs (must include _id, title, slug, tags, keywords,
//         content, targetWebsite { slug } OR websiteSlug)
// tenantBlogSlugPrefix: optional override (default 'blog')
// publicSiteSlug: tenant slug for URL generation (e.g. 'spanbix')
//                 → URL: `/${tenantSitePath}/${blogSlugPrefix}/${blog.slug}`
//                 tenantSitePath maps slug to site path (slug passes through as-is)
//
// Returns:
//   {
//     suggestions: [{ blog, score, anchor, href, reason }],
//     existing: [{ href, anchor }],
//     orphans: [{ blog, score }],
//     coverage: { total, suggested, existingInternal },
//   }
export function analyzeInternalLinks(currentBlog, corpus, { tenantSitePath, blogSlugPrefix = 'blog', minScore = 0.05, max = 6 } = {}) {
  const safeCorpus = Array.isArray(corpus) ? corpus.filter(Boolean) : [];
  if (!currentBlog || safeCorpus.length === 0) {
    return { suggestions: [], existing: [], orphans: [], coverage: { total: 0, suggested: 0, existingInternal: 0 } };
  }

  const currentSig = signatureTokens(currentBlog);
  const currentHtml = currentBlog.content || '';
  const currentPlain = stripTags(currentHtml);
  const { internal: existingInternalLinks } = extractLinks(currentHtml);

  // Build candidate scores
  const scored = safeCorpus.map((b) => {
    const sig = signatureTokens(b);
    const score = jaccard(currentSig, sig);
    return { blog: b, sig, score };
  });

  // Sort by score desc, drop below threshold + drop already-linked
  const existingSlugFragments = new Set(
    existingInternalLinks
      .map((href) => {
        // Trailing-slash tolerant (WordPress permalinks end in '/')
        const clean = String(href).split('#')[0].split('?')[0].replace(/\/+$/, '');
        const m = clean.match(/\/([^\/]+)$/);
        return m ? m[1].toLowerCase() : '';
      })
      .filter(Boolean)
  );

  const tenantPath = tenantSitePath || ''; // empty → relative-only

  const suggestions = scored
    .filter((s) => s.score >= minScore)
    .filter((s) => !existingSlugFragments.has(String(s.blog.slug || '').toLowerCase()))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => {
      const fallbackAnchor = proposeAnchor(currentPlain, s.sig, s.blog.title || s.blog.seoTitle || 'related post');
      const variants = generateAnchorVariants(currentBlog, s.blog);
      // Best anchor = highest-scoring variant or fallback
      const anchor = variants.best?.text || fallbackAnchor;
      const slug = s.blog.slug;
      const href = tenantPath
        ? `/${tenantPath}/${blogSlugPrefix}/${slug}`
        : `/${blogSlugPrefix}/${slug}`;
      return {
        blog: s.blog,
        score: Number((s.score * 100).toFixed(1)),
        confidence: Number((s.score * 100).toFixed(0)), // alias for UI
        anchor,
        anchorVariants: variants,
        href,
        reason: deriveReason(s.score, s.sig, currentSig),
      };
    });

  // Existing internal links — annotate with anchor text where possible
  const existing = existingInternalLinks.map((href) => ({
    href,
    anchor: extractAnchorText(currentHtml, href),
  }));

  // Orphan opportunities from the actual link graph — corpus blogs with zero
  // inbound + zero outbound. These benefit most from being linked.
  const orphanOpps = detectGraphOrphans(safeCorpus).slice(0, 4)
    .map((o) => {
      const sig = signatureTokens(o);
      const overlap = jaccard(currentSig, sig);
      const slug = o.slug;
      const fallback = o.title || 'orphan post';
      const variants = generateAnchorVariants(currentBlog, o);
      return {
        blog: o,
        score: Number((overlap * 100).toFixed(1)),
        anchor: variants.best?.text || fallback,
        anchorVariants: variants,
        href: tenantPath ? `/${tenantPath}/${blogSlugPrefix}/${slug}` : `/${blogSlugPrefix}/${slug}`,
      };
    });

  // Cluster expansion — sibling blogs in the same cluster as the current draft
  // (uses lightweight clustering on corpus only; treats current draft as a
  // pseudo-node by overlap to cluster centroids).
  const clusters = computeClustersForCorpus(safeCorpus);
  const clusterExpansion = pickClusterExpansion(currentSig, clusters, existingSlugFragments, tenantPath, blogSlugPrefix);

  // Coverage warnings on the current draft
  const coverageReport = analyzeLinkCoverage(currentBlog);

  // Missing-link detection — internal links pointing at slugs not in corpus
  const corpusSlugs = new Set(safeCorpus.map((b) => String(b.slug || '').toLowerCase()));
  const missingLinks = [...existingSlugFragments]
    .filter((slug) => !corpusSlugs.has(slug))
    .map((slug) => ({ slug }));

  return {
    suggestions,
    existing,
    orphanOpportunities: orphanOpps,
    clusterExpansion,
    missingLinks,
    coverageWarnings: coverageReport.warnings,
    coverageStats: {
      wordCount: coverageReport.wordCount,
      internal: coverageReport.internalCount,
      external: coverageReport.externalCount,
      density: coverageReport.density,
      anchorRepeats: coverageReport.anchorRepeats,
    },
    // Backwards-compat
    orphans: orphanOpps.map((o) => ({ blog: o.blog, score: o.score })),
    coverage: {
      total: safeCorpus.length,
      suggested: suggestions.length,
      existingInternal: existingInternalLinks.length,
    },
  };
}

// ===================================
// Helpers: graph-based orphan detection within corpus
// ===================================
function detectGraphOrphans(corpus) {
  const graph = buildLinkGraph(corpus);
  return graph.nodes
    .filter((n) => n.isOrphan)
    .map((n) => n.blog);
}

function computeClustersForCorpus(corpus) {
  const graph = buildLinkGraph(corpus);
  const { clusters } = buildClusters(graph.nodes, 0.18);
  // Return clusters with their node refs
  return clusters.map((c) => {
    const members = c.members.map((id) => graph.byId.get(id)?.blog).filter(Boolean);
    return { ...c, blogs: members };
  });
}

function pickClusterExpansion(currentSig, clusters, existingSlugFragments, tenantPath, blogSlugPrefix) {
  // Score each cluster by overlap of currentSig with the aggregate token bag
  if (!clusters.length || currentSig.size === 0) return null;
  let best = null;
  for (const c of clusters) {
    const tokens = new Set();
    for (const b of c.blogs) for (const t of signatureTokens(b)) tokens.add(t);
    const sim = jaccard(currentSig, tokens);
    if (!best || sim > best.sim) best = { cluster: c, sim };
  }
  if (!best || best.sim < 0.08) return null;
  const candidates = best.cluster.blogs
    .filter((b) => !existingSlugFragments.has(String(b.slug || '').toLowerCase()))
    .map((b) => ({
      blog: b,
      href: tenantPath ? `/${tenantPath}/${blogSlugPrefix}/${b.slug}` : `/${blogSlugPrefix}/${b.slug}`,
      anchor: b.title,
    }))
    .slice(0, 4);
  return {
    clusterId: best.cluster.id,
    label: best.cluster.label,
    strength: Number((best.sim * 100).toFixed(1)),
    candidates,
  };
}

function deriveReason(score, sigA, sigB) {
  if (score >= 0.3) return 'Very strong topical overlap';
  if (score >= 0.15) return 'Strong topical overlap';
  if (score >= 0.08) return 'Moderate topical overlap';
  return 'Loose topical overlap';
}

function extractAnchorText(html, href) {
  const escaped = String(href).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<a\\b[^>]*href\\s*=\\s*["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/a>`, 'i');
  const m = html.match(re);
  return m ? stripTags(m[1]) : '';
}

function computeOrphans(scored, corpus) {
  // For each corpus blog, average overlap with every other corpus blog.
  // Anything significantly below the median is "isolated" (orphan-prone).
  if (scored.length < 3) return [];
  const sigs = scored.map((s) => s.sig);
  const blogs = scored.map((s) => s.blog);
  const avgs = sigs.map((a, i) => {
    let sum = 0, n = 0;
    for (let j = 0; j < sigs.length; j++) {
      if (i === j) continue;
      sum += jaccard(a, sigs[j]);
      n++;
    }
    return { blog: blogs[i], score: n ? sum / n : 0 };
  });
  const sorted = [...avgs].sort((a, b) => a.score - b.score);
  return sorted
    .filter((o) => o.score < 0.05)
    .map((o) => ({ blog: o.blog, score: Number((o.score * 100).toFixed(1)) }));
}

// ===================================
// Tenant site-path resolver
// ===================================
// Maps a tenant slug to the public site URL fragment. The live tenants
// (Spanbix on spanbix-web, SaiSatwik on WordPress) serve blogs at the root of
// their own hosts, so the slug passes through as-is; any legacy 'mavro-'
// prefix is stripped for safety.
export function resolveTenantSitePath(slug) {
  if (!slug) return '';
  return slug.replace(/^mavro-/, '');
}
