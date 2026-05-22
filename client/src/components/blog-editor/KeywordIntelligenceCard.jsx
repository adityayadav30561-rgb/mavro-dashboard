import { motion } from 'framer-motion';
import {
  Brain, TrendingUp, TrendingDown, Sparkle, Activity,
  CheckCircle2, AlertTriangle, AlertCircle, Layers, MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const HEALTH_META = {
  balanced:        { label: 'Balanced',          tone: 'emerald', Icon: CheckCircle2 },
  'balanced-flat': { label: 'Balanced (rigid)',  tone: 'cyan',    Icon: CheckCircle2 },
  'balanced-spread':{label: 'Balanced (skewed)', tone: 'cyan',    Icon: AlertTriangle },
  under:           { label: 'Under-optimized',   tone: 'amber',   Icon: TrendingDown },
  aggressive:      { label: 'Aggressive',        tone: 'orange',  Icon: TrendingUp },
  stuffing:        { label: 'Stuffing risk',     tone: 'rose',    Icon: AlertCircle },
  unknown:         { label: 'Insufficient data', tone: 'muted',   Icon: AlertTriangle },
};

const TONE_CLASSES = {
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  cyan:    'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  amber:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
  orange:  'text-orange-300 bg-orange-500/10 border-orange-500/30',
  rose:    'text-rose-300 bg-rose-500/10 border-rose-500/30',
  violet:  'text-violet-300 bg-violet-500/10 border-violet-500/30',
  muted:   'text-foreground/70 bg-foreground/[0.04] border-border/60',
};

export default function KeywordIntelligenceCard({ intel }) {
  if (!intel || intel.totalTokens === 0) {
    return <Empty />;
  }

  const { primary, secondary, variations, coverage, distribution, optimization, health, totalTokens, confidence } = intel;
  const healthMeta = HEALTH_META[health?.state] || HEALTH_META.unknown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border/60">
        <Brain size={13} className="text-violet-400" />
        <h3 className="text-[12px] font-bold tracking-tight">Keyword Intelligence</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
          {totalTokens} tokens
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Health banner */}
        <div className={cn('rounded-lg px-3 py-2 flex items-start gap-2 text-[11px] border', TONE_CLASSES[healthMeta.tone])}>
          <healthMeta.Icon size={12} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{healthMeta.label}</p>
            <p className="mt-0.5 text-[11px] opacity-90">{health?.message}</p>
          </div>
        </div>

        {/* Primary topic */}
        {primary && (
          <Section icon={Sparkle} label={primary.source === 'focus' ? 'Operator focus' : 'Detected primary'}>
            <div className="rounded-lg bg-foreground/[0.04] border border-border/60 p-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12.5px] font-semibold text-violet-300 truncate flex-1">
                  {primary.term}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                  {primary.count}× · {primary.density}%
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-foreground/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, primary.confidence || 0)}%` }}
                    transition={{ duration: 0.4 }}
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                  />
                </div>
                <span className="text-[9.5px] font-mono text-muted-foreground tabular-nums">
                  {primary.confidence || 0}% conf
                </span>
              </div>
            </div>
          </Section>
        )}

        {/* Optimization band */}
        {optimization && (
          <Section icon={Activity} label="Density band">
            <div className="flex items-center gap-2 text-[11px]">
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.14em] border', stateTone(optimization.state))}>
                {optimization.state}
              </span>
              <span className="font-mono text-muted-foreground">target {optimization.band}</span>
              <span className="ml-auto font-mono font-bold tabular-nums">{(optimization.densityValue || 0).toFixed(2)}%</span>
            </div>
            <p className="mt-1.5 text-[10.5px] text-muted-foreground leading-snug">{optimization.message}</p>
          </Section>
        )}

        {/* Distribution */}
        {distribution && primary && (
          <Section icon={MapPin} label="Distribution">
            <div className="grid grid-cols-2 gap-1.5">
              <DistChip label="Title"     on={distribution.title} />
              <DistChip label="SEO title" on={distribution.seoTitle} />
              <DistChip label="Meta desc" on={distribution.seoDescription} />
              <DistChip label="Slug"      on={distribution.slug} />
              <DistChip label="Intro"     on={distribution.sections.intro} />
              <DistChip label="Middle"    on={distribution.sections.middle} />
              <DistChip label="End"       on={distribution.sections.conclusion} />
              <DistChip label={`H1·H2·H3 ${distribution.headings.h1}·${distribution.headings.h2}·${distribution.headings.h3}`} on={distribution.headings.total > 0} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-foreground/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${distribution.spreadScore}%` }}
                  transition={{ duration: 0.4 }}
                  className={cn('h-full', distribution.spreadScore >= 70 ? 'bg-emerald-500' : distribution.spreadScore >= 40 ? 'bg-cyan-500' : 'bg-amber-500')}
                />
              </div>
              <span className="text-[9.5px] font-mono text-muted-foreground tabular-nums">{distribution.spreadScore}% spread</span>
            </div>
          </Section>
        )}

        {/* Semantic variations, supporting terms, and semantic coverage
            sections removed pending AI/LLM-backed semantic engine. The
            heuristic n-gram surfaces produced noisy results; we'll reinsert
            these with real semantic models later. Underlying data still
            flows through `intel` so wiring the panels back is a UI-only
            change when the LLM layer lands. */}
      </div>
    </motion.div>
  );
}

// ===================================
// Sub-components
// ===================================
function Empty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border/60">
        <Brain size={13} className="text-violet-400" />
        <h3 className="text-[12px] font-bold tracking-tight">Keyword Intelligence</h3>
      </div>
      <p className="p-4 text-[11.5px] text-muted-foreground">
        Start writing — keyword intelligence activates once you reach a meaningful body of content.
      </p>
    </motion.div>
  );
}

function Section({ icon: Icon, label, hint, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon size={10} className="text-violet-400" />}
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      {hint && <p className="mb-1.5 text-[10px] text-muted-foreground/85 leading-snug">{hint}</p>}
      {children}
    </div>
  );
}

function ChipRow({ items, tone, showConfidence }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <li key={it.term} className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10.5px] border', TONE_CLASSES[tone])}>
          <span className="font-medium">{it.term}</span>
          {typeof it.count === 'number' && <span className="font-mono text-[9.5px] opacity-80">{it.count}×</span>}
          {showConfidence && typeof it.confidence === 'number' && (
            <span className="font-mono text-[9.5px] opacity-70">{it.confidence}%</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function DistChip({ label, on }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border',
      on ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
         : 'text-muted-foreground bg-foreground/[0.04] border-border/60',
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', on ? 'bg-emerald-400' : 'bg-muted-foreground/40')} />
      <span className="truncate">{label}</span>
    </span>
  );
}

function stateTone(state) {
  switch (state) {
    case 'balanced':    return TONE_CLASSES.emerald;
    case 'under':       return TONE_CLASSES.amber;
    case 'aggressive':  return TONE_CLASSES.orange;
    case 'stuffing':    return TONE_CLASSES.rose;
    default:            return TONE_CLASSES.muted;
  }
}
