import { motion } from 'framer-motion';
import { Inbox, GitBranch, UserCheck, Shield, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const incidents = [
  { icon: Inbox,     text: 'INC-4218 raised by helpdesk@acme', time: 'now',       color: 'rose'    },
  { icon: GitBranch, text: 'Routed to Platform · P1 escalation', time: '12s',      color: 'amber'   },
  { icon: UserCheck, text: 'Assigned to A. Mehta (on-call)',     time: '38s',      color: 'cyan'    },
  { icon: Shield,    text: 'SLA breach guard armed · 28 min',    time: '1m ago',   color: 'violet'  },
  { icon: CheckCheck,text: 'INC-4214 resolved · CSAT 4.8',       time: '4m ago',   color: 'emerald' },
];

const dotColors = {
  violet:  'bg-violet-500 shadow-[0_0_10px_hsl(263_70%_58%/0.7)]',
  cyan:    'bg-cyan-500 shadow-[0_0_10px_hsl(192_85%_55%/0.7)]',
  emerald: 'bg-emerald-500 shadow-[0_0_10px_hsl(160_70%_45%/0.7)]',
  amber:   'bg-amber-500 shadow-[0_0_10px_hsl(38_85%_55%/0.7)]',
  rose:    'bg-rose-500 shadow-[0_0_10px_hsl(347_75%_60%/0.7)]',
};

export default function FloatingIncidentFeed({ className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16, y: 18 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-2xl bg-card/85 backdrop-blur-2xl border border-border/70 p-5',
        'shadow-[0_30px_70px_-25px_hsl(160_70%_45%/0.4)]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">Incident Feed</p>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_hsl(160_70%_45%/0.8)]" />
      </div>
      <ul className="relative">
        <span className="absolute left-[6px] top-1 bottom-1 w-px bg-gradient-to-b from-border via-border/40 to-transparent" />
        {incidents.map((it, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.2 + i * 0.07 }}
            className="relative flex items-start gap-3 pl-5 pb-3 last:pb-0"
          >
            <span className={cn('absolute left-0 top-1.5 w-3 h-3 rounded-full ring-2 ring-background', dotColors[it.color])} />
            <it.icon size={11} className="text-muted-foreground mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-foreground/90 leading-snug">{it.text}</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">{it.time}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
