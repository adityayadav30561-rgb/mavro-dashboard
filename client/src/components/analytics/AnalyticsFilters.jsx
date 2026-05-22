import { motion } from 'framer-motion';
import { Globe, ChevronDown, RefreshCw, Activity } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/utils';

const RANGES = [
  { key: 'day',   label: 'Today' },
  { key: 'week',  label: '7d' },
  { key: 'month', label: '30d' },
  { key: 'year',  label: '12m' },
];

export default function AnalyticsFilters({ range, onRangeChange, websiteSlug, onWebsiteChange, onRefresh, liveCount }) {
  const { websites } = useTenant();
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Range pills */}
      <div className="inline-flex items-center p-1 rounded-xl bg-card/70 backdrop-blur-xl border border-border/70">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => onRangeChange(r.key)}
            className={cn(
              'relative px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] rounded-lg transition-colors',
              range === r.key
                ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/40'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Website selector */}
      <div className="relative inline-flex">
        <select
          value={websiteSlug}
          onChange={(e) => onWebsiteChange(e.target.value)}
          className="appearance-none pl-8 pr-9 py-2 rounded-xl text-[12px] font-semibold bg-card/70 backdrop-blur-xl border border-border/70 hover:border-border focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer"
        >
          <option value="all">All Properties</option>
          {websites.map((w) => (
            <option key={w._id} value={w.slug}>{w.name}</option>
          ))}
        </select>
        <Globe size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-violet-400" />
        <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold bg-card/70 backdrop-blur-xl border border-border/70 hover:bg-card hover:border-border transition-all"
        title="Refresh"
      >
        <RefreshCw size={13} /> Refresh
      </button>

      {/* Live indicator */}
      {liveCount != null && (
        <motion.span
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold uppercase tracking-[0.14em]"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          {liveCount} active
        </motion.span>
      )}
    </div>
  );
}
