import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, Inbox, Timer, Users, Activity, Layers, Flame,
} from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';
import GlassSurface from '@/components/hrms/GlassSurface';

const trend = [
  { d: 'Mon', open: 42, resolved: 51 },
  { d: 'Tue', open: 58, resolved: 60 },
  { d: 'Wed', open: 67, resolved: 64 },
  { d: 'Thu', open: 71, resolved: 69 },
  { d: 'Fri', open: 64, resolved: 72 },
  { d: 'Sat', open: 31, resolved: 38 },
  { d: 'Sun', open: 22, resolved: 25 },
];

const dist = [
  { name: 'Platform',    value: 124 },
  { name: 'NetOps',      value: 92  },
  { name: 'Application', value: 78  },
  { name: 'Endpoint',    value: 56  },
  { name: 'Storage',     value: 33  },
  { name: 'Identity',    value: 27  },
];

const cardMetrics = [
  { icon: Inbox,        label: 'Open Tickets',      value: '128',  delta: '+4%',   color: 'text-cyan-400'    },
  { icon: Timer,        label: 'SLA Compliance',    value: '97%',  delta: '+1.4%', color: 'text-emerald-400' },
  { icon: TrendingUp,   label: 'Avg Response',      value: '6m',   delta: '−12%',  color: 'text-violet-400'  },
  { icon: Activity,     label: 'MTTR',              value: '42m',  delta: '−18%',  color: 'text-amber-400'   },
  { icon: Users,        label: 'Team Load',         value: '72%',  delta: '+3%',   color: 'text-rose-400'    },
  { icon: Layers,       label: 'Categories',        value: '8',    delta: '+1',    color: 'text-indigo-400'  },
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

export default function Analytics() {
  return (
    <EditorialSection
      id="analytics"
      caption="Operational Intelligence"
      title="Real-Time Support Operations Intelligence"
      subtitle="Open ticket trends, SLA compliance, response time metrics, team performance, and incident hot-spots — surfaced live across the operational fleet."
    >
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Trend chart */}
        <GlassSurface className="lg:col-span-7 p-6 md:p-8" delay={0.05}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Flow</p>
              <h3 className="text-base font-bold mt-1">Open vs Resolved · 7 Days</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Open</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Resolved</span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="opensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(192 85% 55%)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="hsl(192 85% 55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160 70% 45%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(160 70% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis hide />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="open"     stroke="hsl(192 85% 55%)" strokeWidth={2} fill="url(#opensGrad)"    dot={false} />
                <Area type="monotone" dataKey="resolved" stroke="hsl(160 70% 45%)" strokeWidth={2} fill="url(#resolvedGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassSurface>

        {/* Distribution bars */}
        <GlassSurface className="lg:col-span-5 p-6 md:p-8" delay={0.1}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">Hot Spots</p>
              <h3 className="text-base font-bold mt-1">Tickets by Team</h3>
            </div>
            <Flame size={14} className="text-rose-400" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={92} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                  {dist.map((_, i) => (
                    <Cell key={i} fill={['hsl(192 85% 55%)', 'hsl(160 70% 45%)', 'hsl(245 75% 60%)', 'hsl(38 85% 55%)', 'hsl(347 75% 60%)', 'hsl(290 75% 55%)'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassSurface>

        {/* KPI strip */}
        <div className="lg:col-span-12 grid sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-2">
          {cardMetrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="rounded-xl bg-card/60 backdrop-blur-xl border border-border/70 p-4"
            >
              <div className="flex items-center justify-between mb-2.5">
                <m.icon size={15} className={m.color} />
                <span className={`text-[10px] font-semibold ${m.color}`}>{m.delta}</span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{m.label}</p>
              <p className="text-lg font-bold font-mono mt-0.5">{m.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </EditorialSection>
  );
}
