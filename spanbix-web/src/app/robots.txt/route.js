import { apiBase } from '@/lib/apiBase';

// robots.txt proxied from the Express backend (sitemapService.generateRobotsTxt)
// so the disallow list + any per-page noindex entries + the Sitemap: pointer
// stay in one place. The backend emits `Sitemap: https://<domain>/sitemap.xml`,
// which resolves to the proxied sitemap route alongside this one. A static
// allow-all fallback is served if the backend is unreachable so crawlers never
// hit a 5xx on robots.txt.
export const revalidate = 3600;

export async function GET() {
  const upstream = `${apiBase()}/robots/spanbix.txt`;
  try {
    // Tagged so api/revalidate can bust this proxied body via revalidateTag('robots').
    const res = await fetch(upstream, { next: { revalidate: 3600, tags: ['robots'] } });
    if (!res.ok) {
      return new Response('User-agent: *\nAllow: /\n', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    const txt = await res.text();
    return new Response(txt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response('User-agent: *\nAllow: /\n', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
