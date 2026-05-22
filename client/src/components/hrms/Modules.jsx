import {
  Users, Clock, CalendarCheck, Wallet, UserPlus,
  Target, Smartphone, BarChart3,
} from 'lucide-react';
import EditorialSection from './EditorialSection';
import ModuleShowcaseCard from './ModuleShowcaseCard';

const modules = [
  {
    icon: Users, color: 'violet',
    title: 'Employee Management',
    description: 'Manage employee records, onboarding, documents, departments, reporting structures, and lifecycle events.',
    features: ['Full lifecycle', 'Org structures', 'Document vault', 'Custom fields'],
  },
  {
    icon: Clock, color: 'cyan',
    title: 'Attendance & Shift Tracking',
    description: 'Track attendance, shifts, late entries, overtime, biometric integrations, and workforce schedules.',
    features: ['Biometric sync', 'Overtime engine', 'Shift roster', 'Late-policy auto'],
  },
  {
    icon: CalendarCheck, color: 'emerald',
    title: 'Leave & Approval Workflows',
    description: 'Automate leave requests, approvals, leave balances, and policy enforcement.',
    features: ['Multi-step approvals', 'Auto balances', 'Policy library', 'Calendar sync'],
  },
  {
    icon: Wallet, color: 'amber',
    title: 'Payroll Management',
    description: 'Process payroll with deductions, reimbursements, compliance handling, and salary structures.',
    features: ['Statutory ready', 'Salary structures', 'Reimbursements', 'Payslip vault'],
  },
  {
    icon: UserPlus, color: 'rose',
    title: 'Recruitment Pipeline',
    description: 'Manage hiring workflows, candidate pipelines, interview stages, and onboarding.',
    features: ['Stage tracking', 'Interview kit', 'Candidate CRM', 'Offer flow'],
  },
  {
    icon: Target, color: 'indigo',
    title: 'Performance Tracking',
    description: 'Monitor goals, reviews, KPIs, and employee performance cycles.',
    features: ['OKRs', 'Review cycles', '360° feedback', 'KPI scorecards'],
  },
  {
    icon: Smartphone, color: 'sky',
    title: 'Employee Self-Service',
    description: 'Enable employees to access documents, apply leaves, track attendance, and manage profiles independently.',
    features: ['Mobile-ready', 'Doc downloads', 'Profile control', 'Quick apply'],
  },
  {
    icon: BarChart3, color: 'fuchsia',
    title: 'Reports & Analytics',
    description: 'Generate operational reports with real-time workforce intelligence and decision-ready metrics.',
    features: ['Live dashboards', 'Custom reports', 'Export anywhere', 'Trends + alerts'],
  },
];

export default function Modules() {
  return (
    <EditorialSection
      id="modules"
      caption="Platform Modules"
      title="Everything Your HR Team Needs — In One Platform"
      subtitle="A single operational ecosystem with eight tightly-integrated modules. Each surface is a precision tool. Together they form your workforce command center."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {modules.map((m, i) => (
          <ModuleShowcaseCard key={m.title} {...m} delay={(i % 4) * 0.06 + Math.floor(i / 4) * 0.1} />
        ))}
      </div>
    </EditorialSection>
  );
}
