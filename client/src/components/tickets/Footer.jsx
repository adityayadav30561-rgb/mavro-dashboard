import { Link } from 'react-router-dom';
import { Ticket, Linkedin, ArrowUpRight } from 'lucide-react';

const sections = [
  {
    label: 'Platform',
    links: [
      { label: 'Modules',    href: '/tickets#modules' },
      { label: 'SLA Engine', href: '/tickets#sla' },
      { label: 'Automation', href: '/tickets#automation' },
      { label: 'Analytics',  href: '/tickets#analytics' },
    ],
  },
  {
    label: 'Features',
    links: [
      { label: 'Ticket Management',     href: '/tickets#modules' },
      { label: 'Escalation Workflows',  href: '/tickets#sla' },
      { label: 'Team Collaboration',    href: '/tickets#collaboration' },
      { label: 'Security & RBAC',       href: '/tickets#security' },
    ],
  },
  {
    label: 'Operations',
    links: [
      { label: 'Blog',     href: '/tickets/blog' },
      { label: 'Contact',  href: '/tickets#contact' },
      { label: 'Privacy',  href: '#' },
      { label: 'Terms',    href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-background/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          <div className="lg:col-span-5">
            <Link to="/tickets" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-600 to-emerald-700 flex items-center justify-center shadow-[0_0_24px_-4px_hsl(192_85%_50%/0.6)]">
                <Ticket size={17} className="text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-bold tracking-tight">Mavro <span className="text-cyan-400">Tickets</span></span>
                <span className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Operational Support</span>
              </div>
            </Link>
            <p className="mt-5 text-sm text-muted-foreground max-w-sm leading-relaxed">
              Intelligent operational support infrastructure — SLA tracking, escalation workflows, and team-aware ticket operations in one command console.
            </p>
            <a
              href="https://www.linkedin.com"
              target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-foreground/[0.04] border border-border/70 hover:border-border hover:bg-foreground/[0.06] transition-all text-[12px] font-medium"
            >
              <Linkedin size={13} /> LinkedIn
              <ArrowUpRight size={11} className="opacity-60" />
            </a>
          </div>

          {sections.map((s, idx) => (
            <div key={s.label} className={idx === 0 ? 'lg:col-span-3' : 'lg:col-span-2'}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-4">{s.label}</p>
              <ul className="space-y-2.5">
                {s.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[13px] text-foreground/80 hover:text-foreground transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-border/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">
            Mavro Ticket Management — Intelligent Operational Support Infrastructure.
          </p>
          <p className="text-[11px] text-muted-foreground/70 font-mono">
            © {new Date().getFullYear()} Mavro · SLA-aware operations
          </p>
        </div>
      </div>
    </footer>
  );
}
