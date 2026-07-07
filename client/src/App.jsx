import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — eager-imported.
// ────────────────────────────────────────────────────────────────────────────
// These are the primary user-facing surfaces (HRMS + Tickets marketing sites).
// They render on first paint for visitors landing from search engines / social
// / paid acquisition, so the bundle for these routes ships in the initial JS
// payload. No Suspense wait, no flash of loading state.
//
// Spanbix moved off this bundle in Phase 6 — the live site is the standalone
// Next.js 16 App Router app at `spanbix-web/` (deployed to www.spanbix.com).
// Legacy `/spanbix/*` requests against the admin host now fall through to the
// NotFound catch-all and the global `<SpanbixLegacyRedirect />` (below) sends
// them to the canonical www host so any stale inbound link still resolves.
// ════════════════════════════════════════════════════════════════════════════
import HrmsLanding from './pages/hrms/HrmsLanding';
import HrmsBlogList from './pages/hrms/HrmsBlogList';
import HrmsBlogDetail from './pages/hrms/HrmsBlogDetail';
import TicketsLanding from './pages/tickets/TicketsLanding';
import TicketsBlogList from './pages/tickets/TicketsBlogList';
import TicketsBlogDetail from './pages/tickets/TicketsBlogDetail';
import PublicBookingAvailabilityPage from './modules/scheduler/pages/PublicBookingAvailabilityPage';
import BookingManagePage from './modules/scheduler/pages/BookingManagePage';
import PublicRoutingPage from './modules/scheduler/pages/PublicRoutingPage';
import NotFound from './pages/NotFound';

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — code-split via React.lazy.
// ────────────────────────────────────────────────────────────────────────────
// The dashboard (BlogForm with React-Quill, Recharts-heavy Analytics, the
// editorial Calendar, SEO Engine, etc.) is large. None of it is needed for
// public visitors. Lazy-loading isolates the admin bundle into its own
// chunks so a Vercel-deployed public-only build can ship a much smaller
// initial JS payload. Admin users pay one short Suspense fallback the first
// time they hit `/login` or any protected route.
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
const CalendarConnectionsPage = lazy(() => import('./modules/scheduler/pages/CalendarConnectionsPage'));
const EventTypesPage = lazy(() => import('./modules/scheduler/pages/EventTypesPage'));
const EventTypeEditorPage = lazy(() => import('./modules/scheduler/pages/EventTypeEditorPage'));
const BookingsPage = lazy(() => import('./modules/scheduler/pages/BookingsPage'));
const WorkflowEditorPage = lazy(() => import('./modules/scheduler/pages/WorkflowEditorPage'));
const WorkflowHistoryPage = lazy(() => import('./modules/scheduler/pages/WorkflowHistoryPage'));
const RoutingFormsPage = lazy(() => import('./modules/scheduler/pages/RoutingFormsPage'));

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
      {/* ──────── Public HRMS marketing site ──────── */}
      <Route path="/hrms" element={<HrmsLanding />} />
      <Route path="/hrms/blog" element={<HrmsBlogList />} />
      <Route path="/hrms/blog/:slug" element={<HrmsBlogDetail />} />

      {/* ──────── Public Ticket Management marketing site ──────── */}
      <Route path="/tickets" element={<TicketsLanding />} />
      <Route path="/tickets/blog" element={<TicketsBlogList />} />
      <Route path="/tickets/blog/:slug" element={<TicketsBlogDetail />} />

      {/* ──────── Legacy /spanbix/* → canonical www.spanbix.com ────────
          Phase 6 cutover: the live Spanbix site is the standalone Next.js app
          at www.spanbix.com (repo: `spanbix-web/`). Stale inbound links to the
          admin host get bounced to the public canonical via a hard browser
          redirect. NotFound shows for ~one frame before the redirect runs. */}
      <Route path="/spanbix/*" element={<SpanbixLegacyRedirect />} />
      <Route path="/spanbix" element={<SpanbixLegacyRedirect />} />

      {/* ──────── Public scheduler booking (Phase 4 availability viewer) ──────── */}
      <Route path="/book/:eventSlug" element={<PublicBookingAvailabilityPage />} />
      <Route path="/:tenantSlug/book/:eventSlug" element={<PublicBookingAvailabilityPage />} />
      <Route path="/manage/:token" element={<BookingManagePage />} />
      <Route path="/route/:slug" element={<PublicRoutingPage />} />

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
        <Route path="mbr/:view?" element={<Suspense fallback={<AdminFallback />}><MbrReport /></Suspense>} />
        <Route path="calendar" element={<Suspense fallback={<AdminFallback />}><Calendar /></Suspense>} />
        <Route path="scheduler/calendar-connections" element={<Suspense fallback={<AdminFallback />}><CalendarConnectionsPage /></Suspense>} />
        <Route path="scheduler/event-types" element={<Suspense fallback={<AdminFallback />}><EventTypesPage /></Suspense>} />
        <Route path="scheduler/event-types/new" element={<Suspense fallback={<AdminFallback />}><EventTypeEditorPage /></Suspense>} />
        <Route path="scheduler/event-types/:id/edit" element={<Suspense fallback={<AdminFallback />}><EventTypeEditorPage /></Suspense>} />
        <Route path="scheduler/bookings" element={<Suspense fallback={<AdminFallback />}><BookingsPage /></Suspense>} />
        <Route path="scheduler/workflows" element={<Suspense fallback={<AdminFallback />}><WorkflowEditorPage /></Suspense>} />
        <Route path="scheduler/workflow-history" element={<Suspense fallback={<AdminFallback />}><WorkflowHistoryPage /></Suspense>} />
        <Route path="scheduler/routing-forms" element={<Suspense fallback={<AdminFallback />}><RoutingFormsPage /></Suspense>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
