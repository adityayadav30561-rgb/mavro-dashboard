import Image from 'next/image';
import Link from 'next/link';

// Footer (redesign v2) — 5-column grid on desktop, 2-col on mobile.
// Wordmark + brief, then Platform / Company / Resources / Legal link sets.

// Real social tiles — lucide-react 1.16 in this project does NOT export brand
// icons (Linkedin / Facebook / Instagram), so we inline the official brand
// glyphs as SVG. Each entry: { id, label, href, glyph }. Adding a new platform
// = drop a new entry; the icon is just a path payload.
const SOCIALS = [
  {
    id: 'LI',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/118163985',
    glyph: (
      <path d="M19 0H5C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM8 19H5V8h3v11zM6.5 6.7C5.5 6.7 4.8 6 4.8 5s.7-1.7 1.7-1.7S8.2 4 8.2 5s-.7 1.7-1.7 1.7zM20 19h-3v-5.6c0-1.4-.5-2.2-1.6-2.2-1.2 0-1.9.8-1.9 2.2V19h-3V8h2.9v1.3c.4-.7 1.5-1.5 3-1.5 2 0 3.6 1.2 3.6 3.6V19z" />
    ),
  },
  {
    id: 'FB',
    label: 'Facebook',
    href: 'https://www.facebook.com/people/Spanbix-Training-Institute/61590494903596/',
    glyph: (
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.23 2.68.23v2.96h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z" />
    ),
  },
  {
    id: 'IG',
    label: 'Instagram',
    href: 'https://www.instagram.com/spanbix93',
    glyph: (
      <>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 00-2.13 1.38A5.88 5.88 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12c0 3.26.01 3.67.07 4.95.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.88 5.88 0 002.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24c3.26 0 3.67-.01 4.95-.07 1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 002.13-1.38 5.88 5.88 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95 0-3.26-.01-3.67-.07-4.95-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 00-1.38-2.13A5.88 5.88 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" />
        <path d="M12 5.84A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zM18.4 6.86a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z" />
      </>
    ),
  },
  {
    id: 'YT',
    label: 'YouTube',
    href: 'https://www.youtube.com/@Spanbix93',
    glyph: (
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    ),
  },
  {
    id: 'PT',
    label: 'Pinterest',
    href: 'https://in.pinterest.com/spanbix93/',
    glyph: (
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.366-.053.225-.172.273-.402.165-1.495-.696-2.43-2.879-2.43-4.633 0-3.773 2.74-7.241 7.901-7.241 4.149 0 7.371 2.957 7.371 6.908 0 4.123-2.6 7.443-6.208 7.443-1.214 0-2.355-.629-2.744-1.378l-.747 2.852c-.269 1.04-1.001 2.345-1.488 3.138C9.566 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    ),
  },
];

function SocialGlyph({ children }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

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
      { label: 'Jobs', to: 'https://jobs.spanbix.com/', external: true },
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
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Refund', to: '/refund' },
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
              <Image
                src="/spanbix/spanbix-blue.png"
                alt="Spanbix"
                width={500}
                height={500}
                sizes="44px"
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
              {SOCIALS.map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={`Spanbix on ${s.label}`}
                  className="grid place-items-center transition-colors hover:text-white hover:border-white/30"
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <SocialGlyph>{s.glyph}</SocialGlyph>
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
                    {l.external ? (
                      <a
                        href={l.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.to} className="hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    )}
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
          <div>© 2026 Spanbix Training Institute. · Greater Noida</div>
        </div>
      </div>
    </footer>
  );
}
