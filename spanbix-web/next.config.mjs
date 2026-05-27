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
      {
        source: '/spanbix',
        destination: '/',
        permanent: true,
      },
      {
        source: '/spanbix/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
