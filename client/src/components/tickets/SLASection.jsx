import { motion } from 'framer-motion';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { Timer, AlertTriangle, ArrowUpRight, Activity, ShieldCheck, GaugeCircle } from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';
import GlassSurface from '@/components/hrms/GlassSurface';

const features = [
  { icon: Timer,          title: 'SLA Timers',           body: 'Response and resolution clocks per priority tier — pause on hold, resume on action.' },
  { icon: AlertTriangle,  title: 'Escalation Thresholds',body: 'Configurable breach windows with tiered escalation chains.' },
  { icon: Activity,       title: 'Breach Alerts',        body: 'Real-time notifications to owners, managers, and on-call rotations.' },
  { icon: ArrowUpRight,   title: 'Priority Rules',       body: 'Auto-classify P1–P4 from intake metadata and policy graph.' },
  { icon: ShieldCheck,    title: 'Response Tracking',    body: 'First-response, time-to-acknowledge, and ack-SLA timers.' },
  { icon: GaugeCircle,    title: 'Resolution Tracking',  body: 'MTTR by team, by tier, by hour-of-day. Trend-aware analytics.' },
];

const data = [{ name: 'compliance', value: 97 }];

export default function SLASection() {
  return (
    <EditorialSection
      id="sla"
      caption="SLA Intelligence"
      title="Operational Accountability Through SLA Intelligence"
      subtitle="Time-bound commitments per priority. Breach guards, escalation paths, and audit trails baked into the workflow."
    >
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left — compliance gauge */}
        <GlassSurface className="lg:col-span-5 p-7 md:p-9 flex flex-col" delay={0.05}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Compliance Index</p>
          <h3 className="text-lg font-bold mt-1">7-Day SLA Adherence</h3>

          <div className="relative flex-1 flex items-center justify-center min-h-[260px]">
            <ResponsiveContainer width="100%" height={280}>
              <RadialBarChart innerRadius="76%" outerRadius="100%" data={data} startAngle={210} endAngle={-30}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} fill="url(#slaGrad)" background={{ fill: 'hsl(var(--muted) / 0.25)' }} />
                <defs>
                  <linearGradient id="slaGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(192 85% 55%)" />
                    <stop offset="100%" stopColor="hsl(160 70% 45%)" />
                  </linearGradient>
                </defs>
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[3.25rem] font-bold font-mono tracking-tight bg-gradient-to-br from-cyan-400 to-emerald-400 bg-clip-text text-transparent">97</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground -mt-1">/ 100 compliant</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-2 pt-4 border-t border-border/60">
            <Stat label="P1" value="100%" tone="text-emerald-400" />
            <Stat label="P2" value="98%"  tone="text-cyan-400"    />
            <Stat label="P3" value="94%"  tone="text-amber-400"   />
          </div>
        </GlassSurface>

        {/* Right — feature grid */}
        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 hover:border-border hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3 group-hover:bg-cyan-500/15 transition-colors">
                <f.icon size={16} className="text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold tracking-tight">{f.title}</h4>
              <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </EditorialSection>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold font-mono mt-0.5 ${tone}`}>{value}</p>
    </div>
  );
}
