import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Wifi, ShieldCheck, Building2 } from 'lucide-react';
import { withSpanbixBase } from '@/lib/routeBase';
import { SPANBIX_CAREER_PATHS, SPANBIX_CAMPUS_PROGRAM } from '@/lib/spanbixSeo';
import { Arrow } from '../Arrow';

// ════════════════════════════════════════════════════════════════════════════
// Tracks — homepage catalog (matches /spanbix/courses layout)
// ════════════════════════════════════════════════════════════════════════════
// Pill switcher slides via framer-motion layoutId. Content swap fades + lifts
// on tab change. Track data pulled from SPANBIX_CAREER_PATHS so the homepage
// stays in lockstep with the Courses page + Career Path detail pages.
//
// Layout per tab:
//   functional → 3-col grid (FICO / MM / SD)
//   technical  → single card centered (max-w-2xl)
//   campus     → full-width 2-col composition: content (7/12) + navy stat panel (5/12)
//
// Editorial palette overrides the legacy accent-blue card variant — serif
// titles in navy, citron checkmark accents, cream meta tiles.
// ════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'functional', label: 'Functional Tracks' },
  { id: 'technical', label: 'Technical Tracks' },
  { id: 'campus', label: 'Campus Programs' },
];

const functional = SPANBIX_CAREER_PATHS.filter((p) => p.category === 'functional').slice(0, 3);
const technical = SPANBIX_CAREER_PATHS.filter((p) => p.category === 'technical');

