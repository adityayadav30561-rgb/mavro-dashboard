import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const colorMap = {
  cyan:    { dot: 'bg-cyan-500',    text: 'text-cyan-400',    glow: 'shadow-[0_0_18px_-2px_hsl(192_85%_55%/0.55)]' },
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-[0_0_18px_-2px_hsl(160_70%_45%/0.55)]' },
  amber:   { dot: 'bg-amber-500',   text: 'text-amber-400',   glow: 'shadow-[0_0_18px_-2px_hsl(38_85%_55%/0.55)]' },
  rose:    { dot: 'bg-rose-500',    text: 'text-rose-400',    glow: 'shadow-[0_0_18px_-2px_hsl(347_75%_60%/0.55)]' },
  violet:  { dot: 'bg-violet-500',  text: 'text-violet-400',  glow: 'shadow-[0_0_18px_-2px_hsl(263_70%_58%/0.55)]' },
};

export default function TicketMetricOrb({ label, value, sublabel, color = 'cyan', delay = 0, className }) {
  const c = colorMap[color] || colorMap.cyan;
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
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span className={cn('w-1.5 h-1.5 rounded-full', c.dot, c.glow)} />
      </div>
      <p className="text-[2rem] font-bold tracking-tight font-mono leading-none">{value}</p>
      {sublabel && <p className={cn('mt-2 text-[11px] font-semibold', c.text)}>{sublabel}</p>}
    </motion.div>
  );
}
