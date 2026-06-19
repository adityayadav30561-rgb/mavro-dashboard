/** @type {import('next').NextConfig} */

// ───────────────────────────────────────────────────────────────────────────
// Security headers
// ───────────────────────────────────────────────────────────────────────────
// Applied on every route via `headers()` below. Defaults chosen for the
// Spanbix public marketing + blog surface (no embedded iframes, no third-party
// auth widgets). Tighten further only after verifying the prod page doesn't
// rely on the relaxed source.
//
//   - CSP: blocks any cross-origin script / iframe / object injection while
//     still allowing what Next 16 + Vercel + Google Fonts actually need. The
//     `'unsafe-inline'` + `'unsafe-eval'` carve-outs are required for Next's
//     runtime + framer-motion until a nonce-based CSP is wired (separate
//     refactor — would need middleware to inject the nonce on every render).
//   - HSTS: `max-age=63072000` (2 years) + includeSubDomains + preload — the
//     value required by hstspreload.org before they accept the domain.
//   - frame-ancestors / X-Frame-Options DENY: this site is never embedded.
//   - Referrer-Policy: strict-origin-when-cross-origin lets analytics see the
//     source domain but never the path.
//   - Permissions-Policy: explicitly drops every interactive sensor Spanbix
//     does not use.
//
// Connect-src includes the Render backend (contact form posts + future client
// API calls) and Vercel's web-vitals endpoint. Add any new third-party origin
// here before its first request — otherwise CSP will silently block it.
const RENDER_BACKEND_ORIGIN = 'https://mavro-dashboard.onrender.com';

const csp = [
  "default-src 'self'",
  // Vercel injects its analytics script at runtime; framer-motion + Next
  // hydration require inline + eval until we ship a nonce-based CSP.
  // Google Tag Manager loads gtm.js + (via GTM) the GA4 gtag and Google Ads
  // conversion scripts. These hosts are required for GTM/GA4/Ads to run.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://va.vercel-scripts.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // featuredImage + ogImage may live on any HTTPS host (we don't control where
  // editors upload); data:/blob: covers next/image local placeholders. Open
  // https: also covers GA4/Ads conversion pixels.
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  // GA4 measurement + Google Ads beacons post here; GTM container fetch + the
  // doubleclick endpoints handle conversion + remarketing pings.
  `connect-src 'self' ${RENDER_BACKEND_ORIGIN} https://vitals.vercel-insights.com https://*.vercel-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net https://www.google.com`,
  "media-src 'self'",
  "object-src 'none'",
  // Google Maps embed on /contact uses an iframe served from www.google.com
  // (and a couple of map subdomains it loads internally). googletagmanager +
  // doubleclick are needed for GTM preview mode + Ads conversion iframes.
  // Keep the allow-list tight — no broad wildcards.
  "frame-src 'self' https://www.google.com https://maps.google.com https://www.googletagmanager.com https://td.doubleclick.net",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Auto-upgrade any accidental http://… reference to https://… instead of
  // mixed-content blocking it outright.
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'autoplay=(self)',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'picture-in-picture=()',
      'usb=()',
      'xr-spatial-tracking=()',
    ].join(', '),
  },
  // Disable Vercel's automatic "X-Powered-By: Next.js" advertising header.
  // (Mirrored by `poweredByHeader: false` below — header() can't unset it.)
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Stable brand assets in /public/spanbix (logos, partner PNGs, hero
        // video). Filenames aren't content-hashed, so NOT `immutable` — fresh
        // for a day, then serve-stale-while-revalidate for a month so a swapped
        // asset still propagates. Next's own /_next/static (hashed) is already
        // served immutable by the framework — don't duplicate that here.
        source: '/spanbix/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=2592000',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The legacy Vite Spanbix site lived under /spanbix/*. This standalone
      // Next app is root-relative, so permanently (308) forward /spanbix/foo →
      // /foo. Bare /spanbix needs its own rule: with `/:path*` an empty path
      // yields an empty destination (no leading slash), so map it to / first —
      // mirrors the old SpanbixApp.jsx LegacyRedirect `|| '/'` fallback.
      //
      // The `(?!.*\\.)` negative-lookahead restricts the catch-all to legacy
      // PAGE paths only (no file extension). Static assets still live under the
      // /spanbix/ URL namespace (public/spanbix/**, referenced as /spanbix/x.png)
      // — without this guard the redirect would 308 every image/video/logo away
      // to a non-existent root path.
      //
      // Apex → www canonical redirect is handled in `src/middleware.js` so it
      // can emit an explicit 301 (Next's redirects() only emits 307/308).
      {
        source: '/spanbix',
        destination: '/',
        permanent: true,
      },
      {
        source: '/spanbix/:path((?!.*\\.).*)',
        destination: '/:path',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
