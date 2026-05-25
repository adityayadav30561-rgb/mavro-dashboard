import { Routes, Route, Navigate } from 'react-router-dom';

// ════════════════════════════════════════════════════════════════════════════
// SpanbixApp — standalone Spanbix routing tree.
// ────────────────────────────────────────────────────────────────────────────
// Active when the frontend is built with VITE_BUILD_TARGET=spanbix.
// Routes mount Spanbix at the ROOT (`/`, `/courses`, `/blog`, etc.) — no
// `/spanbix` prefix — so the production hostname (spanbix.com /
// spanbix.vercel.app) serves clean canonical URLs.
//
// In the `full` build target this file is unused — App.jsx handles routing
// for Mavro Console + all public sites with the legacy `/spanbix/*` mount.
//
// Every Spanbix component already emits Link `to` values through
// `withSpanbixBase()` from `lib/routeBase.js`, so the same components work
// transparently under either build target.
// ════════════════════════════════════════════════════════════════════════════

import SpanbixLanding from './pages/spanbix/SpanbixLanding';
import SpanbixCourses from './pages/spanbix/SpanbixCourses';
import SpanbixCareerPaths from './pages/spanbix/SpanbixCareerPaths';
import SpanbixCourseDetail from './pages/spanbix/SpanbixCourseDetail';
import SpanbixCampusPrograms from './pages/spanbix/SpanbixCampusPrograms';
import SpanbixPlacements from './pages/spanbix/SpanbixPlacements';
import SpanbixAbout from './pages/spanbix/SpanbixAbout';
import SpanbixContact from './pages/spanbix/SpanbixContact';
import SpanbixBlogList from './pages/spanbix/SpanbixBlogList';
import SpanbixBlogDetail from './pages/spanbix/SpanbixBlogDetail';
import PublicBookingAvailabilityPage from './modules/scheduler/pages/PublicBookingAvailabilityPage';
import BookingManagePage from './modules/scheduler/pages/BookingManagePage';
import PublicRoutingPage from './modules/scheduler/pages/PublicRoutingPage';
import NotFound from './pages/NotFound';

export default function SpanbixApp() {
  return (
    <Routes>
      {/* Spanbix marketing surfaces — root-mounted */}
      <Route path="/" element={<SpanbixLanding />} />
      <Route path="/courses" element={<SpanbixCourses />} />
      <Route path="/career-paths" element={<SpanbixCareerPaths />} />
      <Route path="/career-paths/:code" element={<SpanbixCourseDetail />} />
      <Route path="/campus-programs" element={<SpanbixCampusPrograms />} />
      <Route path="/placements" element={<SpanbixPlacements />} />
      <Route path="/about" element={<SpanbixAbout />} />
      <Route path="/contact" element={<SpanbixContact />} />
      <Route path="/blog" element={<SpanbixBlogList />} />
      <Route path="/blog/:slug" element={<SpanbixBlogDetail />} />

      {/* Public scheduler booking + invitee self-service */}
      <Route path="/book/:eventSlug" element={<PublicBookingAvailabilityPage />} />
      <Route path="/manage/:token" element={<BookingManagePage />} />
      <Route path="/route/:slug" element={<PublicRoutingPage />} />

      {/* Legacy `/spanbix/*` URLs from the Mavro Console era redirect to root
          equivalents so external inbound links don't 404 after the move. */}
      <Route path="/spanbix" element={<Navigate to="/" replace />} />
      <Route path="/spanbix/*" element={<LegacyRedirect />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Strips the `/spanbix` prefix and forwards to the equivalent root path,
// preserving the rest of the URL + any query string.
function LegacyRedirect() {
  if (typeof window === 'undefined') return null;
  const { pathname, search, hash } = window.location;
  const target = pathname.replace(/^\/spanbix/, '') || '/';
  return <Navigate to={`${target}${search}${hash}`} replace />;
}
