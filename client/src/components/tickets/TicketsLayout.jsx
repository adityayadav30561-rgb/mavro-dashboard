import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import OperationsNavbar from './OperationsNavbar';
import Footer from './Footer';
import AmbientGlowLayer from './AmbientGlowLayer';
import ScrollProgress from '@/components/hrms/ScrollProgress';
import useTrackPageView from '@/hooks/useTrackPageView';
import { setAnalyticsTenant } from '@/lib/analytics';
import { TICKETS_SITE } from '@/lib/ticketsSeo';

// Set tenant slug at module load so the very first track call uses it
setAnalyticsTenant(TICKETS_SITE.slug);

export default function TicketsLayout({ children }) {
  const { hash, pathname } = useLocation();
  useEffect(() => { setAnalyticsTenant(TICKETS_SITE.slug); }, []);
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
    <div className="legacy-neon relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgress />
      <AmbientGlowLayer />
      <OperationsNavbar />
      <main className="relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
