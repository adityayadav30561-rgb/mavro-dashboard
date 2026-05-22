import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackCtaClick } from '@/lib/analytics';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';

// Build-target aware so the same Navbar works under /spanbix/* (full Mavro
// Console) and under / (standalone Spanbix deploy).
const navLinks = [
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Header is intentionally NOT animated on mount. A slide-in animation on the
  // fixed top bar causes a visible white gap between the navbar and the first
  // section on every refresh (navbar starts at y:-16, page bg shows through
  // the 16px sliver during the 500ms transition). Industry-standard navbars
  // are static — only state-driven transitions (scroll shadow, mobile menu)
  // animate. The shadow + mobile-menu animations below stay.
  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-shadow duration-300',
        scrolled ? 'shadow-[0_8px_24px_-12px_rgba(16,44,86,0.45)]' : ''
      )}
      style={{ backgroundColor: SPANBIX_BRAND.navy }}
    >
      {/* Navbar height ramps with viewport so the brand logo stays legible on
          mobile without crushing layout. Keep `h-*` and the logo `h-*` below
          in lockstep — and update SpanbixLayout `pt-*` to match. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 sm:h-20 md:h-24 lg:h-[116px] flex items-center justify-between gap-3 sm:gap-6">
        <Link to={withSpanbixBase('/')} className="flex items-center group" aria-label="Spanbix — home">
          {/* Navy navbar background → white wordmark variant */}
          <img
            src="/spanbix/spanbix-white.png"
            alt="Spanbix"
            className="h-12 sm:h-16 md:h-20 lg:h-28 w-auto select-none"
            draggable={false}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 font-sora">
          {navLinks.map((l) => {
            const active = location.pathname === l.to || location.pathname.startsWith(l.to + '/');
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'px-3 py-2 text-[13.5px] font-medium rounded-md transition-colors',
                  active ? 'text-white' : 'text-white/65 hover:text-white'
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Desktop CTA. Stays hidden under md so the navbar doesn't crowd
              the mobile/tablet layout (CTA reappears inside the hamburger menu). */}
          <Link
            to={withSpanbixBase('/contact')}
            onClick={() => trackCtaClick('Book Career Consultation', { location: 'navbar' })}
            className="hidden md:inline-flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-md text-[12px] lg:text-[13px] font-semibold font-sora text-white transition-all hover:brightness-110 whitespace-nowrap"
            style={{ backgroundColor: SPANBIX_BRAND.accent }}
          >
            Book Career Consultation
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
            style={{ backgroundColor: SPANBIX_BRAND.navy }}
          >
            <nav className="flex flex-col px-6 py-4 gap-1 font-sora">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-3 py-2.5 rounded-md text-[14px] text-white/75 hover:text-white hover:bg-white/[0.05]"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to={withSpanbixBase('/contact')}
                onClick={() => trackCtaClick('Book Career Consultation', { location: 'navbar-mobile' })}
                className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13px] font-semibold text-white"
                style={{ backgroundColor: SPANBIX_BRAND.accent }}
              >
                Book Career Consultation
                <ArrowRight size={14} />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
