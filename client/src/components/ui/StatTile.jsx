import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inkColor } from '@/lib/inks';

/**
 * The one stat tile — icon, big number, label, MoM delta, optional sparkline.
 *
 * <StatTile icon={Users} label="Total users" value="1,204" delta={12}
 *   ink="teal" spark={[3,5,2,8,6]} hint="last 30 days" />
 */
export function TrendBadge({ delta, suffix = '%' }) {
  if (delta == null || Number.isNaN(delta)) return null;
  const positive = delta >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-semibold',
      positive ? 'text-emerald-400' : 'text-rose-400'
    )}>
      <Icon size={10} />
      {positive ? '+' : ''}{delta}{suffix}
    </span>
  );
}

function Sparkline({ values, ink }) {
  if (!values || values.length < 2) return null;
  const w = 72;
  const h = 20;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * (h - 2) - 1).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[72px] h-5 mt-1" aria-hidden>
      <polyline points={pts} fill="none" stroke={inkColor(ink)} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function StatTile({ icon: Icon, label, value, delta, deltaSuffix, hint, ink = 'vermilion', spark, i = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.04 }}
      className={cn(
        'relative rounded-2xl bg-card/70 border border-border/70 p-4 overflow-hidden hover:border-border transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="w-8 h-8 rounded-xl bg-foreground/[0.04] border border-border flex items-center justify-center">
          {Icon && <Icon size={14} style={{ color: inkColor(ink) }} />}
        </div>
        <TrendBadge delta={delta} suffix={deltaSuffix} />
      </div>
      <p className="text-xl font-bold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      {hint && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{hint}</p>}
      {spark && <Sparkline values={spark} ink={ink} />}
    </motion.div>
  );
}
