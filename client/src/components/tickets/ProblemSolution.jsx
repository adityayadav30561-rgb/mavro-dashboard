import { Eye, Timer, GitBranch, BarChart3 } from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';
import GlassSurface from '@/components/hrms/GlassSurface';

const cards = [
  { icon: Eye,        color: 'text-cyan-400',    title: 'Centralized Ticket Visibility', body: 'Every request — email, chat, form, integration — lands in one operational console with status, owner, and SLA in view.' },
  { icon: Timer,      color: 'text-emerald-400', title: 'SLA Accountability',           body: 'Time-bound commitments per priority. Breach guards, escalation paths, and audit trails baked into the workflow.' },
  { icon: GitBranch,  color: 'text-violet-400',  title: 'Smart Assignment Workflows',   body: 'Department routing, skill-matched assignment, and round-robin distribution remove the manual triage layer.' },
  { icon: BarChart3,  color: 'text-amber-400',   title: 'Operational Analytics',        body: 'Real-time visibility into team load, response patterns, MTTR, and incident hot spots.' },
];

export default function ProblemSolution() {
  return (
    <EditorialSection
      caption="The Operational Problem"
      title={<>Support Operations Break Down When <span className="text-muted-foreground/60">Visibility Disappears</span></>}
      subtitle="Most organizations lose operational efficiency because support requests are scattered across emails, chats, spreadsheets, and disconnected systems. Issues get delayed, ownership becomes unclear, and SLA accountability disappears. Mavro creates a centralized operational workflow where every issue is tracked from submission to resolution."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <GlassSurface key={c.title} delay={i * 0.08} hover className="p-6 md:p-7">
            <div className="w-11 h-11 rounded-xl bg-foreground/[0.04] border border-border/70 flex items-center justify-center mb-5">
              <c.icon size={19} className={c.color} />
            </div>
            <h3 className="text-base font-bold tracking-tight mb-2">{c.title}</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{c.body}</p>
          </GlassSurface>
        ))}
      </div>
    </EditorialSection>
  );
}
