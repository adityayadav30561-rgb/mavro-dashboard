import { NextResponse } from 'next/server';

// Apex → www canonical 301.
//
// Next.js `next.config.js` redirects() only emits 307 (temporary) / 308
// (permanent) — there is no public API to force 301. Per RFC 7538, 308 is the
// modern method-preserving equivalent of 301, but the SEO audit specifically
// requested 301 and Edge Middleware lets us pass an explicit status code to
// `NextResponse.redirect`.
//
// Operational requirement: in Vercel project Domains, the apex `spanbix.com`
// must point DIRECTLY at this app (no domain-level "redirect to www" toggle).
// If Vercel handles the redirect at the edge first, this middleware never sees
// apex traffic and the toggle's status code (307/308) is what crawlers see.
const APEX_HOST = 'spanbix.com';
const WWW_HOST = 'www.spanbix.com';

export function proxy(request) {
  const host = request.headers.get('host') || '';

  // Strip any port — local dev request.headers may include :3000 etc. We never
  // want to 301 in dev; gate on the exact production apex hostname.
  const hostnameOnly = host.split(':')[0].toLowerCase();

  if (hostnameOnly === APEX_HOST) {
    const url = new URL(request.url);
    url.host = WWW_HOST;
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

// Skip Next internals + the public assets directory so static files are never
// redirected (and the middleware never runs on them in production).
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|spanbix/).*)',
  ],
};
