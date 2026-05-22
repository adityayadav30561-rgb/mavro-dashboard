import { motion } from 'framer-motion';
import { Database, Globe2, Coins, Cpu, ShieldCheck, GraduationCap } from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';

const blocks = [
  {
    icon: Database,
    title: 'SAP isn\'t "software". It\'s how big companies run.',
    body: 'When a Fortune 500 closes its monthly books, plans procurement, or invoices a customer — SAP is doing it. Learning an SAP module is learning how a billion-dollar business actually operates. That\'s why the salaries exist; that\'s why the demand never dries up.',
  },
  {
    icon: Coins,
    title: 'Commerce graduates are the most-wanted profile.',
    body: 'You don\'t need a B.Tech. Functional SAP roles — FICO, MM, SD — exist precisely because companies need people who understand accounting, procurement, and sales. BBA, BCom, and MBA backgrounds are the natural fit, not the exception.',
  },
  {
    icon: Cpu,
    title: 'Companies are hiring. The trained pipeline doesn\'t exist.',
    body: 'There are roughly 40,000 SAP roles posted in India every year that don\'t find ready talent. Companies hire whoever they can find, then spend 6 months training them on the job. Be the candidate who walks in already trained — and skip the queue.',
  },
  {
    icon: Globe2,
    title: 'India is where the global SAP economy lives.',
    body: 'Every Tier-1 SI, global captive center, and manufacturing major delivers SAP work from India. With S/4HANA migrations running until 2028, the entire industry is rebuilding its SAP bench right now. The next decade of demand is already locked in.',
  },
  {
    icon: ShieldCheck,
    title: 'Experience compounds. It doesn\'t depreciate.',
    body: 'In most software careers, last year\'s skill is half-obsolete. In SAP, a 10-year consultant is more valuable than a 1-year consultant — every implementation deepens the knowledge. It\'s one of the few tech careers where age and depth actually win.',
  },
  {
    icon: GraduationCap,
    title: 'Geography is no longer a prerequisite.',
    body: 'Quality SAP training was locked inside Tier-1 metros for two decades. Spanbix is online-first and mentor-led — you can learn from your hometown and still get placed at a Bengaluru SI or a GCC captive in Hyderabad. Tier-2 and Tier-3 are now in the game.',
  },
];

export default function WhySap() {
  return (
    <Section
      id="why-sap"
      tone="cream"
      caption="Why SAP Careers"
      title="Everything you were never told about SAP careers."
      subtitle="Most graduates leave college without ever hearing the word SAP. Then they spend a decade fighting for the same handful of roles their classmates also chase. The SAP economy is hiring at scale, in parallel — and nobody is pointing graduates at it."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {blocks.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative rounded-2xl p-7 transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${SPANBIX_BRAND.border}`,
                boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 10px 28px -18px rgba(16,44,86,0.16)',
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(39,100,228,0.10)' }}
                >
                  <Icon size={20} style={{ color: SPANBIX_BRAND.accent }} />
                </div>
                <span
                  className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: SPANBIX_BRAND.accent }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3
                className="mt-5 font-serif text-[20px] tracking-tight leading-snug"
                style={{ color: SPANBIX_BRAND.navy }}
              >
                {b.title}
              </h3>
              <p
                className="mt-3 text-[14px] leading-relaxed font-sora"
                style={{ color: SPANBIX_BRAND.textMuted }}
              >
                {b.body}
              </p>
              <span
                aria-hidden
                className="absolute left-7 right-7 bottom-0 h-px"
                style={{ background: 'linear-gradient(to right, transparent, rgba(39,100,228,0.35), transparent)' }}
              />
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
