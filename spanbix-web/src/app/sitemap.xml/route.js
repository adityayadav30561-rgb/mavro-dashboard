import { apiBase } from '@/lib/apiBase';

// The Express backend (sitemapService.generateSitemap) already enumerates every
// published Spanbix blog with <lastmod> + <image:image> entries plus the static
// marketing URLs. Proxy that canonical XML so spanbix.com/sitemap.xml serves it
// — no second sitemap implementation to drift out of sync. ISR caches the
// proxied body for 5 min; on-demand revalidation keeps the blog pages fresh and
// a sitemap that lags by ≤5 min is fine for crawlers.
export const revalidate = 300;

export async function GET() {
  const upstream = `${apiBase()}/sitemap/spanbix.xml`;
  try {
    const res = await fetch(upstream, { next: { revalidate: 300 } });
    if (!res.ok) {
      return new Response('Sitemap unavailable', { status: 502 });
    }
    const xml = await res.text();
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return new Response('Sitemap unavailable', { status: 502 });
  }
}
