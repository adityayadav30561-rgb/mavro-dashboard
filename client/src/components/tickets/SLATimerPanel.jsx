import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tickets = [
  { id: 'INC-4218', subject: 'Auth service degraded',     priority: 'P1', sla: 60 * 30,  status: 'breach',  team: 'Platform' },
  { id: 'INC-4217', subject: 'Email delivery queued',     priority: 'P2', sla: 60 * 90,  status: 'tracking', team: 'Comms' },
  { id: 'INC-4216', subject: 'VPN latency in Mumbai',     priority: 'P2', sla: 60 * 75,  status: 'tracking', team: 'NetOps' },
  { id: 'INC-4215', subject: 'Backup verification rerun', priority: 'P3', sla: 60 * 240, status: 'safe',    team: 'Storage' },
];

function format(sec) {
  const mm = Math.floor(sec / 60).toString().padStart(2, '0');
  const ss = (sec % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

const statusMap = {
  breach:   { tone: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/40',    dot: 'bg-rose-500',    label: 'SLA Breach',     icon: AlertTriangle },
  tracking: { tone: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-500',   label: 'Tracking',       icon: Timer },
  safe:     { tone: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-500', label: 'Within SLA',     icon: CheckCircle2 },
};

const priorityTone = {
  P1: 'text-rose-300 bg-rose-500/15 border-rose-500/40',
  P2: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
  P3: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40',
};

export default function SLATimerPanel({ className, delay = 0 }) {
  // Drive each timer locally so the panel feels live without polling backend
  const [ticks, setTicks] = useState(() => tickets.map((t) => t.sla));
  useEffect(() => {
    const t = setInterval(() => setTicks((arr) => arr.map((s) => Math.max(0, s - 1))), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative rounded-2xl bg-card/85 backdrop-blur-2xl border border-border/70 p-5',
        'shadow-[0_40px_90px_-20px_hsl(192_85%_45%/0.35)]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">SLA Engine</p>
          <h3 className="text-sm font-bold mt-1">Live Ticket Stream</h3>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">4 active</span>
      </div>

      <ul className="space-y-2.5">
        {tickets.map((t, i) => {
          const s = statusMap[t.status];
          const Icon = s.icon;
          return (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + i * 0.08 }}
              className={cn('flex items-center gap-3 p-2.5 rounded-xl border', s.bg, s.border)}
            >
              <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-lg', s.bg, s.border, 'border')}>
                <Icon size={13} className={s.tone} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{t.id}</span>
                  <span className={cn('text-[9px] px-1.5 py-px rounded font-bold border', priorityTone[t.priority])}>{t.priority}</span>
                  <span className="text-[9px] text-muted-foreground">· {t.team}</span>
                </div>
                <p className="text-[12px] font-medium truncate">{t.subject}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-bold font-mono tabular-nums', s.tone)}>{format(ticks[i])}</p>
                <p className={cn('text-[9px] uppercase tracking-[0.18em] font-semibold', s.tone)}>{s.label}</p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
