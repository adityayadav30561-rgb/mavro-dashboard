import { useEffect, useState } from 'react';
import { Link, useParams, Navigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Globe, Star, Users, CheckCircle2 } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import Mentors from '@/components/spanbix/redesign/sections/Mentors';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import {
  SPANBIX_SITE,
  getCareerPath,
  breadcrumbLd,
  courseLd,
} from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';
import { trackCtaClick } from '@/lib/analytics';

// Course detail — per-track editorial layout.
//   - Individual mode: pricing + Enrol CTA + individualTimeline (week buckets)
//   - Campus mode:     pricing hidden + campusTimeline (semester months)
// Switches via ?mode=campus deep-link or the pill toggle below the hero.

export default function SpanbixCourseDetail() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const track = getCareerPath(code);
  const initialMode = searchParams.get('mode') === 'campus' ? 'campus' : 'individual';
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    const next = searchParams.get('mode') === 'campus' ? 'campus' : 'individual';
    setMode(next);
  }, [searchParams]);

  const url = track
    ? `${SPANBIX_SITE.url}/career-paths/${track.code}`
    : `${SPANBIX_SITE.url}/career-paths`;
  useSEO({
    title: track
      ? `${track.name} · ${track.fullName} — ${SPANBIX_SITE.name}`
      : `SAP Career Paths — ${SPANBIX_SITE.name}`,
    description: track
      ? `${track.summary} Mentor-led training, capstone, certification, and placement readiness.`
      : SPANBIX_SITE.description,
    keywords: track
      ? [`${track.name} course`, `${track.name} training`, `${track.name} certification`, `learn ${track.name}`]
      : SPANBIX_SITE.keywords,
    canonical: url,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: track
      ? [
          breadcrumbLd([
            { name: 'Home', url: `${SPANBIX_SITE.url}/` },
            { name: 'Career Paths', url: `${SPANBIX_SITE.url}/career-paths` },
            { name: track.name, url },
          ]),
          courseLd(track),
        ]
      : null,
  });

  useScrollReveal([code, mode]);

  if (!track) {
    return <Navigate to={withSpanbixBase('/career-paths')} replace />;
  }

  const timeline = mode === 'individual' ? track.individualTimeline : track.campusTimeline;
  const showPricing = mode === 'individual';

  return (
    <SpanbixLayout>
      {/* Editorial hero — navy band, breadcrumb, eyebrow, title, summary, meta strip */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'var(--sx-navy)',
          color: '#fff',
          paddingTop: 'clamp(120px, 14vw, 180px)',
          paddingBottom: 'clamp(56px, 8vw, 96px)',
        }}
      >
        <div className="sx-grid-bg" />
        <div className="sx-container relative" style={{ zIndex: 2 }}>
          <Link
            to={withSpanbixBase('/career-paths')}
            className="inline-flex items-center gap-1.5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, fontFamily: 'var(--sx-sans)' }}
          >
            <ArrowLeft size={13} /> All career paths
          </Link>

          <div className="mt-6 grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 min-w-0">
              <span className="sx-eyebrow on-navy">{track.fullName.toUpperCase()}</span>
              <h1
                className="sx-display on-navy"
                style={{
                  color: '#fff', marginTop: 18,
                  fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 1.04, letterSpacing: '-0.02em',
                }}
              >
                {track.name}
              </h1>
              <p className="sx-lead on-navy" style={{ marginTop: 18 }}>{track.summary}</p>

              <div className="sx-hero-meta" style={{ marginTop: 32 }}>
                <Meta value={track.duration} label="Duration" />
                <span className="sx-hero-meta-divider" />
                <Meta value={track.salaryRange} label="Salary range" />
                <span className="sx-hero-meta-divider" />
                <Meta value={track.studentsEnrolled} label="Students enrolled" />
                <span className="sx-hero-meta-divider" />
                <Meta value={`★ ${track.rating}`} label={track.ratingsCount} />
              </div>
            </div>

            {/* Floating pricing / enrolment panel — individual mode only */}
            <div className="lg:col-span-4 min-w-0">
              <div
                className="sticky"
                style={{
                  top: 24,
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 16,
                  padding: 22,
                  boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
                }}
              >
                {/* Mode switcher */}
                <div
                  className="inline-flex p-1 rounded-full mb-5"
                  style={{ background: 'rgba(0,0,0,0.28)', gap: 2 }}
                >
                  {['individual', 'campus'].map((m) => {
                    const isActive = mode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className="relative px-4 py-1.5 rounded-full"
                        style={{
                          background: 'transparent', border: 0, cursor: 'pointer',
                          color: isActive ? 'var(--sx-navy)' : 'rgba(255,255,255,0.7)',
                          fontFamily: 'var(--sx-sans)', fontSize: 12.5, fontWeight: 500,
                          letterSpacing: '0.04em', textTransform: 'capitalize',
                        }}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="sx-detail-mode-pill"
                            className="absolute inset-0 rounded-full"
                            style={{ background: '#fff' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                          />
                        )}
                        <span className="relative z-10">{m}</span>
                      </button>
                    );
                  })}
                </div>

                {showPricing ? (
                  <>
                    <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>INDIVIDUAL ENROLMENT</div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <div
                        style={{
                          fontFamily: 'var(--sx-serif)', fontSize: 40,
                          letterSpacing: '-0.02em', color: '#fff', lineHeight: 1,
                        }}
                      >
                        {track.priceIndividual}
                      </div>
                      <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'line-through' }}>
                        {track.priceMrp}
                      </div>
                    </div>
                    <div className="sx-mono" style={{ color: 'var(--sx-citron)', marginTop: 4 }}>
                      Last updated {track.lastUpdated.toUpperCase()}
                    </div>
                    <Link
                      to={withSpanbixBase('/contact')}
                      onClick={() => trackCtaClick('Enrol Now', { location: 'course-detail', track: track.code })}
                      className="sx-btn sx-btn-citron mt-5"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Enrol Now <Arrow />
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>CAMPUS COHORT</div>
                    <div
                      style={{
                        fontFamily: 'var(--sx-serif)', fontSize: 26,
                        color: '#fff', marginTop: 8, letterSpacing: '-0.01em', lineHeight: 1.15,
                      }}
                    >
                      Negotiated with your placement office.
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, marginTop: 8 }}>
                      Campus cohorts are priced per-batch — depends on cohort size and modules
                      enabled. We walk through it on the institutional call.
                    </p>
                    <Link
                      to={withSpanbixBase('/campus-programs')}
                      className="sx-btn sx-btn-citron mt-5"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Talk to Campus Team <Arrow />
                    </Link>
                  </>
                )}

                <div className="mt-5 pt-5 grid gap-2.5 text-[12.5px]" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <Detail icon={Clock}  label={track.duration} />
                  <Detail icon={Globe}  label={track.language} />
                  <Detail icon={Users}  label={`Instructor · ${track.instructor.name}`} />
                  <Detail icon={Star}   label={`${track.rating} · ${track.ratingsCount}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="sx-section sx-section-paper" style={{ paddingTop: 'clamp(56px, 7vw, 96px)', paddingBottom: 'clamp(56px, 7vw, 96px)' }}>
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">What You'll Learn</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                Outcomes you'll <em>own</em> by the end of this track.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              Every line below is a verifiable capability — recruiters can ask, and you'll have a
              capstone artifact to back it up. No "exposure to" language. No "introduction to".
            </p>
          </div>

          <ul className="grid gap-3 list-none p-0" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {track.whatYoullLearn.map((line, i) => (
              <li
                key={i}
                className="sx-reveal flex items-start gap-3"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  transitionDelay: `${i * 40}ms`,
                }}
              >
                <span
                  className="mt-0.5 shrink-0 grid place-items-center"
                  style={{ width: 18, height: 18, borderRadius: 999, background: 'var(--sx-citron)' }}
                >
                  <CheckCircle2 size={11} strokeWidth={3} style={{ color: 'var(--sx-citron-ink)' }} />
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--sx-ink-2)' }}>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Curriculum timeline */}
      <section className="sx-section sx-section-cream">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Curriculum Timeline · {mode === 'campus' ? 'Campus Cohort' : 'Individual Track'}</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                How the {mode === 'campus' ? 'semester' : 'track'} <em>actually unfolds</em>.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              Calendar below is the real cadence — milestones, mentor reviews, capstone gates, and
              placement runway. {mode === 'campus' ? 'Aligned to your academic calendar.' : 'Self-paced inside cohort windows.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="grid gap-3"
            >
              {timeline.map((block, i) => (
                <div
                  key={i}
                  className="grid gap-4 items-start"
                  style={{
                    gridTemplateColumns: '120px 1fr',
                    background: 'var(--sx-white)',
                    border: '1px solid var(--sx-hairline)',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', letterSpacing: '0.1em', fontSize: 12 }}>
                    {block.label.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 20, color: 'var(--sx-navy)', margin: 0, letterSpacing: '-0.01em' }}>
                      {block.title}
                    </h4>
                    <p style={{ color: 'var(--sx-ink-3)', fontSize: 14, lineHeight: 1.55, margin: '6px 0 0' }}>{block.body}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Instructor + Includes + Requirements */}
      <section className="sx-section sx-section-paper">
        <div className="sx-container">
          <div className="grid gap-8" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)' }}>
            {/* Instructor */}
            <div
              className="sx-reveal"
              style={{
                background: 'var(--sx-white)',
                border: '1px solid var(--sx-hairline)',
                borderRadius: 16,
                padding: 24,
                alignSelf: 'start',
                position: 'sticky',
                top: 100,
              }}
            >
              <span className="sx-eyebrow">Mentor</span>
              <div
                className="mt-4 grid place-items-center"
                style={{
                  width: 80, height: 80, borderRadius: 999,
                  background: 'var(--sx-navy)', color: '#fff',
                  fontFamily: 'var(--sx-serif)', fontSize: 28, fontStyle: 'italic', letterSpacing: '-0.02em',
                }}
              >
                {track.instructor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', marginTop: 10, letterSpacing: '-0.01em' }}>
                {track.instructor.name}
              </div>
              <div className="sx-mono" style={{ color: 'var(--sx-ink-3)', marginTop: 4 }}>
                {track.instructor.title.toUpperCase()}
              </div>
              <p style={{ color: 'var(--sx-ink-3)', fontSize: 13.5, lineHeight: 1.6, marginTop: 14 }}>
                {track.instructor.bio}
              </p>
            </div>

            {/* Includes + Requirements */}
            <div className="grid gap-6">
              <div
                className="sx-reveal"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <span className="sx-eyebrow">This Track Includes</span>
                <ul className="mt-4 grid gap-2.5 list-none p-0">
                  {track.includes.map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5" style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--sx-ink-2)' }}>
                      <span
                        className="mt-0.5 shrink-0 grid place-items-center"
                        style={{ width: 16, height: 16, borderRadius: 999, background: 'var(--sx-citron)' }}
                      >
                        <CheckCircle2 size={10} strokeWidth={3} style={{ color: 'var(--sx-citron-ink)' }} />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="sx-reveal"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <span className="sx-eyebrow">Prerequisites</span>
                <ul className="mt-4 grid gap-2.5 list-none p-0">
                  {track.requirements.map((line, i) => (
                    <li key={i} style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--sx-ink-2)' }}>
                      · {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Mentors />
      <FinalCta />
    </SpanbixLayout>
  );
}

function Meta({ value, label }) {
  return (
    <div className="min-w-0">
      <div className="sx-hero-meta-num" style={{ fontSize: 'clamp(22px, 2.5vw, 32px)' }}>{value}</div>
      <div className="sx-hero-meta-lbl">{label}</div>
    </div>
  );
}

function Detail({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2.5" style={{ color: 'rgba(255,255,255,0.78)' }}>
      <Icon size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
      <span>{label}</span>
    </div>
  );
}
