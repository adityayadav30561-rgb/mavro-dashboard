import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, EyeOff, TrendingUp, Briefcase, Sparkles } from 'lucide-react';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';
import { trackCtaClick } from '@/lib/analytics';
import { withSpanbixBase } from '@/lib/routeBase';

const stats = [
  { value: '40,000+', label: 'SAP roles unfilled every year in India', icon: Briefcase },
  { value: '₹4.7L+', label: 'Starting CTC for certified consultants', icon: TrendingUp },
  { value: '<2%', label: 'Of graduates know these roles exist', icon: EyeOff },
];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: SPANBIX_BRAND.navy,
        color: '#fff',
        backgroundImage:
          'radial-gradient(circle at 20% 10%, rgba(39,100,228,0.22), transparent 55%), radial-gradient(circle at 80% 90%, rgba(39,100,228,0.16), transparent 55%)',
      }}
    >
      {/* Subtle grid texture — restrained, not flashy */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative max-w-7xl mx-auto w-full min-w-0 px-6 sm:px-6 md:px-8 pt-12 sm:pt-16 md:pt-24 lg:pt-36 pb-16 sm:pb-20 md:pb-28">
        <div className="grid lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* `min-w-0` is critical on grid children that hold long-text content:
              CSS Grid's default `min-width: auto` lets children expand to their
              intrinsic content width, defeating `overflow-x-hidden` on the
              parent. min-w-0 forces the child to honor the grid track width. */}
          <div className="lg:col-span-7 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 sm:gap-2 max-w-full px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[9.5px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.24em] font-sora text-white"
              style={{
                backgroundColor: 'rgba(39,100,228,0.28)',
                border: '1px solid rgba(147,197,253,0.55)',
              }}
            >
              <Sparkles size={11} className="shrink-0" />
              <span className="whitespace-normal break-words leading-tight">
                SAP Careers · Commerce + Engineering Graduates
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              // Mobile base uses Tailwind core token `text-2xl` (24px) — guaranteed
              // in the production bundle even if JIT arbitrary classes get tree-shaken.
              // Inline style sets the strongest word-break hints as a final safety net
              // so the headline never clips at 320–414px viewports.
              className="mt-5 sm:mt-6 font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15] sm:leading-[1.08] tracking-[-0.015em] text-white max-w-full"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                hyphens: 'auto',
              }}
            >
              There are 40,000 SAP jobs waiting.{' '}
              <span
                style={{
                  background: 'linear-gradient(120deg, #ffffff 0%, #bfdbfe 55%, #93c5fd 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Almost nobody told graduates about them
              </span>
              <span style={{ color: '#93c5fd' }}>.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-4 sm:mt-6 max-w-full sm:max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed font-sora"
              style={{ color: 'rgba(255,255,255,0.9)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              Spanbix trains BBA, BCom, MBA, and engineering graduates for the SAP roles that
              actually pay — through working-consultant mentorship, hands-on S/4HANA sandbox
              practice, and direct placement support. Learn online if you're solo, or get the
              full cohort inside your college through our campus partnership.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-9 flex flex-wrap items-center gap-3 font-sora"
            >
              <Link
                to={withSpanbixBase('/career-paths')}
                onClick={() => trackCtaClick('Explore Career Paths', { location: 'hero' })}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-[14.5px] font-semibold transition-all hover:brightness-110 shadow-[0_18px_40px_-12px_rgba(39,100,228,0.6)]"
                style={{ backgroundColor: SPANBIX_BRAND.accent, color: '#fff' }}
              >
                Explore Career Paths
                <ArrowRight size={15} />
              </Link>
              <Link
                to={withSpanbixBase('/demo-classes')}
                onClick={() => trackCtaClick('Watch Free Demo', { location: 'hero' })}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-[14.5px] font-semibold border border-white/20 text-white/90 hover:bg-white/[0.06] hover:border-white/35 transition-all"
              >
                <PlayCircle size={16} />
                Watch Free Demo
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.28 }}
              className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 max-w-full sm:max-w-2xl min-w-0"
            >
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="relative p-3 sm:p-4 rounded-xl backdrop-blur-sm overflow-hidden text-white min-w-0"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(147,197,253,0.22)',
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute top-0 left-0 h-[3px] w-8 sm:w-10 rounded-r-full"
                      style={{ backgroundColor: '#60a5fa' }}
                    />
                    <Icon size={14} className="sm:hidden" style={{ color: '#93c5fd' }} />
                    <Icon size={16} className="hidden sm:block" style={{ color: '#93c5fd' }} />
                    <p
                      className="mt-2 sm:mt-3 font-mono text-base sm:text-xl md:text-2xl font-semibold tracking-tight"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {s.value}
                    </p>
                    <p
                      className="mt-1 text-[10.5px] sm:text-[11.5px] font-sora leading-snug"
                      style={{ color: 'rgba(255,255,255,0.82)', wordBreak: 'break-word' }}
                    >
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Right: enterprise dashboard preview composition */}
          <div className="lg:col-span-5 min-w-0 w-full">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Primary panel: career path snapshot */}
      <div
        className="relative rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] text-white w-full min-w-0 overflow-hidden"
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(147,197,253,0.22)',
        }}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.24em] font-sora"
              style={{ color: 'rgba(255,255,255,0.72)' }}
            >
              Active Cohort
            </p>
            <p className="mt-1 font-serif text-base sm:text-[19px] truncate">SAP FICO · Consultant Track</p>
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full font-sora"
            style={{
              backgroundColor: 'rgba(22,163,74,0.15)',
              color: '#4ade80',
              border: '1px solid rgba(22,163,74,0.4)',
            }}
          >
            In Progress
          </span>
        </div>

        <div className="mt-5">
          <div
            className="flex items-center justify-between text-[11.5px] font-sora mb-2"
            style={{ color: 'rgba(255,255,255,0.82)' }}
          >
            <span>Curriculum progress</span>
            <span className="font-mono text-white">68%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '68%' }}
              transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ backgroundColor: SPANBIX_BRAND.accent }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 min-w-0">
          {[
            { label: 'Modules', value: '24' },
            { label: 'Mentors', value: '6' },
            { label: 'Placements', value: '142' },
          ].map((m) => (
            <div
              key={m.label}
              className="p-2 sm:p-3 rounded-lg min-w-0 overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(147,197,253,0.20)' }}
            >
              <p className="font-mono text-base sm:text-[18px] font-semibold tracking-tight text-white">{m.value}</p>
              <p
                className="text-[9.5px] sm:text-[10.5px] font-sora uppercase tracking-[0.12em] sm:tracking-[0.16em] mt-0.5 truncate"
                style={{ color: 'rgba(255,255,255,0.72)' }}
              >
                {m.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(147,197,253,0.20)' }}>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em] font-sora mb-3"
            style={{ color: 'rgba(255,255,255,0.72)' }}
          >
            Next session
          </p>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-serif text-[16px] text-white"
              style={{ backgroundColor: 'rgba(96,165,250,0.35)' }}
            >
              AP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium font-sora truncate text-white">
                Asset Accounting in S/4HANA — Live workshop
              </p>
              <p
                className="text-[11px] font-sora mt-0.5 truncate"
                style={{ color: 'rgba(255,255,255,0.72)' }}
              >
                Mentor: Aman Patil · Senior SAP Consultant
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary floating panel: salary signal */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="absolute -bottom-7 -left-6 hidden sm:block rounded-xl p-4 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.55)]"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid rgba(219,228,240,1)',
          color: SPANBIX_BRAND.textDark,
          width: 200,
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
          Placement signal
        </p>
        <p className="mt-1.5 font-mono text-[20px] font-semibold tracking-tight" style={{ color: SPANBIX_BRAND.navy }}>
          ₹14.2L
        </p>
        <p className="text-[11.5px] font-sora mt-1" style={{ color: SPANBIX_BRAND.textMuted }}>
          Median CTC · FICO graduates · last 12 months
        </p>
      </motion.div>
    </motion.div>
  );
}
