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

/** Fetch one page of posts. Returns { posts, totalPages }. */
async function fetchPage(base, page) {
  const url =
    `${base}/wp-json/wp/v2/posts?status=publish&per_page=100&page=${page}` +
    `&_embed=wp:term,wp:featuredmedia`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MavroSeoEngine/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    // page > totalPages returns 400 rest_post_invalid_page_number — treat as end
    if (res.status === 400 && page > 1) return { posts: [], totalPages: page - 1 };
    throw new Error(`WP REST ${res.status} fetching posts page ${page}`);
  }
  const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
  const posts = await res.json();
  return { posts, totalPages };
}

/** Adapt one WP post into the Blog-document shape the audit engine consumes. */
function adaptPost(post, websiteId) {
  const title = stripHtml(post.title?.rendered || '');
  const excerpt = stripHtml(post.excerpt?.rendered || '');
  const terms = post._embedded?.['wp:term'] || [];
  const categories = (terms[0] || []).map((t) => t.name).filter(Boolean);
  const tags = (terms[1] || []).map((t) => t.name).filter(Boolean);
  const featured = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';

  return {
    _id: `wp_${post.id}`,
    wpPostId: post.id,
    title,
    slug: post.slug,
    content: post.content?.rendered || '',
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

/**
 * Fetch + adapt the full published corpus for a WordPress-backed tenant.
 * Cached 1h per origin. Pass { fresh: true } to bypass the cache.
 */
async function getWordpressBlogs(wordpressUrl, websiteId, { fresh = false } = {}) {
  const base = String(wordpressUrl).replace(/\/+$/, '');
  const hit = cache.get(base);
  if (!fresh && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.blogs;

  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { posts, totalPages: tp } = await fetchPage(base, page);
    totalPages = Math.min(tp, MAX_PAGES);
    all.push(...posts);
    page += 1;
  } while (page <= totalPages);

  const blogs = all.map((p) => adaptPost(p, websiteId));
  cache.set(base, { at: Date.now(), blogs });
  return blogs;
}

module.exports = { getWordpressBlogs };
