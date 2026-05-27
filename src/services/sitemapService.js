/**
 * Enhanced Sitemap Service
 *
 * Generates XML sitemaps, sitemap indexes, and robots.txt
 * for each Mavro website dynamically.
 */

const { Blog, Website, SeoMetadata } = require('../models');

// ===================================
// XML Helpers
// ===================================
const escapeXml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Build a clean `https://<host>` base from a stored Website.domain that may
 * carry a scheme and/or trailing slash (e.g. `https://spanbix.vercel.app/`).
 * Without this, `https://${website.domain}` produces `https://https://…//`.
 */
const buildBaseUrl = (domain) => {
  const host = String(domain || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  return `https://${host}`;
};

const xmlUrl = ({ loc, lastmod, changefreq = 'weekly', priority = '0.5', images = [] }) => {
  let entry = '  <url>\n';
  entry += `    <loc>${escapeXml(loc)}</loc>\n`;
  if (lastmod) entry += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
  entry += `    <changefreq>${changefreq}</changefreq>\n`;
  entry += `    <priority>${priority}</priority>\n`;
  // Image sitemap extension
  for (const img of images) {
    entry += '    <image:image>\n';
    entry += `      <image:loc>${escapeXml(img.loc)}</image:loc>\n`;
    if (img.title) entry += `      <image:title>${escapeXml(img.title)}</image:title>\n`;
    entry += '    </image:image>\n';
  }
  entry += '  </url>\n';
  return entry;
};

// ===================================
// Sitemap Generation
// ===================================

/**
 * Generate full sitemap XML for a website (by slug)
 * Includes: homepage, SEO-configured pages, and published blogs
 */
const generateSitemapBySlug = async (websiteSlug) => {
  const website = await Website.findOne({ slug: websiteSlug, status: 'active' });
  if (!website) return null;

  return generateSitemap(website._id, website);
};

/**
 * Generate sitemap XML for a website (by ID)
 * @param {string} websiteId
 * @param {Object} [website] - Pre-fetched website doc (optimization)
 * @returns {string} XML sitemap
 */
const generateSitemap = async (websiteId, website = null) => {
  if (!website) {
    website = await Website.findById(websiteId);
    if (!website) throw new Error('Website not found');
  }

  const baseUrl = buildBaseUrl(website.domain);

  // Fetch published blogs and SEO-configured pages in parallel
  const [blogs, seoPages] = await Promise.all([
    Blog.find({ targetWebsite: websiteId, status: 'published' })
      .select('slug publishedAt updatedAt featuredImage title')
      .sort({ publishedAt: -1 })
      .lean(),
    SeoMetadata.find({ website: websiteId, includeInSitemap: true, isActive: true })
      .select('pagePath sitemapPriority sitemapChangefreq updatedAt')
      .lean(),
  ]);

  // Build URL set tracking which paths are already covered by SEO entries
  const seoPaths = new Set(seoPages.map((p) => p.pagePath));

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // 1. Homepage (always included unless SEO page overrides it)
  if (!seoPaths.has('/')) {
    xml += xmlUrl({ loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' });
  }

  // 2. SEO-configured pages (explicit entries from admin)
  for (const page of seoPages) {
    xml += xmlUrl({
      loc: `${baseUrl}${page.pagePath}`,
      lastmod: page.updatedAt,
      changefreq: page.sitemapChangefreq || 'weekly',
      priority: String(page.sitemapPriority || 0.5),
    });
  }

  // 3. Blog listing page (if not in SEO pages)
  if (!seoPaths.has('/blog') && blogs.length > 0) {
    xml += xmlUrl({
      loc: `${baseUrl}/blog`,
      lastmod: blogs[0]?.publishedAt || blogs[0]?.updatedAt,
      changefreq: 'daily',
      priority: '0.7',
    });
  }

  // 4. Individual blog posts
  for (const blog of blogs) {
    const images = [];
    if (blog.featuredImage) {
      images.push({ loc: blog.featuredImage, title: blog.title });
    }
    xml += xmlUrl({
      loc: `${baseUrl}/blog/${blog.slug}`,
      lastmod: blog.updatedAt || blog.publishedAt,
      changefreq: 'monthly',
      priority: '0.8',
      images,
    });
  }

  xml += '</urlset>';
  return xml;
};

// ===================================
// Sitemap Index (for sites with many URLs)
// ===================================

/**
 * Generate a sitemap index listing all website sitemaps
 * Useful when serving from the central admin domain
 */
const generateSitemapIndex = async (adminDomain) => {
  const websites = await Website.find({ status: 'active' }).select('slug updatedAt').lean();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const site of websites) {
    xml += '  <sitemap>\n';
    xml += `    <loc>https://${adminDomain}/sitemap/${site.slug}.xml</loc>\n`;
    xml += `    <lastmod>${new Date(site.updatedAt).toISOString()}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }

  xml += '</sitemapindex>';
  return xml;
};

// ===================================
// Robots.txt Generation
// ===================================

/**
 * Generate robots.txt for a website
 * @param {string} websiteSlug
 * @returns {string|null} robots.txt content
 */
const generateRobotsTxt = async (websiteSlug) => {
  const website = await Website.findOne({ slug: websiteSlug, status: 'active' });
  if (!website) return null;

  const baseUrl = buildBaseUrl(website.domain);

  let robots = '# Robots.txt generated by Mavro Admin\n';
  robots += `# Website: ${website.name}\n\n`;
  robots += 'User-agent: *\n';
  robots += 'Allow: /\n';
  robots += 'Disallow: /admin/\n';
  robots += 'Disallow: /api/\n';
  robots += 'Disallow: /private/\n';
  robots += 'Disallow: /*.json$\n\n';
  robots += '# Crawl-delay (be polite)\n';
  robots += 'Crawl-delay: 1\n\n';
  robots += '# Sitemap\n';
  robots += `Sitemap: ${baseUrl}/sitemap.xml\n`;

  // Also include SEO pages that are noindex as disallowed
  const noindexPages = await SeoMetadata.find({
    website: website._id,
    robotsIndex: false,
    isActive: true,
  }).select('pagePath').lean();

  if (noindexPages.length > 0) {
    robots += '\n# Noindex pages\n';
    for (const page of noindexPages) {
      robots += `Disallow: ${page.pagePath}\n`;
    }
  }

  return robots;
};

// ===================================
// URL Count Stats (for dashboard)
// ===================================

/**
 * Get URL counts for a sitemap (without generating XML)
 */
const getSitemapStats = async (websiteId) => {
  const [blogCount, seoPageCount] = await Promise.all([
    Blog.countDocuments({ targetWebsite: websiteId, status: 'published' }),
    SeoMetadata.countDocuments({ website: websiteId, includeInSitemap: true, isActive: true }),
  ]);

  return {
    blogUrls: blogCount,
    staticUrls: seoPageCount + 2, // +2 for homepage and blog index
    totalUrls: blogCount + seoPageCount + 2,
  };
};

module.exports = {
  generateSitemap,
  generateSitemapBySlug,
  generateSitemapIndex,
  generateRobotsTxt,
  getSitemapStats,
};
