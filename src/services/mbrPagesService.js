/**
 * "Pages built this month" — the MBR Pages deliverable, source-aware:
 *
 *  - WordPress sources (source.wordpressUrl set): pulled live from the public
 *    WP REST API (/wp-json/wp/v2/pages) — `date` is the exact publish date,
 *    so attribution is authoritative. Blog POSTS are a different WP type and
 *    never appear here.
 *
 *  - Registry sources (source.websiteSlug set, e.g. spanbix): read from our
 *    own SeoMetadata rows. Every Spanbix static page is seeded via
 *    SPANBIX_STATIC_PAGES (seedSpanbix.js) — the same list that feeds the
 *    sitemap — and the row's createdAt is the deploy that introduced it.
 *    Pushing a new page = adding it to SPANBIX_STATIC_PAGES → next boot
 *    upserts the row → the page lands in that month automatically.
 *    `/blog*` paths are excluded (blogs are not pages).
 */

const SeoMetadata = require('../models/SeoMetadata');
const Website = require('../models/Website');

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map();

async function fetchWordpress(baseUrl, type) {
  const cacheKey = `wp:${type}:${baseUrl}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.items;

  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `${baseUrl.replace(/\/$/, '')}/wp-json/wp/v2/${type}?per_page=100&page=${page}&status=publish&_fields=link,title,date`;
    const res = await fetch(url, { headers: { 'User-Agent': 'MavroMBR/1.0' } });
    if (!res.ok) {
      if (page === 1) throw new Error(`WordPress API ${res.status} for ${baseUrl}`);
      break; // past last page
    }
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < 100) break;
  }

  const items = all.map((p) => ({
    path: String(p.link || '').replace(/^https?:\/\/[^/]+/, '') || '/',
    title: p.title?.rendered || '',
    builtAt: p.date || null,
  }));
  cache.set(cacheKey, { items, expiresAt: Date.now() + CACHE_TTL_MS });
  return items;
}

const fetchWordpressPages = (baseUrl) => fetchWordpress(baseUrl, 'pages');
const fetchWordpressPosts = (baseUrl) => fetchWordpress(baseUrl, 'posts');

async function registryPages(websiteSlug) {
  const website = await Website.findOne({ slug: websiteSlug }).select('_id').lean();
  if (!website) return [];
  const rows = await SeoMetadata.find({ website: website._id })
    .select('pagePath title createdAt')
    .lean();
  return rows
    .filter((r) => !String(r.pagePath).startsWith('/blog'))
    .map((r) => ({ path: r.pagePath, title: r.title || '', builtAt: r.createdAt }));
}

/**
 * @param {object} source  MBR source config
 * @param {{startDate, endDate}} range  current period (YYYY-MM-DD)
 * @returns {{method: string, pages: [{path,title,builtAt}]}}
 */
async function getBuiltPages(source, range) {
  let pages = [];
  let method = 'none';

  if (source.wordpressUrl) {
    pages = await fetchWordpressPages(source.wordpressUrl);
    method = 'wordpress';
  } else if (source.websiteSlug) {
    pages = await registryPages(source.websiteSlug);
    method = 'registry';
  }

  const lo = `${range.startDate}T00:00:00`;
  const hi = `${range.endDate}T23:59:59`;
  const inRange = pages.filter((p) => {
    if (!p.builtAt) return false;
    const iso = new Date(p.builtAt).toISOString().slice(0, 19);
    return iso >= lo && iso <= hi;
  });

  inRange.sort((a, b) => new Date(a.builtAt) - new Date(b.builtAt));
  return { method, pages: inRange };
}

/**
 * Blog posts published in the period for a WordPress source.
 * (Mavro-tenant sources read the Blog collection instead — see controller.)
 */
async function getWordpressBlogs(source, range) {
  if (!source.wordpressUrl) return null;
  const posts = await fetchWordpressPosts(source.wordpressUrl);
  const lo = `${range.startDate}T00:00:00`;
  const hi = `${range.endDate}T23:59:59`;
  const inRange = posts.filter((p) => {
    if (!p.builtAt) return false;
    const iso = new Date(p.builtAt).toISOString().slice(0, 19);
    return iso >= lo && iso <= hi;
  });
  inRange.sort((a, b) => new Date(b.builtAt) - new Date(a.builtAt));
  return inRange.map((p) => ({ title: p.title, path: p.path, publishedAt: p.builtAt }));
}

module.exports = { getBuiltPages, getWordpressBlogs };
