/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
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
