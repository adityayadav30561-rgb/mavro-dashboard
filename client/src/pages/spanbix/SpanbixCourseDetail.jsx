import { useEffect, useState } from 'react';
import { Link, useParams, Navigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  Star,
  Users,
  Clock,
  Globe,
  ShieldCheck,
  CheckCircle2,
  PlayCircle,
  ChevronDown,
  Sparkles,
  Building2,
  GraduationCap,
} from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import Section from '@/components/spanbix/Section';
import FinalCta from '@/components/spanbix/FinalCta';
import useSEO from '@/hooks/useSEO';
import {
  SPANBIX_BRAND,
  SPANBIX_SITE,
  getCareerPath,
  breadcrumbLd,
  courseLd,
} from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';
import { cn } from '@/lib/utils';
import { trackCtaClick } from '@/lib/analytics';

/**
 * Per-track course detail page at /spanbix/career-paths/:code.
 *
 * Pill toggle switches the entire surface between two modes:
 *   - 'individual' — public learner enrolment. Surfaces price + Enrol CTA +
 *                    individualTimeline (week-bucketed, ~14–20 weeks).
 *   - 'campus'     — institutional. Hides price entirely (negotiated with the
 *                    college T&P / placement cell in the backend) and surfaces
 *                    campusTimeline (month-bucketed, 6–7 month semester cycle).
 */
