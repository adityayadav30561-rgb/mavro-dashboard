import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import DemoVideos from '@/components/spanbix/redesign/sections/DemoVideos';
import Mentors from '@/components/spanbix/redesign/sections/Mentors';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

// Demo classes page — full sample lessons from active tracks. Same DemoVideos
// section reused, layered with a library grid + Mentors + FinalCta.

const LIBRARY = [
  { track: 'SAP FICO', dur: '32 min', t: 'Configuring a chart of depreciation in S/4HANA',                     m: 'Aman Patil',    tone: 'rose' },
  { track: 'SAP FICO', dur: '28 min', t: 'How a Tier-1 SI runs its monthly close',                              m: 'Aman Patil',    tone: 'rose' },
  { track: 'SAP MM',   dur: '27 min', t: 'Procure-to-pay end-to-end on a live sandbox',                         m: 'Neha Iyer',     tone: 'olive' },
  { track: 'SAP MM',   dur: '34 min', t: 'Goods receipt + invoice verification walk-through',                   m: 'Neha Iyer',     tone: 'olive' },
  { track: 'SAP SD',   dur: '31 min', t: 'Pricing procedure from condition records to net price',               m: 'Rohit Sharma',  tone: 'cream' },
  { track: 'SAP SD',   dur: '24 min', t: 'Order-to-cash, every screen, every step',                             m: 'Rohit Sharma',  tone: 'cream' },
  { track: 'SAP ABAP', dur: '41 min', t: 'Reading + extending a real RICEFW object',                            m: 'Karthik S.',    tone: 'slate' },
  { track: 'SAP ABAP', dur: '38 min', t: 'CDS views, OData services, and modern RAP — the working consultant view', m: 'Karthik S.', tone: 'slate' },
  { track: 'CAREER',   dur: '22 min', t: 'How recruiters read an ATS-friendly SAP resume',                       m: 'Vikram Joshi',  tone: 'slate' },
];

export default function SpanbixDemoClasses() {
  useSEO({
    title: `Demo Classes — ${SPANBIX_SITE.name}`,
    description:
      "Watch full-length sample lessons from Spanbix tracks — same mentor, same sandbox, same depth a paid learner gets. Decide with proof, not a 30-second highlight reel.",
    keywords: ['SAP demo class', 'free SAP training', 'SAP sample lesson', 'SAP FICO demo'],
    canonical: `${SPANBIX_SITE.url}/demo-classes`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Demo Classes', url: `${SPANBIX_SITE.url}/demo-classes` },
      ]),
    ],
  });
  useScrollReveal();

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Sample the Real Thing"
        title={<>Watch a <em>full mentor session</em>. Then decide.</>}
        subtitle="Most platforms ship 30-second highlight reels. Spanbix ships full-length sample lessons from active cohort recordings — same mentor, same sandbox, same depth a paid learner gets. Free, no email gate."
        meta={[
          { value: '40+', label: 'Sample lessons live' },
          { value: '9 hrs', label: 'Total runtime' },
          { value: 'Free', label: 'No paywall, no email gate' },
        ]}
      />

      <DemoVideos />

      {/* Full library grid */}
      <section className="sx-section sx-section-cream">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Full Demo Library</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                Browse by <em>track</em>, by <em>mentor</em>, by topic.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              Every video below is a real cohort recording. Pricing, scope, and curriculum
              transparency are baked into the sample — what you watch here is what you get inside.
            </p>
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {LIBRARY.map((v, i) => (
              <article
                key={i}
                className="sx-reveal overflow-hidden"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 14,
                  transitionDelay: `${i * 50}ms`,
                }}
              >
                <div className={`sx-photo sx-photo-${v.tone} relative`} style={{ aspectRatio: '16/10' }}>
                  <span
                    className="absolute sx-mono"
                    style={{
                      top: 12, left: 12,
                      background: 'rgba(255,255,255,0.94)', color: 'var(--sx-navy)',
                      padding: '5px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    }}
                  >
                    {v.track}
                  </span>
                  <span
                    className="absolute sx-mono"
                    style={{
                      top: 12, right: 12,
                      background: 'rgba(0,0,0,0.5)', color: '#fff',
                      padding: '4px 10px', borderRadius: 99, fontSize: 10,
                    }}
                  >
                    ⏱ {v.dur}
                  </span>
                  <button
                    aria-label="Play preview"
                    className="absolute grid place-items-center"
                    style={{
                      top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      width: 52, height: 52, borderRadius: 999,
                      background: 'var(--sx-navy)', color: '#fff', border: 0,
                      boxShadow: '0 0 0 7px rgba(255,255,255,0.18)', cursor: 'pointer',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M8 5l10 7-10 7V5z" fill="currentColor" /></svg>
                  </button>
                </div>
                <div style={{ padding: 18 }}>
                  <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 19, color: 'var(--sx-navy)', margin: '0 0 8px', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                    {v.t}
                  </h4>
                  <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: 'var(--sx-ink-3)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--sx-navy)' }} />
                    Mentor · {v.m}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Mentors />
      <FinalCta />
    </SpanbixLayout>
  );
}
