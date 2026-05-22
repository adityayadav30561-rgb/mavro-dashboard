import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

const data = [
  { d: 'Mon', present: 412, leave: 14 },
  { d: 'Tue', present: 438, leave: 9 },
  { d: 'Wed', present: 426, leave: 12 },
  { d: 'Thu', present: 451, leave: 7 },
  { d: 'Fri', present: 462, leave: 5 },
  { d: 'Sat', present: 318, leave: 22 },
  { d: 'Sun', present: 96,  leave: 31 },
];

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-popover/95 backdrop-blur-xl border border-border px-3 py-2 text-[11px] shadow-xl">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="font-mono font-semibold text-foreground ml-2">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function FloatingAnalyticsPanel({ className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: -8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative rounded-2xl bg-card/85 backdrop-blur-2xl border border-border/70',
        'shadow-[0_40px_90px_-20px_hsl(263_70%_50%/0.35)]',
        'p-5',
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400">
            Live Workforce
          </p>
          <h3 className="text-sm font-bold mt-1">Attendance · Last 7 Days</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_hsl(263_70%_58%/0.7)]" />
            Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Leave
          </span>
        </div>
      </div>

      <div className="h-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="hrmsPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(263 70% 58%)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="hsl(263 70% 58%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hrmsLeave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(347 75% 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(347 75% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="d"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis hide />
            <Tooltip content={<Tip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="present"
              stroke="hsl(263 70% 58%)"
              strokeWidth={2}
              fill="url(#hrmsPresent)"
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(263 70% 58%)', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="leave"
              stroke="hsl(347 75% 60%)"
              strokeWidth={2}
              fill="url(#hrmsLeave)"
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(347 75% 60%)', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/60">
        {[
          { label: 'Active', value: '462', tone: 'text-emerald-400' },
          { label: 'On Leave', value: '14', tone: 'text-amber-400' },
          { label: 'Late Today', value: '8', tone: 'text-rose-400' },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
            <p className={cn('text-lg font-bold font-mono mt-0.5', s.tone)}>{s.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
