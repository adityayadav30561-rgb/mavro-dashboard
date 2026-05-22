import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Sun, Moon, LogOut, User, Bell, Search,
  ChevronDown, Globe, Check, Command
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/utils';

function TenantSwitcher() {
  const { websites, selected, setSelected, loading } = useTenant();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    { name: 'All Properties', slug: 'all' },
    ...websites.map((w) => ({ name: w.name, slug: w.slug })),
  ];
  const currentName = options.find((o) => o.slug === selected)?.name || 'All Properties';

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading && websites.length === 0}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground/60 hover:text-foreground/90 hover:bg-foreground/[0.04] transition-all disabled:opacity-60"
      >
        <Globe size={13} className="text-violet-400/70" />
        <span className="font-medium">{currentName}</span>
        <ChevronDown size={12} className={cn('transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-56 rounded-xl glass-elevated overflow-hidden z-50"
          >
            <div className="p-1">
              {options.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => { setSelected(t.slug); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors',
                    selected === t.slug
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'text-foreground/60 hover:text-foreground/90 hover:bg-foreground/[0.04]'
                  )}
                >
                  <span className="truncate flex-1 text-left">{t.name}</span>
                  {t.slug !== 'all' && (
                    <span className="text-[9px] font-mono text-muted-foreground">{t.slug}</span>
                  )}
                  {selected === t.slug && <Check size={12} className="ml-1 text-violet-400 flex-shrink-0" />}
                </button>
              ))}
              {!loading && websites.length === 0 && (
                <p className="px-3 py-2 text-[11px] text-muted-foreground">No properties yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/[0.04] transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_0_12px_-2px_hsl(263_70%_58%/0.4)]">
          <span className="text-[10px] font-bold text-white">{initials}</span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-48 rounded-xl glass-elevated overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/[0.04]">
              <p className="text-xs font-medium text-white/80">{user?.name}</p>
              <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => { navigate('/settings'); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 rounded-lg hover:text-white/70 hover:bg-white/[0.04]"
              >
                <User size={12} /> Profile
              </button>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400/70 rounded-lg hover:text-rose-300 hover:bg-rose-500/5"
              >
                <LogOut size={12} /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommandSearch() {
  const [focused, setFocused] = useState(false);
  return (
    <div className={cn(
      'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300',
      focused
        ? 'bg-white/[0.06] ring-1 ring-violet-500/30 w-72'
        : 'bg-white/[0.02] w-52 hover:bg-white/[0.04]'
    )}>
      <Command size={13} className="text-white/20 flex-shrink-0" />
      <input
        type="text"
        placeholder="Search everything..."
        className="flex-1 bg-transparent text-xs outline-none text-white/70 placeholder:text-white/20"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <kbd className="hidden lg:inline-flex items-center px-1 py-0.5 rounded text-[9px] font-mono font-medium bg-white/[0.04] text-white/20 border border-white/[0.06]">
        ⌘K
      </kbd>
    </div>
  );
}

export default function Topbar({ onMenuClick }) {
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const [hasNotifications] = useState(true);

  // Tenant switcher is dashboard-only — other pages have their own tenant
  // selectors (e.g., /seo) or aren't tenant-scoped at all.
  const showTenantSwitcher = location.pathname === '/';

  return (
    <header className="surface-topbar sticky top-0 z-30 h-12 flex items-center justify-between gap-4 px-4 md:px-5 border-b">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.05] text-white/30">
          <Menu size={18} />
        </button>
        {showTenantSwitcher && <TenantSwitcher />}
      </div>

      <CommandSearch />

      <div className="flex items-center gap-0.5">
        <button className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors" title="Notifications">
          <Bell size={15} className="text-white/30" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-400 rounded-full shadow-[0_0_6px_hsl(263_70%_58%/0.6)]" />
          )}
        </button>
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
          <AnimatePresence mode="wait">
            {dark ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Sun size={15} className="text-amber-400/60" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Moon size={15} className="text-white/30" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <ProfileMenu />
      </div>
    </header>
  );
}
