import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, Globe, FileText, Users, Search as SearchIcon,
  Settings, X, Hexagon, ChevronLeft, ChevronDown, ChevronRight,
  BarChart3, Zap, Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Command',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    label: 'Content Ops',
    items: [
      { to: '/websites', icon: Globe, label: 'Properties' },
      { to: '/blogs', icon: FileText, label: 'Publications' },
      { to: '/calendar', icon: CalendarIcon, label: 'Calendar', badge: 'New' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/leads', icon: Users, label: 'Lead Capture' },
      { to: '/seo', icon: SearchIcon, label: 'SEO Engine', badge: 'New' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Scheduler',
    items: [
      { to: '/scheduler/event-types', icon: Zap, label: 'Event Types', badge: 'Beta' },
      { to: '/scheduler/bookings', icon: CalendarIcon, label: 'Bookings' },
      { to: '/scheduler/workflows', icon: Zap, label: 'Workflows' },
      { to: '/scheduler/workflow-history', icon: Zap, label: 'Workflow History' },
      { to: '/scheduler/routing-forms', icon: Zap, label: 'Routing Forms' },
      { to: '/scheduler/calendar-connections', icon: CalendarIcon, label: 'Calendar Connections' },
    ],
  },
];

function NavItem({ to, icon: Icon, label, end, collapsed, badge, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-white/[0.08] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_8px_-2px_rgba(0,0,0,0.3)]'
            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <motion.div
              layoutId="nav-glow"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-violet-400 rounded-r-full shadow-[0_0_8px_hsl(263_70%_58%/0.6)]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <Icon size={16} className={cn('flex-shrink-0', isActive && 'text-violet-300')} />
          {!collapsed && <span className="truncate">{label}</span>}
          {!collapsed && badge && (
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function NavGroup({ group, collapsed, onClose }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      {!collapsed && (
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20 hover:text-white/30 transition-colors"
        >
          {group.label}
          <ChevronDown size={10} className={cn('transition-transform duration-200', !open && '-rotate-90')} />
        </button>
      )}
      <AnimatePresence initial={false}>
        {(open || collapsed) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-0.5 overflow-hidden mt-1"
          >
            {group.items.map((item) => (
              <NavItem key={item.to} {...item} collapsed={collapsed} onClick={onClose} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar({ onClose, collapsed, onToggleCollapse }) {
  return (
    <aside
      className={cn(
        'surface-sidebar h-full flex flex-col transition-all duration-300 border-r',
        collapsed ? 'w-[70px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-[0_0_16px_-2px_hsl(263_70%_58%/0.4)] flex-shrink-0">
            <Hexagon size={16} className="text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-sm font-bold text-white tracking-tight">MAVRO</span>
              <span className="text-[9px] text-white/25 uppercase tracking-[0.2em] -mt-0.5">Console</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/[0.05] text-white/20 hover:text-white/40 transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.05] text-white/30">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navGroups.map((group) => (
          <NavGroup key={group.label} group={group} collapsed={collapsed} onClose={onClose} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/[0.04]">
        <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} onClick={onClose} />
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 mt-3">
            <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_hsl(160_84%_45%/0.6)]" />
            <p className="text-[10px] text-white/15 font-medium">v2.0 · All systems operational</p>
          </div>
        )}
      </div>
    </aside>
  );
}
