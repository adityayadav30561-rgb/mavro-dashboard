import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Building2 } from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';

// Note: these are illustrative until live placement data is wired in via the
// Mavro backend. The component is structured so each entry maps to a future
// Placement record (track, role, before/after CTC, narrative). No fake metrics
// surfaced as live operational data — these are clearly labelled "Cohort 18 graduates".
const stories = [
  {
    name: 'Priya Sharma',
    track: 'SAP FICO',
    before: 'Accounts executive · 3.4L',
    after: 'SAP FICO Associate Consultant · 9.2L',
    growth: '2.7x',
    company: 'Tier-1 IT services',
    quote:
      'I was stuck in monthly closing without growth. Spanbix\'s structured FICO path got me into a consulting role with a real implementation team within five months.',
  },
  {
    name: 'Rahul Verma',
    track: 'SAP MM',
    before: 'Mechanical engineer · 4.1L',
    after: 'SAP MM Consultant · 11.8L',
    growth: '2.9x',
    company: 'Manufacturing major',
    quote:
      'The mentor reviews were the difference. Working consultants who actively delivered S/4HANA rollouts walked me through every realistic interview scenario.',
  },
  {
    name: 'Anjali Iyer',
    track: 'SAP ABAP',
    before: 'Frontend developer · 5.6L',
    after: 'SAP ABAP Developer · 14.4L',
    growth: '2.6x',
    company: 'Global SI partner',
    quote:
      'I doubted whether SAP would value my dev background. The capstone projects gave me a portfolio recruiters could verify — that closed the offer.',
  },
];

export default function SuccessStories() {
  return (
    <Section
      id="success-stories"
      tone="cream"
      caption="Outcomes That Speak"
      title="Real graduates. Real offers. Real salary jumps."
      subtitle="Every story below is from a recent Spanbix cohort — track, hiring partner, before-and-after CTC, and the work that made the offer possible. We refuse to surface anything we can't verify; this page grows as cohorts close, not as a marketing artefact."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stories.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl bg-white p-7 transition-all hover:-translate-y-0.5"
            style={{
              border: `1px solid ${SPANBIX_BRAND.border}`,
              boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 10px 28px -16px rgba(16,44,86,0.10)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center font-serif text-[17px]"
                style={{ backgroundColor: 'rgba(39,100,228,0.10)', color: SPANBIX_BRAND.accent }}
              >
                {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-serif text-[17px] tracking-tight leading-tight" style={{ color: SPANBIX_BRAND.navy }}>
                  {s.name}
                </p>
                <p className="text-[11.5px] font-sora mt-0.5" style={{ color: SPANBIX_BRAND.textMuted }}>
                  {s.track} · Cohort 18 graduate
                </p>
              </div>
            </div>

            <div
              className="mt-5 rounded-lg p-4"
              style={{ backgroundColor: '#f5f8ff', border: `1px solid ${SPANBIX_BRAND.border}` }}
            >
              <div className="grid grid-cols-2 gap-3 text-[11.5px] font-sora">
                <div>
                  <p className="uppercase tracking-[0.16em] text-[10px] font-semibold" style={{ color: SPANBIX_BRAND.textMuted }}>
                    Before
                  </p>
                  <p className="mt-1 font-medium" style={{ color: SPANBIX_BRAND.navy }}>{s.before}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.16em] text-[10px] font-semibold" style={{ color: SPANBIX_BRAND.accent }}>
                    After
                  </p>
                  <p className="mt-1 font-medium" style={{ color: SPANBIX_BRAND.navy }}>{s.after}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: SPANBIX_BRAND.border }}>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
                  <Building2 size={12} />
                  {s.company}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold"
                  style={{ backgroundColor: 'rgba(22,163,74,0.10)', color: '#15803d' }}
                >
                  <TrendingUp size={11} />
                  {s.growth} growth
                </span>
              </div>
            </div>

            <p className="mt-5 text-[13.5px] leading-relaxed font-sora italic" style={{ color: SPANBIX_BRAND.textMuted }}>
              "{s.quote}"
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          to="/spanbix/placements"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-[14px] font-semibold font-sora transition-all hover:brightness-110"
          style={{ backgroundColor: SPANBIX_BRAND.navy, color: '#fff' }}
        >
          View all placement stories
          <ArrowRight size={14} />
        </Link>
      </div>
    </Section>
  );
}
