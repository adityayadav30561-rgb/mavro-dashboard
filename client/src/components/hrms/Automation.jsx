import { motion } from 'framer-motion';
import {
  Zap, Clock, GitBranch, Wallet, BellRing, Building2, Settings2, KeyRound, FileCheck2,
} from 'lucide-react';
import EditorialSection from './EditorialSection';

const features = [
  { icon: Clock, label: 'Automated attendance calculations' },
  { icon: GitBranch, label: 'Approval workflow automation' },
  { icon: Wallet, label: 'Smart payroll processing' },
  { icon: BellRing, label: 'Real-time notifications' },
  { icon: Building2, label: 'Department-level controls' },
  { icon: Settings2, label: 'Policy-based automation' },
  { icon: KeyRound, label: 'Role-based access management' },
  { icon: FileCheck2, label: 'Audit-ready employee records' },
];

export default function Automation() {
  return (
    <EditorialSection
      id="automation"
      caption="Automation Engine"
      title="Built For High-Efficiency HR Operations"
      subtitle="Mavro HRMS reduces manual work across the organization with intelligent automation and operational workflows."
    >
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left — central engine visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 relative aspect-square max-w-[400px] mx-auto"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 via-cyan-500/10 to-transparent blur-3xl" />

          <div className="absolute inset-[18%] rounded-full border border-border/70 animate-[spin_24s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 60%, hsl(263 70% 60% / 0.3) 75%, transparent 90%)' }} />
          <div className="absolute inset-[28%] rounded-full border border-border/50 animate-[spin_18s_linear_infinite_reverse]" style={{ background: 'conic-gradient(from 0deg, transparent 70%, hsl(192 80% 55% / 0.25) 85%, transparent 95%)' }} />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-[0_0_60px_-10px_hsl(263_70%_50%/0.8)]">
              <Zap size={48} className="text-white" />
              <span className="absolute -inset-px rounded-3xl bg-gradient-to-br from-white/30 to-transparent opacity-40" />
            </div>
          </div>

          {/* Floating chips */}
          {[
            { txt: 'Auto-Approval', pos: 'top-2 left-0', color: 'text-cyan-400' },
            { txt: 'Payroll Cycle', pos: 'top-4 right-0', color: 'text-amber-400' },
            { txt: 'Compliance', pos: 'bottom-8 left-2', color: 'text-emerald-400' },
            { txt: 'Audit Trail', pos: 'bottom-2 right-4', color: 'text-rose-400' },
          ].map((c, i) => (
            <motion.div
              key={c.txt}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className={`absolute ${c.pos} px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-xl border border-border text-[10px] font-semibold uppercase tracking-wider ${c.color}`}
            >
              {c.txt}
            </motion.div>
          ))}
        </motion.div>

        {/* Right — feature list */}
        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group flex items-center gap-3 p-4 rounded-xl bg-card/60 backdrop-blur-xl border border-border/70 hover:border-border hover:bg-card/80 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/15 transition-colors">
                <f.icon size={15} className="text-violet-400" />
              </div>
              <span className="text-[13px] font-medium">{f.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </EditorialSection>
  );
}
