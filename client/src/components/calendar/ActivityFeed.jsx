import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ArrowRight, CheckCircle2, RotateCcw, XCircle, UserPlus,
  Edit3, Send, Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_META = {
  workflow:          { Icon: ArrowRight,   tone: 'cyan'    },
  publish:           { Icon: Send,         tone: 'emerald' },
  approve:           { Icon: CheckCircle2, tone: 'emerald' },
  'request-revision':{ Icon: RotateCcw,    tone: 'amber'   },
  reject:            { Icon: XCircle,      tone: 'rose'    },
  assign:            { Icon: UserPlus,     tone: 'violet'  },
  reschedule:        { Icon: CalendarIcon, tone: 'violet'  },
  edit:              { Icon: Edit3,        tone: 'muted'   },
};

const TONE_CLASSES = {
  cyan:    'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  amber:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
  rose:    'text-rose-300 bg-rose-500/10 border-rose-500/30',
  violet:  'text-violet-300 bg-violet-500/10 border-violet-500/30',
  muted:   'text-foreground/70 bg-foreground/[0.04] border-border/60',
};

/**
 * Activity Feed — flattened blog.activityLog events across the tenant scope.
 * Visual hierarchy mirrors Linear / GitHub notification stream.
 */
export default function ActivityFeed({ events = [], loading, onBlogClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <Activity size={14} className="text-violet-400" />
        <h3 className="text-sm font-bold tracking-tight">Activity</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">{events.length}</span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-[12px] text-muted-foreground">Loading activity…</div>
      ) : events.length === 0 ? (
        <div className="p-6 text-center text-[12px] text-muted-foreground">No recent editorial activity.</div>
      ) : (
        <ul className="divide-y divide-border/40 max-h-[520px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {events.map((e, i) => {
              const meta = TYPE_META[e.type] || TYPE_META.edit;
              const tone = TONE_CLASSES[meta.tone];
              const when = e.at ? new Date(e.at) : null;
              return (
                <motion.li
                  key={`${e.blog._id}-${i}`}
                  layout
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={{ duration: 0.22 }}
                  className="px-5 py-2.5 flex items-start gap-3 hover:bg-foreground/[0.025] transition-colors cursor-pointer"
                  onClick={() => onBlogClick?.(e.blog)}
                >
                  <span className={cn('inline-flex items-center justify-center w-6 h-6 rounded-full border flex-shrink-0', tone)}>
                    <meta.Icon size={10} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] leading-snug">
                      {e.actor?.name && <span className="font-semibold">{e.actor.name}</span>}
                      {e.actor?.name && ' '}
                      <span className="text-foreground/85">{e.message}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] font-mono text-muted-foreground truncate tabular-nums">
                      {e.blog.title} {e.blog.tenant ? `· ${e.blog.tenant}` : ''}
                    </p>
                  </div>
                  <span className="text-[9.5px] font-mono text-muted-foreground tabular-nums flex-shrink-0">{relativeTime(when)}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  );
}

function relativeTime(d) {
  if (!d) return '';
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60)   return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}
