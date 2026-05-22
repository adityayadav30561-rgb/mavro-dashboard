const aiProviderService = require('./AIProviderService');
const { buildSiteIntelligencePrompt } = require('./promptBuilders/siteIntelligencePrompt');
const { Blog, Website } = require('../../models');

/**
 * siteIntelligenceService — site-wide AI SEO intelligence for a single tenant.
 *
 * Flow:
 *   1. Resolve tenant (Website ObjectId).
 *   2. Fetch corpus (published + draft blogs, content included).
 *   3. Compute DETERMINISTIC summary (counts, avg word count, gaps, cadence,
 *      category/tag distribution, FAQ coverage, metadata gaps, stale flags).
 *   4. Build a representative random sample of blogs WITH headings + excerpt
 *      so the AI grounds its strategy in real content (no hallucination).
 *   5. Call the AI orchestrator with `feature: 'seo_audit'` → routes to
 *      DeepSeek primary → Nemotron → Qwen3-Coder fallbacks (per
 *      routingStrategy.js).
 *   6. Parse + return structured insights side-by-side with the deterministic
 *      summary so the UI can render both.
 *
 * The AI never replaces the deterministic SEO engine — it INTERPRETS the
 * summary + sample data. Editor-level AI features are unchanged.
 */

const STOPWORDS = new Set([
  'the','a','an','and','or','but','of','for','with','to','in','on','at','by','as','is','are','was','were','be','been','this','that','these','those','it','its','from','about',
]);

function stripHtml(html) {
  return String(html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeadings(html, max = 10) {
  const out = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html || '')) !== null && out.length < max) {
    const level = parseInt(m[1], 10);
    const text = stripHtml(m[2]).slice(0, 160);
    if (text) out.push({ level, text });
  }
  return out;
}

function hasFaqPattern(html) {
  if (!html) return false;
  return /<strong>\s*Q\s*[.:]/i.test(html) || /frequently\s+asked\s+questions/i.test(html);
}

function wordCount(text) {
  return (text.match(/\S+/g) || []).length;
}

