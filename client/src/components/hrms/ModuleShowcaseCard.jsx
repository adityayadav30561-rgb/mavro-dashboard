import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const accents = {
  violet:  { ring: 'hover:shadow-[0_30px_60px_-25px_hsl(263_70%_50%/0.5)]', icon: 'text-violet-400',  halo: 'from-violet-500/25  to-violet-500/0' },
  cyan:    { ring: 'hover:shadow-[0_30px_60px_-25px_hsl(192_85%_45%/0.5)]', icon: 'text-cyan-400',    halo: 'from-cyan-500/25    to-cyan-500/0' },
  emerald: { ring: 'hover:shadow-[0_30px_60px_-25px_hsl(160_70%_40%/0.5)]', icon: 'text-emerald-400', halo: 'from-emerald-500/25 to-emerald-500/0' },
  amber:   { ring: 'hover:shadow-[0_30px_60px_-25px_hsl(38_85%_50%/0.5)]',  icon: 'text-amber-400',   halo: 'from-amber-500/25   to-amber-500/0' },
  rose:    { ring: 'hover:shadow-[0_30px_60px_-25px_hsl(347_75%_55%/0.5)]', icon: 'text-rose-400',    halo: 'from-rose-500/25    to-rose-500/0' },
  indigo:  { ring: 'hover:shadow-[0_30px_60px_-25px_hsl(245_75%_55%/0.5)]', icon: 'text-indigo-400',  halo: 'from-indigo-500/25  to-indigo-500/0' },
  sky:     { ring: 'hover:shadow-[0_30px_60px_-25px_hsl(205_85%_50%/0.5)]', icon: 'text-sky-400',     halo: 'from-sky-500/25     to-sky-500/0' },
  fuchsia: { ring: 'hover:shadow-[0_30px_60px_-25px_hsl(290_75%_55%/0.5)]', icon: 'text-fuchsia-400', halo: 'from-fuchsia-500/25 to-fuchsia-500/0' },
};

export default function ModuleShowcaseCard({
  icon: Icon,
  title,
  description,
  features,
  color = 'violet',
  delay = 0,
}) {
  const a = accents[color] || accents.violet;

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative rounded-2xl p-6 md:p-7 overflow-hidden',
        'bg-card/70 backdrop-blur-xl border border-border/70',
        'transition-all duration-500 flex flex-col',
        'hover:-translate-y-1 hover:border-border',
        a.ring
      )}
    >
      <div
        className={cn(
          'absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700',
          'bg-gradient-to-br',
          a.halo
        )}
      />

      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between mb-5">
          <div className={cn(
            'w-11 h-11 rounded-xl bg-foreground/[0.04] border border-border/70 flex items-center justify-center',
            'group-hover:scale-105 transition-transform duration-300'
          )}>
            <Icon size={20} className={a.icon} />
          </div>
          <ArrowUpRight
            size={16}
            className="text-muted-foreground/40 group-hover:text-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300"
          />
        </div>

        <h3 className="text-lg font-bold tracking-tight mb-2">{title}</h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{description}</p>

        {features && (
          <ul className="mt-5 pt-4 border-t border-border/60 space-y-1.5">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-[11.5px] text-muted-foreground/90">
                <span className={cn('w-1 h-1 rounded-full', a.icon.replace('text-', 'bg-'))} />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.article>
  );
}
