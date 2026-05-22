import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  Users2,
  Award,
  LineChart,
  PlayCircle,
} from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';

const pillars = [
  {
    icon: LayoutDashboard,
    title: 'One workspace, not a YouTube playlist',
    body: 'Course library, structured modules, quizzes, assignments, mentor sessions, and your placement readiness score — all in a single console. No tab-juggling, no scattered Drive links.',
  },
  {
    icon: BookOpen,
    title: 'Curriculum that mirrors a real project',
    body: 'Every module follows how SAP is actually deployed at a client: business process → configuration → integration → capstone simulation. You learn the way a consultant would learn on the job — just faster, and with a mentor watching.',
  },
  {
    icon: Users2,
    title: 'Live mentorship, not pre-recorded answers',
    body: 'Each cohort gets a working SAP consultant as a primary mentor — someone delivering implementations right now. Weekly office hours, code/config reviews, and 1:1 sessions on the harder topics.',
  },
  {
    icon: CheckCircle2,
    title: 'A sandbox you actually configure',
    body: 'Live S/4HANA environment for hands-on practice — configure GL accounts, post documents, build pricing procedures, run goods receipts, debug your own RICEFW. Theory without the sandbox is just reading.',
  },
  {
    icon: Award,
    title: 'Certificate + a built-in placement portal',
    body: 'A QR-verifiable Spanbix certificate plus an embedded placement portal: resume reviews, profile builder, mock interviews scheduled with senior consultants, and direct connect to hiring partners. The portal opens the moment you finish your capstone.',
  },
  {
    icon: LineChart,
    title: 'Readiness analytics for you (and your T&P)',
    body: 'Granular signals on curriculum velocity, assessment performance, mock-interview readiness, and placement-match score. For solo learners — your personal dashboard. For colleges — exportable cohort reports the T&P office can use in placement reviews.',
  },
];

export default function LearningExperience() {
  return (
    <Section
      id="learning-experience"
      tone="cream"
      caption="The Learning Experience"
      title="Built like a working consultant's toolkit. Not a video library."
      subtitle="Most online platforms hand you 80 hours of recorded video and hope something sticks. Spanbix runs like an actual enterprise project — structured curriculum, a sandbox you actually touch, weekly mentor reviews, and a capstone that recruiters can verify. Same online or on campus."
    >
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Pillars list */}
        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i % 2) * 0.05 }}
                className="rounded-2xl bg-white p-6"
                style={{
                  border: `1px solid ${SPANBIX_BRAND.border}`,
                  boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 8px 24px -16px rgba(16,44,86,0.08)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(39,100,228,0.10)' }}
                >
                  <Icon size={18} style={{ color: SPANBIX_BRAND.accent }} />
                </div>
                <h3
                  className="mt-4 font-serif text-[18px] tracking-tight leading-snug"
                  style={{ color: SPANBIX_BRAND.navy }}
                >
                  {p.title}
                </h3>
                <p className="mt-2 text-[13.5px] font-sora leading-relaxed" style={{ color: SPANBIX_BRAND.textMuted }}>
                  {p.body}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* LMS preview mockup */}
        <div className="lg:col-span-5">
          <LmsPreview />
        </div>
      </div>
    </Section>
  );
}

function LmsPreview() {
  const lessons = [
    { title: 'GL Account Master Data', state: 'completed', meta: '24 min' },
    { title: 'Document Splitting Configuration', state: 'in_progress', meta: '38 min · 62%' },
    { title: 'Asset Accounting Setup', state: 'next', meta: 'Live · Tomorrow 7 PM' },
    { title: 'Controlling Area & Cost Centers', state: 'locked', meta: 'Unlocks after AA' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        border: `1px solid ${SPANBIX_BRAND.border}`,
        boxShadow: '0 20px 50px -22px rgba(16,44,86,0.18)',
      }}
    >
      {/* Header bar */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ backgroundColor: SPANBIX_BRAND.navy, color: '#fff' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ade80' }} />
          <p className="text-[12px] font-sora">SAP FICO · Module 04 · Asset Accounting</p>
        </div>
        <p className="text-[10.5px] font-sora uppercase tracking-[0.18em] text-white/55">Cohort 18</p>
      </div>

      <div className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
          Current lesson
        </p>
        <h4 className="mt-2 font-serif text-[20px] tracking-tight" style={{ color: SPANBIX_BRAND.navy }}>
          Configuring Chart of Depreciation
        </h4>

        <div
          className="mt-4 rounded-lg p-4 flex items-center gap-3"
          style={{ backgroundColor: 'rgba(39,100,228,0.06)', border: `1px solid rgba(39,100,228,0.18)` }}
        >
          <PlayCircle size={26} style={{ color: SPANBIX_BRAND.accent }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold font-sora" style={{ color: SPANBIX_BRAND.navy }}>
              Sandbox walkthrough · 28 minutes
            </p>
            <p className="text-[11.5px] font-sora mt-0.5" style={{ color: SPANBIX_BRAND.textMuted }}>
              Mentor commentary by Aman Patil · S/4HANA 2023
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
            Module map
          </p>
          <ul className="mt-3 space-y-2">
            {lessons.map((l) => (
              <li
                key={l.title}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{
                  backgroundColor: l.state === 'in_progress' ? 'rgba(39,100,228,0.06)' : '#f5f8ff',
                  border: l.state === 'in_progress' ? '1px solid rgba(39,100,228,0.22)' : `1px solid ${SPANBIX_BRAND.border}`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      l.state === 'completed' ? '#22c55e' :
                      l.state === 'in_progress' ? SPANBIX_BRAND.accent :
                      l.state === 'next' ? '#f59e0b' : '#cbd5e1',
                  }}
                />
                <p className="text-[12.5px] font-sora flex-1 min-w-0 truncate" style={{ color: SPANBIX_BRAND.textDark }}>
                  {l.title}
                </p>
                <p className="text-[11px] font-mono whitespace-nowrap" style={{ color: SPANBIX_BRAND.textMuted }}>
                  {l.meta}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
