import { motion } from 'framer-motion';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { ShieldCheck, BadgeCheck, AlertCircle, FileText } from 'lucide-react';
import { auditCorpus } from '@/lib/seoHealth';
import { useMemo } from 'react';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

function ringTone(score) {
  if (score >= 90) return 'hsl(95 35% 45%)';
  if (score >= 80) return 'hsl(188 45% 55%)';
  if (score >= 70) return 'hsl(36 72% 55%)';
  if (score >= 60) return 'hsl(28 85% 55%)';
  return 'hsl(352 55% 60%)';
}

/**
 * SEO performance telemetry — runs the canonical SEO engine over the supplied
 * blog corpus and surfaces operational signals (overall score, coverage,
 * critical issue count).
 */
export default function SeoTelemetry({ contentPerformance, blogsWithContent }) {
  // Prefer corpus with content if provided (audit needs HTML); otherwise we
  // surface lighter telemetry from contentPerformance metadata alone.
  const audit = useMemo(() => {
    if (blogsWithContent?.length) return auditCorpus(blogsWithContent);
    return null;
  }, [blogsWithContent]);

  const fallbackCoverage = useMemo(() => {
    if (audit) return null;
    const blogs = contentPerformance || [];
    return {
      posts: blogs.length,
      avgWordCount: 0,
      critical: 0,
      warnings: 0,
    };
  }, [audit, contentPerformance]);

  const overall = audit?.totals?.overall ?? 0;
  const tone = ringTone(overall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <ShieldCheck size={14} className="text-emerald-400" />
        <h3 className="text-title">SEO Telemetry</h3>
        <InfoPopover infoKey="seoTelemetry" />
        <span className="ml-auto text-[10px] text-muted-foreground">cross-corpus rollup</span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 p-5">
        {/* Gauge */}
        <div className="relative min-h-[180px] flex flex-col items-center justify-center">
          {audit ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart innerRadius="76%" outerRadius="100%" data={[{ value: overall }]} startAngle={210} endAngle={-30}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={20} fill={tone} background={{ fill: 'hsl(var(--muted) / 0.25)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold font-mono leading-none" style={{ color: tone }}>{overall}</span>
                <span className="mt-1 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">SEO Score</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
              <FileText size={20} className="mb-2 text-muted-foreground/40" />
              <p className="text-[11px]">Open /seo to compute full audit</p>
            </div>
          )}
        </div>

        {/* Coverage stats */}
        <div className="sm:col-span-2 grid grid-cols-2 gap-3">
          <Tile icon={FileText}   label="Audited posts"  value={audit?.totals?.posts ?? fallbackCoverage?.posts ?? 0} />
          <Tile icon={BadgeCheck} label="Published"      value={audit?.totals?.published ?? 0} tone="text-emerald-400" />
          <Tile icon={AlertCircle} label="Critical issues" value={audit?.totals?.critical ?? 0} tone={(audit?.totals?.critical || 0) > 0 ? 'text-rose-400' : 'text-muted-foreground'} />
          <Tile icon={AlertCircle} label="Warnings"      value={audit?.totals?.warnings ?? 0} tone={(audit?.totals?.warnings || 0) > 0 ? 'text-amber-400' : 'text-muted-foreground'} />
          {audit && (
            <>
              <Tile label="Avg word count" value={audit.totals.avgWordCount} />
              <Tile label="Avg readability" value={audit.totals.avgReadability} tone="text-cyan-400" />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Tile({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-xl bg-foreground/[0.03] border border-border/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={11} className="text-muted-foreground" />}
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      </div>
      <p className={cn('text-lg font-bold font-mono mt-0.5 tabular-nums', tone || 'text-foreground')}>{value}</p>
    </div>
  );
}
