import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// ════════════════════════════════════════════════════════════════════════════
// Vite config — build-target aware.
// ────────────────────────────────────────────────────────────────────────────
// VITE_BUILD_TARGET selects which entry point + HTML shell to build:
//
//   full     (default) — index.html → src/main.jsx → App.jsx
//                        Mavro Console + every public site (HRMS / Tickets /
//                        Spanbix) under one bundle. Used for the current
//                        admin host (mavro-dashboard.* / dashboard.mavro.com).
//
//   spanbix            — index.spanbix.html → src/entries/spanbix.jsx →
//                        SpanbixApp.jsx
//                        Standalone Spanbix bundle for spanbix.com /
//                        spanbix.vercel.app. NO admin, NO HRMS, NO Tickets
//                        code in the output.
//
//   hrms     (future)  — index.hrms.html → src/entries/hrms.jsx → HrmsApp
//   tickets  (future)  — index.tickets.html → src/entries/tickets.jsx → TicketsApp
//
// After build the rename plugin promotes the target-specific HTML to
// `dist/index.html` so Vercel serves it as the default document for `/`.
// ════════════════════════════════════════════════════════════════════════════

const TARGET = process.env.VITE_BUILD_TARGET || 'full';

const ENTRY_HTML = {
  full: 'index.html',
  spanbix: 'index.spanbix.html',
  hrms: 'index.hrms.html',
  tickets: 'index.tickets.html',
};

function renamePromotedHtmlPlugin(outDir, entryHtmlName) {
  return {
    name: 'mavro-promote-target-html',
    apply: 'build',
    closeBundle() {
      if (entryHtmlName === 'index.html') return;
      const sourcePath = path.resolve(outDir, entryHtmlName);
      const targetPath = path.resolve(outDir, 'index.html');
      try {
        if (fs.existsSync(sourcePath)) {
          // Remove any stale index.html from a previous build of a different target.
          if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
          fs.renameSync(sourcePath, targetPath);
          // eslint-disable-next-line no-console
          console.log(`📦 Promoted ${entryHtmlName} → index.html for target=${TARGET}`);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️  Could not promote ${entryHtmlName} → index.html:`, err.message);
      }
    },
  };
}

// Vite's dev server always serves `<root>/index.html` for HTML requests,
// regardless of build.rollupOptions.input. Without this plugin, `npm run
// dev:spanbix` would still ship the full Mavro Console because index.html
// loads /src/main.jsx. The middleware below intercepts every HTML request
// in dev and substitutes the target-specific HTML file's content (after
// Vite's transformIndexHtml hook so HMR + plugins still apply).
function devTargetHtmlPlugin(entryHtmlName, projectRoot) {
  return {
    name: 'mavro-dev-target-html',
    apply: 'serve',
    configureServer(server) {
      if (entryHtmlName === 'index.html') return;
      const filePath = path.resolve(projectRoot, entryHtmlName);

      // Install BEFORE Vite's internal HTML middleware so our handler
      // wins for `/`, `/index.html`, and SPA-fallback HTML requests.
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '/';
        const url = rawUrl.split('?')[0];
        const accept = req.headers.accept || '';
        const isHtmlRequest =
          url === '/' ||
          url === '/index.html' ||
          (!path.extname(url) && accept.includes('text/html'));

        if (isHtmlRequest && fs.existsSync(filePath)) {
          try {
            let html = fs.readFileSync(filePath, 'utf-8');
            html = await server.transformIndexHtml(req.originalUrl || url, html);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
            return;
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(`⚠️  dev-target-html failed for ${url}:`, err.message);
          }
        }
        next();
      });

      // eslint-disable-next-line no-console
      console.log(`🎯 Dev serving ${entryHtmlName} for VITE_BUILD_TARGET=${TARGET}`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useExternalApi = !!env.VITE_API_BASE_URL;
  const entryHtml = ENTRY_HTML[TARGET] || ENTRY_HTML.full;
  const outDir = path.resolve(__dirname, 'dist');

  return {
    plugins: [
      react(),
      devTargetHtmlPlugin(entryHtml, __dirname),
      renamePromotedHtmlPlugin(outDir, entryHtml),
    ],
    // `define` pins VITE_BUILD_TARGET into the bundle so client code that
    // imports it (e.g. `lib/routeBase.js`) gets the build-time value even
    // when `.env` doesn't carry it.
    define: {
      'import.meta.env.VITE_BUILD_TARGET': JSON.stringify(TARGET),
    },
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
      emptyOutDir: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        // Each build target ships exactly one HTML entry. Vite uses the file
        // path (relative to project root) and emits the same basename in dist;
        // the rename plugin above promotes it to index.html when needed.
        input: path.resolve(__dirname, entryHtml),
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          // Default Rollup code-splitting. We previously had aggressive manual
          // chunking (vendor-react / vendor-motion / vendor-charts / etc.)
          // which produced the "Cannot read properties of undefined (reading
          // 'createContext')" runtime crash in production: libraries like
          // framer-motion evaluate `React.createContext(...)` at module-init
          // time, and when they live in a separate chunk from React itself,
          // module execution order is not guaranteed — React can be `undefined`
          // when motion's chunk runs. Letting Rollup auto-split keeps every
          // React peer co-located with React in the same chunk, eliminating
          // the race. The trade-off (one big vendor chunk vs. several smaller
          // ones) is acceptable; admin-only deps (Recharts, Quill, Radix) are
          // already absent from the Spanbix build because SpanbixApp.jsx
          // never imports them. Admin lazy-load splits in App.jsx still isolate
          // admin routes from the public bundle in the `full` target.
        },
      },
    },
  };
});
