import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import EditorialSection from './EditorialSection';
import GlassSurface from './GlassSurface';
import { Users, Clock, Building2, UserPlus, CalendarCheck, Wallet } from 'lucide-react';

const metrics = [
  { icon: Users,         label: 'Active workforce',      value: '462',   delta: '+3.2%', color: 'text-violet-400' },
  { icon: Clock,         label: 'Attendance efficiency', value: '94.2%', delta: '+1.8%', color: 'text-cyan-400' },
  { icon: Building2,     label: 'Department productivity', value: '88',  delta: '+5.1%', color: 'text-emerald-400' },
  { icon: UserPlus,      label: 'Hiring pipeline',       value: '37',    delta: '+12',   color: 'text-amber-400' },
  { icon: CalendarCheck, label: 'Leave analytics',       value: '3.8%',  delta: '-0.4%', color: 'text-rose-400' },
  { icon: Wallet,        label: 'Payroll summaries',     value: '₹4.2M', delta: '+8.4%', color: 'text-indigo-400' },
];

const deptData = [
  { name: 'Engineering', value: 124 },
  { name: 'Operations',  value: 96  },
  { name: 'Sales',       value: 71  },
  { name: 'Support',     value: 58  },
  { name: 'Finance',     value: 34  },
  { name: 'HR',          value: 21  },
];

const efficiency = [{ name: 'efficiency', value: 94 }];

export default function Analytics() {
  return (
    <EditorialSection
      id="analytics"
      caption="Live Intelligence"
      title="Workforce Intelligence In Real Time"
      subtitle="Track workforce trends, attendance patterns, operational performance, leave utilization, employee distribution, and HR efficiency through powerful analytics dashboards."
    >
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Department distribution bar */}
        <GlassSurface className="lg:col-span-7 p-6 md:p-8" delay={0.05}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400">Distribution</p>
              <h3 className="text-base font-bold mt-1">Workforce by Department</h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">Last sync · 2m ago</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  width={92}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                  {deptData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ['hsl(263 70% 60%)', 'hsl(192 80% 55%)', 'hsl(160 70% 45%)',
                         'hsl(38 85% 55%)',  'hsl(347 75% 60%)', 'hsl(245 75% 60%)'][i]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassSurface>

        {/* Efficiency radial */}
        <GlassSurface className="lg:col-span-5 p-6 md:p-8 flex flex-col" delay={0.1}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Operational Health</p>
            <h3 className="text-base font-bold mt-1">HR Efficiency Index</h3>
          </div>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart innerRadius="78%" outerRadius="100%" data={efficiency} startAngle={210} endAngle={-30}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} fill="url(#effGrad)" background={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                <defs>
                  <linearGradient id="effGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(263 70% 58%)" />
                    <stop offset="100%" stopColor="hsl(192 85% 55%)" />
                  </linearGradient>
                </defs>
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[3rem] font-bold font-mono tracking-tight bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">94</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground -mt-1">/ 100 Score</span>
            </div>
          </div>
        </GlassSurface>

        {/* Metric grid */}
        <div className="lg:col-span-12 grid sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-2">
          {metrics.map((m, i) => (
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
