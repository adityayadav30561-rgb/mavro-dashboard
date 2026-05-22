import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertTriangle, Activity, Zap } from 'lucide-react';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

// ===================================
// Generate operational insights from real data
// ===================================
// Pure function — derives narrative observations from the analytics payload.
// No fake numbers. If a signal can't be computed, the insight is skipped.
export function generateInsights({ tenantComparison, contentPerformance, overview, engagement, funnel }) {
  const insights = [];

  // 1. Tenant conversion comparison
  const tenants = tenantComparison?.tenants || [];
  if (tenants.length >= 2) {
    const sorted = [...tenants].sort((a, b) => b.conversionRate - a.conversionRate);
    const winner = sorted[0];
    const loser = sorted[sorted.length - 1];
    if (winner.conversionRate > 0 && winner.conversionRate > loser.conversionRate) {
      const diff = winner.conversionRate - loser.conversionRate;
      const ratio = loser.conversionRate ? (winner.conversionRate / loser.conversionRate - 1) * 100 : null;
      insights.push({
        kind: 'positive',
        icon: TrendingUp,
        message: ratio
          ? `${winner.name} converts ${ratio.toFixed(0)}% higher than ${loser.name} (${winner.conversionRate}% vs ${loser.conversionRate}%)`
          : `${winner.name} leads conversion at ${winner.conversionRate}%`,
      });
    }
  }

  // 2. Dominant blog
  const blogs = contentPerformance || [];
  const totalBlogViews = blogs.reduce((s, b) => s + (b.views || 0), 0);
  if (totalBlogViews > 5 && blogs.length > 0) {
    const top = blogs.reduce((max, b) => (b.views > max.views ? b : max), blogs[0]);
    if (top.views > 0) {
      const share = Math.round((top.views / totalBlogViews) * 100);
      if (share >= 40) {
        insights.push({
          kind: 'positive',
          icon: Sparkles,
          message: `"${top.title}" drives ${share}% of blog traffic`,
        });
      }
    }
  }

  // 3. Stale content
  const stale = blogs.filter((b) => b.isStale);
  if (stale.length > 0) {
    insights.push({
      kind: 'warning',
      icon: AlertTriangle,
      message: `${stale.length} ${stale.length === 1 ? 'post is' : 'posts are'} stale (>180 days since update). Consider refreshing.`,
    });
  }

  // 4. Bounce signal
  if (engagement && engagement.sessions >= 5) {
    if (engagement.bouncePct >= 70) {
      insights.push({
        kind: 'warning',
        icon: AlertTriangle,
        message: `High bounce rate at ${engagement.bouncePct}% — top landing pages may need stronger hooks.`,
      });
    } else if (engagement.bouncePct <= 30 && engagement.bouncePct > 0) {
      insights.push({
        kind: 'positive',
        icon: TrendingUp,
        message: `Engagement is strong — ${engagement.bouncePct}% bounce rate.`,
      });
    }
  }

  // 5. Funnel drop-off
  const stages = funnel?.stages || [];
  if (stages.length === 3 && stages[0].sessions > 5) {
    const top = stages[0].sessions;
    const cta = stages[1].sessions;
    const submit = stages[2].sessions;
    const ctaPct = (cta / top) * 100;
    if (cta > 0 && submit / cta < 0.15) {
      insights.push({
        kind: 'warning',
        icon: Activity,
        message: `CTA clicks aren't converting — only ${((submit / cta) * 100).toFixed(0)}% of CTA users submit forms.`,
      });
    } else if (ctaPct < 5 && top > 20) {
      insights.push({
        kind: 'warning',
        icon: Activity,
        message: `Only ${ctaPct.toFixed(1)}% of visitors click any CTA. Reduce friction or test alternate hooks.`,
      });
    }
  }

  // 6. Visitor growth
  const visitors = overview?.metrics?.visitors;
  if (visitors && visitors.value >= 5 && visitors.delta >= 50) {
    insights.push({
      kind: 'positive',
      icon: TrendingUp,
      message: `Visitor count up ${visitors.delta}% vs previous window.`,
    });
  } else if (visitors && visitors.value >= 5 && visitors.delta <= -30) {
    insights.push({
      kind: 'warning',
      icon: AlertTriangle,
      message: `Visitor count dropped ${Math.abs(visitors.delta)}% vs previous window.`,
    });
  }

  // 7. Lead conversion
  const leads = overview?.metrics?.leads;
  if (leads && leads.value > 0 && leads.delta >= 100) {
    insights.push({
      kind: 'positive',
      icon: Zap,
      message: `Lead capture surged ${leads.delta}% — sustain momentum.`,
    });
  }

  return insights;
}

const kindClass = {
  positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  warning:  'text-amber-400 bg-amber-500/10 border-amber-500/30',
  critical: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

export default function OperationalInsights({ insights = [] }) {
  if (insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 p-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-violet-400" />
          <h3 className="text-title">Operational Insights</h3>
          <InfoPopover infoKey="operationalInsights" />
        </div>
        <p className="text-[12px] text-muted-foreground">
          Insights surface here once you accumulate enough events. Drive traffic, capture leads, and publish content to unlock narrative observations.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <Sparkles size={14} className="text-violet-400" />
        <h3 className="text-title">Operational Insights</h3>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">{insights.length}</span>
      </div>
      <ul className="divide-y divide-border/60">
        {insights.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="px-5 py-3 flex items-start gap-3"
            >
              <span className={cn('flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border', kindClass[it.kind])}>
                <Icon size={13} />
              </span>
              <p className="text-[12.5px] leading-snug">{it.message}</p>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
