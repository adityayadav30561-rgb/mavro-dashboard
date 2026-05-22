import { Link } from 'react-router-dom';
import { Linkedin, ArrowUpRight } from 'lucide-react';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';

const columns = [
  {
    label: 'Platform',
    links: [
      { label: 'Courses', to: withSpanbixBase('/courses') },
      { label: 'Career Paths', to: withSpanbixBase('/career-paths') },
      { label: 'Certifications', to: withSpanbixBase('/courses#certifications') },
      { label: 'Demo Classes', to: withSpanbixBase('/demo-classes') },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About', to: withSpanbixBase('/about') },
      { label: 'Placements', to: withSpanbixBase('/placements') },
      { label: 'Campus Programs', to: withSpanbixBase('/campus-programs') },
      { label: 'Contact', to: withSpanbixBase('/contact') },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Blog', to: withSpanbixBase('/blog') },
      { label: 'Career Guides', to: withSpanbixBase('/blog?category=guides') },
      { label: 'FAQs', to: withSpanbixBase('/about#faqs') },
    ],
  },
  {
    label: 'Legal',
    links: [
      { label: 'Privacy Policy', to: withSpanbixBase('/about#privacy') },
      { label: 'Terms', to: withSpanbixBase('/about#terms') },
      { label: 'Refund Policy', to: withSpanbixBase('/about#refunds') },
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
            <Link to={withSpanbixBase('/')} className="inline-flex items-center" aria-label="Spanbix — home">
              {/* Navy footer background → white wordmark variant */}
              <img
                src="/spanbix/spanbix-white.png"
                alt="Spanbix"
                className="h-40 w-auto select-none"
                draggable={false}
              />
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
