import { Link } from 'react-router-dom';
import { Compass, UserPlus, Calendar, Briefcase } from 'lucide-react';
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
  { n: '01', icon: Compass,   t: 'Discovery',           b: '30-minute call with the institutional team. Walk through your placement calendar, cohort size, and the modules to enable. We map the right ERP tracks to your student profile.' },
  { n: '02', icon: UserPlus,  t: 'Roster + Onboarding', b: 'Share the batch roster. Spanbix generates credentials, assigns cohorts, and sends welcome emails so students start cleanly.' },
  { n: '03', icon: Calendar,  t: 'Cohort Execution',    b: 'Curriculum runs to your academic calendar. Live mentor sessions, recorded library for revisits, regular T&P sync.' },
  { n: '04', icon: Briefcase, t: 'Placement Layer',     b: 'Mock interviews, mentor referrals, and hiring partner connects layer in during the cohort.' },
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
      'Spanbix Campus brings ERP-readiness cohorts inside your college — structured curriculum, live mentor sessions, and a co-branded credential. Aligned to your placement calendar.',
    keywords: ['campus ERP training', 'institutional SAP partnerships', 'placement cell ERP', 'campus ERP curriculum'],
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
        title={<>Make "placed in ERP roles" a line in your <em>prospectus</em>.</>}
        subtitle="ERP-readiness cohorts inside your college — structured curriculum, live mentor sessions, recorded library, and a co-branded credential. Aligned to your academic calendar."
        meta={[
          { value: '4', label: 'ERP tracks available' },
          { value: '3 mo', label: 'Cohort duration' },
          { value: 'Co-branded', label: 'College credential' },
        ]}
      >
        <div className="sx-row" style={{ gap: 12 }}>
          <Link to={withSpanbixBase('/contact')} className="sx-btn sx-btn-citron">
            Partner With Spanbix <Arrow />
          </Link>
        </div>
      </PageHero>

      <Campus tone="paper" showCtaStrip={false} />

      {/* Rollout process strip */}
      <section className="sx-section sx-section-cream">
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

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {ROLLOUT_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.n}
                  className="sx-reveal"
                  style={{
                    background: 'var(--sx-white)',
                    border: '1px solid var(--sx-hairline)',
                    borderRadius: 14,
                    padding: 22,
                  }}
                >
                  <div
                    className="grid place-items-center"
                    style={{
                      width: 52, height: 52,
                      borderRadius: 13,
                      background: 'linear-gradient(135deg, var(--sx-navy) 0%, var(--sx-navy-700) 100%)',
                      color: 'var(--sx-citron)',
                      boxShadow: '0 8px 22px -10px rgba(16,44,86,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset',
                      marginBottom: 14,
                    }}
                  >
                    <Icon size={24} strokeWidth={1.8} />
                  </div>
                  <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', letterSpacing: '0.12em' }}>{s.n} · STEP</div>
                  <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', margin: '6px 0 8px', letterSpacing: '-0.01em' }}>
                    {s.t}
                  </h4>
                  <p style={{ color: 'var(--sx-ink-3)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{s.b}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tracks delivered on campus */}
      <section className="sx-section sx-section-paper">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Tracks Delivered On Campus</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                Functional + technical ERP — <em>built for your batch</em>.
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
