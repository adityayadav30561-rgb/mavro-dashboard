import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const colorMap = {
  violet: { text: 'text-violet-400', dot: 'bg-violet-500', glow: 'shadow-[0_0_18px_-2px_hsl(263_70%_58%/0.55)]' },
  cyan:   { text: 'text-cyan-400',   dot: 'bg-cyan-500',   glow: 'shadow-[0_0_18px_-2px_hsl(192_85%_55%/0.55)]' },
  emerald:{ text: 'text-emerald-400',dot: 'bg-emerald-500',glow: 'shadow-[0_0_18px_-2px_hsl(160_70%_45%/0.55)]' },
  amber:  { text: 'text-amber-400',  dot: 'bg-amber-500',  glow: 'shadow-[0_0_18px_-2px_hsl(38_85%_55%/0.55)]' },
  rose:   { text: 'text-rose-400',   dot: 'bg-rose-500',   glow: 'shadow-[0_0_18px_-2px_hsl(347_75%_60%/0.55)]' },
};

/**
 * Compact metric card used inside hero floating panels and analytics.
 * Shows label, primary value, trend, with a status dot + ambient glow.
 */
export default function WorkforceMetricCard({
  label,
  value,
  suffix,
  trend,
  trendDirection = 'up',
  color = 'violet',
  delay = 0,
  className,
}) {
  const c = colorMap[color] || colorMap.violet;
  const TrendIcon = trendDirection === 'up' ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'relative rounded-2xl p-5 bg-card/80 backdrop-blur-xl border border-border/70',
        'shadow-[var(--shadow-card)]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className={cn('w-1.5 h-1.5 rounded-full', c.dot, c.glow)} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[2rem] font-bold tracking-tight font-mono">{value}</span>
        {suffix && (
          <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
        )}
      </div>
      {trend && (
        <div className={cn('mt-2 flex items-center gap-1 text-[11px] font-medium', c.text)}>
          <TrendIcon size={11} /> {trend}
        </div>
      )}
    </motion.div>
  );
}
