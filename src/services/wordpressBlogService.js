/**
 * WordPress Blog Adapter — feeds the SEO Engine for tenants whose blog corpus
 * lives in an external WordPress install (Website.wordpressUrl set).
 *
 * Pulls published posts from the WP REST API, adapts each into the exact shape
 * `seoHealth.auditBlog()` expects from a Mavro Blog document, and caches the
 * result in-memory for 1 hour per WordPress origin (same pattern as
 * mbrPagesService's WP fetches — read-heavy admin surface, slow-moving data).
 *
 * The audit engine only reads fields — nothing here writes back to WordPress.
 */

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const MAX_PAGES = 3;                 // 3 × 100 = 300 posts ceiling
const cache = new Map();             // wordpressUrl → { at, blogs }
const inflight = new Map();          // wordpressUrl → Promise<blogs> (dedupes concurrent fetches)

/** Strip tags + collapse whitespace + decode the handful of entities WP emits. */
const stripHtml = (html = '') =>
  String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8220;|&ldquo;|&#8221;|&rdquo;/g, '"')
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/&#8212;|&mdash;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Only the fields adaptPost() reads. NEVER switch back to `_embed`: with ~100
// posts the embedded response was 6.6 MB and took 22 s on the shared WP host,
// which blew the timeout and took down SEO + Analytics (Nov 2026). `_fields`
// returns the same posts in ~1.3 MB / ~4 s; term names and cover URLs are
// resolved with small side lookups below.
const POST_FIELDS =
  'id,slug,link,title,excerpt,content,date,date_gmt,modified,modified_gmt,categories,tags,featured_media';
const REQUEST_TIMEOUT_MS = 20000;
const UA = { 'User-Agent': 'MavroSeoEngine/1.0' };

