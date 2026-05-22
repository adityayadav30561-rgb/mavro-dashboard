import {
  Ticket, Timer, GitBranch, AlertTriangle, Users,
  BookOpen, Package, FileSearch, MessageSquare, Sparkles,
  BarChart3, Building2,
} from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';
import ModuleShowcaseCard from '@/components/hrms/ModuleShowcaseCard';

const modules = [
  { icon: Ticket,        color: 'cyan',    title: 'Ticket Management',    description: 'Unified ticket lifecycle — submission, triage, ownership, resolution.', features: ['Multi-channel intake', 'Custom fields', 'Status pipelines', 'Bulk actions'] },
  { icon: Timer,         color: 'emerald', title: 'SLA Engine',           description: 'Response + resolution timers with policy-driven priority tiers.',      features: ['Time-zone aware', 'Pause-on-hold', 'Breach guards', 'Calendar-bound'] },
  { icon: GitBranch,     color: 'violet',  title: 'Department Routing',   description: 'Rule-based routing across teams, regions, and skill sets.',            features: ['Routing graph', 'Fallback owners', 'Skill matching', 'Load balancing'] },
  { icon: AlertTriangle, color: 'rose',    title: 'Escalation Management',description: 'Auto-escalate on breach risk with notification chains.',                features: ['Multi-tier ladders', 'On-call rotations', 'Breach windows', 'Acknowledge SLA'] },
  { icon: Users,         color: 'amber',   title: 'Team Assignment',      description: 'Round-robin, manual, or skill-weighted assignment per workflow.',     features: ['Owner audit', 'Reassign trail', 'Capacity caps', 'Shift-aware'] },
  { icon: BookOpen,      color: 'sky',     title: 'Knowledge Base',       description: 'Internal solution articles surfaced inside ticket context.',           features: ['Inline suggestions', 'Article CRUD', 'Search index', 'Versioning'] },
  { icon: Package,       color: 'indigo',  title: 'Asset Linking',        description: 'Tie tickets to assets, services, devices, or product lines.',         features: ['CMDB-ready', 'Bulk link', 'Asset history', 'Tag inheritance'] },
  { icon: FileSearch,    color: 'fuchsia', title: 'Audit Logs',           description: 'Immutable timeline of every transition, edit, and assignment.',       features: ['Diff views', 'Actor attribution', 'Export ready', 'Tamper guards'] },
  { icon: MessageSquare, color: 'cyan',    title: 'Internal Notes',       description: 'Private collaboration channel inside every ticket.',                   features: ['@-mentions', 'Markdown', 'Reactions', 'Reply threading'] },
  { icon: Sparkles,      color: 'violet',  title: 'Automation Rules',     description: 'Triggers, conditions, and actions across the ticket lifecycle.',     features: ['Rule builder', 'Schedule rules', 'Webhook actions', 'Replay logs'] },
  { icon: BarChart3,     color: 'emerald', title: 'Analytics Dashboard',  description: 'Live operational intelligence on team load, MTTR, breach rate.',     features: ['Live charts', 'Cohort filters', 'Export CSV', 'Custom views'] },
  { icon: Building2,     color: 'amber',   title: 'Multi-Team Operations',description: 'Departmental isolation with cross-team visibility where it matters.',features: ['Workspace scoping', 'Shared dashboards', 'Role inheritance', 'Cross-team handoff'] },
];

export default function Modules() {
  return (
    <EditorialSection
      id="modules"
      caption="Platform Modules"
      title="Everything Needed To Run Modern IT Operations"
      subtitle="Twelve tightly-integrated operational modules. Each surface is a precision tool. Together they form your IT command center."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {modules.map((m, i) => (
          <ModuleShowcaseCard key={m.title} {...m} delay={(i % 4) * 0.06 + Math.floor(i / 4) * 0.1} />
        ))}
      </div>
    </EditorialSection>
  );
}
