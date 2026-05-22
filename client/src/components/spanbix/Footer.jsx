import { Link } from 'react-router-dom';
import { Linkedin, ArrowUpRight } from 'lucide-react';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';

const columns = [
  {
    label: 'Platform',
    links: [
      { label: 'Courses', to: '/spanbix/courses' },
      { label: 'Career Paths', to: '/spanbix/career-paths' },
      { label: 'Certifications', to: '/spanbix/courses#certifications' },
      { label: 'Demo Classes', to: '/spanbix/demo-classes' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About', to: '/spanbix/about' },
      { label: 'Placements', to: '/spanbix/placements' },
      { label: 'Campus Programs', to: '/spanbix/campus-programs' },
      { label: 'Contact', to: '/spanbix/contact' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Blog', to: '/spanbix/blog' },
      { label: 'Career Guides', to: '/spanbix/blog?category=guides' },
      { label: 'FAQs', to: '/spanbix/about#faqs' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/spanbix/about#privacy' },
      { label: 'Terms', to: '/spanbix/about#terms' },
      { label: 'Refund Policy', to: '/spanbix/about#refunds' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative" style={{ backgroundColor: SPANBIX_BRAND.navy, color: '#fff' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand block */}
          <div className="lg:col-span-4">
            <Link to="/spanbix" className="inline-flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-serif text-[20px] leading-none"
                style={{ backgroundColor: SPANBIX_BRAND.accent }}
              >
                S
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-[22px] tracking-tight">Spanbix</span>
                <span className="text-[10px] font-sora uppercase tracking-[0.22em] text-white/55">
                  Career Infrastructure
                </span>
              </div>
            </Link>
            <p className="mt-5 text-[13.5px] font-sora text-white/70 max-w-sm leading-relaxed">
              Career transformation infrastructure for the SAP and enterprise technology economy —
              structured curriculum, mentorship, certification, and placement readiness.
            </p>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-white/[0.06] border border-white/10 hover:border-white/20 hover:bg-white/[0.09] transition-all text-[12px] font-medium font-sora text-white/80"
            >
              <Linkedin size={13} /> LinkedIn
              <ArrowUpRight size={11} className="opacity-60" />
            </a>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.label} className="lg:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 mb-4 font-sora">
                {col.label}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-[13px] font-sora text-white/75 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-[12px] font-sora text-white/60">
            Spanbix — Career Transformation Infrastructure for Enterprise Technologies.
          </p>
          <p className="text-[11px] font-mono text-white/45">
            © {new Date().getFullYear()} Spanbix · All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
