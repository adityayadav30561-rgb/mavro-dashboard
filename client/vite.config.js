import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ════════════════════════════════════════════════════════════════════════════
// Vite config — Mavro Console (admin + HRMS + Tickets public sites).
// ────────────────────────────────────────────────────────────────────────────
// The multi-target build-switcher (VITE_BUILD_TARGET) was retired in Phase 6
// when Spanbix moved to its own standalone Next.js app at `spanbix-web/`.
// This file now ships a single bundle for `index.html → src/main.jsx → App.jsx`
// covering the Mavro admin dashboard plus the HRMS + Tickets public marketing
// sites at `/hrms*` and `/tickets*`. The Spanbix entry / shell / pages /
// components / route base / spanbix design system have all been deleted.
//
// If HRMS or Tickets ever need their own SSR deploy, follow the spanbix-web
// blueprint — a new sibling Next.js project, NOT a re-introduction of the
// build-target machinery here.
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
            '/api':     { target: 'http://localhost:5000', changeOrigin: true },
            '/sitemap': { target: 'http://localhost:5000', changeOrigin: true },
            '/robots':  { target: 'http://localhost:5000', changeOrigin: true },
          },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      emptyOutDir: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          // Default Rollup code-splitting. Aggressive manual chunking
          // (vendor-react / vendor-motion / vendor-charts / etc.) previously
          // produced the "Cannot read properties of undefined (reading
          // 'createContext')" runtime crash in production: libraries like
          // framer-motion + react-hot-toast call React.createContext at
          // module load, and a chunk that imports them but races React's
          // initialisation has no React global yet. Letting Rollup keep
          // React co-located with its peer libraries fixes the race.
        },
      },
    },
  };
});