export default function Tracks() {
  const [active, setActive] = useState('functional');

  return (
    <section className="sx-section sx-section-cream" id="tracks">
      <div className="sx-container">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow">Programs Built for Outcomes</span>
            <h2 className="sx-display sx-h2 sx-reveal">
              Four programs.<br />
              Two ways to learn.<br />
              <em>One outcome</em> — placed.
            </h2>
          </div>
          <p className="sx-lead sx-reveal">
            Four ERP tracks (SAP-led) with the deepest hiring pipelines in India. Each runs as a
            self-paced individual program or as a campus cohort. Every course includes a
            complimentary personality development module.
          </p>
        </div>

        {/* Pill switcher — sliding indicator */}
        <div className="flex justify-center mb-10 md:mb-12">
          <div
            className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-full max-w-full"
            style={{ background: 'var(--sx-navy)', gap: 2 }}
          >
            {TABS.map((tab) => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  className="relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-full whitespace-nowrap focus:outline-none"
                  style={{
                    background: 'transparent', border: 0,
                    fontSize: 13.5, fontWeight: 500,
                    fontFamily: 'var(--sx-sans)', cursor: 'pointer',
                    color: isActive ? 'var(--sx-navy)' : 'rgba(255,255,255,0.78)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sx-tracks-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: '#fff' }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {active === 'functional' && <TrackGrid tracks={functional} />}
            {active === 'technical' && <TrackGrid tracks={technical} />}
            {active === 'campus' && <CampusCard />}
          </motion.div>
        </AnimatePresence>

        {/* Support strip */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6"
          style={{
            background: 'var(--sx-white)',
            border: '1px solid var(--sx-hairline)',
            borderRadius: 14,
          }}
        >
          <div>
            <span className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>NOT SURE WHICH PROGRAM IS BEST?</span>
            <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(18px, 2.6vw, 22px)', color: 'var(--sx-navy)', marginTop: 6 }}>
              30-minute call with a career strategist.
            </div>
          </div>
          <Link to={withSpanbixBase('/contact')} className="sx-btn sx-btn-dark">
            Get Instant Callback <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Single-track tab (Technical = ABAP only right now) renders a centered featured
// card; multi-track tabs render a 3-col grid.
function TrackGrid({ tracks }) {
  if (tracks.length === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <TrackCard track={tracks[0]} />
      </div>
    );
  }
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {tracks.map((p) => <TrackCard key={p.code} track={p} />)}
    </div>
  );
}

function TrackCard({ track }) {
  return (
    <article
      className="relative flex flex-col overflow-hidden transition-transform hover:-translate-y-1"
      style={{
        background: 'var(--sx-white)',
        border: '1px solid var(--sx-hairline)',
        borderRadius: 16,
        boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 14px 36px -18px rgba(16,44,86,0.18)',
      }}
    >
      <div className="p-7 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2">
          <PillBadge icon={Wifi}>Online Track</PillBadge>
        </div>

        <h3
          className="mt-5 leading-tight uppercase"
          style={{
            fontFamily: 'var(--sx-serif)', fontWeight: 400,
            fontSize: 'clamp(24px, 4vw, 30px)', letterSpacing: '-0.02em',
            color: 'var(--sx-navy)',
          }}
        >
          {track.name}
        </h3>
        <p
          className="mt-1.5"
          style={{ fontSize: 13.5, fontFamily: 'var(--sx-sans)', fontWeight: 500, color: 'var(--sx-ink-2)' }}
        >
          {track.audience}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MetaTile label="Course Duration" value={track.duration} />
          <MetaTile label="Eligibility" value={track.eligibility} />
        </div>

        <div className="mt-6">
          <p className="sx-mono" style={{ color: 'var(--sx-ink-4)', letterSpacing: '0.18em' }}>
            PROGRAM HIGHLIGHTS
          </p>
          <ul className="mt-3 space-y-2.5 list-none p-0">
            {track.highlights.map((h) => {
              const isPersonality = h.toLowerCase().includes('personality');
              return (
                <li key={h} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 shrink-0 grid place-items-center"
                    style={{ width: 18, height: 18, borderRadius: 999, background: 'var(--sx-citron)' }}
                  >
                    <Check size={11} strokeWidth={3} style={{ color: 'var(--sx-citron-ink)' }} />
                  </span>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontFamily: 'var(--sx-sans)',
                      lineHeight: 1.45,
                      color: 'var(--sx-ink-2)',
                      ...(isPersonality
                        ? {
                            backgroundImage: 'linear-gradient(transparent 55%, var(--sx-citron) 55%)',
                            padding: '0 4px',
                            fontWeight: 500,
                          }
                        : {}),
                    }}
                  >
                    {h}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <Link
          to={withSpanbixBase(`/career-paths/${track.code}`)}
          className="sx-btn sx-btn-outline mt-7"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Explore Track <Arrow />
        </Link>
      </div>
    </article>
  );
}

function CampusCard() {
  const c = SPANBIX_CAMPUS_PROGRAM;
  return (
    <article
      className="relative overflow-hidden"
      style={{
        background: 'var(--sx-white)',
        border: '1px solid var(--sx-hairline)',
        borderRadius: 16,
        boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 14px 36px -18px rgba(16,44,86,0.18)',
      }}
    >
      <div className="grid lg:grid-cols-12 gap-0 items-stretch">
        {/* Left — content */}
        <div className="lg:col-span-7 p-7 md:p-10">
          <div className="flex flex-wrap gap-2">
            <PillBadge icon={Building2}>Offline + Online</PillBadge>
            <PillBadge icon={ShieldCheck} verified>B2B Partnership</PillBadge>
          </div>

          <p
            className="mt-5"
            style={{ fontSize: 14.5, fontFamily: 'var(--sx-sans)', fontWeight: 500, color: 'var(--sx-ink-2)' }}
          >
            {c.fullName}
          </p>
          <h3
            className="mt-1 uppercase"
            style={{
              fontFamily: 'var(--sx-serif)', fontWeight: 400,
              fontSize: 'clamp(28px, 5.2vw, 40px)', letterSpacing: '-0.02em',
              lineHeight: 1.05, color: 'var(--sx-navy)',
            }}
          >
            {c.name}
          </h3>
          <p
            className="mt-3 max-w-xl"
            style={{ fontSize: 15, fontFamily: 'var(--sx-sans)', lineHeight: 1.55, color: 'var(--sx-ink-3)' }}
          >
            {c.tagline}
          </p>

          <div className="mt-6 grid sm:grid-cols-2 gap-3 max-w-md">
            <MetaTile label="Engagement" value={c.duration} />
            <MetaTile label="For" value={c.eligibility} />
          </div>

          <div className="mt-7">
            <p className="sx-mono" style={{ color: 'var(--sx-ink-4)', letterSpacing: '0.18em' }}>
              PROGRAM HIGHLIGHTS
            </p>
            <ul className="mt-3 space-y-2.5 list-none p-0">
              {c.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 shrink-0 grid place-items-center"
                    style={{ width: 18, height: 18, borderRadius: 999, background: 'var(--sx-citron)' }}
                  >
                    <Check size={11} strokeWidth={3} style={{ color: 'var(--sx-citron-ink)' }} />
                  </span>
                  <span style={{ fontSize: 13.5, fontFamily: 'var(--sx-sans)', lineHeight: 1.45, color: 'var(--sx-ink-2)' }}>
                    {h}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to={withSpanbixBase('/campus-programs')}
            className="sx-btn sx-btn-outline mt-8"
            style={{ justifyContent: 'center' }}
          >
            Explore Campus Partnership <Arrow />
          </Link>
        </div>

        {/* Right — navy stat panel */}
        <div
          className="lg:col-span-5 relative p-7 md:p-10 text-white"
          style={{
            background: 'linear-gradient(135deg, var(--sx-navy) 0%, var(--sx-navy-900) 100%)',
            isolation: 'isolate',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              zIndex: -1,
            }}
          />

          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(74, 222, 128, 0.12)',
              border: '1px solid rgba(74, 222, 128, 0.22)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 99, background: '#4ade80' }} />
            <span className="sx-mono" style={{ color: '#86efac', letterSpacing: '0.08em' }}>
              ONBOARDING COHORT 24
            </span>
          </div>

          <h4
            className="mt-6"
            style={{
              fontFamily: 'var(--sx-serif)', fontWeight: 400,
              fontSize: 'clamp(22px, 4vw, 32px)', letterSpacing: '-0.015em',
              lineHeight: 1.15, color: '#fff',
            }}
          >
            An institutional layer your placement office actually uses.
          </h4>

          <div
            className="mt-8 grid grid-cols-3 gap-2"
            style={{
              padding: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
            }}
          >
            <Stat top="Individual" bottom={<>GUIDANCE<br />EVERY COHORT</>} />
            <Stat top="50,000+" bottom="ERP JOBS" />
            <Stat top="3 mo" bottom={<>COHORT<br />LENGTH</>} />
          </div>

          <p
            className="mt-8"
            style={{ fontSize: 12.5, fontFamily: 'var(--sx-sans)', color: 'rgba(255,255,255,0.55)' }}
          >
            One of the most competitive institutional ERP programs you can complete on your own
          </p>
        </div>
      </div>
    </article>
  );
}

// ──────── Primitives ────────

function PillBadge({ icon: Icon, verified, children }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        background: 'rgba(39, 100, 228, 0.06)',
        border: '1px solid rgba(39, 100, 228, 0.18)',
        color: 'var(--sx-navy)',
        fontFamily: 'var(--sx-sans)',
        fontSize: 12, fontWeight: 500,
      }}
    >
      {Icon && <Icon size={12} />}
      {children}
      {verified && (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function MetaTile({ label, value }) {
  return (
    <div
      style={{
        background: 'var(--sx-cream-50)',
        border: '1px solid var(--sx-hairline)',
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', letterSpacing: '0.16em' }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontWeight: 500, marginTop: 4, fontSize: 14, color: 'var(--sx-ink)' }}>
        {value}
      </div>
    </div>
  );
}

function Stat({ top, bottom }) {
  return (
    <div className="text-center">
      <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {top}
      </div>
      <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.55)', marginTop: 6, letterSpacing: '0.1em' }}>
        {bottom}
      </div>
    </div>
  );
}
