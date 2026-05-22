import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlayCircle, Clock, ArrowRight, Mic, BookOpen } from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';
import { trackCtaClick } from '@/lib/analytics';
import { withSpanbixBase } from '@/lib/routeBase';

const previews = [
  {
    track: 'SAP FICO',
    title: 'How a real S/4HANA finance close actually runs',
    duration: '32 min',
    type: 'Live Workshop Recording',
    mentor: 'Aman Patil',
    accent: 'rgba(39,100,228,0.10)',
  },
  {
    track: 'SAP MM',
    title: 'Inside the procure-to-pay cycle, end to end',
    duration: '27 min',
    type: 'Mini Lecture',
    mentor: 'Neha Iyer',
    accent: 'rgba(22,163,74,0.10)',
  },
  {
    track: 'SAP ABAP',
    title: 'Reading and extending a real RICEFW object',
    duration: '41 min',
    type: 'Hands-on Walkthrough',
    mentor: 'Rohit Sharma',
    accent: 'rgba(245,158,11,0.10)',
  },
];

export default function DemoClasses() {
  return (
    <Section
      id="demo-classes"
      tone="cream"
      caption="Sample The Real Thing"
      title="Watch a full mentor session. Then decide."
      subtitle="Most platforms ship 30-second highlight reels. We ship full sample lessons from the actual track — same mentor, same sandbox, same depth a paid learner gets. Watch the session, judge whether the teaching matches your standard, then talk to us."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {previews.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="group rounded-2xl bg-white overflow-hidden transition-all hover:-translate-y-0.5"
            style={{
              border: `1px solid ${SPANBIX_BRAND.border}`,
              boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 10px 28px -16px rgba(16,44,86,0.10)',
            }}
          >
            {/* Preview pane */}
            <div
              className="relative aspect-[16/9] flex items-center justify-center"
              style={{ backgroundColor: p.accent }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ backgroundColor: SPANBIX_BRAND.accent, color: '#fff', boxShadow: '0 14px 30px -10px rgba(39,100,228,0.5)' }}
              >
                <PlayCircle size={26} />
              </div>
              <span
                className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-[0.18em] px-2 py-1 rounded-full font-sora"
                style={{ backgroundColor: '#fff', color: SPANBIX_BRAND.navy, border: `1px solid ${SPANBIX_BRAND.border}` }}
              >
                {p.track}
              </span>
              <span
                className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-[10.5px] font-mono px-2 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: SPANBIX_BRAND.navy }}
              >
                <Clock size={10} />
                {p.duration}
              </span>
            </div>

            <div className="p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] font-sora" style={{ color: SPANBIX_BRAND.accent }}>
                {p.type}
              </p>
              <h3
                className="mt-2 font-serif text-[18px] tracking-tight leading-snug"
                style={{ color: SPANBIX_BRAND.navy }}
              >
                {p.title}
              </h3>
              <div className="mt-4 flex items-center gap-2 text-[12.5px] font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
                <Mic size={13} />
                <span>Mentor · {p.mentor}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between rounded-2xl p-7 bg-white" style={{ border: `1px solid ${SPANBIX_BRAND.border}` }}>
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(39,100,228,0.10)' }}
          >
            <BookOpen size={22} style={{ color: SPANBIX_BRAND.accent }} />
          </div>
          <div>
            <h3 className="font-serif text-[20px] tracking-tight" style={{ color: SPANBIX_BRAND.navy }}>
              Want the full demo library?
            </h3>
            <p className="text-[13.5px] font-sora mt-1" style={{ color: SPANBIX_BRAND.textMuted }}>
              Free access to a curated set of full-length sample lessons across every SAP module.
            </p>
          </div>
        </div>
        <Link
          to={withSpanbixBase('/demo-classes')}
          onClick={() => trackCtaClick('Access Free Demo Classes', { location: 'demo-section' })}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-[14px] font-semibold font-sora transition-all hover:brightness-110 whitespace-nowrap"
          style={{ backgroundColor: SPANBIX_BRAND.accent, color: '#fff' }}
        >
          Access Free Demo Classes
          <ArrowRight size={14} />
        </Link>
      </div>
    </Section>
  );
}
