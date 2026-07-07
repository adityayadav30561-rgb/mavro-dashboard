import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const orbColors = {
  violet: {
    gradient: 'from-violet-500 to-purple-700',
    glow: 'shadow-[0_0_24px_-4px_hsl(14_73%_58%/0.5)]',
    ring: 'ring-violet-500/20',
    text: 'text-violet-300',
  },
  cyan: {
    gradient: 'from-cyan-400 to-blue-600',
    glow: 'shadow-[0_0_24px_-4px_hsl(188_45%_56%/0.5)]',
    ring: 'ring-cyan-500/20',
    text: 'text-cyan-300',
  },
  emerald: {
    gradient: 'from-emerald-400 to-green-700',
    glow: 'shadow-[0_0_24px_-4px_hsl(95_35%_45%/0.5)]',
    ring: 'ring-emerald-500/20',
    text: 'text-emerald-300',
  },
  amber: {
    gradient: 'from-amber-400 to-orange-600',
    glow: 'shadow-[0_0_24px_-4px_hsl(36_72%_60%/0.5)]',
    ring: 'ring-amber-500/20',
    text: 'text-amber-300',
  },
  rose: {
    gradient: 'from-rose-400 to-pink-700',
    glow: 'shadow-[0_0_24px_-4px_hsl(352_55%_58%/0.5)]',
    ring: 'ring-rose-500/20',
    text: 'text-rose-300',
  },
};

/**
 * MetricOrb — A radial metric display with ambient glow.
 * Replaces generic stat cards with a distinctive visual.
 */
export default function MetricOrb({
  value,
  label,
  sublabel,
  icon: Icon,
  color = 'violet',
  size = 'md',
  delay = 0,
}) {
  const c = orbColors[color] || orbColors.violet;
  const sizes = {
    sm: { orb: 'w-12 h-12', icon: 16, text: 'text-2xl' },
    md: { orb: 'w-14 h-14', icon: 20, text: 'text-3xl' },
    lg: { orb: 'w-16 h-16', icon: 22, text: 'text-4xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center gap-4 group"
    >
      {/* Orb */}
      <div className="relative">
        <div className={cn(
          s.orb,
          'rounded-2xl bg-gradient-to-br flex items-center justify-center ring-1',
          c.gradient, c.glow, c.ring,
          'group-hover:scale-110 transition-transform duration-500 ease-out'
        )}>
          {Icon && <Icon size={s.icon} className="text-white drop-shadow-lg" />}
        </div>
        {/* Pulse ring */}
        <div className={cn(
          'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-500',
          c.gradient
        )} style={{ filter: 'blur(8px)' }} />
      </div>

      {/* Text */}
      <div>
        <p className={cn(s.text, 'font-extrabold tracking-tight leading-none')}>
          {value ?? '—'}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sublabel && (
          <p className={cn('text-xs mt-0.5 font-medium', c.text)}>{sublabel}</p>
        )}
      </div>
    </motion.div>
  );
}
