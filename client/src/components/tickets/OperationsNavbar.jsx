import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Sun, Moon, ArrowRight, Menu, X, ShieldAlert } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { trackCtaClick } from '@/lib/analytics';

const navLinks = [
  { label: 'Platform',     to: '/tickets#modules' },
  { label: 'SLA Engine',   to: '/tickets#sla' },
  { label: 'Automation',   to: '/tickets#automation' },
  { label: 'Analytics',    to: '/tickets#analytics' },
  { label: 'Blog',         to: '/tickets/blog' },
];

export default function OperationsNavbar() {
  const { dark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border/70 bg-background/70 backdrop-blur-xl'
          : 'border-b border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-6">
        <Link to="/tickets" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-600 to-emerald-700 flex items-center justify-center shadow-[0_0_24px_-4px_hsl(192_85%_50%/0.6)]">
              <Ticket size={17} className="text-white" />
            </div>
            <span className="absolute inset-0 rounded-xl bg-cyan-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold tracking-tight">Mavro <span className="text-cyan-400">Tickets</span></span>
            <span className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Ops Console</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.to}
              href={l.to}
              className="px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {/* Live status pill */}
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Ops Live
          </span>

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-lg hover:bg-foreground/[0.05] transition-colors"
          >
            <AnimatePresence mode="wait">
              {dark ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Sun size={15} className="text-amber-400" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Moon size={15} className="text-cyan-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <a
            href="/tickets#contact"
            onClick={() => trackCtaClick('Book Demo', { location: 'navbar' })}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            Book Demo <ArrowRight size={13} />
          </a>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-foreground/[0.05]" aria-label="Menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <nav className="flex flex-col px-6 py-4 gap-1">
              {navLinks.map((l) => (
                <a key={l.to} href={l.to} className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]">
                  {l.label}
                </a>
              ))}
              <a
                href="/tickets#contact"
                onClick={() => trackCtaClick('Book Demo', { location: 'navbar-mobile' })}
                className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-foreground text-background"
              >
                Book Demo <ArrowRight size={14} />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
