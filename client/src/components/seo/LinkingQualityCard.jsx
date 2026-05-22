import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ShieldCheck, GitBranch, Layers, Hash, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import InfoPopover from '@/components/analytics/InfoPopover';
import { getSeoInfo } from '@/lib/seoCopy';

/**
 * Internal Linking Quality — corpus-level scorecard.
 *
 * 5 sub-signals (each 0–100), equally weighted into final 0–100:
 *   1. Avg outbound links per article (target ≥3)
 *   2. Non-orphan rate
 *   3. Anchor diversity
 *   4. Cluster cohesion (% edges that stay inside a topical cluster)
 *   5. Inbound coverage (% blogs with ≥1 inbound link)
 *
 * All derived from real graph signals. No fake numbers.
 */
const SIGNAL_META = [
  { key: 'sig1', label: 'Outbound density', icon: GitBranch, valueKey: 'avgOutbound', format: (v) => `${v}/post`,                       infoKey: 'linking_outbound' },
  { key: 'sig2', label: 'Non-orphan rate',  icon: ShieldCheck, valueKey: 'orphanRate', format: (v) => `${Math.round((1 - v) * 100)}%`, infoKey: 'linking_non_orphan' },
  { key: 'sig3', label: 'Anchor diversity', icon: Hash,        valueKey: 'anchorDiversity', format: (v) => `${Math.round(v * 100)}%`,  infoKey: 'linking_anchor_diversity' },
  { key: 'sig4', label: 'Cluster cohesion', icon: Layers,      valueKey: 'clusterCohesion', format: (v) => `${Math.round(v * 100)}%`,  infoKey: 'linking_cohesion' },
  { key: 'sig5', label: 'Inbound coverage', icon: Repeat,      valueKey: 'coverage',        format: (v) => `${Math.round(v * 100)}%`,  infoKey: 'linking_coverage' },
];

export default function LinkingQualityCard({ quality }) {
  if (!quality) return null;

  const tone = ringTone(quality.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <ShieldCheck size={14} className="text-violet-400" />
        <h3 className="text-sm font-bold tracking-tight">Internal Linking Quality</h3>
        {(() => {
          const i = getSeoInfo('linking_score', { score: quality.score });
          return i && <InfoPopover title={i.title} text={i.text} size={11} />;
        })()}
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
          {quality.details.totalEdges} edges · {quality.details.clusters} clusters
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
        {/* Score ring */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-[160px] h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="74%" outerRadius="100%" data={[{ value: quality.score }]} startAngle={210} endAngle={-30}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} fill={tone} background={{ fill: 'hsl(var(--muted) / 0.25)' }} isAnimationActive animationDuration={650} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.span
                key={quality.score}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-bold font-mono tracking-tight leading-none"
                style={{ color: tone }}
              >
                {quality.score}
              </motion.span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: tone }}>
                Grade {quality.letter}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Linking Score
          </p>
        </div>

        {/* Sub-signals */}
        <div className="space-y-2">
          {SIGNAL_META.map((m) => {
            const score = quality.subScores[m.key];
            const rawValue = quality.signals[m.valueKey];
            return (
              <SignalBar
                key={m.key}
                Icon={m.icon}
                label={m.label}
                score={score}
                rawValue={m.format(rawValue)}
                infoKey={m.infoKey}
              />
            );
          })}
        </div>
      </div>

      {/* Footer details */}
      <div className="px-5 py-3 border-t border-border/60 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-mono text-muted-foreground tabular-nums">
        <span>{quality.details.totalNodes} nodes</span>
        <span>{quality.details.orphans} orphans</span>
        <span>{quality.details.hubs} hubs</span>
        <span>{quality.details.clusters} clusters</span>
        <span className="ml-auto">All signals derived from live tenant link graph.</span>
      </div>
    </motion.div>
  );
}

function SignalBar({ Icon, label, score, rawValue, infoKey }) {
  const info = infoKey ? getSeoInfo(infoKey) : null;
  const tone = score >= 80 ? 'emerald' : score >= 60 ? 'cyan' : score >= 40 ? 'amber' : 'rose';
  const fillClass = {
    emerald: 'from-emerald-500/60 to-emerald-400',
    cyan:    'from-cyan-500/60 to-cyan-400',
    amber:   'from-amber-500/60 to-amber-400',
    rose:    'from-rose-500/60 to-rose-400',
  }[tone];
  const textTone = {
    emerald: 'text-emerald-400',
    cyan:    'text-cyan-400',
    amber:   'text-amber-400',
    rose:    'text-rose-400',
  }[tone];

  return (
    <div className="rounded-lg border border-border/60 bg-foreground/[0.025] px-3 py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={11} className={textTone} />
        <p className="text-[11px] font-semibold flex items-center gap-1 flex-1 min-w-0">
          <span className="truncate">{label}</span>
          {info && <InfoPopover title={info.title} text={info.text} size={10} />}
        </p>
        <span className={cn('text-[11px] font-mono font-bold tabular-nums', textTone)}>{score}</span>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{rawValue}</span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full bg-gradient-to-r', fillClass)}
        />
      </div>
    </div>
  );
}

function ringTone(score) {
  if (score >= 90) return 'hsl(160 70% 45%)';
  if (score >= 80) return 'hsl(192 85% 55%)';
  if (score >= 70) return 'hsl(38 85% 55%)';
  if (score >= 60) return 'hsl(28 85% 55%)';
  return                'hsl(347 75% 60%)';
}
