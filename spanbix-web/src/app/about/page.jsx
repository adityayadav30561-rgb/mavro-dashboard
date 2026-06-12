import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import JsonLd from '@/components/JsonLd';
import PageHero from '@/components/spanbix/redesign/PageHero';
import MarketValidation from '@/components/spanbix/redesign/sections/MarketValidation';
import Mentors from '@/components/spanbix/redesign/sections/Mentors';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE, educationalOrganizationLd, breadcrumbLd } from '@/lib/spanbixSeo';

export const metadata = buildMetadata({
  title: `About — ${SPANBIX_SITE.name}`,
  description:
    'Spanbix is an SAP & ERP career platform built by working consultants in Greater Noida — training commerce, MBA & engineering graduates for SAP jobs.',
  keywords: ['about Spanbix', 'Spanbix mission', 'SAP training company India', 'enterprise career platform'],
  canonical: `${SPANBIX_SITE.url}/about`,
  ogImage: SPANBIX_SITE.logo,
});

// Factual company details — verified data only. CIN / GST / founding year are
// intentionally absent until confirmed; do not add placeholders.
const FACTS = [
  { label: 'Registered office', value: SPANBIX_SITE.address.street + ', ' + SPANBIX_SITE.address.locality + ', ' + SPANBIX_SITE.address.region + ' ' + SPANBIX_SITE.address.postalCode },
  { label: 'Learning centres', value: SPANBIX_SITE.centres.join(' · ') },
  { label: 'Email', value: SPANBIX_SITE.email },
  { label: 'Phone', value: SPANBIX_SITE.phone },
];

export default function AboutPage() {
  const ld = [
    breadcrumbLd([
      { name: 'Home', url: `${SPANBIX_SITE.url}/` },
      { name: 'About', url: `${SPANBIX_SITE.url}/about` },
    ]),
    educationalOrganizationLd(),
  ];
  return (
    <>
      <JsonLd data={ld} />
      <SpanbixLayout>
        <PageHero
          eyebrow="About Spanbix"
          title={<>Career transformation infrastructure for the <em>SAP economy</em>.</>}
          subtitle="India ships millions of commerce, management, and engineering graduates into the job market every year. The country also runs the global SAP delivery economy. Almost nothing connects the two — which is exactly why we built Spanbix."
          meta={[
            { value: '4', label: 'Active tracks' },
            { value: '12', label: 'Campus cohorts' },
            { value: '2,400+', label: 'Learners enrolled' },
          ]}
        />
        <MarketValidation
          eyebrow="Founder Story"
          title={<>Led by a founder who lived the <em>gap</em>.</>}
          lead="Spanbix was started by a founder with 15+ years inside the SAP industry — after watching thousands of open roles go unfilled while skilled candidates stayed invisible. We built it from inside the gap, not from the outside."
          stats={[
            { num: '15+ yrs', label: 'FOUNDER', text: 'Hands-on SAP delivery experience before starting Spanbix' },
            { num: '50K+', label: 'OPEN ROLES', text: 'ERP jobs posted yearly in India — pipeline can\'t fill them' },
            { num: '3 mo', label: 'TO READY', text: 'Structured path from beginner to placement-ready' },
            { num: '4', label: 'SAP TRACKS', text: 'FICO, MM, SD and ABAP — functional and technical' },
          ]}
          image="/spanbix/lalit.png"
          imageAlt="LalitMohan Parihar — Spanbix founder"
          imageCorner="FOUNDER"
          sources={null}
        />
        <Mentors />
        <section className="sx-section sx-section-paper">
          <div className="sx-container">
            <div className="sx-section-head">
              <div className="sx-stack-md">
                <span className="sx-eyebrow">Company</span>
                <h2 className="sx-display sx-h2 sx-reveal">
                  Where to <em>find us</em>.
                </h2>
              </div>
              <p className="sx-lead sx-reveal">
                Spanbix runs online cohorts nationwide, with learning centres in
                Greater Noida and Lucknow. Reach the team directly using the
                details below.
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2" style={{ marginTop: 8 }}>
              {FACTS.map((f) => (
                <div
                  key={f.label}
                  style={{
                    background: 'var(--sx-white)',
                    border: '1px solid var(--sx-hairline)',
                    borderRadius: 14,
                    padding: '18px 20px',
                  }}
                >
                  <dt className="sx-mono" style={{ color: 'var(--sx-ink-4)', marginBottom: 6 }}>
                    {f.label.toUpperCase()}
                  </dt>
                  <dd style={{ color: 'var(--sx-navy)', fontWeight: 500, lineHeight: 1.45 }}>
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <FinalCta />
      </SpanbixLayout>
    </>
  );
}
