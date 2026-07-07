import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Frosted glass card with ambient glow, cinematic shadow, and hover lift.
 * The foundation surface for the Cyber Editorial design system.
 */
export function GlassCard({ children, className, glow, hover = true, delay = 0, ...props }) {
  const glowMap = {
    violet: 'hover:glow-ring-violet',
    cyan: 'hover:glow-ring-cyan',
    emerald: 'hover:shadow-[0_0_0_1px_hsl(95_35%_45%/0.3),0_0_12px_-2px_hsl(95_35%_45%/0.2)]',
    amber: 'hover:shadow-[0_0_0_1px_hsl(36_72%_60%/0.3),0_0_12px_-2px_hsl(36_72%_60%/0.2)]',
    rose: 'hover:shadow-[0_0_0_1px_hsl(352_55%_58%/0.3),0_0_12px_-2px_hsl(352_55%_58%/0.2)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-card border border-border/70',
        'shadow-[var(--shadow-card)]',
        'backdrop-blur-xl',
        hover && 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]',
        hover && glow && glowMap[glow],
        className
      )}
      {...props}
    >
      {/* Subtle gradient sheen at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      {children}
    </motion.div>
  );
}

/**
 * GlassCard with header section
 */
export function GlassPanel({ title, caption, action, children, className, ...rest }) {
  return (
    <GlassCard className={className} {...rest}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            {caption && <p className="text-caption mb-1">{caption}</p>}
            {title && <h3 className="text-title">{title}</h3>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="px-5 pb-5">
        {children}
      </div>
    </GlassCard>
  );
}

export default GlassCard;
