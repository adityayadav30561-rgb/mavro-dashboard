/**
 * On-Demand ISR Revalidation Service
 *
 * Notifies the standalone Spanbix Next.js site (spanbix-web) the moment a blog
 * flips to `published`, so its statically-generated blog pages regenerate
 * within seconds — no redeploy required.
 *
 * Fire-and-forget by contract:
 *   - Short timeout; never throws; never blocks the publish response.
 *   - Silent no-op when SPANBIX_WEB_URL / REVALIDATE_SECRET are unset
 *     (local dev, or a backend not paired with the Next site).
 *   - Tenant-agnostic: posts the slug regardless of tenant. The Next endpoint
 *     simply revalidates `/blog/<slug>` — harmless for non-Spanbix slugs.
 */

const https = require('https');
const http = require('http');

const TIMEOUT_MS = 4000;

/**
 * Fire a revalidation POST for a published blog slug.
 * @param {string} slug - Blog slug to revalidate (`/blog/<slug>`)
 * @returns {Promise<{revalidated: boolean, [k: string]: any}>} never rejects
 */
const revalidateBlog = (slug) => {
  const base = process.env.SPANBIX_WEB_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!base || !secret) {
    return Promise.resolve({ revalidated: false, reason: 'not-configured' });
  }

  return new Promise((resolve) => {
    let url;
    try {
      url = new URL('/api/revalidate', base);
    } catch (err) {
      console.error('🔄 [revalidate] invalid SPANBIX_WEB_URL:', err.message);
      return resolve({ revalidated: false, reason: 'bad-url' });
    }

    const payload = JSON.stringify({ slug, secret });
    const lib = url.protocol === 'https:' ? https : http;

    const req = lib.request(
      url,
      {
        method: 'POST',
        timeout: TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        res.resume(); // drain to free the socket
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        console.log(`🔄 [revalidate] ${slug}: ${ok ? '✅' : '❌'} ${res.statusCode}`);
        resolve({ revalidated: ok, statusCode: res.statusCode });
      }
    );

    req.on('error', (err) => {
      console.error(`🔄 [revalidate] ${slug} failed:`, err.message);
      resolve({ revalidated: false, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      console.error(`🔄 [revalidate] ${slug} timed out after ${TIMEOUT_MS}ms`);
      resolve({ revalidated: false, error: 'timeout' });
    });

    req.write(payload);
    req.end();
  });
};

module.exports = { revalidateBlog };
