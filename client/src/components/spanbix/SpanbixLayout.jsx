import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import useTrackPageView from '@/hooks/useTrackPageView';
import { setAnalyticsTenant } from '@/lib/analytics';

// Spanbix is the third active Mavro tenant (slug 'spanbix'). The module-level
// call ensures analytics events fire under the correct websiteSlug from the
// moment the user first lands on any /spanbix route — useEffect re-asserts it
// on navigation between tenants within the same browser tab.
setAnalyticsTenant('spanbix');

export default function SpanbixLayout({ children }) {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    setAnalyticsTenant('spanbix');
  }, []);

  useTrackPageView();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [hash, pathname]);

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
    </div>
  );
}
