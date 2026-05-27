'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackCtaClick } from '@/lib/analytics';

// Spanbix navbar (redesign v2).
//
//   - Solid glassmorphic cream bar; navy text.
//   - Soft shadow appears after 40px scroll.
//   - Routes are root-relative (standalone Next deploy at spanbix.com).
//   - Mount animation is intentionally skipped — see prior bug fix log
//     (a slide-in caused a visible white sliver between bar + page on refresh).

const NAV_LINKS = [
  { label: 'Courses', to: '/courses' },
  { label: 'Career Paths', to: '/career-paths' },
  { label: 'Campus Programs', to: '/campus-programs' },
  { label: 'Blog', to: '/blog' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300'
      )}
      style={{
        backgroundColor: 'rgba(243, 237, 224, 0.72)',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        borderBottom: '1px solid rgba(16, 44, 86, 0.08)',
        boxShadow: scrolled ? '0 8px 28px -18px rgba(16, 44, 86, 0.22)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 sm:h-20 md:h-24 lg:h-[96px] flex items-center justify-between gap-3 sm:gap-6">
        <Link
          href="/"
          aria-label="Spanbix — home"
          className="inline-flex items-center"
          style={{ padding: 0 }}
        >
          <img
            src="/spanbix/spanbix-blue.png"
            alt="Spanbix"
            style={{ height: 'clamp(56px, 9vw, 96px)', width: 'auto', display: 'block' }}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.to || pathname.startsWith(l.to + '/');
            return (
              <Link
                key={l.to}
                href={l.to}
                className={cn(
                  'px-3 py-2 text-[13.5px] font-medium rounded-md transition-colors',
                  active ? 'text-[#102c56]' : 'text-[#102c56]/65 hover:text-[#102c56]'
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
            href="/contact"
            onClick={() => trackCtaClick('Book Career Consultation', { location: 'navbar' })}
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium text-white transition-all hover:brightness-110 whitespace-nowrap"
            style={{ background: '#102c56', fontFamily: '"Geist", "Sora", system-ui, sans-serif' }}
          >
            Book Consultation
            <ArrowRight size={13} />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-md text-[#102c56]/80 hover:text-[#102c56] hover:bg-[#102c56]/[0.06]"
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
            className="lg:hidden border-t overflow-hidden"
            style={{
              backgroundColor: 'rgba(243, 237, 224, 0.92)',
              backdropFilter: 'blur(22px) saturate(160%)',
              WebkitBackdropFilter: 'blur(22px) saturate(160%)',
              borderColor: 'rgba(16, 44, 86, 0.10)',
            }}
          >
            <nav className="flex flex-col px-6 py-4 gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  href={l.to}
                  className="px-3 py-2.5 rounded-md text-[14px] text-[#102c56]/75 hover:text-[#102c56] hover:bg-[#102c56]/[0.05]"
                  style={{ fontFamily: '"Geist", "Sora", system-ui, sans-serif' }}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => trackCtaClick('Book Career Consultation', { location: 'navbar-mobile' })}
                className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-medium text-white"
                style={{ background: '#102c56', fontFamily: '"Geist", "Sora", system-ui, sans-serif' }}
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
