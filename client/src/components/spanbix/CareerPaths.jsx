import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowUpRight, ShieldCheck, Wifi, Building2 } from 'lucide-react';
import Section from './Section';
import {
  SPANBIX_BRAND,
  SPANBIX_CAREER_PATHS,
  SPANBIX_CAMPUS_PROGRAM,
} from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'functional', label: 'Functional Tracks' },
  { key: 'technical', label: 'Technical Tracks' },
  { key: 'campus', label: 'Campus Programs' },
];

export default function CareerPaths() {
  const [tab, setTab] = useState('functional');

  const functional = SPANBIX_CAREER_PATHS.filter((p) => p.category === 'functional').slice(0, 3);
  const technical = SPANBIX_CAREER_PATHS.filter((p) => p.category === 'technical');

  return (
    <Section
      id="career-paths"
      tone="white"
      caption="Programs Built For Outcomes"
      title="Four SAP tracks. Two ways to learn. One outcome — placed."
      subtitle="We don't run a 47-course catalog. We run the four SAP modules with the deepest hiring pipelines in India — FICO, MM, SD, ABAP. Each track works as a self-paced individual program for solo learners, or as a campus cohort tied to your college's placement calendar."
    >
      {/* Pill toggle */}
      <PillSwitcher tab={tab} setTab={setTab} />

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === 'functional' && <TrackGrid tracks={functional} />}
          {tab === 'technical' && <TrackGrid tracks={technical} />}
          {tab === 'campus' && <CampusCard />}
        </motion.div>
      </AnimatePresence>

      {/* Footer support strip */}
      <div
        className="mt-10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6"
        style={{ backgroundColor: '#f5f8ff', border: `1px solid ${SPANBIX_BRAND.border}` }}
      >
        <p className="text-[14px] font-sora" style={{ color: SPANBIX_BRAND.navy }}>
          Not sure which program is best for you?
        </p>
        <Link
          to={withSpanbixBase('/contact')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-[13px] font-semibold font-sora transition-all hover:brightness-110 text-white whitespace-nowrap"
          style={{ backgroundColor: SPANBIX_BRAND.navy }}
        >
          Get Instant Callback
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </Section>
  );
}