const wpGet = (base, path) =>
  fetch(`${base}/wp-json/wp/v2/${path}`, { headers: UA, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

const totalPagesOf = (res) => parseInt(res.headers.get('x-wp-totalpages') || '1', 10) || 1;

/** Fetch one page of posts (100 per page, sequential). Returns { posts, totalPages }. */
async function fetchPage(base, page) {
  const res = await wpGet(base, `posts?status=publish&per_page=100&page=${page}&_fields=${POST_FIELDS}`);
  if (!res.ok) {
    // page > totalPages returns 400 rest_post_invalid_page_number — treat as end
    if (res.status === 400 && page > 1) return { posts: [], totalPages: page - 1 };
    throw new Error(`WP REST ${res.status} fetching posts page ${page}`);
  }
  const posts = await res.json();
  return { posts, totalPages: totalPagesOf(res) };
}

/** id → name for a taxonomy (categories | tags), paginated. */
async function fetchTermNames(base, taxonomy) {
  const names = new Map();
  for (let page = 1; page <= 10; page += 1) {
    const res = await wpGet(base, `${taxonomy}?per_page=100&page=${page}&_fields=id,name`);
    if (!res.ok) {
      if (res.status === 400 && page > 1) break;
      throw new Error(`WP REST ${res.status} fetching ${taxonomy}`);
    }
    for (const t of await res.json()) names.set(t.id, t.name);
    if (page >= totalPagesOf(res)) break;
  }
  return names;
}

/** attachment id → source_url, in chunks of 100 ids. */
async function fetchMediaUrls(base, ids) {
  const urls = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const res = await wpGet(base, `media?per_page=100&include=${chunk.join(',')}&_fields=id,source_url`);
    if (!res.ok) throw new Error(`WP REST ${res.status} fetching media`);
    for (const m of await res.json()) urls.set(m.id, m.source_url);
  }
  return urls;
}

/** Term names + cover URLs are enrichment — a failed lookup degrades to empty, never fails the corpus. */
async function softLookup(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[wordpressBlogService] ${label} lookup failed — continuing without it: ${err.message}`);
    return new Map();
  }
}

/**
 * Rewrite absolute self-referencing links to relative paths.
 * WordPress content links its own posts absolutely
 * (`https://saisatwik.com/<slug>/`), which the frontend link intelligence
 * (`extractLinks` in seoReadability.js) classifies as EXTERNAL — collapsing
 * the internal link graph to 0 edges and marking every post an orphan.
 * Normalizing self-host hrefs to `/<path>` makes the audit's
 * internal/external partition and the Content Relationship Graph behave
 * exactly as they do for Mavro-hosted corpora.
 */
function relativizeSelfLinks(html, base) {
  const host = String(base).replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
  const esc = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(href=["'])https?://(?:www\\.)?${esc}(/[^"']*)?(["'])`, 'gi');
  return String(html).replace(re, (_m, pre, path, post) => `${pre}${path || '/'}${post}`);
}

/** Adapt one WP post into the Blog-document shape the audit engine consumes. */
function adaptPost(post, websiteId, base, lookups) {
  const title = stripHtml(post.title?.rendered || '');
  const excerpt = stripHtml(post.excerpt?.rendered || '');
  const categories = (post.categories || []).map((id) => lookups.categories.get(id)).filter(Boolean);
  const tags = (post.tags || []).map((id) => lookups.tags.get(id)).filter(Boolean);
  const featured = (post.featured_media && lookups.media.get(post.featured_media)) || '';

  return {
    _id: `wp_${post.id}`,
    wpPostId: post.id,
    title,
    slug: post.slug,
    content: relativizeSelfLinks(post.content?.rendered || '', base),
    excerpt,
    // WordPress SEO-plugin meta (Rank Math) isn't exposed over bare REST, so
    // the closest honest mapping: post title as seoTitle, excerpt as
    // seoDescription. The audit's length checks then reflect what search
    // engines actually see when the plugin falls back to these same fields.
    seoTitle: title,
    seoDescription: excerpt,
    keywords: tags,
    tags,
    category: categories[0] || '',
    canonicalUrl: post.link || '',
    featuredImage: featured,
    ogImage: featured,
    status: 'published',
    publishedAt: post.date_gmt ? `${post.date_gmt}Z` : post.date,
    updatedAt: post.modified_gmt ? `${post.modified_gmt}Z` : post.modified,
    createdAt: post.date_gmt ? `${post.date_gmt}Z` : post.date,
    targetWebsite: websiteId,
    source: 'wordpress',
  };
}

async function loadCorpus(base, websiteId) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { posts, totalPages: tp } = await fetchPage(base, page);
    totalPages = Math.min(tp, MAX_PAGES);
    all.push(...posts);
    page += 1;
  } while (page <= totalPages);

  const mediaIds = [...new Set(all.map((p) => p.featured_media).filter(Boolean))];
  const [categories, tags, media] = await Promise.all([
    softLookup('categories', () => fetchTermNames(base, 'categories')),
    softLookup('tags', () => fetchTermNames(base, 'tags')),
    softLookup('media', () => fetchMediaUrls(base, mediaIds)),
  ]);
  return all.map((p) => adaptPost(p, websiteId, base, { categories, tags, media }));
}

/**
 * Fetch + adapt the full published corpus for a WordPress-backed tenant.
 * Cached 1h per origin. Pass { fresh: true } to bypass the cache.
 * Concurrent callers share one in-flight fetch (anomalies + SEO telemetry hit
 * this together), and a failed refresh serves the last good corpus if any.
 */
async function getWordpressBlogs(wordpressUrl, websiteId, { fresh = false } = {}) {
  const base = String(wordpressUrl).replace(/\/+$/, '');
  const hit = cache.get(base);
  if (!fresh && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.blogs;
  if (inflight.has(base)) return inflight.get(base);

  const pending = loadCorpus(base, websiteId)
    .then((blogs) => {
      cache.set(base, { at: Date.now(), blogs });
      return blogs;
    })
    .catch((err) => {
      if (hit) {
        console.warn(`[wordpressBlogService] refresh failed for ${base}, serving cached corpus: ${err.message}`);
        return hit.blogs;
      }
      throw err;
    })
    .finally(() => inflight.delete(base));
  inflight.set(base, pending);
  return pending;
}

/**
 * Sitemap-style URL counts for a WordPress-backed tenant, from real WP REST
 * totals (X-WP-Total headers — one cheap request per post type). WordPress
 * owns the tenant's actual sitemap; the Mavro backend's sitemapService knows
 * nothing about it, which is why the /seo Indexed Pages tile showed 2
 * (homepage + blog index) before this existed. Shape matches
 * `sitemapService.getSitemapStats` so the frontend consumes it unchanged.
 */
async function getWordpressSitemapStats(wordpressUrl, { fresh = false } = {}) {
  const base = String(wordpressUrl).replace(/\/+$/, '');
  const key = `${base}::stats`;
  const hit = cache.get(key);
  if (!fresh && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.stats;

  const count = async (type) => {
    const res = await fetch(`${base}/wp-json/wp/v2/${type}?per_page=1&status=publish&_fields=id`, {
      headers: { 'User-Agent': 'MavroSeoEngine/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return 0;
    return parseInt(res.headers.get('x-wp-total') || '0', 10);
  };

  const [blogUrls, staticUrls] = await Promise.all([count('posts'), count('pages')]);
  const stats = {
    blogUrls,
    staticUrls,
    totalUrls: blogUrls + staticUrls,
    source: 'wordpress',
  };
  cache.set(key, { at: Date.now(), stats });
  return stats;
}

module.exports = { getWordpressBlogs, getWordpressSitemapStats };
