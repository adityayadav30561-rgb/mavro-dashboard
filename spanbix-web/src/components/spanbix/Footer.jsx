import Link from 'next/link';

// Footer (redesign v2) — 5-column grid on desktop, 2-col on mobile.
// Wordmark + brief, then Platform / Company / Resources / Legal link sets.

const COLUMNS = [
  {
    label: 'Platform',
    links: [
      { label: 'SAP FICO Track', to: '/career-paths/fico' },
      { label: 'SAP MM Track', to: '/career-paths/mm' },
      { label: 'SAP SD Track', to: '/career-paths/sd' },
      { label: 'SAP ABAP Track', to: '/career-paths/abap' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Campus Programs', to: '/campus-programs' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Blog', to: '/blog' },
      { label: 'Career Guides', to: '/blog?category=guides' },
      { label: 'FAQs', to: '/about#faqs' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { label: 'Privacy', to: '/about#privacy' },
      { label: 'Terms', to: '/about#terms' },
      { label: 'Refund', to: '/about#refunds' },
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
              href="/"
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
              {['IG', 'LI', 'YT', 'X'].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={`Spanbix on ${s}`}
                  className="grid place-items-center"
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.12)',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: '"Geist", "Sora", system-ui, sans-serif',
                  }}
                >
                  {s}
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
                    <Link href={l.to} className="hover:text-white transition-colors">
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
          <div>© {new Date().getFullYear()} Spanbix Training Institute. Bengaluru · Hyderabad · Pune.</div>
          <div style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', color: 'rgba(255,255,255,0.45)' }}>
            v.3.0 — REDESIGN_2026
          </div>
        </div>
      </div>
    </footer>
  );
}
