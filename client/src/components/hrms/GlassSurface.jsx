import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Reusable glass panel for the HRMS marketing site.
 * Floats above ambient layer with sheen, soft shadow, hover lift.
 */
export default function GlassSurface({
  children,
  className,
  hover = false,
  glow,
  delay = 0,
  as: Tag = motion.div,
  ...rest
}) {
  const glowMap = {
    violet: 'shadow-[0_30px_80px_-30px_hsl(263_70%_50%/0.45)]',
    cyan: 'shadow-[0_30px_80px_-30px_hsl(192_80%_45%/0.4)]',
    emerald: 'shadow-[0_30px_80px_-30px_hsl(160_70%_40%/0.4)]',
    amber: 'shadow-[0_30px_80px_-30px_hsl(38_80%_50%/0.4)]',
    rose: 'shadow-[0_30px_80px_-30px_hsl(347_75%_55%/0.4)]',
  };

  return (
    <Tag
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-card/70 backdrop-blur-2xl border border-border/70',
        'shadow-[var(--shadow-card)]',
        hover &&
          'transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] hover:border-border',
        glow && glowMap[glow],
        className
      )}
      {...rest}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
      {children}
    </Tag>
  );
}
