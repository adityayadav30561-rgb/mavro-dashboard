/**
 * Search Engine Ping Service
 *
 * Notifies search engines when sitemaps are updated.
 * Called automatically when blogs are published.
 */

const https = require('https');
const http = require('http');

/**
 * Send an HTTP/HTTPS GET request (fire-and-forget)
 * @param {string} url - URL to ping
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<{success: boolean, url: string, statusCode?: number, error?: string}>}
 */
const httpGet = (url, timeoutMs = 10000) => {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      // Consume response to free up memory
      res.resume();
      resolve({
        success: res.statusCode >= 200 && res.statusCode < 400,
        url,
        statusCode: res.statusCode,
      });
    });
    req.on('error', (err) => {
      resolve({ success: false, url, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, url, error: 'Request timed out' });
    });
  });
};

/**
 * Ping Google with sitemap URL
 * @param {string} sitemapUrl - Full URL to sitemap.xml
 */
const pingGoogle = async (sitemapUrl) => {
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  const result = await httpGet(pingUrl);
  console.log(`📡 [PingService] Google: ${result.success ? '✅' : '❌'} ${sitemapUrl}`);
  return { engine: 'google', ...result };
};

/**
 * Ping Bing with sitemap URL
 * @param {string} sitemapUrl - Full URL to sitemap.xml
 */
const pingBing = async (sitemapUrl) => {
  const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  const result = await httpGet(pingUrl);
  console.log(`📡 [PingService] Bing: ${result.success ? '✅' : '❌'} ${sitemapUrl}`);
  return { engine: 'bing', ...result };
};

/**
 * Ping IndexNow (Bing's instant indexing protocol)
 * @param {string} url - The specific URL that was published
 * @param {string} domain - Website domain
 */
const pingIndexNow = async (url, domain) => {
  // IndexNow requires an API key file hosted on your domain
  // For now, use the standard ping endpoint
  const pingUrl = `https://www.bing.com/indexnow?url=${encodeURIComponent(url)}&key=mavro-indexnow-key`;
  const result = await httpGet(pingUrl);
  console.log(`📡 [PingService] IndexNow: ${result.success ? '✅' : '❌'} ${url}`);
  return { engine: 'indexnow', ...result };
};

/**
 * Ping all search engines with sitemap URL
 * Non-blocking: failures don't throw
 * @param {string} sitemapUrl - Full URL to sitemap.xml
 * @returns {Object[]} Array of ping results
 */
const pingAllEngines = async (sitemapUrl) => {
  const results = await Promise.allSettled([
    pingGoogle(sitemapUrl),
    pingBing(sitemapUrl),
  ]);

  return results.map((r) => (r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message }));
};

/**
 * Auto-ping on blog publish
 * Called from the blog controller when status changes to 'published'
 *
 * @param {Object} blog - Blog document (populated with targetWebsite)
 * @param {Object} website - Website document
 */
const onBlogPublished = async (blog, website) => {
  const domain = website.domain;
  const sitemapUrl = `https://${domain}/sitemap.xml`;
  const blogUrl = `https://${domain}/blog/${blog.slug}`;

  console.log(`🚀 [PingService] Blog published: "${blog.title}" → ${blogUrl}`);

  // Run all pings in parallel (non-blocking)
  const [sitemapResults, indexNowResult] = await Promise.allSettled([
    pingAllEngines(sitemapUrl),
    pingIndexNow(blogUrl, domain),
  ]);

  return {
    blogUrl,
    sitemapUrl,
    sitemapPings: sitemapResults.status === 'fulfilled' ? sitemapResults.value : [],
    indexNow: indexNowResult.status === 'fulfilled' ? indexNowResult.value : null,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  pingGoogle,
  pingBing,
  pingIndexNow,
  pingAllEngines,
  onBlogPublished,
};
