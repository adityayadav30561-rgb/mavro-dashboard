import { motion } from 'framer-motion';
import { Award, ShieldCheck, BookCheck, Briefcase } from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';

const pillars = [
  {
    icon: Award,
    title: 'A certificate that means you actually finished.',
    body: 'Issued only after curriculum, assessments, capstone, and mentor sign-off. QR-verifiable, mentor-signed PDF — recruiters can validate authenticity in a single scan. Attendance alone earns you nothing.',
  },
  {
    icon: BookCheck,
    title: 'Maps directly to SAP\'s official C_TS exams.',
    body: 'Curriculum is built against SAP\'s associate / specialist exam blueprints (e.g. C_TS4FI for FICO, C_TS452 for MM). Same study, two outcomes — Spanbix credential plus a confident attempt at the official paper.',
  },
  {
    icon: ShieldCheck,
    title: 'Reviewed by consultants who deliver, not trainers who retired.',
    body: 'Every module is reviewed by working SAP consultants currently shipping S/4HANA implementations for live clients. When SAP releases a new feature pack, the people teaching it are already using it on real projects.',
  },
  {
    icon: Briefcase,
    title: 'Built around what hiring panels actually ask.',
    body: 'Mock interviews, case scenarios, and resume reviews are tuned to the real questions Tier-1 SIs, GCCs, and manufacturing majors ask. Because the same mentors who teach you also sit on those panels.',
  },
];

export default function Certifications() {
  return (
    <Section
      id="certifications"
      tone="white"
      caption="Certification That Earns Its Place"
      title="A credential a recruiter can verify in 30 seconds."
      subtitle="Most online certificates are wallpaper. Spanbix's is QR-verifiable, mentor-signed, and only issued after curriculum + assessments + capstone + mentor sign-off — never on attendance alone. The curriculum also maps cleanly to SAP's official C_TS exam blueprints, so the same prep doubles as exam prep."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {pillars.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-2xl bg-white p-6 transition-all hover:-translate-y-0.5"
              style={{
                border: `1px solid ${SPANBIX_BRAND.border}`,
                boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 8px 24px -16px rgba(16,44,86,0.08)',
              }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(39,100,228,0.10)' }}
              >
                <Icon size={20} style={{ color: SPANBIX_BRAND.accent }} />
              </div>
              <h3 className="mt-5 font-serif text-[18px] tracking-tight leading-snug" style={{ color: SPANBIX_BRAND.navy }}>
                {p.title}
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
                {p.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
