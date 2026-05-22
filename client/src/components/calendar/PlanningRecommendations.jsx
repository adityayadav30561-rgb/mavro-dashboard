import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEV = {
  critical: { Icon: AlertCircle,   tone: 'text-rose-300 bg-rose-500/10 border-rose-500/30' },
  warning:  { Icon: AlertTriangle, tone: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  notice:   { Icon: Info,          tone: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' },
};

export default function PlanningRecommendations({ recommendations = [] }) {
  if (!recommendations.length) {
    return (
      <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-5 flex items-center gap-3">
        <Lightbulb size={14} className="text-emerald-400" />
        <p className="text-[12px] text-emerald-400">Editorial pipeline looks healthy. No planning gaps detected.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-3 flex items-center gap-2 border-b border-border/60">
        <Lightbulb size={13} className="text-violet-400" />
        <h3 className="text-[12px] font-bold tracking-tight">Planning Recommendations</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">{recommendations.length}</span>
      </div>
      <ul className="divide-y divide-border/40">
        <AnimatePresence initial={false}>
          {recommendations.map((r, i) => {
            const sev = SEV[r.severity] || SEV.notice;
            return (
              <motion.li
                key={`${r.code}-${i}`}
                layout
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.22 }}
                className="px-5 py-2.5 flex items-start gap-3"
              >
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] border flex-shrink-0', sev.tone)}>
                  <sev.Icon size={9} />
                  {r.severity}
                </span>
                <p className="text-[11.5px] text-foreground/85 leading-snug">{r.message}</p>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
}
