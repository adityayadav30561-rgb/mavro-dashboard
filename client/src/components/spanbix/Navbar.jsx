import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackCtaClick } from '@/lib/analytics';
import { withSpanbixBase } from '@/lib/routeBase';

// Spanbix navbar (redesign v2).
//
//   - Transparent at scroll-top (lets the hero photo bleed under the bar).
//   - Navy + backdrop-blur after 40px scroll, with a soft shadow.
//   - Build-target aware: `withSpanbixBase()` keeps links right under
//     /spanbix/* (Mavro full build) AND / (standalone Spanbix build).
//   - Mount animation is intentionally skipped — see prior bug fix log
//     (a slide-in caused a visible white sliver between bar + page on refresh).

const NAV_LINKS = [
  { label: 'Courses', to: withSpanbixBase('/courses') },
  { label: 'Career Paths', to: withSpanbixBase('/career-paths') },
  { label: 'Campus Programs', to: withSpanbixBase('/campus-programs') },
  { label: 'Placements', to: withSpanbixBase('/placements') },
  { label: 'Blog', to: withSpanbixBase('/blog') },
  { label: 'About', to: withSpanbixBase('/about') },
  { label: 'Contact', to: withSpanbixBase('/contact') },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300'
      )}
      style={{
        backgroundColor: scrolled ? 'rgba(16, 44, 86, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 sm:h-20 md:h-24 lg:h-[96px] flex items-center justify-between gap-3 sm:gap-6">
        <Link to={withSpanbixBase('/')} className="flex items-center gap-2.5 group" aria-label="Spanbix — home">
          <span
            className="grid place-items-center select-none"
            aria-hidden
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, #fff 0%, #cfe1ff 100%)',
              color: '#102c56',
              fontFamily: '"Instrument Serif", "DM Serif Display", Georgia, serif',
              fontSize: 22, fontStyle: 'italic', fontWeight: 600,
              lineHeight: 1,
            }}
          >
            S
          </span>
          <span
            className="hidden sm:inline text-white font-semibold tracking-[0.08em]"
            style={{ fontSize: 14, fontFamily: '"Geist", "Sora", system-ui, sans-serif' }}
          >
            SPANBIX
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const active = location.pathname === l.to || location.pathname.startsWith(l.to + '/');
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'px-3 py-2 text-[13.5px] font-medium rounded-md transition-colors',
                  active ? 'text-white' : 'text-white/65 hover:text-white'
                )}
                style={{ fontFamily: '"Geist", "Sora", system-ui, sans-serif' }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={withSpanbixBase('/contact')}
            onClick={() => trackCtaClick('Book Career Consultation', { location: 'navbar' })}
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium text-[#102c56] transition-all hover:brightness-95 whitespace-nowrap"
            style={{ background: '#ffffff', fontFamily: '"Geist", "Sora", system-ui, sans-serif' }}
          >
            Book Consultation
            <ArrowRight size={13} />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-md text-white/80 hover:text-white hover:bg-white/[0.06]"
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden border-t border-white/10 overflow-hidden"
            style={{ backgroundColor: 'rgba(16,44,86,0.97)' }}
          >
            <nav className="flex flex-col px-6 py-4 gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-3 py-2.5 rounded-md text-[14px] text-white/75 hover:text-white hover:bg-white/[0.05]"
                  style={{ fontFamily: '"Geist", "Sora", system-ui, sans-serif' }}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to={withSpanbixBase('/contact')}
                onClick={() => trackCtaClick('Book Career Consultation', { location: 'navbar-mobile' })}
                className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-medium text-[#102c56]"
                style={{ background: '#ffffff', fontFamily: '"Geist", "Sora", system-ui, sans-serif' }}
              >
                Book Consultation
                <ArrowRight size={14} />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
