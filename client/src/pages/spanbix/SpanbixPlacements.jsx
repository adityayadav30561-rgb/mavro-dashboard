import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import Placement from '@/components/spanbix/redesign/sections/Placement';
import Outcomes from '@/components/spanbix/redesign/sections/Outcomes';
import HiringPartners from '@/components/spanbix/redesign/sections/HiringPartners';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

// Placements page — proof + process. Hero with placement-volume stats,
// HiringPartners marquee, Placement 3-step, Outcomes testimonials, plus a
// verification strip + FinalCta.

const VERIFICATION = [
  { t: 'Every CTC verified at offer-letter stage', b: 'Numbers below are taken from offer letters that placed graduates voluntarily share with us. No claimed-but-unverified stories.' },
  { t: 'Spanbix mentors sit on the hiring panels', b: 'Our faculty actively interviews for Tier-1 SIs, GCCs, and manufacturing majors. Mock interviews are built around the same questions they ask in real panels.' },
  { t: "Placement support doesn't expire", b: "If you don't sign an offer in your cohort's placement window, support carries over — until you sign your first SAP role." },
  { t: 'Partial / full refund on placement miss', b: 'Track-specific refund terms spelled out before enrollment. No hidden clauses, no "it depends" answers after the fact.' },
];

export default function SpanbixPlacements() {
  useSEO({
    title: `Placements — ${SPANBIX_SITE.name}`,
    description:
      'Verified Spanbix placement outcomes — alumni offers across Tier-1 IT, GCC, manufacturing, and BFSI hiring partners. Median CTC, growth multipliers, hiring panel transparency.',
    keywords: ['SAP placement', 'SAP consultant jobs', 'SAP FICO placement', 'SAP careers India'],
    canonical: `${SPANBIX_SITE.url}/placements`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Placements', url: `${SPANBIX_SITE.url}/placements` },
      ]),
    ],
  });
  useScrollReveal();

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Placement Outcomes"
        title={<>Real graduates. Real offers. <em>Real salary jumps.</em></>}
        subtitle="Spanbix's placement layer turns on from week one of your track — profile building, mentor referrals, and direct hiring-partner connects — and stays on until you sign your first offer letter. Every metric below is sourced from offer letters our alumni voluntarily share."
        meta={[
          { value: '₹14.2L', label: 'Median placed CTC' },
          { value: '2.7x', label: 'Avg salary growth' },
          { value: '142+', label: 'Verified placements' },
        ]}
      />

      <HiringPartners />
      <Placement />
      <Outcomes />

      {/* Verification + transparency strip */}
      <section className="sx-section sx-section-paper">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">How We Verify</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                If we can't prove it, <em>we don't print it</em>.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              Most training brands report placement numbers selectively. We've made the opposite
              promise — every story you see lists track, hiring partner, before-CTC, and after-CTC.
              If we can't verify any of those, the story doesn't ship.
            </p>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {VERIFICATION.map((v, i) => (
              <div
                key={i}
                className="sx-reveal"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 12,
                  padding: 22,
                }}
              >
                <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>0{i + 1} · COMMITMENT</div>
                <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', margin: '8px 0', letterSpacing: '-0.01em' }}>
                  {v.t}
                </h4>
                <p style={{ color: 'var(--sx-ink-3)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{v.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </SpanbixLayout>
  );
}
