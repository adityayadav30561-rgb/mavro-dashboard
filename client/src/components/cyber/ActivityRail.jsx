import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * ActivityRail — Vertical timeline with ambient dot indicators.
 * Editorial publishing activity feed.
 */
export default function ActivityRail({ items = [], className }) {
  const dotColors = {
    publish: 'bg-emerald-400 shadow-[0_0_8px_hsl(95_35%_45%/0.6)]',
    lead: 'bg-cyan-400 shadow-[0_0_8px_hsl(188_45%_56%/0.6)]',
    seo: 'bg-violet-400 shadow-[0_0_8px_hsl(14_73%_58%/0.6)]',
    index: 'bg-amber-400 shadow-[0_0_8px_hsl(36_72%_60%/0.6)]',
    default: 'bg-white/30 shadow-[0_0_6px_rgba(255,255,255,0.2)]',
  };

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

      <div className="space-y-1">
        {items.map((item, i) => (
          <motion.div
            key={item.id || i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="relative flex items-start gap-3 py-2 px-1 rounded-lg hover:bg-white/[0.02] transition-colors group"
          >
            {/* Dot */}
            <div className={cn(
              'relative z-10 w-[15px] h-[15px] rounded-full flex-shrink-0 mt-0.5 ring-[3px] ring-[hsl(240_10%_3.9%)]',
              dotColors[item.type] || dotColors.default
            )} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-medium text-foreground/90">{item.action}</span>
                {item.target && (
                  <span className="text-muted-foreground"> — {item.target}</span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.website && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80">
                    {item.website}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/50">{item.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
