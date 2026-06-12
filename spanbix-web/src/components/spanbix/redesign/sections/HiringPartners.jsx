'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  // tile around it. Native brand colors stay intact. next/image serves AVIF/WebP
  // automatically; on load failure we fall back to a serif wordmark via React
  // state (the old imperative `replaceWith` DOM swap doesn't compose with the
  // next/image wrapper element).
  const [errored, setErrored] = useState(false);
  return (
    <div
      className="shrink-0 grid place-items-center"
      style={{ height: 56, minWidth: 160, padding: '0 8px' }}
      title={p.name}
    >
      {errored ? (
        <span
          style={{
            fontFamily: 'var(--sx-serif)',
            fontSize: 20,
            color: 'var(--sx-navy)',
            letterSpacing: '0.02em',
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
          }}
        >
          {p.name}
        </span>
      ) : (
        <Image
          src={`/spanbix/partners/${p.file}`}
          alt={`${p.name} logo`}
          width={170}
          height={48}
          loading="lazy"
          onError={() => setErrored(true)}
          style={{
            maxHeight: 48,
            maxWidth: 170,
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      )}
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
