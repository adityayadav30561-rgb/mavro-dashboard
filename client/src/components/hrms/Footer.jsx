import { Link } from 'react-router-dom';
import { Hexagon, Linkedin, ArrowUpRight } from 'lucide-react';

const sections = [
  {
    label: 'Platform',
    links: [
      { label: 'Modules', href: '/hrms#modules' },
      { label: 'Automation', href: '/hrms#automation' },
      { label: 'Analytics', href: '/hrms#analytics' },
      { label: 'Why Mavro', href: '/hrms#why' },
    ],
  },
  {
    label: 'Modules',
    links: [
      { label: 'Employee Management', href: '/hrms#modules' },
      { label: 'Attendance & Shifts', href: '/hrms#modules' },
      { label: 'Payroll', href: '/hrms#modules' },
      { label: 'Performance', href: '/hrms#modules' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Blog', href: '/hrms/blog' },
      { label: 'Contact', href: '/hrms#contact' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-background/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link to="/hrms" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-700 flex items-center justify-center shadow-[0_0_24px_-4px_hsl(263_70%_58%/0.6)]">
                <Hexagon size={17} className="text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-bold tracking-tight">Mavro <span className="text-violet-400">HRMS</span></span>
                <span className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Workforce OS</span>
              </div>
            </Link>
            <p className="mt-5 text-sm text-muted-foreground max-w-sm leading-relaxed">
              Intelligent workforce operations platform — attendance, payroll, lifecycle, performance, and analytics in one operational console.
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

          {/* Links */}
          {sections.map((s, idx) => (
            <div key={s.label} className={idx === 0 ? 'lg:col-span-3' : 'lg:col-span-2'}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-4">{s.label}</p>
              <ul className="space-y-2.5">
                {s.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[13px] text-foreground/80 hover:text-foreground transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-border/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">
            Mavro HRMS — Intelligent Workforce Operations Platform.
          </p>
          <p className="text-[11px] text-muted-foreground/70 font-mono">
            © {new Date().getFullYear()} Mavro · All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
