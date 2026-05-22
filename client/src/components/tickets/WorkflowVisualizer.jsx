import { motion } from 'framer-motion';
import {
  Inbox, Flag, Users, Timer, AlertTriangle, CheckCircle2, FileSearch,
} from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';

const stages = [
  { icon: Inbox,         title: 'Request Raised',     desc: 'Email, form, chat, or API — unified inbox.',         color: 'text-rose-400',    ring: 'border-rose-500/40' },
  { icon: Flag,          title: 'Priority Assigned',  desc: 'P1–P4 classification with policy automation.',       color: 'text-amber-400',   ring: 'border-amber-500/40' },
  { icon: Users,         title: 'Team Assignment',    desc: 'Department routing, skill-match, round-robin.',      color: 'text-cyan-400',    ring: 'border-cyan-500/40' },
  { icon: Timer,         title: 'SLA Tracking',       desc: 'Response + resolution timers per priority tier.',    color: 'text-violet-400',  ring: 'border-violet-500/40' },
  { icon: AlertTriangle, title: 'Escalation Logic',   desc: 'Auto-escalate on breach risk to senior owners.',     color: 'text-rose-400',    ring: 'border-rose-500/40' },
  { icon: CheckCircle2,  title: 'Resolution',         desc: 'Internal notes, customer comms, closure controls.',  color: 'text-emerald-400', ring: 'border-emerald-500/40' },
  { icon: FileSearch,    title: 'Audit Trail',        desc: 'Immutable timeline — every transition recorded.',    color: 'text-indigo-400',  ring: 'border-indigo-500/40' },
];

export default function WorkflowVisualizer() {
  return (
    <EditorialSection
      caption="Operational Workflow"
      title="From Request To Resolution — One Continuous Workflow"
      subtitle="Every ticket follows a deterministic operational path with policy-driven transitions, SLA guards, and an immutable audit trail at every step."
    >
      <div className="relative">
        {/* Vertical glow rail (mobile) / horizontal line (desktop) */}
        <div className="absolute hidden lg:block left-0 right-0 top-[60px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute lg:hidden left-[20px] top-3 bottom-3 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

        <ol className="grid lg:grid-cols-7 gap-6 lg:gap-3">
          {stages.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative pl-12 lg:pl-0 lg:text-center"
            >
              <span className={`absolute lg:static lg:mx-auto left-0 top-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-card/85 backdrop-blur-xl border-2 ${s.ring} shadow-[0_8px_24px_-8px_hsl(192_85%_45%/0.5)]`}>
                <s.icon size={16} className={s.color} />
              </span>
              <p className="text-[9px] font-mono text-muted-foreground/60 mt-0 lg:mt-3">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="text-[13px] font-bold tracking-tight mt-1">{s.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">{s.desc}</p>

              {/* Animated arrow on desktop */}
              {i < stages.length - 1 && (
                <motion.span
                  initial={{ opacity: 0, scaleX: 0 }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 + 0.2 }}
                  aria-hidden
                  className="absolute hidden lg:block right-[-14px] top-[18px] origin-left"
                >
                  <span className="block w-7 h-px bg-gradient-to-r from-cyan-400/60 to-emerald-400/60 shadow-[0_0_6px_hsl(192_85%_55%/0.6)]" />
                </motion.span>
              )}
            </motion.li>
          ))}
        </ol>
      </div>
    </EditorialSection>
  );
}