function PillSwitcher({ tab, setTab }) {
  return (
    <div className="flex justify-center mb-10 md:mb-12">
      <div
        className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-full max-w-full"
        style={{ backgroundColor: SPANBIX_BRAND.navy }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="relative px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-[12.5px] sm:text-[14px] font-semibold font-sora transition-colors focus:outline-none"
              style={{ color: active ? SPANBIX_BRAND.navy : 'rgba(255,255,255,0.78)' }}
            >
              {active && (
                <motion.span
                  layoutId="career-path-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: '#ffffff' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrackGrid({ tracks }) {
  // Single-track tab (e.g. Technical = only ABAP right now) renders a centered
  // featured card rather than a lonely 1-of-3 column. Adapts gracefully when
  // we add more technical tracks in a later phase.
  if (tracks.length === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <TrackCard track={tracks[0]} />
      </div>
    );
  }
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {tracks.map((p) => (
        <TrackCard key={p.code} track={p} />
      ))}
    </div>
  );
}

function TrackCard({ track }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all hover:-translate-y-1 flex flex-col"
      style={{
        background:
          'linear-gradient(180deg, rgba(39,100,228,0.07) 0%, rgba(255,255,255,1) 55%)',
        border: `1px solid ${SPANBIX_BRAND.border}`,
        boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 14px 36px -18px rgba(16,44,86,0.18)',
      }}
    >
      <div className="p-7 flex-1 flex flex-col">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          <PillBadge icon={Wifi}>Online Track</PillBadge>
          <PillBadge icon={ShieldCheck} verified>
            Industry Certified
          </PillBadge>
        </div>

        {/* Title */}
        <h3
          className="mt-5 font-serif font-bold tracking-tight text-[26px] md:text-[28px] leading-tight uppercase"
          style={{ color: SPANBIX_BRAND.accent }}
        >
          {track.name}
        </h3>
        <p
          className="mt-1.5 text-[13.5px] font-semibold font-sora"
          style={{ color: SPANBIX_BRAND.navy }}
        >
          {track.audience}
        </p>

        {/* Meta tiles */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MetaTile label="Course Duration" value={track.duration} />
          <MetaTile label="Eligibility" value={track.eligibility} />
        </div>

        {/* Highlights */}
        <div className="mt-6">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em] font-sora"
            style={{ color: SPANBIX_BRAND.navy }}
          >
            Program Highlights
          </p>
          <ul className="mt-3 space-y-2.5">
            {track.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(39,100,228,0.12)' }}
                >
                  <Check size={11} strokeWidth={3} style={{ color: SPANBIX_BRAND.accent }} />
                </span>
                <span
                  className="text-[13.5px] font-sora leading-snug"
                  style={{ color: SPANBIX_BRAND.textDark }}
                >
                  {h}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Link
          to={withSpanbixBase(`/career-paths/${track.code}`)}
          className="group/cta mt-7 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13.5px] font-semibold font-sora transition-all"
          style={{
            border: `1.5px solid ${SPANBIX_BRAND.accent}`,
            color: SPANBIX_BRAND.accent,
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(39,100,228,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Explore Track
          <ArrowUpRight
            size={14}
            className="transition-transform group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5"
          />
        </Link>
      </div>
    </div>
  );
}

function CampusCard() {
  const c = SPANBIX_CAMPUS_PROGRAM;
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(39,100,228,0.07) 0%, rgba(255,255,255,1) 55%)',
        border: `1px solid ${SPANBIX_BRAND.border}`,
        boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 14px 36px -18px rgba(16,44,86,0.18)',
      }}
    >
      <div className="grid lg:grid-cols-12 gap-0 lg:gap-8 items-stretch">
        {/* Left column — content */}
        <div className="lg:col-span-7 p-7 md:p-10">
          <div className="flex flex-wrap gap-2">
            <PillBadge icon={Building2}>Offline + Online</PillBadge>
            <PillBadge icon={ShieldCheck} verified>
              {c.badge}
            </PillBadge>
            <PillBadge icon={ShieldCheck} verified>
              AICTE / NAAC Aligned
            </PillBadge>
          </div>

          <p
            className="mt-5 text-[14.5px] font-semibold font-sora"
            style={{ color: SPANBIX_BRAND.navy }}
          >
            {c.fullName}
          </p>
          <h3
            className="mt-1 font-serif font-bold tracking-tight text-[30px] md:text-[36px] leading-[1.05] uppercase"
            style={{ color: SPANBIX_BRAND.accent }}
          >
            {c.name}
          </h3>
          <p
            className="mt-3 text-[15px] font-sora leading-relaxed max-w-xl"
            style={{ color: SPANBIX_BRAND.textMuted }}
          >
            {c.tagline}
          </p>

          <div className="mt-6 grid sm:grid-cols-2 gap-3 max-w-md">
            <MetaTile label="Engagement" value={c.duration} />
            <MetaTile label="For" value={c.eligibility} />
          </div>

          <div className="mt-7">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] font-sora"
              style={{ color: SPANBIX_BRAND.navy }}
            >
              Program Highlights
            </p>
            <ul className="mt-3 space-y-2.5 max-w-2xl">
              {c.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(39,100,228,0.12)' }}
                  >
                    <Check size={11} strokeWidth={3} style={{ color: SPANBIX_BRAND.accent }} />
                  </span>
                  <span
                    className="text-[13.5px] font-sora leading-snug"
                    style={{ color: SPANBIX_BRAND.textDark }}
                  >
                    {h}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to={withSpanbixBase('/campus-programs')}
            className="group/cta mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13.5px] font-semibold font-sora transition-all"
            style={{
              border: `1.5px solid ${SPANBIX_BRAND.accent}`,
              color: SPANBIX_BRAND.accent,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(39,100,228,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Explore Campus Partnership
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* Right column — illustrative panel (no image, uses Spanbix language) */}
        <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-[460px]">
          <div
            className="absolute inset-0 lg:m-6 lg:rounded-2xl overflow-hidden"
            style={{
              backgroundColor: SPANBIX_BRAND.navy,
              backgroundImage:
                'radial-gradient(circle at 80% 20%, rgba(39,100,228,0.35), transparent 55%), radial-gradient(circle at 15% 90%, rgba(96,165,250,0.25), transparent 55%)',
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />

            <div className="relative h-full p-8 flex flex-col justify-between">
              <div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] font-sora"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.10)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#4ade80' }}
                  />
                  Onboarding cohort 24
                </span>
                <p
                  className="mt-4 font-serif text-[22px] leading-tight"
                  style={{ color: '#ffffff' }}
                >
                  An institutional layer your placement office actually uses.
                </p>
              </div>

              {/* Mini stat block */}
              <div
                className="rounded-xl p-4 mt-6"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="grid grid-cols-3 gap-3 text-center">
                  <CampusStat value="200–2K" label="Per cohort" />
                  <CampusStat value="39,000+" label="Eligible colleges" />
                  <CampusStat value="AICTE" label="Curriculum fit" />
                </div>
              </div>

              <p
                className="mt-5 text-[12px] font-sora"
                style={{ color: 'rgba(255,255,255,0.78)' }}
              >
                India's leading institutional SAP partnership layer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PillBadge({ icon: Icon, children, verified = false }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-sora"
      style={{
        backgroundColor: 'rgba(39,100,228,0.10)',
        color: SPANBIX_BRAND.accent,
        border: '1px solid rgba(39,100,228,0.18)',
      }}
    >
      {Icon && <Icon size={11} style={verified ? { color: SPANBIX_BRAND.accent } : undefined} />}
      {children}
    </span>
  );
}

function MetaTile({ label, value }) {
  return (
    <div
      className="rounded-xl p-3.5"
      style={{
        backgroundColor: 'rgba(255,255,255,0.7)',
        border: `1px solid ${SPANBIX_BRAND.border}`,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em] font-sora"
        style={{ color: SPANBIX_BRAND.textMuted }}
      >
        {label}
      </p>
      <p
        className="mt-1 font-sora text-[14px] font-semibold leading-snug"
        style={{ color: SPANBIX_BRAND.navy }}
      >
        {value}
      </p>
    </div>
  );
}

function CampusStat({ value, label }) {
  return (
    <div>
      <p className="font-mono text-[16px] sm:text-[18px] font-semibold tracking-tight" style={{ color: '#ffffff' }}>
        {value}
      </p>
      <p
        className="text-[10px] font-sora uppercase tracking-[0.14em] mt-0.5"
        style={{ color: 'rgba(255,255,255,0.72)' }}
      >
        {label}
      </p>
    </div>
  );
}
