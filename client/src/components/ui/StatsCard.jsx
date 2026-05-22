import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const colorMap = {
  violet: { bg: 'bg-violet-500/10 dark:bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-500 to-indigo-600' },
  emerald: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-600' },
  amber: { bg: 'bg-amber-500/10 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500 to-orange-600' },
  sky: { bg: 'bg-sky-500/10 dark:bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400', gradient: 'from-sky-500 to-cyan-600' },
  rose: { bg: 'bg-rose-500/10 dark:bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', gradient: 'from-rose-500 to-pink-600' },
};

/**
 * Premium stat card with glassmorphism accent, trend indicator, and hover animation.
 */
export default function StatCard({ title, value, subtitle, trend, icon: Icon, color = 'violet', delay = 0 }) {
  const colors = colorMap[color] || colorMap.violet;

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-rose-500' : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
        {/* Glassmorphism accent blob */}
        <div className={cn(
          'absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500',
          colors.bg
        )} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{value ?? '—'}</p>
              {subtitle && (
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  {trend !== undefined && <TrendIcon size={12} className={trendColor} />}
                  {subtitle}
                </p>
              )}
            </div>
            <div className={cn(
              'flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300',
              colors.gradient
            )}>
              {Icon && <Icon size={20} className="text-white" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
