import { motion } from 'framer-motion';
import { Target, AlertTriangle } from 'lucide-react';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

function PageRow({ row, accent, valueKey, suffix, sessionsLabel = 'sessions' }) {
  const accentClass = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    rose:    'text-rose-400 bg-rose-500/10',
  }[accent];
  const max = 100;
  const pct = Math.min(100, (row[valueKey] / max) * 100);

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative px-3 py-2 rounded-lg hover:bg-foreground/[0.025] transition-colors overflow-hidden"
    >
      <div className={cn('absolute inset-y-0 left-0 transition-all', accentClass)} style={{ width: `${pct}%`, opacity: 0.15 }} />
      <div className="relative flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate flex-1">{row.page}</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {row[valueKey === 'conversionRate' ? 'sessions' : 'visits']} {sessionsLabel}
        </span>
        <span className={cn('text-sm font-mono font-semibold tabular-nums w-14 text-right', accentClass.split(' ')[0])}>
          {row[valueKey]}{suffix}
        </span>
      </div>
    </motion.li>
  );
}

export default function BehaviorIntelligence({ pageConversion = [], pageBounce = [] }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Best converting pages */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
          <Target size={13} className="text-emerald-400" />
          <h3 className="text-title">Best Converting Pages</h3>
          <InfoPopover infoKey="bestConverting" />
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">{pageConversion.length}</span>
        </div>
        {pageConversion.length === 0 ? (
          <div className="p-8 text-center">
            <Target size={20} className="mx-auto text-muted-foreground/40 mb-1" />
            <p className="text-xs text-muted-foreground">No pages with multi-session traffic yet</p>
          </div>
        ) : (
          <ul className="p-2">
            {pageConversion.map((r, i) => (
              <PageRow key={r.page + i} row={r} accent="emerald" valueKey="conversionRate" suffix="%" />
            ))}
          </ul>
        )}
      </motion.div>

      {/* Highest bounce pages */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
          <AlertTriangle size={13} className="text-rose-400" />
          <h3 className="text-title">Highest Bounce Pages</h3>
          <InfoPopover infoKey="highestBounce" />
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">{pageBounce.length}</span>
        </div>
        {pageBounce.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle size={20} className="mx-auto text-muted-foreground/40 mb-1" />
            <p className="text-xs text-muted-foreground">Not enough multi-page sessions to compute bounce</p>
          </div>
        ) : (
          <ul className="p-2">
            {pageBounce.map((r, i) => (
              <PageRow key={r.page + i} row={r} accent="rose" valueKey="bouncePct" suffix="%" sessionsLabel="visits" />
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
