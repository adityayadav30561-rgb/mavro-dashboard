import { Link } from 'react-router-dom';
import { Linkedin, Facebook } from 'lucide-react';
import { withSpanbixBase } from '@/lib/routeBase';

const SOCIAL_LINKS = [
  { name: 'LinkedIn', Icon: Linkedin, href: 'https://www.linkedin.com/company/118163985' },
  { name: 'Facebook', Icon: Facebook, href: 'https://www.facebook.com/people/Spanbix-Training-Institute/61590494903596/' },
];

// Footer (redesign v2) — 5-column grid on desktop, 2-col on mobile.
// Wordmark + brief, then Platform / Company / Resources / Legal link sets.

const COLUMNS = [
  {
    label: 'Platform',
    links: [
      { label: 'SAP FICO Track', to: withSpanbixBase('/career-paths/fico') },
      { label: 'SAP MM Track', to: withSpanbixBase('/career-paths/mm') },
      { label: 'SAP SD Track', to: withSpanbixBase('/career-paths/sd') },
      { label: 'SAP ABAP Track', to: withSpanbixBase('/career-paths/abap') },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About', to: withSpanbixBase('/about') },
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
      { label: 'Privacy', to: withSpanbixBase('/about#privacy') },
      { label: 'Terms', to: withSpanbixBase('/about#terms') },
      { label: 'Refund', to: withSpanbixBase('/about#refunds') },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="relative"
      style={{ background: '#050d1f', color: 'rgba(255,255,255,0.7)', padding: '72px 0 32px' }}
    >
      <div className="max-w-7xl mx-auto w-full min-w-0 px-6 sm:px-6 md:px-8">
        <div
          className="grid gap-10"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'start' }}
        >
          <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
            <Link
              to={withSpanbixBase('/')}
              aria-label="Spanbix — home"
              className="inline-flex items-center"
              style={{
                background: '#ffffff',
                borderRadius: 12,
                padding: '10px 16px',
              }}
            >
              <img
                src="/spanbix/spanbix-blue.png"
                alt="Spanbix"
                style={{ height: 44, width: 'auto', display: 'block' }}
              />
            </Link>
            <p
              style={{
                fontSize: 13.5, color: 'rgba(255,255,255,0.6)',
                marginTop: 16, maxWidth: 320, lineHeight: 1.6,
                fontFamily: '"Geist", "Sora", system-ui, sans-serif',
              }}
            >
              Career transformation infrastructure for the SAP and enterprise technology economy.
              Built for the SAP economy.
            </p>
            <div className="flex gap-2.5" style={{ marginTop: 22 }}>
              {SOCIAL_LINKS.map(({ name, Icon, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Spanbix on ${name}`}
                  className="grid place-items-center transition-colors"
                  style={{
                    width: 38, height: 38, borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.78)',
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.label}>
              <h5
                style={{
                  color: '#fff', fontSize: 11.5, letterSpacing: '0.16em',
                  textTransform: 'uppercase', margin: '0 0 14px', fontWeight: 600,
                  fontFamily: '"Geist", "Sora", system-ui, sans-serif',
                }}
              >
                {col.label}
              </h5>
              <ul
                style={{
                  listStyle: 'none', padding: 0, margin: 0,
                  display: 'grid', gap: 9, fontSize: 13.5,
                  fontFamily: '"Geist", "Sora", system-ui, sans-serif',
                }}
              >
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col md:flex-row justify-between gap-4"
          style={{
            marginTop: 56, paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12.5,
            fontFamily: '"Geist", "Sora", system-ui, sans-serif',
          }}
        >
          <div>© {new Date().getFullYear()} Spanbix Training Institute. · Greater Noida</div>
          <div style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', color: 'rgba(255,255,255,0.45)' }}>
            v.3.0 — REDESIGN_2026
          </div>
        </div>
      </div>
    </footer>
  );
}
