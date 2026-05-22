import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEV_META = {
  critical: { Icon: AlertCircle,   classes: 'text-rose-300 bg-rose-500/10 border-rose-500/30',     dot: 'bg-rose-400' },
  warning:  { Icon: AlertTriangle, classes: 'text-amber-300 bg-amber-500/10 border-amber-500/30',  dot: 'bg-amber-400' },
  notice:   { Icon: Info,          classes: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',     dot: 'bg-cyan-400' },
};

/**
 * Decay Alerts Strip — surfaces the top N content-decay alerts as a horizontal
 * banner. Critical entries pulse subtly to draw operator attention.
 */
export default function DecayAlertsStrip({ alerts = [] }) {
  if (!alerts.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-3 flex items-center gap-2 border-b border-border/60">
        <Activity size={13} className="text-rose-400" />
        <h3 className="text-[12px] font-bold tracking-tight">Decay Alerts</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
          {alerts.length}
        </span>
      </div>
      <ul className="divide-y divide-border/40 max-h-[220px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {alerts.map((a) => {
            const meta = SEV_META[a.severity] || SEV_META.notice;
            return (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.22 }}
                className="px-5 py-2.5 flex items-start gap-3 hover:bg-foreground/[0.025] transition-colors"
              >
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] border flex-shrink-0', meta.classes)}>
                  <meta.Icon size={9} />
                  {a.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{a.message}</p>
                </div>
                <span className="font-mono text-[11px] text-rose-400/80 tabular-nums flex-shrink-0">
                  {a.score}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
}
