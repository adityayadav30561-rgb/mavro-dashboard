import { Link } from 'react-router-dom';
import { Star, Clock, TrendingUp } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import Tracks from '@/components/spanbix/redesign/sections/Tracks';
import Mentors from '@/components/spanbix/redesign/sections/Mentors';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import {
  SPANBIX_CAREER_PATHS,
  SPANBIX_SITE,
  breadcrumbLd,
  courseLd,
} from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';

// Career-paths page — magazine catalog. Hero + Tracks tab section + a flat
// catalog table of every track (functional + technical) + Mentors + FinalCta.

const TONE_BY_CATEGORY = {
  functional: 'rose',
  technical: 'slate',
};

export default function SpanbixCareerPaths() {
  useSEO({
    title: `Career Paths — ${SPANBIX_SITE.name}`,
    description:
      'Structured SAP + ERP career paths for commerce, MBA, and engineering graduates — FICO, MM, SD, ABAP and more, with mentor-led tracks + placement support baked in from week one.',
    keywords: ['SAP career paths', 'SAP FICO career', 'SAP MM career', 'SAP ABAP career', 'ERP career India'],
    canonical: `${SPANBIX_SITE.url}/career-paths`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Career Paths', url: `${SPANBIX_SITE.url}/career-paths` },
      ]),
      ...SPANBIX_CAREER_PATHS.map(courseLd),
    ],
  });
  useScrollReveal();

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Career Paths"
        title={<>Pick the SAP track that actually pays for <em>your degree</em>.</>}
        subtitle="Each path below is a self-contained career layer — curriculum, mentor reviews, sandbox practice, capstone, and placement runway. Pick by background, salary band, and how soon you want an offer letter."
        meta={[
          { value: '4', label: 'Active tracks' },
          { value: '₹6–22L', label: 'CTC range placed' },
          { value: '3.5–5 mo', label: 'Time to job-ready' },
        ]}
      />

      <Tracks />

      {/* Flat catalog table — every track in one list. */}
      <section className="sx-section sx-section-paper">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Full Catalog</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                Every track Spanbix runs<br />— <em>at a glance</em>.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              Salary bands sourced from verified placements over the last 12 months. Demand
              ratings reflect open requisitions across hiring partners as of this quarter.
            </p>
          </div>

          <div className="grid gap-3">
            {SPANBIX_CAREER_PATHS.map((p) => (
              <Link
                key={p.code}
                to={withSpanbixBase(`/career-paths/${p.code}`)}
                className="block group"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 14,
                  padding: '20px 22px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div className="grid items-center gap-4" style={{ gridTemplateColumns: '60px 1fr auto auto auto auto' }}>
                  <span
                    className={`sx-photo sx-photo-${TONE_BY_CATEGORY[p.category] || 'slate'} grid place-items-center`}
                    style={{
                      width: 60, height: 60, borderRadius: 10,
                      fontFamily: 'var(--sx-serif)', fontSize: 22, color: '#fff', fontStyle: 'italic',
                    }}
                  >
                    {p.code.toUpperCase().slice(0, 4)}
                  </span>
                  <div className="min-w-0">
                    <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', letterSpacing: '-0.01em' }}>
                      {p.name}
                    </div>
                    <div style={{ color: 'var(--sx-ink-3)', fontSize: 13.5, marginTop: 4 }}>
                      {p.audience}
                    </div>
                  </div>
                  <span className="sx-chip"><Clock size={11} /> {p.duration}</span>
                  <span className="sx-chip"><TrendingUp size={11} /> {p.demand}</span>
                  <span className="sx-chip"><Star size={11} /> {p.salaryRange}</span>
                  <Arrow size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Mentors />
      <FinalCta />
    </SpanbixLayout>
  );
}
