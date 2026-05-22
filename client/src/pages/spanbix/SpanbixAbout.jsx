import { motion } from 'framer-motion';
import { Target, Compass, ShieldCheck, Users2 } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/PageHero';
import Section from '@/components/spanbix/Section';
import Certifications from '@/components/spanbix/Certifications';
import FinalCta from '@/components/spanbix/FinalCta';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_BRAND, SPANBIX_SITE, breadcrumbLd, faqLd } from '@/lib/spanbixSeo';

const values = [
  {
    icon: Target,
    title: 'Career outcomes are the only success metric',
    body:
      'We do not optimize for course completion or NPS. We optimize for placement velocity, salary trajectory, and the consultant track our graduates build over five years.',
  },
  {
    icon: ShieldCheck,
    title: 'Credentials must mean something',
    body:
      'Certificates are issued only after curriculum, assessments, capstone, and mentor sign-off — never on attendance alone. Every credential is verifiable.',
  },
  {
    icon: Users2,
    title: 'Mentorship from working consultants',
    body:
      'Mentors are active SAP consultants currently delivering implementations — not retired trainers reading slides.',
  },
  {
    icon: Compass,
    title: 'Honest career advice',
    body:
      'Consultations are advisory, not sales calls. If the right answer is "this track is not for you" — we will say that.',
  },
];

const aboutFaqs = [
  {
    q: 'What does Spanbix actually do?',
    a: 'Spanbix is career transformation infrastructure for the SAP and enterprise technology economy — structured curriculum, mentor-led tracks, certification, and placement readiness.',
  },
  {
    q: 'Who is Spanbix for?',
    a: 'Fresh graduates, working professionals transitioning into SAP, and engineering / management colleges running campus partnerships for placement readiness.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes. A pro-rated refund policy applies until specific curriculum milestones. Details are shared during onboarding and published in the refund policy.',
  },
  {
    q: 'How is Spanbix different from a generic LMS or course marketplace?',
    a: 'We are not a content marketplace. Spanbix is a career-outcome platform with structured curriculum, working consultant mentorship, placement support, and credentialing that recruiters can verify.',
  },
];

export default function SpanbixAbout() {
  useSEO({
    title: `About — ${SPANBIX_SITE.name}`,
    description:
      'Spanbix builds career transformation infrastructure for the SAP and enterprise technology economy. Learn about our mission, values, and how we operate.',
    keywords: ['about Spanbix', 'SAP training company', 'enterprise technology education', 'career platform'],
    canonical: `${SPANBIX_SITE.url}/about`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'About', url: `${SPANBIX_SITE.url}/about` },
      ]),
      faqLd(aboutFaqs),
    ],
  });

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="About Spanbix"
        title="We exist because nobody told graduates about the SAP economy."
        subtitle="India ships 38 million graduates into the job market every year. A vanishingly small number of them know that the world's enterprise-software economy is hiring at scale — at salaries that change family trajectories. Spanbix is the bridge from 'I've never heard of SAP' to 'I'm a placed SAP consultant'."
      />

      <Section tone="white" caption="Our Values" title="The four things we refuse to compromise on.">
        <div className="grid md:grid-cols-2 gap-5">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i % 2) * 0.06 }}
                className="rounded-2xl bg-white p-7"
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
                <h3
                  className="mt-5 font-serif text-[20px] tracking-tight leading-snug"
                  style={{ color: SPANBIX_BRAND.navy }}
                >
                  {v.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
                  {v.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      <Certifications />

      <Section id="faqs" tone="cream" caption="FAQs" title="Common questions about Spanbix.">
        <div className="space-y-4">
          {aboutFaqs.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
              className="rounded-xl bg-white p-6"
              style={{
                border: `1px solid ${SPANBIX_BRAND.border}`,
              }}
            >
              <h4 className="font-serif text-[18px] tracking-tight" style={{ color: SPANBIX_BRAND.navy }}>
                {f.q}
              </h4>
              <p className="mt-2 text-[14px] font-sora leading-relaxed" style={{ color: SPANBIX_BRAND.textMuted }}>
                {f.a}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      <FinalCta />
    </SpanbixLayout>
  );
}
