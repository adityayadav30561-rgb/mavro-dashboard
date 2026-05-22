import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Calendar,
  Users,
  GraduationCap,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND, SPANBIX_CAREER_PATHS } from '@/lib/spanbixSeo';

/**
 * Campus-context course catalog. Same 4 SAP tracks surfaced from the consumer
 * catalog (FICO, MM, SD, ABAP) but framed for a college placement cell:
 *   - Campus cohort badge instead of consumer "Bestseller"
 *   - Cohort duration sourced from campusTimeline length (6–7 months)
 *   - Highlights tuned to AICTE / NAAC / co-certification
 *   - CTA routes to /spanbix/career-paths/:code?mode=campus so the detail
 *     page lands directly on the Campus pill (no extra click).
 * Pricing is intentionally omitted everywhere on this surface — campus
 * engagements are negotiated with the college T&P in the backend.
 */
export default function CampusCoursesCatalog() {
  return (
    <Section
      id="campus-courses"
      tone="cream"
      caption="Campus Curriculum Catalog"
      title="Four SAP tracks. Drop any one of them inside your college."
      subtitle="Every Spanbix track is also a campus cohort — AICTE / NAAC-aligned, attendance-linked, T&P-instrumented, and finished with college-branded co-certification. Open a track to see the 6–7 month cohort timeline aligned to a placement-cycle calendar."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {SPANBIX_CAREER_PATHS.map((track, i) => (
          <CampusTrackCard key={track.code} track={track} index={i} />
        ))}
      </div>

      <div
        className="mt-12 rounded-2xl p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${SPANBIX_BRAND.border}`,
          boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 10px 28px -18px rgba(16,44,86,0.10)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(39,100,228,0.10)' }}
          >
            <Building2 size={20} style={{ color: SPANBIX_BRAND.accent }} />
          </div>
          <div>
            <p
              className="font-serif text-[19px] tracking-tight"
              style={{ color: SPANBIX_BRAND.navy }}
            >
              Want a custom blend across tracks?
            </p>
            <p
              className="mt-1 text-[13.5px] font-sora"
              style={{ color: SPANBIX_BRAND.textMuted }}
            >
              We design hybrid cohorts that match your branch mix — for example, FICO + MM split across a B.Com batch, or SD + ABAP for a B.Tech batch. Talk to us; we'll draft the plan.
            </p>
          </div>
        </div>
        <Link
          to="/spanbix/contact"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-[13.5px] font-semibold font-sora text-white transition-all hover:brightness-110 whitespace-nowrap"
          style={{ backgroundColor: SPANBIX_BRAND.navy }}
        >
          Request Tailored Plan
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </Section>
  );
}

function CampusTrackCard({ track, index }) {
  const cohortMonths = track.campusTimeline?.length || 6;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
    >
      <Link
        to={`/spanbix/career-paths/${track.code}?mode=campus`}
        className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${SPANBIX_BRAND.border}`,
          boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 14px 36px -18px rgba(16,44,86,0.18)',
        }}
      >
        {/* Visual header */}
        <div
          className="relative aspect-[16/9] overflow-hidden"
          style={{
            backgroundColor: SPANBIX_BRAND.navy,
            backgroundImage:
              'radial-gradient(circle at 78% 18%, rgba(39,100,228,0.35), transparent 55%), radial-gradient(circle at 22% 82%, rgba(96,165,250,0.22), transparent 55%)',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] font-sora"
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <GraduationCap size={11} />
            Campus Cohort
          </span>
          <span
            className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] font-sora"
            style={{
              backgroundColor: '#ffffff',
              color: SPANBIX_BRAND.accent,
            }}
          >
            <ShieldCheck size={10} />
            AICTE / NAAC
          </span>
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
            {track.audience}
          </p>

          {/* Cohort stats */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <CohortTile icon={Calendar} label="Cohort" value={`${cohortMonths} months`} />
            <CohortTile icon={Users} label="Capacity" value="200–2K" />
          </div>

          {/* Mini highlights */}
          <ul className="mt-4 space-y-1.5">
            {[
              'Bulk CSV onboarding',
              'Attendance-linked content unlock',
              'College-branded co-certification',
            ].map((h) => (
              <li key={h} className="flex items-start gap-2">
                <span
                  className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: SPANBIX_BRAND.accent }}
                />
                <span className="text-[12.5px] font-sora" style={{ color: SPANBIX_BRAND.textDark }}>
                  {h}
                </span>
              </li>
            ))}
          </ul>

          <div
            className="mt-auto pt-5 flex items-center justify-between"
            style={{ borderTop: `1px solid ${SPANBIX_BRAND.border}` }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] font-sora"
              style={{ color: SPANBIX_BRAND.textMuted }}
            >
              MoU-priced
            </p>
            <span
              className="inline-flex items-center gap-1 text-[13px] font-semibold font-sora transition-colors group-hover:gap-2"
              style={{ color: SPANBIX_BRAND.accent }}
            >
              View Curriculum
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

function CohortTile({ icon: Icon, label, value }) {
  return (
    <div
      className="rounded-lg p-2.5"
      style={{
        backgroundColor: '#f5f8ff',
        border: `1px solid ${SPANBIX_BRAND.border}`,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.14em] font-sora"
        style={{ color: SPANBIX_BRAND.textMuted }}
      >
        {label}
      </p>
      <p className="mt-0.5 inline-flex items-center gap-1.5 font-sora text-[13px] font-semibold" style={{ color: SPANBIX_BRAND.navy }}>
        <Icon size={12} style={{ color: SPANBIX_BRAND.accent }} />
        {value}
      </p>
    </div>
  );
}