function daysSince(d) {
  if (!d) return null;
  const ms = Date.now() - new Date(d).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function topNCounts(items, n) {
  const counts = new Map();
  items.forEach((it) => {
    if (!it) return;
    const k = String(it).trim();
    if (!k) return;
    counts.set(k, (counts.get(k) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

function pickSample(arr, n, seed = 1) {
  if (!arr.length) return [];
  if (arr.length <= n) return arr.slice();
  // Deterministic shuffle (Mulberry32) seeded by seed.
  let t = seed >>> 0;
  const rng = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function computeCorpusSummary(blogs) {
  const total = blogs.length;
  const byStatus = blogs.reduce((acc, b) => {
    acc[b.status || 'unknown'] = (acc[b.status || 'unknown'] || 0) + 1;
    return acc;
  }, {});

  const wcs = [];
  const cats = [];
  const tags = [];
  let thin = 0;
  let withFaqs = 0;
  let missingTitle = 0;
  let missingDesc = 0;
  let missingOg = 0;
  let stale = 0;
  let recent = 0;
  const publishedDates = [];
  const last90Publishes = [];

  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const oneEightyDaysMs = 180 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (const b of blogs) {
    const plain = stripHtml(b.content || '');
    const wc = wordCount(plain);
    wcs.push(wc);
    if (wc < 300) thin += 1;
    if (b.category) cats.push(b.category);
    (b.tags || []).forEach((t) => tags.push(t));
    if (hasFaqPattern(b.content)) withFaqs += 1;
    if (!b.seoTitle) missingTitle += 1;
    if (!b.seoDescription) missingDesc += 1;
    if (!b.ogImage && !b.featuredImage) missingOg += 1;

    if (b.status === 'published' && b.publishedAt) {
      const pd = new Date(b.publishedAt).getTime();
      publishedDates.push(pd);
      if (now - pd <= ninetyDaysMs) last90Publishes.push(pd);
      if (now - pd <= thirtyDaysMs) recent += 1;
    }
    const updated = new Date(b.updatedAt || b.publishedAt || b.createdAt).getTime();
    if (b.status === 'published' && now - updated >= oneEightyDaysMs) stale += 1;
  }

  const sumWc = wcs.reduce((s, n) => s + n, 0);
  const avgWordCount = wcs.length ? Math.round(sumWc / wcs.length) : 0;
  publishedDates.sort((a, b) => a - b);
  const oldest = publishedDates[0] ? new Date(publishedDates[0]).toISOString().slice(0, 10) : null;
  const newest = publishedDates[publishedDates.length - 1]
    ? new Date(publishedDates[publishedDates.length - 1]).toISOString().slice(0, 10)
    : null;

  return {
    totalBlogs: total,
    publishedCount: byStatus.published || 0,
    draftCount: byStatus.draft || 0,
    scheduledCount: byStatus.scheduled || 0,
    archivedCount: byStatus.archived || 0,
    avgWordCount,
    thinCount: thin,
    blogsWithFaqs: withFaqs,
    missingSeoTitle: missingTitle,
    missingSeoDescription: missingDesc,
    missingOgImage: missingOg,
    staleCount: stale,
    recentCount: recent,
    oldestPublished: oldest,
    newestPublished: newest,
    publishesPerWeek: last90Publishes.length
      ? Math.round((last90Publishes.length / (90 / 7)) * 10) / 10
      : 0,
    topCategories: topNCounts(cats, 8),
    topTags: topNCounts(tags, 12),
  };
}

function blogSamplePayload(b) {
  const plain = stripHtml(b.content || '');
  return {
    title: b.title,
    slug: b.slug,
    category: b.category,
    tags: b.tags || [],
    headings: extractHeadings(b.content || ''),
    excerpt: (b.excerpt || plain.slice(0, 240)).slice(0, 240),
    wordCount: wordCount(plain),
    ageDays: daysSince(b.publishedAt || b.createdAt),
    status: b.status,
  };
}

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) return null;
  try {
    return JSON.parse(candidate.slice(first, last + 1));
  } catch {
    return null;
  }
}

/**
 * Public entry point.
 * @param {object} args
 * @param {string} args.targetWebsite        - ObjectId
 * @param {string} [args.tenantSlug]         - alternative tenant identifier
 * @param {object} [args.deterministic]      - extra signals (avgSeoScore, linkGraph, decay)
 * @param {object} [args.options]            - { model, temperature, sampleSize }
 */
async function generateSiteIntelligence({
  targetWebsite,
  tenantSlug: slugArg,
  deterministic = {},
  options = {},
} = {}) {
  if (!targetWebsite && !slugArg) {
    throw new Error('targetWebsite or tenantSlug is required');
  }

  // Fetch the full AI-relevant Website fields so the prompt builder can
  // render a tenant brief without any hardcoded tenant map.
  let website = null;
  if (targetWebsite) {
    website = await Website.findById(targetWebsite)
      .select('slug name description aiContext seoDefaults')
      .lean();
  } else if (slugArg) {
    website = await Website.findOne({ slug: slugArg })
      .select('slug name description aiContext seoDefaults')
      .lean();
  }
  if (!website) throw new Error('Website not found for site intelligence');

  // Pull a useful slice of the corpus. Include drafts so the AI sees the
  // pipeline, but bias the sample toward published content.
  const blogs = await Blog.find({ targetWebsite: website._id })
    .select(
      'title slug content status category tags seoTitle seoDescription ogImage featuredImage excerpt publishedAt createdAt updatedAt'
    )
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(120)
    .lean();

  if (blogs.length === 0) {
    return {
      tenant: { slug: website.slug, name: website.name },
      summary: computeCorpusSummary([]),
      insights: null,
      empty: true,
      reason: 'No blogs in corpus yet.',
    };
  }

  const summary = computeCorpusSummary(blogs);

  // Bias sampling: include the 10 most recent published, fill remainder with random.
  const sampleSize = Math.min(options.sampleSize || 22, blogs.length);
  const published = blogs.filter((b) => b.status === 'published');
  const recent10 = published.slice(0, 10);
  const recentIds = new Set(recent10.map((b) => String(b._id)));
  const pool = blogs.filter((b) => !recentIds.has(String(b._id)));
  const filler = pickSample(pool, Math.max(0, sampleSize - recent10.length));
  const sampleBlogs = [...recent10, ...filler].slice(0, sampleSize).map(blogSamplePayload);

  const prompt = buildSiteIntelligencePrompt({
    tenantSlug: website.slug,
    tenantName: website.name,
    tenant: website,
    summary,
    blogSamples: sampleBlogs,
    deterministic,
  });

  const result = await aiProviderService.generateText({
    prompt,
    options: {
      feature: 'seo_audit',
      model: options.model,
      temperature: options.temperature ?? 0.55,
      maxOutputTokens: options.maxOutputTokens ?? 6000,
      // Large-corpus prompts (~5k tokens of context) consistently exceed the
      // orchestrator's 30s default on slower OpenRouter models. Raise to 60s
      // so the primary chain finishes before fallover wastes a model slot.
      timeoutMs: options.timeoutMs ?? 60000,
      responseFormat: 'json',
      systemInstruction:
        'You are a precise SEO operations strategist. You only respond with valid JSON matching the schema in the prompt. No prose outside JSON, no markdown fences.',
    },
    op: 'site_intelligence',
  });

  const parsed = extractJson(result.text);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response did not contain valid site intelligence JSON');
  }

  return {
    tenant: { slug: website.slug, name: website.name },
    summary,
    sampleSize: sampleBlogs.length,
    provider: result.provider,
    model: result.model,
    usage: result.usage,
    insights: parsed,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  generateSiteIntelligence,
  computeCorpusSummary,
};
