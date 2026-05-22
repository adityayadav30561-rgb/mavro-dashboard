import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ════════════════════════════════════════════════════════════════════════════
// Vite config
// ────────────────────────────────────────────────────────────────────────────
// - Dev proxy still targets a local Express on :5000 (matches `npm run dev`).
//   When VITE_API_BASE_URL is set in `.env.development` we skip the proxy and
//   let axios hit the absolute URL directly — useful for testing against a
//   remote staging backend from a local dev server.
// - Build emits predictable chunk names so the Vercel deploy can cache them
//   aggressively (`max-age=31536000, immutable`, see vercel.json).
// - Manual chunks split heavy admin-only deps into their own chunks so the
//   public bundle stays small. Lazy routes (App.jsx) already isolate admin
//   pages into separate chunks; this tightens the split for the vendor side.
// ════════════════════════════════════════════════════════════════════════════
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useExternalApi = !!env.VITE_API_BASE_URL;

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 5173,
      // Only wire up the dev proxy when we want same-origin paths. If the dev
      // env points at a remote backend (VITE_API_BASE_URL set), the axios
      // baseURL is already absolute and the proxy would be a no-op.
      proxy: useExternalApi
        ? undefined
        : {
            '/api': { target: 'http://localhost:5000', changeOrigin: true },
            '/sitemap': { target: 'http://localhost:5000', changeOrigin: true },
            '/robots': { target: 'http://localhost:5000', changeOrigin: true },
          },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Bump the chunk-size warning so the rich-text editor + Recharts chunks
      // don't spam the build log; both are already isolated via dynamic imports.
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Predictable chunk names enable long-term caching on Vercel's CDN.
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            // Keep React + Router in the framework chunk shared by every route.
            if (id.match(/[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/)) {
              return 'vendor-react';
            }
            // Framer Motion is used by both public and admin surfaces.
            if (id.includes('framer-motion')) return 'vendor-motion';
            // Recharts is admin-only (analytics dashboards) — keeping it in
            // its own chunk means the public bundle never downloads it.
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            // React-Quill is editor-only.
            if (id.includes('react-quill-new') || id.includes('quill')) return 'vendor-editor';
            // Radix UI primitives — admin-heavy.
            if (id.includes('@radix-ui')) return 'vendor-radix';
            // Everything else from node_modules bundles into the default vendor.
            return 'vendor';
          },
        },
      },
    },
  };
});
