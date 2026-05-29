'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppFloater from './WhatsAppFloater';
import CohortBanner from './CohortBanner';
import useScrollReveal from './redesign/useScrollReveal';
import useTrackPageView from '@/hooks/useTrackPageView';
import { setAnalyticsTenant } from '@/lib/analytics';

// Spanbix is the third active Mavro tenant (slug 'spanbix'). The module-level
// call ensures analytics events fire under the correct websiteSlug from the
// moment the user first lands on any Spanbix route — useEffect re-asserts it
// on navigation between tenants within the same browser tab.
setAnalyticsTenant('spanbix');

export default function SpanbixLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    setAnalyticsTenant('spanbix');
  }, []);

  useTrackPageView();

  // Pages are Server Components and can't call hooks, so the layout owns the
  // scroll-reveal observer for every route. Mount-only (per the invariant) —
  // children are already in the DOM by the time this effect runs.
  useScrollReveal();

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return (
    <div
      className="spanbix-scope relative min-h-screen overflow-x-hidden font-sora text-[#0f172a]"
      style={{ backgroundColor: '#ffffff' }}
    >
      <Navbar />
      {/* Navbar is solid white. Main padded to match navbar height across
          breakpoints so the bar doesn't cover the hero / page top row. */}
      <main className="relative z-10 pt-16 sm:pt-20 md:pt-24 lg:pt-24">{children}</main>
      <Footer />

      {/* Floating WhatsApp affordance (every page, every breakpoint) +
          first-visit cohort-launch banner. Both are 'use client' and
          self-mount; SpanbixLayout only owns their placement. */}
      <WhatsAppFloater />
      <CohortBanner />
    </div>
  );
}
