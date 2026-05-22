import { motion } from 'framer-motion';
import { ShieldCheck, FileSearch, Lock, GitCommitVertical, KeyRound, BadgeCheck } from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';

const items = [
  { icon: ShieldCheck,      title: 'RBAC',                     body: 'Role-based access — per workspace, per module, per action.' },
  { icon: FileSearch,       title: 'Audit Logs',               body: 'Immutable append-only trail of every operational transition.' },
  { icon: Lock,             title: 'Encrypted Workflows',      body: 'TLS in transit, encryption at rest. Field-level controls on PII.' },
  { icon: GitCommitVertical,title: 'Operational Traceability', body: 'Reconstruct any ticket lifecycle event-by-event for incident review.' },
  { icon: KeyRound,         title: 'Permission Controls',      body: 'Granular scopes for assignment, escalation, closure, deletion.' },
  { icon: BadgeCheck,       title: 'Compliance Ready',         body: 'Built with ISO 27001, SOC 2, and GDPR auditing patterns in mind.' },
];

export default function Security() {
  return (
    <EditorialSection
      id="security"
      caption="Security & Compliance"
      title="Enterprise-Grade Operational Security"
      subtitle="Operations data is mission-critical. Mavro enforces access boundaries, immutable audit trails, and compliance-friendly architecture across the stack."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 hover:border-border transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <it.icon size={15} className="text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold tracking-tight">{it.title}</h3>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{it.body}</p>
          </motion.div>
        ))}
      </div>
    </EditorialSection>
  );
}
