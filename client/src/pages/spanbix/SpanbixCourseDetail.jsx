import { useEffect, useState, useRef } from 'react';
import { Link, useParams, Navigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Globe, Users, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import {
  SPANBIX_SITE,
  SPANBIX_MENTORS,
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
                  fontSize: 'clamp(32px, 6vw, 76px)', lineHeight: 1.04, letterSpacing: '-0.02em',
                  wordBreak: 'break-word',
                }}
              >
                {track.name}
              </h1>
              <p className="sx-lead on-navy" style={{ marginTop: 18 }}>{track.summary}</p>

              <div className="sx-hero-meta" style={{ marginTop: 32 }}>
                <Meta value={track.duration} label="Duration" />
                <span className="sx-hero-meta-divider" />
                <Meta value={track.salaryRange} label="Salary range (industry)" />
                <span className="sx-hero-meta-divider" />
                <Meta value={track.eligibility} label="Eligibility" />
              </div>
            </div>

            {/* Floating pricing / enrolment panel — individual mode only */}
            <div className="lg:col-span-4 min-w-0">
              <div
                className="lg:sticky"
                style={{
                  top: 110,
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
                    <div
                      style={{
                        fontFamily: 'var(--sx-serif)', fontSize: 26,
                        color: '#fff', marginTop: 8, letterSpacing: '-0.01em', lineHeight: 1.15,
                      }}
                    >
                      Talk to us to enrol.
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, marginTop: 8 }}>
                      Pricing is shared during the consultation call so we can tailor it to your background and goals.
                    </p>
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
                  <Detail icon={Users}  label={`Mentor · ${track.instructor.name}`} />
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
                What you'll take away from the track.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              The core capabilities you'll build, with a capstone to demonstrate them.
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

      {/* Curriculum overview — general flow */}
      <section className="sx-section sx-section-cream">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Curriculum Flow · {mode === 'campus' ? 'Campus Cohort' : 'Individual Track'}</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                How the {mode === 'campus' ? 'semester' : 'track'} <em>progresses</em>.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              A high-level view of the modules and pacing. {mode === 'campus' ? 'Aligned to your academic calendar.' : 'Walk through each module at a pace that fits your schedule.'}
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
                  key={block.id || i}
                  className="grid gap-2 sm:gap-4 items-start grid-cols-1 sm:[grid-template-columns:minmax(120px,_180px)_1fr]"
                  style={{
                    background: 'var(--sx-white)',
                    border: '1px solid var(--sx-hairline)',
                    borderRadius: 12,
                    padding: 'clamp(14px, 2.5vw, 20px)',
                  }}
                >
                  <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', letterSpacing: '0.1em', fontSize: 12 }}>
                    {(block.meta || '').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(17px, 2.4vw, 20px)', color: 'var(--sx-navy)', margin: 0, letterSpacing: '-0.01em' }}>
                      {block.title}
                    </h4>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Faculty + Includes + Requirements */}
      <section className="sx-section sx-section-paper">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Track Details</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                Meet the faculty. See <em>what's inside</em>.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              Who you'll learn from and what you walk away with — laid out side by side.
            </p>
          </div>

          <div className="grid gap-8 grid-cols-1 md:[grid-template-columns:minmax(0,_1fr)_minmax(0,_1.4fr)]">
            {/* Mentor carousel */}
            <MentorCarousel />

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

// Mentor carousel — one mentor visible at a time, prev/next buttons + swipe.
// Touch swipe threshold ~50px so accidental taps don't trigger.
function MentorCarousel() {
  const [idx, setIdx] = useState(0);
  const total = SPANBIX_MENTORS.length;
  const touchStartX = useRef(null);

  const goPrev = () => setIdx((i) => (i - 1 + total) % total);
  const goNext = () => setIdx((i) => (i + 1) % total);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext(); else goPrev();
    }
    touchStartX.current = null;
  };

  const m = SPANBIX_MENTORS[idx];

  return (
    <div
      className="sx-reveal md:sticky"
      style={{
        background: 'var(--sx-white)',
        border: '1px solid var(--sx-hairline)',
        borderRadius: 16,
        padding: 'clamp(18px, 3vw, 24px)',
        alignSelf: 'start',
        top: 110,
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between">
        <span className="sx-eyebrow">Faculty</span>
        <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>
          {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={m.name}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="mt-4 relative overflow-hidden"
            style={{
              aspectRatio: '1 / 1',
              borderRadius: 12,
              background: 'rgba(16,44,86,0.06)',
            }}
          >
            <img
              src={m.image}
              alt={m.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
            <div
              className="absolute grid place-items-center"
              style={{
                top: 12, right: 12,
                minWidth: 54, height: 54, padding: '0 8px',
                borderRadius: 999,
                background: 'var(--sx-citron)',
                color: 'var(--sx-citron-ink)',
                fontFamily: 'var(--sx-serif)',
                boxShadow: '0 8px 22px -10px rgba(212,240,74,0.55), 0 0 0 3px rgba(212,240,74,0.18)',
                textAlign: 'center',
                lineHeight: 1,
              }}
            >
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>{m.exp}</div>
                <div className="sx-mono" style={{ fontSize: 8.5, marginTop: 2, letterSpacing: '0.08em' }}>YOE</div>
              </div>
            </div>
          </div>

          <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(20px, 2.6vw, 24px)', color: 'var(--sx-navy)', marginTop: 14, letterSpacing: '-0.01em' }}>
            {m.name}
          </div>
          <div className="sx-mono" style={{ color: 'var(--sx-ink-3)', marginTop: 4 }}>
            {m.role.toUpperCase()}
          </div>
          <div className="sx-row" style={{ marginTop: 10, gap: 8 }}>
            <span className="sx-chip">{m.tag}</span>
          </div>
          <p style={{ color: 'var(--sx-ink-3)', fontSize: 13.5, lineHeight: 1.6, marginTop: 14 }}>
            {m.currently}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-5 pt-5" style={{ borderTop: '1px solid var(--sx-hairline)' }}>
        <button
          onClick={goPrev}
          aria-label="Previous mentor"
          style={{
            width: 38, height: 38, borderRadius: 999,
            border: '1px solid var(--sx-hairline)',
            background: 'var(--sx-white)', color: 'var(--sx-navy)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex gap-1.5">
          {SPANBIX_MENTORS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Mentor ${i + 1}`}
              style={{
                width: idx === i ? 22 : 8, height: 8, borderRadius: 99,
                border: 0, padding: 0,
                background: idx === i ? 'var(--sx-navy)' : 'var(--sx-hairline)',
                cursor: 'pointer',
                transition: 'width 0.25s ease, background 0.2s ease',
              }}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          aria-label="Next mentor"
          style={{
            width: 38, height: 38, borderRadius: 999,
            border: '1px solid var(--sx-hairline)',
            background: 'var(--sx-white)', color: 'var(--sx-navy)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
