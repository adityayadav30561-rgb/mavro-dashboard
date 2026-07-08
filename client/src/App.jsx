import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import NotFound from './pages/NotFound';

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — code-split via React.lazy.
// ────────────────────────────────────────────────────────────────────────────
// This bundle is now admin-only. The public marketing surfaces live elsewhere:
//   - Spanbix   → standalone Next.js app at `spanbix-web/` (www.spanbix.com)
//   - SaiSatwik → external WordPress install (saisatwik.com, Divi theme)
// The legacy HRMS + Tickets Vite marketing sites were removed in July 2026 —
// only Spanbix and SaiSatwik are live tenants. Lazy-loading keeps each admin
// surface (Quill-heavy BlogForm, Recharts-heavy Analytics, the editorial
// Calendar, SEO Engine) in its own chunk.
// ════════════════════════════════════════════════════════════════════════════
const Login = lazy(() => import('./pages/Login'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BlogList = lazy(() => import('./pages/blogs/BlogList'));
const BlogForm = lazy(() => import('./pages/blogs/BlogForm'));
const LeadList = lazy(() => import('./pages/leads/LeadList'));
const WebsiteList = lazy(() => import('./pages/websites/WebsiteList'));
const SeoEngine = lazy(() => import('./pages/SeoEngine'));
const Analytics = lazy(() => import('./pages/Analytics'));
const MbrReport = lazy(() => import('./pages/MbrReport'));
const Calendar = lazy(() => import('./pages/Calendar'));
const PremiumTestDashboard = lazy(() => import('./pages/PremiumTestDashboard'));

// Lightweight Suspense fallback for the lazy admin chunks. Matches the
// AuthContext's loading spinner so the visual is consistent.
function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Hard-redirects `/spanbix/<path>` → `https://www.spanbix.com/<path>`. Runs on
// mount; preserves search + hash so deep links survive the cutover. React
// Router's <Navigate> can't issue cross-origin redirects, so we go through
// `window.location.replace` to also drop the legacy path from history.
const SPANBIX_CANONICAL_ORIGIN = 'https://www.spanbix.com';
function SpanbixLegacyRedirect() {
  if (typeof window !== 'undefined') {
    const { pathname, search, hash } = window.location;
    const trimmed = pathname.replace(/^\/spanbix\/?/, '/').replace(/\/+$/, '') || '/';
    window.location.replace(SPANBIX_CANONICAL_ORIGIN + trimmed + search + hash);
  }
  return null;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ──────── Legacy /spanbix/* → canonical www.spanbix.com ────────
          Phase 6 cutover: the live Spanbix site is the standalone Next.js app
          at www.spanbix.com (repo: `spanbix-web/`). Stale inbound links to the
          admin host get bounced to the public canonical via a hard browser
          redirect. NotFound shows for ~one frame before the redirect runs. */}
      <Route path="/spanbix/*" element={<SpanbixLegacyRedirect />} />
      <Route path="/spanbix" element={<SpanbixLegacyRedirect />} />

      {/* ──────── Admin surfaces (code-split, lazy-loaded) ──────── */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<AdminFallback />}>
            {user ? <Navigate to="/" replace /> : <Login />}
          </Suspense>
        }
      />
      <Route
        path="/test-ui"
        element={
          <Suspense fallback={<AdminFallback />}>
            <PremiumTestDashboard />
          </Suspense>
        }
      />
      <Route
        element={
          <Suspense fallback={<AdminFallback />}>
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          </Suspense>
        }
      >
        <Route index element={<Suspense fallback={<AdminFallback />}><Dashboard /></Suspense>} />
        <Route path="blogs" element={<Suspense fallback={<AdminFallback />}><BlogList /></Suspense>} />
        <Route path="blogs/new" element={<Suspense fallback={<AdminFallback />}><BlogForm /></Suspense>} />
        <Route path="blogs/:id/edit" element={<Suspense fallback={<AdminFallback />}><BlogForm /></Suspense>} />
        <Route path="leads" element={<Suspense fallback={<AdminFallback />}><LeadList /></Suspense>} />
        <Route path="websites" element={<Suspense fallback={<AdminFallback />}><WebsiteList /></Suspense>} />
        <Route path="seo" element={<Suspense fallback={<AdminFallback />}><SeoEngine /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<AdminFallback />}><Analytics /></Suspense>} />
        <Route path="mbr/:view?/:sub?" element={<Suspense fallback={<AdminFallback />}><MbrReport /></Suspense>} />
        <Route path="calendar" element={<Suspense fallback={<AdminFallback />}><Calendar /></Suspense>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
