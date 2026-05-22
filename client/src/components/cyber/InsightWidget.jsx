import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/**
 * InsightWidget — Compact data insight with trend indicator and spark visual.
 * Used for SEO metrics, indexing status, performance KPIs.
 */
export default function InsightWidget({
  label,
  value,
  unit,
  trend,
  trendLabel,
  sparkColor = 'violet',
  delay = 0,
  className,
}) {
  const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
  const trendColorClass = trend > 0
    ? 'text-emerald-400'
    : trend < 0
      ? 'text-rose-400'
      : 'text-muted-foreground';

  const sparkMap = {
    violet: 'bg-violet-500',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'relative p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]',
        'hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300',
        className
      )}
    >
      <p className="text-caption">{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
      </div>
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <TrendIcon size={12} className={trendColorClass} />
          <span className={cn('text-xs font-medium', trendColorClass)}>
            {trendLabel || (trend > 0 ? `+${trend}%` : `${trend}%`)}
          </span>
        </div>
      )}
      {/* Spark bar */}
      <div className="mt-3 h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', sparkMap[sparkColor] || sparkMap.violet)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.abs(value) || 50, 100)}%` }}
          transition={{ duration: 0.8, delay: delay + 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
