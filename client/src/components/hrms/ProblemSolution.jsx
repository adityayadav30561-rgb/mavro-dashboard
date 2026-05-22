import { Eye, Workflow, ShieldCheck, BarChart3 } from 'lucide-react';
import EditorialSection from './EditorialSection';
import GlassSurface from './GlassSurface';

const cards = [
  {
    icon: Eye,
    color: 'text-violet-400',
    title: 'Workforce Visibility',
    body: 'Track your entire workforce in real time from a centralized dashboard.',
  },
  {
    icon: Workflow,
    color: 'text-cyan-400',
    title: 'Smart Automation',
    body: 'Automate repetitive HR workflows, approvals, attendance policies, and reporting.',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-400',
    title: 'Compliance Confidence',
    body: 'Maintain structured employee records, payroll integrity, and operational consistency.',
  },
  {
    icon: BarChart3,
    color: 'text-amber-400',
    title: 'Actionable Analytics',
    body: 'Transform workforce data into meaningful operational insights.',
  },
];

export default function ProblemSolution() {
  return (
    <EditorialSection
      caption="The HR Problem"
      title={
        <>
          HR Operations Shouldn’t Feel <span className="text-muted-foreground/60">Fragmented</span>
        </>
      }
      subtitle="Most organizations struggle with disconnected HR tools, spreadsheet-driven workflows, approval delays, compliance gaps, and poor workforce visibility. Mavro HRMS centralizes everything into a unified operational ecosystem designed for speed, automation, and decision-making."
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
