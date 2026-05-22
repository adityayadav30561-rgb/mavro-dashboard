import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import EditorialSection from './EditorialSection';

const items = [
  {
    role: 'Operations Director',
    org:  'Manufacturing · 1,200+ employees',
    quote:'Mavro HRMS helped us centralize workforce operations and drastically reduce manual coordination.',
    initials: 'OD',
    accent: 'from-violet-500 to-indigo-600',
  },
  {
    role: 'HR Manager',
    org:  'Logistics · 450 employees',
    quote:'The automation workflows and attendance visibility improved our entire HR process.',
    initials: 'HM',
    accent: 'from-cyan-500 to-sky-600',
  },
  {
    role: 'Admin Lead',
    org:  'Enterprise Services · 280 employees',
    quote:'The platform feels modern, fast, and operationally focused instead of bloated.',
    initials: 'AL',
    accent: 'from-emerald-500 to-teal-600',
  },
];

export default function Testimonials() {
  return (
    <EditorialSection
      caption="Voices From the Field"
      title="Built For Teams That Move Fast"
      subtitle="Operators, HR leaders, and admin teams running real workforce operations on Mavro HRMS."
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
            <Quote size={26} className="text-violet-400/50 mb-4" />
            <blockquote className="text-[15px] text-foreground/90 leading-relaxed">
              "{t.quote}"
            </blockquote>
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
