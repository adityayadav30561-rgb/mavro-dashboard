'use client';

// HiringPartners — marquee strip of partner logos.
//
// Logos are served locally from `client/public/spanbix/partners/<slug>.png`.
// Earlier Clearbit-based remote loading was unreliable (the free Logo API has
// been deprecated / inconsistent for some brands), so we ship a fixed set of
// PNGs in the public folder for guaranteed-working assets.
//
// To swap a brand: drop a new PNG at the same path or update the `file` field.
// Transparent-background PNGs render best on the white pill; ~600×200 source
// resolution keeps them sharp on retina.

const PARTNERS = [
  { name: 'Tata Consultancy', file: 'tcs.png' },
  { name: 'Infosys',          file: 'infosys.png' },
  { name: 'Capgemini',        file: 'capgemini.png' },
  { name: 'Deloitte',         file: 'deloitte.png' },
  { name: 'Accenture',        file: 'ACCENTURE.png' },
  { name: 'Wipro',            file: 'wipro.png' },
  { name: 'IBM',              file: 'ibm.png' },
  { name: 'Cognizant',        file: 'cognizant.png' },
  { name: 'HCLTech',          file: 'hcl.png' },
  { name: 'KPMG',             file: 'kpmg.png' },
  { name: 'PwC',              file: 'pwc.png' },
  { name: 'Tech Mahindra',    file: 'tech-mahindra.png' },
];

function PartnerLogo({ p }) {
  // Logo PNG renders directly on the section's cream bg — no pill / shadow /
  // tile around it. Native brand colors stay intact.
  return (
    <div
      className="shrink-0 grid place-items-center"
      style={{ height: 56, minWidth: 160, padding: '0 8px' }}
      title={p.name}
    >
      <img
        src={`/spanbix/partners/${p.file}`}
        alt={`${p.name} logo`}
        loading="lazy"
        decoding="async"
        style={{
          maxHeight: 48,
          maxWidth: 170,
          objectFit: 'contain',
          display: 'block',
        }}
        onError={(e) => {
          const fallback = document.createElement('span');
          fallback.textContent = p.name;
          fallback.style.cssText = [
            'font-family: var(--sx-serif)',
            'font-size: 20px',
            'color: var(--sx-navy)',
            'letter-spacing: 0.02em',
            'font-style: italic',
            'white-space: nowrap',
          ].join(';');
          e.currentTarget.replaceWith(fallback);
        }}
      />
    </div>
  );
}

export default function HiringPartners() {
  return (
    <section
      style={{
        padding: '40px 0',
        background: 'var(--sx-cream-50)',
        color: 'var(--sx-ink)',
        borderTop: '1px solid var(--sx-hairline)',
        borderBottom: '1px solid var(--sx-hairline)',
      }}
    >
      <div className="sx-container mb-6">
        <span className="sx-mono" style={{ color: 'var(--sx-ink-3)' }}>
          COMPANIES THAT ACTIVELY HIRE FOR ERP AND SAP ROLES
        </span>
      </div>
      <div className="sx-marquee">
        <div className="sx-marquee-track">
          {[...PARTNERS, ...PARTNERS].map((p, i) => (
            <PartnerLogo key={`${p.file}-${i}`} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
