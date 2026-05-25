import { Link } from 'react-router-dom';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import Campus from '@/components/spanbix/redesign/sections/Campus';
import Mentors from '@/components/spanbix/redesign/sections/Mentors';
import Certification from '@/components/spanbix/redesign/sections/Certification';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';

// Campus partnerships page — institutional B2B framing for placement cells +
// academic leadership. Reuses the homepage Campus section as the primary
// anchor, layered with a rollout-process strip + tracks delivered on campus +
// Mentors + Certification + FinalCta.

const ROLLOUT_STEPS = [
  { n: '01', t: 'Discovery', b: '30-minute call with our institutional team. Walk through your placement calendar, cohort size, and the modules you want enabled. We map the right SAP tracks to your student profile.' },
  { n: '02', t: 'Roster + Onboarding', b: 'Drop us a CSV of the batch. Within 48 hours, Spanbix generates credentials, assigns cohorts, and sends welcome emails — 200 to 2,000 learners onboarded in one clean rollout.' },
  { n: '03', t: 'Cohort Execution', b: 'Curriculum runs to your academic calendar. Attendance-linked progression, weekly mentor sessions, T&P dashboard updates every Monday morning.' },
  { n: '04', t: 'Placement Layer', b: 'Mock interviews, alumni referrals, hiring partner connects activate from month three. Mid-cohort placement readiness scoring keeps every student tracked.' },
  { n: '05', t: 'Outcomes Reporting', b: 'Quarterly cohort report — assessments, mock-interview readiness, placement-match scoring — formatted for your annual placement reviews.' },
];

const TRACKS = [
  { code: 'FICO', tone: 'rose',  audience: 'BCom · BBA · MBA',   highlights: 'Finance, controlling, S/4HANA' },
  { code: 'MM',   tone: 'olive', audience: 'BBA · B.Tech',       highlights: 'Procure-to-pay, materials master' },
  { code: 'SD',   tone: 'cream', audience: 'BCom · BBA',         highlights: 'Order-to-cash, pricing, billing' },
  { code: 'ABAP', tone: 'slate', audience: 'B.Tech · BCA · MCA', highlights: 'RICEFW, CDS views, RAP' },
];

export default function SpanbixCampusPrograms() {
  useSEO({
    title: `Campus Programs — ${SPANBIX_SITE.name}`,
    description:
      'Spanbix Campus brings SAP-readiness cohorts inside your college — structured curriculum, attendance-linked progression, T&P-instrumented dashboards, and a co-branded credential.',
    keywords: ['campus SAP training', 'institutional SAP partnerships', 'placement cell SAP', 'campus ERP curriculum'],
    canonical: `${SPANBIX_SITE.url}/campus-programs`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Campus Programs', url: `${SPANBIX_SITE.url}/campus-programs` },
      ]),
    ],
  });
  useScrollReveal();

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="For Colleges + Placement Cells"
        title={<>Make "placed in SAP roles" a line in your <em>prospectus</em>.</>}
        subtitle="Spanbix Campus runs SAP-readiness cohorts inside your college — structured curriculum, attendance-linked progression, T&P-instrumented dashboards, and a co-branded credential. Your placement office gets a real career layer; your students get a career most of their peers never hear of."
        meta={[
          { value: '12', label: 'Active campus cohorts' },
          { value: '2,400+', label: 'Students enrolled' },
          { value: '4 states', label: 'Geographic reach' },
        ]}
      >
        <div className="sx-row" style={{ gap: 12 }}>
          <Link to={withSpanbixBase('/contact')} className="sx-btn sx-btn-citron">
            Partner With Spanbix <Arrow />
          </Link>
        </div>
      </PageHero>

      <Campus />

      {/* Rollout process strip */}
      <section className="sx-section sx-section-paper">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Rollout Process</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                From CSV roster to <em>placement-ready cohort</em>.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              A five-step institutional rollout. No long onboarding calls, no surprise
              dependencies — your T&P office knows exactly what's happening at every milestone.
            </p>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {ROLLOUT_STEPS.map((s) => (
              <div
                key={s.n}
                className="sx-reveal"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 12,
                  padding: 22,
                }}
              >
                <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>{s.n} · STEP</div>
                <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', margin: '8px 0 8px', letterSpacing: '-0.01em' }}>
                  {s.t}
                </h4>
                <p style={{ color: 'var(--sx-ink-3)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks delivered on campus */}
      <section className="sx-section sx-section-cream">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Tracks Delivered On Campus</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                Functional + technical SAP — <em>built for your batch</em>.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              Cohorts can run any combination of these tracks. Engineering colleges typically run
              ABAP + MM. Commerce + management programs typically run FICO + SD + MM. Cohort
              composition follows your student profile, not our catalog.
            </p>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {TRACKS.map((t) => (
              <div
                key={t.code}
                className="sx-reveal overflow-hidden"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 14,
                }}
              >
                <div
                  className={`sx-photo sx-photo-${t.tone} relative`}
                  style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'flex-end', padding: 18 }}
                >
                  <div
                    className="absolute"
                    style={{
                      top: 12, left: 18,
                      fontFamily: 'var(--sx-serif)', fontSize: 48,
                      color: 'rgba(255,255,255,0.85)', fontStyle: 'italic',
                      letterSpacing: '-0.04em', lineHeight: 1,
                    }}
                  >
                    {t.code}
                  </div>
                </div>
                <div style={{ padding: 18 }}>
                  <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>{t.audience}</div>
                  <div style={{ color: 'var(--sx-ink-2)', fontSize: 14, marginTop: 6 }}>{t.highlights}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Mentors />
      <Certification />
      <FinalCta />
    </SpanbixLayout>
  );
}
