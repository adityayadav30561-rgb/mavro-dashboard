import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';

/**
 * "You'll be guided by industry experts" — homepage social proof for the
 * faculty bench. Cards live on a navy section for high-contrast emphasis;
 * each card is a white surface with an initials-gradient avatar (no
 * fabricated portraits) + role + company chip + LinkedIn glyph.
 *
 * Faculty entries are sourced from the same instructors that drive each
 * SAP track in `SPANBIX_CAREER_PATHS.instructor`, plus two cross-track
 * mentors who lead career strategy + cross-module solutioning.
 */

const FACULTY = [
  {
    name: 'Aman Patil',
    role: 'Senior SAP FICO Consultant',
    company: 'Tier-1 SI',
    yearsExp: '9+',
    badge: 'Faculty',
    track: 'SAP FICO',
    initials: 'AP',
    accent: 'from-blue-500/30 to-indigo-600/30',
  },
  {
    name: 'Neha Iyer',
    role: 'Senior SAP MM Consultant',
    company: 'Manufacturing',
    yearsExp: '7+',
    badge: 'Faculty',
    track: 'SAP MM',
    initials: 'NI',
    accent: 'from-emerald-400/30 to-cyan-600/30',
  },
  {
    name: 'Rohit Sharma',
    role: 'Senior SAP SD Consultant',
    company: 'Global Retail',
    yearsExp: '8+',
    badge: 'Faculty',
    track: 'SAP SD',
    initials: 'RS',
    accent: 'from-amber-400/30 to-orange-600/30',
  },
  {
    name: 'Karthik Subramaniam',
    role: 'Senior SAP ABAP Developer',
    company: 'BFSI',
    yearsExp: '11+',
    badge: 'Faculty',
    track: 'SAP ABAP',
    initials: 'KS',
    accent: 'from-violet-400/30 to-fuchsia-600/30',
  },
  {
    name: 'Vikram Joshi',
    role: 'SAP Career Strategist',
    company: 'Placements Lead',
    yearsExp: '12+',
    badge: 'Mentor',
    track: 'Placements',
    initials: 'VJ',
    accent: 'from-sky-400/30 to-blue-600/30',
  },
  {
    name: 'Divya Krishnan',
    role: 'S/4HANA Solution Lead',
    company: 'Global SI',
    yearsExp: '10+',
    badge: 'Mentor',
    track: 'Cross-module',
    initials: 'DK',
    accent: 'from-rose-400/30 to-pink-600/30',
  },
];

export default function IndustryExperts() {
  const scrollerRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Track scroll position to enable / disable nav arrows.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setCanPrev(el.scrollLeft > 4);
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('[data-faculty-card]');
    const step = card ? card.clientWidth + 20 : 320;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <Section
      id="industry-experts"
      tone="navy"
      caption="Instructors, Founders & Mentors"
      title={
        <>
          Taught by the people you'll be{' '}
          <span style={{ color: '#bfd2f4' }}>working alongside.</span>
        </>
      }
      subtitle="Spanbix's faculty is built from working SAP consultants, solution architects, and the founders who built the platform. They're currently shipping S/4HANA implementations for real clients — and sitting on the same hiring panels you'll eventually interview with. That's who teaches at Spanbix. Not retired trainers reading slides."
    >
      <div className="relative">
        {/* Arrows */}
        <div className="hidden md:flex absolute -top-16 right-0 items-center gap-2">
          <ArrowBtn dir="prev" disabled={!canPrev} onClick={() => scrollBy(-1)} />
          <ArrowBtn dir="next" disabled={!canNext} onClick={() => scrollBy(1)} />
        </div>

        {/* Scroller */}
        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6 md:mx-0 md:px-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {FACULTY.map((f, i) => (
            <FacultyCard key={f.name} faculty={f} index={i} />
          ))}
        </div>

        {/* Mobile arrows below */}
        <div className="md:hidden flex items-center justify-center gap-3 mt-5">
          <ArrowBtn dir="prev" disabled={!canPrev} onClick={() => scrollBy(-1)} />
          <ArrowBtn dir="next" disabled={!canNext} onClick={() => scrollBy(1)} />
        </div>
      </div>

      <p
        className="mt-10 text-[12px] font-sora text-center"
        style={{ color: 'rgba(255,255,255,0.66)' }}
      >
        Faculty rotates as new consultants join the bench. Every instructor is screened for active delivery experience, mentorship temperament, and verified placement outcomes from past cohorts. The same mentor who teaches you is who reviews your capstone and reaches out to hiring partners on your behalf.
      </p>
    </Section>
  );
}

function FacultyCard({ faculty, index }) {
  return (
    <motion.div
      data-faculty-card
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
      className="snap-start shrink-0 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 18px 44px -22px rgba(0,0,0,0.55)',
        width: 280,
      }}
    >
      {/* Avatar header */}
      <div
        className={`relative aspect-[5/4] bg-gradient-to-br ${faculty.accent}`}
        style={{
          backgroundColor: 'rgba(39,100,228,0.10)',
        }}
      >
        {/* Years exp pill */}
        <span
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10.5px] font-semibold font-sora"
          style={{
            backgroundColor: '#ffffff',
            color: SPANBIX_BRAND.navy,
            border: `1px solid ${SPANBIX_BRAND.border}`,
          }}
        >
          {faculty.yearsExp} years exp
        </span>
        {/* Role badge */}
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] font-sora"
          style={{
            backgroundColor: SPANBIX_BRAND.accent,
            color: '#ffffff',
          }}
        >
          {faculty.badge}
        </span>
        {/* Initials avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center font-serif text-[36px] tracking-tight"
            style={{
              background: `linear-gradient(135deg, ${SPANBIX_BRAND.accent} 0%, ${SPANBIX_BRAND.navy} 100%)`,
              color: '#ffffff',
              boxShadow: '0 18px 36px -14px rgba(16,44,86,0.45)',
            }}
          >
            {faculty.initials}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid rgba(255,255,255,0.4)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-center gap-2">
          <h3
            className="font-serif text-[18px] tracking-tight leading-tight"
            style={{ color: SPANBIX_BRAND.navy }}
          >
            {faculty.name}
          </h3>
          <span
            aria-label={`${faculty.name} on LinkedIn`}
            className="inline-flex items-center justify-center w-5 h-5 rounded shrink-0"
            style={{ backgroundColor: '#0a66c2' }}
          >
            <Linkedin size={11} color="#ffffff" />
          </span>
        </div>
        <p
          className="mt-1 text-[12.5px] font-sora leading-snug"
          style={{ color: SPANBIX_BRAND.textMuted }}
        >
          {faculty.role}
        </p>

        <div
          className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sora"
          style={{
            backgroundColor: '#f5f8ff',
            color: SPANBIX_BRAND.navy,
            border: `1px solid ${SPANBIX_BRAND.border}`,
          }}
        >
          <Briefcase size={10} style={{ color: SPANBIX_BRAND.accent }} />
          {faculty.company}
          <span style={{ color: SPANBIX_BRAND.textMuted }}>·</span>
          <span style={{ color: SPANBIX_BRAND.accent }}>{faculty.track}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ArrowBtn({ dir, disabled, onClick }) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous faculty' : 'Next faculty'}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed"
      style={{
        backgroundColor: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: disabled ? 'rgba(255,255,255,0.30)' : '#ffffff',
      }}
    >
      <Icon size={18} />
    </button>
  );
}
