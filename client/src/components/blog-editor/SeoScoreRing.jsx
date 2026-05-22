import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

function ringTone(score) {
  if (score >= 90) return 'hsl(160 70% 45%)';
  if (score >= 80) return 'hsl(192 85% 55%)';
  if (score >= 70) return 'hsl(38 85% 55%)';
  if (score >= 60) return 'hsl(28 85% 55%)';
  return 'hsl(347 75% 60%)';
}

/**
 * Animated SEO score ring. Single number + label + optional grade letter.
 * Used in the live writing cockpit for overall + sub-scores.
 */
export default function SeoScoreRing({
  score,
  label,
  size = 120,
  showGrade = false,
  grade,
  className,
}) {
  const safe = Math.max(0, Math.min(100, Math.round(score || 0)));
  const tone = ringTone(safe);

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)} style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="74%" outerRadius="100%" data={[{ value: safe }]} startAngle={210} endAngle={-30}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={20}
              fill={tone}
              background={{ fill: 'hsl(var(--muted) / 0.25)' }}
              isAnimationActive
              animationDuration={550}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.span
            key={safe}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="text-2xl font-bold font-mono tracking-tight leading-none"
            style={{ color: tone }}
          >
            {safe}
          </motion.span>
          {showGrade && grade && (
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: tone }}>
              {grade.letter}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground text-center">
          {label}
        </span>
      )}
    </div>
  );
}
