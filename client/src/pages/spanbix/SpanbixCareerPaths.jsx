import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  ArrowUpRight,
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/PageHero';
import Section from '@/components/spanbix/Section';
import FinalCta from '@/components/spanbix/FinalCta';
import {
  SPANBIX_BRAND,
  SPANBIX_CAREER_PATHS,
  SPANBIX_SITE,
  breadcrumbLd,
} from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';
import useSEO from '@/hooks/useSEO';

/**
 * Udemy-style horizontal course catalog for /spanbix/career-paths.
 * Currently lists 4 curated SAP tracks. Each card is a clickable landing into
 * the per-track detail page at /spanbix/career-paths/:code where learners can
 * switch between Individual and Campus enrollment via a pill toggle.
 */
export default function SpanbixCareerPaths() {
  useSEO({
    title: `SAP Career Paths — ${SPANBIX_SITE.name}`,
    description:
      'Explore Spanbix\'s curated SAP career tracks — FICO, MM, SD, and ABAP. Industry-aligned curriculum, working consultant mentorship, capstone projects, and placement readiness.',
    keywords: [
      'SAP courses India',
      'SAP FICO course',
      'SAP MM course',
      'SAP SD course',
      'SAP ABAP course',
      'enterprise technology training',
    ],
    canonical: `${SPANBIX_SITE.url}/career-paths`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Career Paths', url: `${SPANBIX_SITE.url}/career-paths` },
      ]),
    ],
  });

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="SAP Career Tracks"
        title="Four tracks. Picked because they're the ones companies actually hire for."
        subtitle="We don't run a 47-course catalog. We run the four SAP modules with the deepest hiring pipelines in the Indian + GCC markets — FICO, MM, SD, and ABAP. Each track ships with mentor-reviewed curriculum, live sandbox practice, and a placement layer that turns on from week one."
      />

      <Section
        tone="cream"
        caption="Choose Your Track"
        title="Pick the SAP module that fits the career you want."
        subtitle="The price tag below covers the individual program. Campus cohorts are negotiated separately with each college's placement cell — pricing follows the engagement, not the other way around."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
          {SPANBIX_CAREER_PATHS.map((track, i) => (
            <CourseCard key={track.code} track={track} index={i} />
          ))}
        </div>
      </Section>

      <FinalCta />
    </SpanbixLayout>
  );
}

function CourseCard({ track, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.05 }}
    >
      <Link
        to={withSpanbixBase(`/career-paths/${track.code}`)}
        className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${SPANBIX_BRAND.border}`,
          boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 14px 36px -18px rgba(16,44,86,0.18)',
        }}
      >
        {/* Visual header — navy panel with track code + decoration */}
        <div
          className="relative aspect-[16/9] overflow-hidden"
          style={{
            backgroundColor: SPANBIX_BRAND.navy,
            backgroundImage:
              'radial-gradient(circle at 80% 15%, rgba(39,100,228,0.35), transparent 55%), radial-gradient(circle at 20% 85%, rgba(96,165,250,0.20), transparent 55%)',
          }}
        >
          {/* Grid texture */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* Category pill */}
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] font-sora"
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            {track.category === 'functional' ? 'Functional Track' : 'Technical Track'}
          </span>
          {/* Bestseller-style pill */}
          <span
            className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] font-sora"
            style={{
              backgroundColor: '#ffffff',
              color: SPANBIX_BRAND.accent,
            }}
          >
            <Sparkles size={10} />
            Bestseller
          </span>
          {/* Big track code in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className="font-serif text-[44px] sm:text-[52px] tracking-tight leading-none uppercase"
              style={{
                background: 'linear-gradient(120deg, #ffffff 0%, #bfdbfe 55%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {track.code.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Card body */}
        <div className="p-5 flex-1 flex flex-col">
          <h3
            className="font-serif text-[19px] tracking-tight leading-snug line-clamp-2"
            style={{ color: SPANBIX_BRAND.navy }}
          >
            {track.name} — {track.fullName}
          </h3>
          <p
            className="mt-1.5 text-[12.5px] font-sora line-clamp-1"
            style={{ color: SPANBIX_BRAND.textMuted }}
          >
            {track.instructor.name} · {track.instructor.title}
          </p>

          {/* Rating row */}
          <div className="mt-3 flex items-center gap-2 text-[12.5px] font-sora">
            <span
              className="font-semibold font-mono"
              style={{ color: SPANBIX_BRAND.accent }}
            >
              {track.rating.toFixed(1)}
            </span>
            <RatingStars rating={track.rating} />
            <span style={{ color: SPANBIX_BRAND.textMuted }}>({track.ratingsCount})</span>
          </div>

          {/* Pills row */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <MiniPill icon={Clock}>{track.duration}</MiniPill>
            <MiniPill icon={Users}>{track.studentsEnrolled} learners</MiniPill>
            <MiniPill icon={TrendingUp}>{track.demand}</MiniPill>
          </div>

          {/* Price row */}
          <div className="mt-auto pt-5 flex items-end justify-between">
            <div>
              <p
                className="font-mono text-[20px] font-semibold leading-none"
                style={{ color: SPANBIX_BRAND.navy }}
              >
                {track.priceIndividual}
              </p>
              <p
                className="mt-1 font-mono text-[12px] line-through"
                style={{ color: SPANBIX_BRAND.textMuted }}
              >
                {track.priceMrp}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1 text-[13px] font-semibold font-sora transition-colors group-hover:gap-2"
              style={{ color: SPANBIX_BRAND.accent }}
            >
              View course
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
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
            size={12}
            strokeWidth={1.5}
            fill={filled ? SPANBIX_BRAND.accent : 'transparent'}
            style={{ color: filled ? SPANBIX_BRAND.accent : 'rgba(39,100,228,0.35)' }}
          />
        );
      })}
    </span>
  );
}

function MiniPill({ icon: Icon, children }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sora"
      style={{
        backgroundColor: 'rgba(39,100,228,0.07)',
        color: SPANBIX_BRAND.navy,
        border: `1px solid rgba(39,100,228,0.15)`,
      }}
    >
      {Icon && <Icon size={10} style={{ color: SPANBIX_BRAND.accent }} />}
      {children}
    </span>
  );
}
