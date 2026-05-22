import { motion } from 'framer-motion';
import { MessageSquare, UserCheck, Users, FileSearch, ArrowUpRightSquare, Bell } from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';

const features = [
  { icon: MessageSquare,      title: 'Internal Notes',         body: 'Private collaboration thread inside every ticket with @-mentions and markdown.' },
  { icon: UserCheck,          title: 'Assignment Ownership',   body: 'Single owner per ticket. Reassign history. Clear accountability at every step.' },
  { icon: ArrowUpRightSquare, title: 'Escalation Chains',      body: 'Multi-tier ladders that auto-trigger on breach risk or manual escalation.' },
  { icon: FileSearch,         title: 'Audit Visibility',       body: 'Immutable timeline shared across teams. Every transition, every actor, recorded.' },
  { icon: Users,              title: 'Cross-Team Workflows',   body: 'Hand off tickets between departments without losing context or history.' },
  { icon: Bell,               title: 'Real-Time Status',       body: 'Live presence indicators, typing signals, and status updates across operators.' },
];

export default function Collaboration() {
  return (
    <EditorialSection
      id="collaboration"
      caption="Team Collaboration"
      title="Operational Collaboration Without Chaos"
      subtitle="Multi-team operations need clarity, not chat threads. Mavro structures every collaborative action inside the ticket — visible, attributable, recoverable."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.article
            key={f.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.55, delay: i * 0.06 }}
            className="group relative p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 hover:border-border hover:-translate-y-1 transition-all overflow-hidden"
          >
            <div className="absolute -bottom-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle, hsl(192 85% 55% / 0.25), transparent 70%)' }} />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                <f.icon size={18} className="text-cyan-400" />
              </div>
              <h3 className="text-base font-bold tracking-tight">{f.title}</h3>
              <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{f.body}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </EditorialSection>
  );
}
