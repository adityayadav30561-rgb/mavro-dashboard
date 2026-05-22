import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const dotColors = {
  violet: 'bg-violet-500 shadow-[0_0_10px_hsl(263_70%_58%/0.7)]',
  cyan:   'bg-cyan-500 shadow-[0_0_10px_hsl(192_85%_55%/0.7)]',
  emerald:'bg-emerald-500 shadow-[0_0_10px_hsl(160_70%_45%/0.7)]',
  amber:  'bg-amber-500 shadow-[0_0_10px_hsl(38_85%_55%/0.7)]',
  rose:   'bg-rose-500 shadow-[0_0_10px_hsl(347_75%_60%/0.7)]',
};

/**
 * Vertical neon-dot timeline used by the floating activity panel in hero
 * and by inline operational feeds.
 */
export default function ActivityTimeline({ items, className }) {
  return (
    <ul className={cn('relative', className)}>
      <span className="absolute left-[6px] top-1 bottom-1 w-px bg-gradient-to-b from-border via-border/40 to-transparent" />
      {items.map((it, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07 }}
          className="relative flex items-start gap-3 pl-5 pb-4 last:pb-0"
        >
          <span
            className={cn(
              'absolute left-0 top-1.5 w-3 h-3 rounded-full ring-2 ring-background',
              dotColors[it.color] || dotColors.violet
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-foreground/90">{it.text}</p>
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">{it.time}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
