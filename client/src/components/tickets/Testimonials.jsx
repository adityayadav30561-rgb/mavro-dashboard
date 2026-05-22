import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';

const items = [
  {
    role: 'IT Operations Lead',
    org: 'Manufacturing · 2,800 endpoints',
    quote: 'We finally gained visibility into support operations across departments.',
    initials: 'OL',
    accent: 'from-cyan-500 to-teal-700',
  },
  {
    role: 'Head of Service Desk',
    org: 'Banking · multi-region',
    quote: 'SLA tracking transformed how our IT teams handle operational requests.',
    initials: 'SD',
    accent: 'from-emerald-500 to-green-700',
  },
  {
    role: 'Director, Tech Ops',
    org: 'Logistics · 18 sites',
    quote: 'The platform feels operationally serious instead of just another ticket tool.',
    initials: 'TO',
    accent: 'from-indigo-500 to-violet-700',
  },
];

export default function Testimonials() {
  return (
    <EditorialSection
      caption="Voices From the Field"
      title="Trusted By Operators Who Don't Have Time For Friction"
      subtitle="Operations leaders, service desk managers, and IT teams running real workloads on Mavro Ticket Management."
    >
      <div className="grid md:grid-cols-3 gap-5">
        {items.map((t, i) => (
          <motion.figure
            key={t.role}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
            className="relative p-7 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 hover:border-border transition-all"
          >
            <Quote size={26} className="text-cyan-400/50 mb-4" />
            <blockquote className="text-[15px] text-foreground/90 leading-relaxed">"{t.quote}"</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-border/60">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.accent} flex items-center justify-center text-white text-[12px] font-bold shadow-lg`}>
                {t.initials}
              </div>
              <div>
                <p className="text-[13px] font-semibold">{t.role}</p>
                <p className="text-[11px] text-muted-foreground">{t.org}</p>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </EditorialSection>
  );
}