export default function SpanbixCourseDetail() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const track = getCareerPath(code);
  // ?mode=campus deep-link: lets the Campus Programs page jump straight into
  // the campus-context view of any track without an extra click.
  const initialMode = searchParams.get('mode') === 'campus' ? 'campus' : 'individual';
  const [mode, setMode] = useState(initialMode);

  // Keep mode in sync if the search param flips on a same-component navigation
  // (rare but possible when a link inside the page rewrites the query).
  useEffect(() => {
    const next = searchParams.get('mode') === 'campus' ? 'campus' : 'individual';
    setMode(next);
  }, [searchParams]);

  // SEO + JSON-LD computed unconditionally so React hook order stays stable
  // even when `track` is null. When the slug is invalid we still emit a clean
  // canonical for /career-paths before bailing to the listing page below.
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
      ? [
          `${track.name} course`,
          `${track.name} training`,
          `${track.name} certification`,
          `${track.fullName} course India`,
          `learn ${track.name}`,
        ]
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

  if (!track) {
    return <Navigate to={withSpanbixBase('/career-paths')} replace />;
  }

  const timeline = mode === 'individual' ? track.individualTimeline : track.campusTimeline;

  return (
    <SpanbixLayout>
      {/* Hero band — navy with breadcrumb + title + meta + floating buy panel */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: SPANBIX_BRAND.navy,
          color: '#fff',
          backgroundImage:
            'radial-gradient(circle at 18% 12%, rgba(39,100,228,0.20), transparent 55%), radial-gradient(circle at 82% 88%, rgba(39,100,228,0.14), transparent 55%)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 md:px-8 pt-10 sm:pt-16 md:pt-24 pb-12 sm:pb-16 md:pb-20">
          {/* Breadcrumb */}
          <Link
            to={withSpanbixBase('/career-paths')}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-sora transition-colors"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            <ArrowLeft size={13} />
            All career paths
          </Link>

          <div className="mt-6 grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left — title + meta */}
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] font-sora"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}
                >
                  {track.category === 'functional' ? 'Functional Track' : 'Technical Track'}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold font-sora"
                  style={{
                    backgroundColor: 'rgba(96,165,250,0.18)',
                    color: '#bfd2f4',
                    border: '1px solid rgba(147,197,253,0.30)',
                  }}
                >
                  <Sparkles size={11} />
                  Bestseller
                </span>
              </div>

              <h1
                className="mt-4 sm:mt-5 font-serif text-[1.85rem] sm:text-[2.4rem] md:text-[2.8rem] lg:text-[3.4rem] leading-[1.08] sm:leading-[1.06] tracking-[-0.012em] text-white"
              >
                {track.name} ·{' '}
                <span
                  style={{
                    background: 'linear-gradient(120deg, #ffffff 0%, #bfdbfe 55%, #93c5fd 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {track.fullName}
                </span>
              </h1>
              <p
                className="mt-4 sm:mt-5 text-[14.5px] sm:text-[16px] md:text-[17.5px] leading-relaxed font-sora max-w-2xl"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                {track.summary}
              </p>

              {/* Meta row */}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-[12.5px] font-sora">
                <span className="inline-flex items-center gap-1.5" style={{ color: '#ffffff' }}>
                  <span className="font-semibold font-mono" style={{ color: '#bfd2f4' }}>
                    {track.rating.toFixed(1)}
                  </span>
                  <RatingStars rating={track.rating} />
                  <span style={{ color: 'rgba(255,255,255,0.72)' }}>({track.ratingsCount})</span>
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  <Users size={13} />
                  {track.studentsEnrolled} learners
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  <Clock size={13} />
                  {track.duration}
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  <Globe size={13} />
                  {track.language}
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  <ShieldCheck size={13} />
                  Updated {track.lastUpdated}
                </span>
              </div>

              <p
                className="mt-6 text-[13.5px] font-sora"
                style={{ color: 'rgba(255,255,255,0.78)' }}
              >
                Created by{' '}
                <span className="font-semibold" style={{ color: '#ffffff' }}>
                  {track.instructor.name}
                </span>{' '}
                — {track.instructor.title}
              </p>
            </div>

            {/* Right — floating enrolment panel */}
            <div className="lg:col-span-4">
              <EnrolmentPanel track={track} mode={mode} />
            </div>
          </div>
        </div>
      </section>

      {/* Pill toggle */}
      <ModeSwitcher mode={mode} setMode={setMode} track={track} />

      {/* What you'll learn */}
      <Section tone="white" caption="What You'll Learn">
        <div
          className="rounded-2xl p-7 md:p-9"
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${SPANBIX_BRAND.border}`,
            boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 12px 32px -16px rgba(16,44,86,0.10)',
          }}
        >
          <h2
            className="font-serif text-[24px] md:text-[28px] tracking-tight"
            style={{ color: SPANBIX_BRAND.navy }}
          >
            What you'll learn
          </h2>
          <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {track.whatYoullLearn.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: SPANBIX_BRAND.accent }}
                />
                <span
                  className="text-[14px] font-sora leading-relaxed"
                  style={{ color: SPANBIX_BRAND.textDark }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Course content / timeline */}
      <Section
        tone="cream"
        caption={mode === 'individual' ? 'Individual Program Timeline' : 'Campus Program Timeline'}
        title={
          mode === 'individual' ? (
            <>
              <span style={{ color: SPANBIX_BRAND.accent }}>{track.individualTimeline.length}-module</span>{' '}
              individual learning path
            </>
          ) : (
            <>
              <span style={{ color: SPANBIX_BRAND.accent }}>{track.campusTimeline.length}-month</span>{' '}
              campus cohort calendar
            </>
          )
        }
        subtitle={
          mode === 'individual'
            ? `A self-paced, mentor-led timeline. Plan ~10–14 hours of structured learning each week to finish in ${track.duration}.`
            : `Aligned to your college's academic calendar. The placement cell receives readiness dashboards at each month-end review.`
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {timeline.map((m, i) => (
              <TimelineItem key={m.id} module={m} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </Section>

      {/* This course includes + Requirements */}
      <Section tone="white">
        <div className="grid lg:grid-cols-2 gap-8">
          <div
            className="rounded-2xl p-7 md:p-9"
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${SPANBIX_BRAND.border}`,
              boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 12px 32px -16px rgba(16,44,86,0.10)',
            }}
          >
            <h2
              className="font-serif text-[22px] tracking-tight"
              style={{ color: SPANBIX_BRAND.navy }}
            >
              This course includes
            </h2>
            <ul className="mt-5 space-y-3">
              {track.includes.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(39,100,228,0.12)' }}
                  >
                    <CheckCircle2 size={11} style={{ color: SPANBIX_BRAND.accent }} />
                  </span>
                  <span
                    className="text-[13.5px] font-sora leading-snug"
                    style={{ color: SPANBIX_BRAND.textDark }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl p-7 md:p-9"
            style={{
              backgroundColor: '#f5f8ff',
              border: `1px solid ${SPANBIX_BRAND.border}`,
            }}
          >
            <h2
              className="font-serif text-[22px] tracking-tight"
              style={{ color: SPANBIX_BRAND.navy }}
            >
              Requirements
            </h2>
            <ul className="mt-5 space-y-3">
              {track.requirements.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: SPANBIX_BRAND.accent }}
                  />
                  <span
                    className="text-[13.5px] font-sora leading-snug"
                    style={{ color: SPANBIX_BRAND.textDark }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="mt-7 pt-6"
              style={{ borderTop: `1px solid ${SPANBIX_BRAND.border}` }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.22em] font-sora"
                style={{ color: SPANBIX_BRAND.textMuted }}
              >
                Instructor
              </p>
              <p
                className="mt-2 font-serif text-[18px] tracking-tight"
                style={{ color: SPANBIX_BRAND.navy }}
              >
                {track.instructor.name}
              </p>
              <p
                className="text-[12.5px] font-sora"
                style={{ color: SPANBIX_BRAND.accent }}
              >
                {track.instructor.title}
              </p>
              <p
                className="mt-3 text-[13.5px] font-sora leading-relaxed"
                style={{ color: SPANBIX_BRAND.textMuted }}
              >
                {track.instructor.bio}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <FinalCta />
    </SpanbixLayout>
  );
}

/* ─────────────────────────── Floating enrolment panel ─────────────────────────── */

function EnrolmentPanel({ track, mode }) {
  const isCampus = mode === 'campus';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.45)',
      }}
    >
      {/* Preview header */}
      <div
        className="aspect-video relative overflow-hidden flex items-center justify-center"
        style={{
          backgroundColor: SPANBIX_BRAND.navy,
          backgroundImage:
            'radial-gradient(circle at 70% 30%, rgba(39,100,228,0.4), transparent 55%)',
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(255,255,255,0.16)',
            border: '1px solid rgba(255,255,255,0.30)',
          }}
        >
          <PlayCircle size={28} color="#fff" />
        </div>
        <p
          className="absolute bottom-3 left-0 right-0 text-center text-[11.5px] font-sora"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          Preview this course
        </p>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {!isCampus ? (
            <motion.div
              key="individual"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.2em] font-sora"
                style={{ color: SPANBIX_BRAND.textMuted }}
              >
                Buy individual course
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <p
                  className="font-mono text-[28px] font-semibold leading-none"
                  style={{ color: SPANBIX_BRAND.navy }}
                >
                  {track.priceIndividual}
                </p>
                <p
                  className="font-mono text-[14px] line-through"
                  style={{ color: SPANBIX_BRAND.textMuted }}
                >
                  {track.priceMrp}
                </p>
              </div>

              <ul className="mt-5 space-y-2.5 text-[12.5px] font-sora" style={{ color: SPANBIX_BRAND.textDark }}>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={13} style={{ color: SPANBIX_BRAND.accent }} />
                  30-day money-back guarantee
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} style={{ color: SPANBIX_BRAND.accent }} />
                  Full lifetime access
                </li>
              </ul>

              <Link
                to={withSpanbixBase('/contact')}
                onClick={() => trackCtaClick(`Enrol ${track.name}`, { location: 'course-detail' })}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-md text-[14px] font-semibold font-sora text-white transition-all hover:brightness-110 shadow-[0_14px_30px_-12px_rgba(39,100,228,0.55)]"
                style={{ backgroundColor: SPANBIX_BRAND.accent }}
              >
                Enrol Now
                <ArrowUpRight size={14} />
              </Link>
              <Link
                to={withSpanbixBase('/contact')}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-md text-[14px] font-semibold font-sora transition-all"
                style={{
                  border: `1.5px solid ${SPANBIX_BRAND.accent}`,
                  color: SPANBIX_BRAND.accent,
                }}
              >
                Book Free Consultation
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="campus"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.2em] font-sora"
                style={{ color: SPANBIX_BRAND.textMuted }}
              >
                Campus Program Enquiry
              </p>
              <div
                className="mt-3 rounded-lg p-4"
                style={{
                  backgroundColor: 'rgba(39,100,228,0.06)',
                  border: '1px solid rgba(39,100,228,0.18)',
                }}
              >
                <p
                  className="font-serif text-[18px] leading-snug tracking-tight"
                  style={{ color: SPANBIX_BRAND.navy }}
                >
                  Pricing negotiated with your placement cell.
                </p>
                <p className="mt-2 text-[12.5px] font-sora leading-relaxed" style={{ color: SPANBIX_BRAND.textMuted }}>
                  Campus engagements are MoU-based and tailored to cohort size,
                  duration, and your academic calendar. Talk to our institutional
                  team for a tailored proposal.
                </p>
              </div>

              <ul className="mt-5 space-y-2.5 text-[12.5px] font-sora" style={{ color: SPANBIX_BRAND.textDark }}>
                <li className="flex items-center gap-2">
                  <Building2 size={13} style={{ color: SPANBIX_BRAND.accent }} />
                  AICTE / NAAC-aligned curriculum
                </li>
                <li className="flex items-center gap-2">
                  <GraduationCap size={13} style={{ color: SPANBIX_BRAND.accent }} />
                  College-branded co-certification
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck size={13} style={{ color: SPANBIX_BRAND.accent }} />
                  NSDC / Skill India funding pathways
                </li>
              </ul>

              <Link
                to={withSpanbixBase('/campus-programs')}
                onClick={() => trackCtaClick(`Talk to Campus ${track.name}`, { location: 'course-detail' })}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-md text-[14px] font-semibold font-sora text-white transition-all hover:brightness-110 shadow-[0_14px_30px_-12px_rgba(39,100,228,0.55)]"
                style={{ backgroundColor: SPANBIX_BRAND.accent }}
              >
                Talk to Campus Team
                <ArrowUpRight size={14} />
              </Link>
              <Link
                to={withSpanbixBase('/campus-programs')}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-md text-[14px] font-semibold font-sora transition-all"
                style={{
                  border: `1.5px solid ${SPANBIX_BRAND.accent}`,
                  color: SPANBIX_BRAND.accent,
                }}
              >
                Explore Campus Partnership
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── Pill switcher ─────────────────────────── */

function ModeSwitcher({ mode, setMode, track }) {
  return (
    <section
      className="relative"
      style={{ backgroundColor: '#ffffff', borderBottom: `1px solid ${SPANBIX_BRAND.border}` }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 flex flex-col items-center text-center">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.26em] font-sora"
          style={{ color: SPANBIX_BRAND.accent }}
        >
          Choose your enrolment path
        </p>
        <h2
          className="mt-3 font-serif text-[20px] sm:text-[24px] md:text-[30px] tracking-tight leading-snug max-w-2xl"
          style={{ color: SPANBIX_BRAND.navy }}
        >
          Studying as an individual or bringing {track.name} into your college?
        </h2>

        <div
          className="mt-6 inline-flex items-center p-1.5 rounded-full"
          style={{ backgroundColor: SPANBIX_BRAND.navy }}
        >
          {[
            { key: 'individual', label: 'Individual Program' },
            { key: 'campus', label: 'Campus Program' },
          ].map((opt) => {
            const active = mode === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setMode(opt.key)}
                className="relative px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-full text-[11.5px] sm:text-[12.5px] md:text-[14px] font-semibold font-sora transition-colors focus:outline-none"
                style={{ color: active ? SPANBIX_BRAND.navy : 'rgba(255,255,255,0.78)' }}
              >
                {active && (
                  <motion.span
                    layoutId="course-detail-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: '#ffffff' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <p
          className="mt-4 text-[12.5px] font-sora max-w-xl"
          style={{ color: SPANBIX_BRAND.textMuted }}
        >
          Toggle to switch the entire page between an individual learner view and
          an institutional campus view. Curriculum, timeline, and CTAs adapt.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────── Timeline accordion item ─────────────────────────── */

function TimelineItem({ module, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${SPANBIX_BRAND.border}`,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 md:px-6 py-4 flex items-center justify-between gap-4 text-left transition-colors"
        style={{
          backgroundColor: open ? 'rgba(39,100,228,0.04)' : 'transparent',
        }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <span
            className="font-mono text-[14px] font-semibold w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(39,100,228,0.10)',
              color: SPANBIX_BRAND.accent,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <p
              className="font-serif text-[16px] md:text-[17px] tracking-tight leading-snug"
              style={{ color: SPANBIX_BRAND.navy }}
            >
              {module.title}
            </p>
            <p
              className="mt-0.5 text-[12px] font-sora"
              style={{ color: SPANBIX_BRAND.textMuted }}
            >
              {module.meta}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className="shrink-0 transition-transform"
          style={{
            color: SPANBIX_BRAND.accent,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="px-5 md:px-6 pb-5 md:pb-6 pt-1 space-y-2">
              {module.topics.map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span
                    className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: SPANBIX_BRAND.accent }}
                  />
                  <span
                    className="text-[13.5px] font-sora leading-relaxed"
                    style={{ color: SPANBIX_BRAND.textDark }}
                  >
                    {t}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RatingStars({ rating }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.4;
  return (
    <span className="inline-flex items-center" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && hasHalf);
        return (
          <Star
            key={i}
            size={13}
            strokeWidth={1.5}
            fill={filled ? '#bfd2f4' : 'transparent'}
            style={{ color: filled ? '#bfd2f4' : 'rgba(191,210,244,0.45)' }}
          />
        );
      })}
    </span>
  );
}
