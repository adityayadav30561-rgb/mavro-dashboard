import { motion } from 'framer-motion';
import { Eye, Layers, Zap, Sparkles, Lock } from 'lucide-react';
import EditorialSection from './EditorialSection';

const reasons = [
  { icon: Eye,      title: 'Operational Clarity',   body: 'Centralized visibility across workforce operations.',            color: 'text-violet-400' },
  { icon: Layers,   title: 'Enterprise Flexibility',body: 'Built for growing organizations with scalable architecture.',    color: 'text-cyan-400' },
  { icon: Zap,      title: 'Faster Decisions',      body: 'Real-time reporting and actionable workforce insights.',         color: 'text-amber-400' },
  { icon: Sparkles, title: 'Modern Experience',     body: 'Designed for usability, speed, and operational productivity.',   color: 'text-rose-400' },
  { icon: Lock,     title: 'Secure Architecture',   body: 'Enterprise-grade role management and protected workforce data.', color: 'text-emerald-400' },
];

export default function WhyMavro() {
  return (
    <EditorialSection
      id="why"
      caption="Why Mavro"
      title="Why Teams Choose Mavro HRMS"
      subtitle="Five operational pillars that define the platform — and the difference between fragmented HR tooling and a real workforce command center."
    >
      <div className="grid lg:grid-cols-3 gap-5">
        {reasons.map((r, i) => (
          <motion.article
            key={r.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: i * 0.07 }}
            className={`group relative p-7 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 overflow-hidden hover:-translate-y-1 hover:border-border transition-all ${i === 0 ? 'lg:col-span-2 lg:row-span-1' : ''}`}
          >
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle, hsl(263 70% 60% / 0.25), transparent 70%)' }}
            />
            <div className="relative">
              <r.icon size={22} className={r.color} />
              <h3 className="mt-5 text-lg font-bold tracking-tight">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </EditorialSection>
  );
}
