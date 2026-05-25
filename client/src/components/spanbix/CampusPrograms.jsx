import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  Building,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';
import { trackCtaClick } from '@/lib/analytics';
import { withSpanbixBase } from '@/lib/routeBase';

const features = [
  {
    icon: GraduationCap,
    title: 'Roster in. Cohort live in 48 hours.',
    body: 'Drop us a CSV of the batch (name, email, phone, branch). Spanbix generates credentials, assigns cohorts, maps the right SAP track per student, and sends welcome emails. 200 to 2,000 students onboarded as one cleanly-scheduled rollout — not a chaotic email-thread exercise.',
  },
  {
    icon: ClipboardList,
    title: 'Awareness workshops, then the actual program.',
    body: 'We start with a free on-campus session — career counsellors and a working SAP consultant explain the SAP economy to 100–500 students. The ones who opt in flow straight into the structured program. Built for placement cells that want signal, not just attendance.',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance + progress unlock the next module.',
    body: 'Content unlocks tie to attendance and assessment scores so students can\'t coast through. Configurable per batch, aligned to your semester calendar. Real academic structure — not "watch 80 videos at your own pace".',
  },
  {
    icon: BarChart3,
    title: 'A dashboard your T&P office actually uses.',
    body: 'Cohort velocity, drop-off rate, assessment scores, mock-interview readiness, placement-match score — every metric a placement head needs, in one downloadable report. Reviewed at every month-end with your team.',
  },
  {
    icon: Briefcase,
    title: 'Costs less than your soft-skills vendor.',
    body: 'Per-batch pricing scales with cohort size and modules enabled — in most engagements the program comes in below what colleges already spend on generic soft-skills training, with verifiable placement outcomes attached.',
  },
  {
    icon: Building,
    title: 'Co-branded certificate that strengthens your record.',
    body: 'Completion certificates issued in your college\'s name alongside the Spanbix credential. QR-verifiable, recruiter-checkable, and a credible new line on your annual placement report. "Placed in SAP roles" becomes something your admissions team can quote.',
  },
];

export default function CampusPrograms() {
  return (
    <Section
      id="campus-programs"
      caption="For Colleges + Placement Cells"
      title="Turn your placement record into your strongest admissions pitch."
      subtitle="Spanbix Campus runs SAP-readiness cohorts inside your college — structured curriculum, attendance-linked progression, T&P-instrumented dashboards, and a co-branded credential. Your placement office gets a real career layer; your students get a career most of their peers never hear of; your prospectus gets a new line that admissions counsellors can actually use."
      tone="navy"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
              className="rounded-2xl p-6 backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(39,100,228,0.18)' }}
              >
                <Icon size={20} style={{ color: '#9bb6ea' }} />
              </div>
              <h3 className="mt-5 font-serif text-[19px] tracking-tight leading-snug text-white">
                {f.title}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed font-sora text-white/70">
                {f.body}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div
        className="mt-12 rounded-2xl p-7 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
        style={{
          backgroundColor: 'rgba(39,100,228,0.10)',
          border: '1px solid rgba(39,100,228,0.40)',
        }}
      >
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] font-sora" style={{ color: '#9bb6ea' }}>
            For Placement Heads + Academic Leadership
          </p>
          <h3 className="mt-2 font-serif text-[22px] md:text-[26px] tracking-tight text-white">
            Make "placed in SAP roles" a line in your prospectus.
          </h3>
          <p className="mt-2 text-[14px] font-sora text-white/75 max-w-2xl">
            30-minute walkthrough with our institutional team — we'll align curriculum, cohort size, and the placement strategy to your academic calendar. Pricing follows the conversation, not the other way around.
          </p>
        </div>
        <Link
          to={withSpanbixBase('/campus-programs')}
          onClick={() => trackCtaClick('Partner With Spanbix', { location: 'campus-section' })}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-[14px] font-semibold font-sora transition-all hover:brightness-110 whitespace-nowrap"
          style={{ backgroundColor: SPANBIX_BRAND.accent, color: '#fff' }}
        >
          Partner With Spanbix
          <ArrowRight size={14} />
        </Link>
      </div>
    </Section>
  );
}
