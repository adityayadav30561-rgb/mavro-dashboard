import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Flame, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Velocity + editorial health metrics strip — single row of operational
 * pacing tiles. Pure presentational.
 */
export default function VelocityStrip({ velocity, deadlines, health }) {
  const tiles = [
    {
      Icon: TrendingUp,
      label: 'Per week',
      value: velocity.cadencePerWeek?.toFixed(1) ?? '0',
      hint: 'rolling 30-day cadence',
      tone: velocity.cadencePerWeek >= 2 ? 'emerald' : velocity.cadencePerWeek >= 1 ? 'cyan' : 'amber',
    },
    {
      Icon: Calendar,
      label: 'Scheduled',
      value: velocity.scheduledForward,
      hint: 'pipeline ahead',
      tone: velocity.scheduledForward >= 4 ? 'emerald' : velocity.scheduledForward >= 1 ? 'cyan' : 'rose',
    },
    {
      Icon: Flame,
      label: 'Streak',
      value: velocity.streak,
      hint: 'consecutive publish days',
      tone: velocity.streak >= 5 ? 'emerald' : velocity.streak >= 2 ? 'amber' : 'muted',
    },
    {
      Icon: Clock,
      label: 'Last publish',
      value: velocity.daysSinceLastPublish == null ? '—' : `${velocity.daysSinceLastPublish}d`,
      hint: 'days since',
      tone: velocity.daysSinceLastPublish == null
        ? 'muted'
        : velocity.daysSinceLastPublish <= 7 ? 'emerald'
        : velocity.daysSinceLastPublish <= 14 ? 'amber'
        : 'rose',
    },
    {
      Icon: Activity,
      label: 'Overdue',
      value: deadlines.overdueDrafts.length + deadlines.staleReviews.length + deadlines.missedPublishes.length,
      hint: 'drafts + reviews + missed publishes',
      tone: (deadlines.overdueDrafts.length + deadlines.staleReviews.length + deadlines.missedPublishes.length) === 0 ? 'emerald' : 'rose',
    },
    {
      Icon: TrendingUp,
      label: 'Editorial health',
      value: health,
      hint: '0–100 operational score',
      tone: health >= 80 ? 'emerald' : health >= 60 ? 'cyan' : health >= 40 ? 'amber' : 'rose',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {tiles.map((t, i) => <Tile key={i} {...t} />)}
    </div>
  );
}

function Tile({ Icon, label, value, hint, tone }) {
  const t = {
    emerald: 'text-emerald-400',
    cyan:    'text-cyan-400',
    amber:   'text-amber-400',
    rose:    'text-rose-400',
    muted:   'text-foreground/70',
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl bg-card/70 backdrop-blur-xl border border-border/70 p-3"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} className={t} />
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <p className={cn('text-xl font-bold font-mono tabular-nums leading-none', t)}>{value}</p>
      <p className="mt-1 text-[9.5px] text-muted-foreground/80 leading-tight">{hint}</p>
    </motion.div>
  );
}
