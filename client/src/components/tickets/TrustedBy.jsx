import { motion } from 'framer-motion';
import { Server, Truck, Factory, Stethoscope, Banknote, Wrench, Building2 } from 'lucide-react';

const tags = [
  { icon: Server,       label: 'Enterprise IT' },
  { icon: Truck,        label: 'Logistics' },
  { icon: Factory,      label: 'Manufacturing' },
  { icon: Stethoscope,  label: 'Healthcare' },
  { icon: Banknote,     label: 'Banking' },
  { icon: Wrench,       label: 'Service Operations' },
  { icon: Building2,    label: 'Corporate IT Teams' },
];

export default function TrustedBy() {
  return (
    <section className="relative py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground"
        >
          Operational Coverage
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-3 text-2xl md:text-3xl font-bold tracking-tight max-w-2xl mx-auto"
        >
          Built For High-Velocity Operational Teams
        </motion.h2>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
          {tags.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-xl border border-border/70 text-[12px] font-medium text-foreground/80 hover:text-foreground hover:border-border transition-all"
            >
              <t.icon size={13} className="text-cyan-400" />
              {t.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
