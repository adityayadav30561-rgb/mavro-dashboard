import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CommandNavbar from './CommandNavbar';
import Footer from './Footer';
import AmbientGlowLayer from './AmbientGlowLayer';
import ScrollProgress from './ScrollProgress';
import useTrackPageView from '@/hooks/useTrackPageView';
import { setAnalyticsTenant } from '@/lib/analytics';

setAnalyticsTenant('mavro-hrms');

export default function HrmsLayout({ children }) {
  const { hash, pathname } = useLocation();
  useEffect(() => { setAnalyticsTenant('mavro-hrms'); }, []);
  useTrackPageView();

  // Smooth anchor scroll on hash change
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [hash, pathname]);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgress />
      <AmbientGlowLayer />
      <CommandNavbar />
      <main className="relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
