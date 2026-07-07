import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  ShieldAlert,
  Link2,
  LayoutGrid,
  Telescope,
  ClipboardList,
  Compass,
  Activity,
  X,
} from 'lucide-react';
import { useAiSiteIntelligence } from '@/hooks/useAiSiteIntelligence';
import { cn } from '@/lib/utils';

/**
 * AiSiteIntelligencePanel — site-wide AI SEO command surface for the /seo
 * page. Calls one backend endpoint that combines a DETERMINISTIC corpus
 * summary with AI-interpreted strategic insights. Cards render both layers
 * side-by-side so the operator can trust the numbers and act on the
 * narrative.
 *
 * Tenant context is supplied by the parent (SeoEngine.jsx). When tenant is
 * "all", the panel renders a prompt to pick a single tenant — site-wide
 * strategy is meaningless across mixed-tenant corpora.
 */

const LOADING_PHRASES = [
  'Indexing the full content corpus…',
  'Analyzing topical clusters…',
  'Detecting semantic gaps…',
  'Scoring publishing cadence…',
  'Interpreting decay + linking signals…',
  'Drafting strategic recommendations…',
];

function LoadingShimmer() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % LOADING_PHRASES.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="px-6 py-16 flex flex-col items-center gap-4">
      <div className="relative">
        <Loader2 size={32} className="animate-spin text-violet-400" />
        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl -z-10 animate-pulse" />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-sm text-muted-foreground"
        >
          {LOADING_PHRASES[idx]}
        </motion.p>
      </AnimatePresence>
      <div className="w-60 h-1 rounded-full bg-foreground/[0.06] overflow-hidden mt-1">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, accent = 'violet', children, span = 'col-span-12 md:col-span-6' }) {
  const accentMap = {
    violet: 'border-violet-500/30 from-violet-500/10 to-violet-500/0 text-violet-300',
    fuchsia: 'border-fuchsia-500/30 from-fuchsia-500/10 to-fuchsia-500/0 text-fuchsia-300',
    cyan: 'border-cyan-500/30 from-cyan-500/10 to-cyan-500/0 text-cyan-300',
    emerald: 'border-emerald-500/30 from-emerald-500/10 to-emerald-500/0 text-emerald-300',
    amber: 'border-amber-500/30 from-amber-500/10 to-amber-500/0 text-amber-300',
    rose: 'border-rose-500/30 from-rose-500/10 to-rose-500/0 text-rose-300',
    sky: 'border-sky-500/30 from-sky-500/10 to-sky-500/0 text-sky-300',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl overflow-hidden', span)}
    >
      <div className={cn('px-4 py-2.5 flex items-center gap-2 border-b border-border/60 bg-gradient-to-r', accentMap[accent])}>
        <Icon size={14} />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em]">{title}</h3>
      </div>
      <div className="p-4 text-[13px] leading-relaxed">{children}</div>
    </motion.div>
  );
}

function Stat({ label, value, tone = 'default' }) {
  const toneMap = {
    default: 'text-foreground',
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    bad: 'text-rose-400',
  };
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <span className={cn('text-base font-mono font-bold tabular-nums', toneMap[tone])}>{value}</span>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    high: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    medium: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    low: 'border-muted-foreground/40 bg-foreground/[0.05] text-muted-foreground',
  };
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-[0.14em]', map[priority] || map.medium)}>
      {priority || 'medium'}
    </span>
  );
}

function StrengthBadge({ strength }) {
  const map = {
    strong: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    moderate: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    weak: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  };
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-[0.14em]', map[strength] || map.moderate)}>
      {strength || 'moderate'}
    </span>
  );
}

function IntentBar({ label, value, tone }) {
  const toneMap = {
    violet: 'from-violet-500 to-fuchsia-400',
    cyan: 'from-cyan-500 to-sky-400',
    emerald: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
  };
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="capitalize text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full bg-gradient-to-r', toneMap[tone] || toneMap.violet)}
        />
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} props.targetWebsite                  - ObjectId, required (single-tenant only)
 * @param {string} [props.tenantSlug]
 * @param {string} [props.tenantName]
 * @param {object} [props.deterministic]                - optional signals to pass through
 *                                                        (avgSeoScore, linkGraph, decay)
 */
export default function AiSiteIntelligencePanel({
  targetWebsite,
  tenantSlug,
  tenantName,
  deterministic,
}) {
  const { loading, error, activeSet, generate, clear } = useAiSiteIntelligence();
  const noTenant = !targetWebsite && !tenantSlug;

  const handleGenerate = () =>
    generate({ targetWebsite, tenantSlug, deterministic }, { force: false });
  const handleRegenerate = () =>
    generate({ targetWebsite, tenantSlug, deterministic }, { force: true });

  const summary = activeSet?.summary;
  const insights = activeSet?.insights;

  return (
    <section className="relative">
      {/* Section header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <Brain size={18} className="text-violet-300" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400/80">AI Command</p>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Site Intelligence</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Site-wide topical authority, semantic gaps, content opportunities, audit, intent coverage,
              and strategic publishing — generated against the {tenantName || tenantSlug || 'selected tenant'} corpus.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeSet && (
            <button
              type="button"
              onClick={clear}
              className="p-2 rounded-lg border border-border/70 bg-card/60 hover:bg-foreground/[0.04] text-muted-foreground hover:text-foreground transition-colors"
              title="Clear"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={activeSet ? handleRegenerate : handleGenerate}
            disabled={loading || noTenant}
            className={cn(
              'group inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-semibold uppercase tracking-[0.14em] transition-all',
              noTenant
                ? 'border-border/50 text-muted-foreground/50 cursor-not-allowed'
                : 'border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 text-violet-200 hover:from-violet-500/25 hover:to-fuchsia-500/25 hover:border-violet-500/60 hover:shadow-[0_0_22px_-4px_hsl(14_73%_58%/0.55)]',
              loading && 'cursor-wait opacity-80'
            )}
            title={noTenant ? 'Pick a single tenant to run site intelligence' : 'Generate AI site intelligence'}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : activeSet ? (
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            ) : (
              <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
            )}
            {activeSet ? 'Regenerate Intelligence' : 'Generate AI Intelligence'}
          </button>
        </div>
      </div>

      {/* Body */}
      {noTenant && (
        <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl p-8 text-center">
          <Compass size={20} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Pick a single tenant in the SEO Engine selector to enable site-wide intelligence.
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            Cross-tenant strategy mixes audiences and degrades insight quality.
          </p>
        </div>
      )}

      {!noTenant && loading && (
        <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl">
          <LoadingShimmer />
        </div>
      )}

      {!noTenant && !loading && error && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/[0.05] backdrop-blur-xl p-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Site intelligence failed</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
            <button
              type="button"
              onClick={handleRegenerate}
              className="mt-2 inline-flex items-center gap-1 text-violet-300 hover:text-violet-200 text-[11px] font-semibold"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        </div>
      )}

      {!noTenant && !loading && !error && !activeSet && (
        <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl p-8 text-center">
          <Sparkles size={20} className="text-violet-400 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Run AI Intelligence to surface topical authority, content opportunities, and a strategic
            audit for <span className="text-violet-300 font-semibold">{tenantName || tenantSlug || 'this tenant'}</span>.
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            AI interprets the deterministic SEO engine — it never replaces it.
          </p>
        </div>
      )}

      {!noTenant && !loading && !error && activeSet && insights && summary && (
        <div className="space-y-4">
          {/* Executive summary + corpus stats */}
          <div className="grid grid-cols-12 gap-4">
            <SectionCard icon={Telescope} title="Executive Summary" accent="violet" span="col-span-12 md:col-span-8">
              <p className="text-sm leading-relaxed text-foreground/90">
                {insights.executiveSummary || '—'}
              </p>
            </SectionCard>
            <SectionCard icon={Activity} title="Corpus Signals" accent="cyan" span="col-span-12 md:col-span-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Total" value={summary.totalBlogs} />
                <Stat label="Published" value={summary.publishedCount} />
                <Stat label="Avg WC" value={summary.avgWordCount} tone={summary.avgWordCount >= 700 ? 'good' : summary.avgWordCount >= 300 ? 'warn' : 'bad'} />
                <Stat label="Thin (<300)" value={summary.thinCount} tone={summary.thinCount > 0 ? 'warn' : 'good'} />
                <Stat label="Stale >180d" value={summary.staleCount} tone={summary.staleCount > 0 ? 'warn' : 'good'} />
                <Stat label="Per Week" value={summary.publishesPerWeek} />
                <Stat label="FAQs" value={summary.blogsWithFaqs} />
                <Stat label="Recent <30d" value={summary.recentCount} />
              </div>
            </SectionCard>
          </div>

          {/* Topical authority */}
          {(insights.topicalAuthority?.strong?.length > 0 || insights.topicalAuthority?.weak?.length > 0) && (
            <div className="grid grid-cols-12 gap-4">
              <SectionCard icon={TrendingUp} title="Strong Topical Authority" accent="emerald">
                <ul className="space-y-2.5">
                  {(insights.topicalAuthority?.strong || []).map((it, i) => (
                    <li key={i} className="border-l-2 border-emerald-500/40 pl-3">
                      <p className="text-sm font-semibold">{it.theme}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{it.rationale}</p>
                      {it.supportingBlogs?.length > 0 && (
                        <p className="text-[10px] text-emerald-400/80 mt-1 truncate">
                          {it.supportingBlogs.slice(0, 3).join(' · ')}
                        </p>
                      )}
                    </li>
                  ))}
                  {(insights.topicalAuthority?.strong || []).length === 0 && (
                    <li className="text-xs text-muted-foreground/70">No themes scored as strong yet — corpus too thin.</li>
                  )}
                </ul>
              </SectionCard>
              <SectionCard icon={TrendingDown} title="Weak / Missing Areas" accent="rose">
                <ul className="space-y-2.5">
                  {(insights.topicalAuthority?.weak || []).map((it, i) => (
                    <li key={i} className="border-l-2 border-rose-500/40 pl-3">
                      <p className="text-sm font-semibold">{it.theme}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{it.rationale}</p>
                      {it.supportingBlogs?.length > 0 && (
                        <p className="text-[10px] text-rose-400/80 mt-1 truncate">
                          {it.supportingBlogs.slice(0, 3).join(' · ')}
                        </p>
                      )}
                    </li>
                  ))}
                  {(insights.topicalAuthority?.weak || []).length === 0 && (
                    <li className="text-xs text-muted-foreground/70">No weak areas detected.</li>
                  )}
                </ul>
              </SectionCard>
            </div>
          )}

          {/* Semantic gaps + content opportunities */}
          <div className="grid grid-cols-12 gap-4">
            <SectionCard icon={LayoutGrid} title="Semantic Gaps" accent="amber" span="col-span-12 md:col-span-5">
              <ul className="space-y-2.5">
                {(insights.semanticGaps || []).map((g, i) => (
                  <li key={i} className="border-l-2 border-amber-500/40 pl-3">
                    <p className="text-sm font-semibold">{g.cluster}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{g.rationale}</p>
                    {g.missingSubtopics?.length > 0 && (
                      <p className="text-[11px] text-amber-300/90 mt-1">
                        Missing: {g.missingSubtopics.slice(0, 6).join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
                {(insights.semanticGaps || []).length === 0 && (
                  <li className="text-xs text-muted-foreground/70">No gaps detected.</li>
                )}
              </ul>
            </SectionCard>
            <SectionCard icon={Lightbulb} title="Content Opportunities" accent="violet" span="col-span-12 md:col-span-7">
              <ul className="space-y-2.5">
                {(insights.contentOpportunities || []).map((op, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <PriorityBadge priority={op.priority} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">{op.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        <span className="uppercase tracking-[0.14em] text-violet-400/80">{op.cluster || '—'}</span>
                        <span className="mx-1.5 text-muted-foreground/50">·</span>
                        <span className="capitalize">{op.intent || 'informational'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{op.rationale}</p>
                    </div>
                  </li>
                ))}
                {(insights.contentOpportunities || []).length === 0 && (
                  <li className="text-xs text-muted-foreground/70">No opportunity slots identified.</li>
                )}
              </ul>
            </SectionCard>
          </div>

          {/* Strategic audit SWOT */}
          {insights.audit && (
            <div className="grid grid-cols-12 gap-4">
              <SectionCard icon={ShieldAlert} title="Strategic Audit" accent="cyan" span="col-span-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'strengths', label: 'Strengths', tone: 'text-emerald-400', border: 'border-emerald-500/30', bullet: 'bg-emerald-400' },
                    { key: 'opportunities', label: 'Opportunities', tone: 'text-violet-400', border: 'border-violet-500/30', bullet: 'bg-violet-400' },
                    { key: 'weaknesses', label: 'Weaknesses', tone: 'text-amber-400', border: 'border-amber-500/30', bullet: 'bg-amber-400' },
                    { key: 'risks', label: 'Risks', tone: 'text-rose-400', border: 'border-rose-500/30', bullet: 'bg-rose-400' },
                  ].map((q) => (
                    <div key={q.key} className={cn('rounded-lg border p-3', q.border)}>
                      <p className={cn('text-[10px] font-semibold uppercase tracking-[0.18em] mb-2', q.tone)}>{q.label}</p>
                      <ul className="space-y-1.5">
                        {((insights.audit && insights.audit[q.key]) || []).map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5', q.bullet)} />
                            <span className="text-xs leading-snug">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* Linking + intent coverage */}
          <div className="grid grid-cols-12 gap-4">
            <SectionCard icon={Link2} title="Linking Intelligence" accent="sky" span="col-span-12 md:col-span-7">
              <p className="text-sm leading-relaxed text-foreground/90 mb-3">
                {insights.linkingIntelligence?.narrative || '—'}
              </p>
              <ul className="space-y-1.5">
                {(insights.linkingIntelligence?.actions || []).map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0 mt-1.5" />
                    <span className="text-xs">
                      <span className="font-semibold">{a.action}</span>
                      {a.rationale && <span className="text-muted-foreground"> — {a.rationale}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard icon={Target} title="Search Intent Coverage" accent="emerald" span="col-span-12 md:col-span-5">
              <div className="space-y-2.5">
                <IntentBar label="Informational" value={insights.searchIntentCoverage?.informational ?? 0} tone="violet" />
                <IntentBar label="Commercial" value={insights.searchIntentCoverage?.commercial ?? 0} tone="emerald" />
                <IntentBar label="Comparative" value={insights.searchIntentCoverage?.comparative ?? 0} tone="amber" />
                <IntentBar label="Educational" value={insights.searchIntentCoverage?.educational ?? 0} tone="cyan" />
              </div>
              {(insights.searchIntentCoverage?.imbalances || []).length > 0 && (
                <ul className="mt-3 pt-3 border-t border-border/60 space-y-1">
                  {insights.searchIntentCoverage.imbalances.map((im, i) => (
                    <li key={i} className="text-[11px] text-amber-300/90">
                      ⚠ {im.observation}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* Cluster strength + decay narrative */}
          <div className="grid grid-cols-12 gap-4">
            <SectionCard icon={LayoutGrid} title="Cluster Strength" accent="fuchsia" span="col-span-12 md:col-span-6">
              <ul className="space-y-2.5">
                {(insights.clusterStrength || []).map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <StrengthBadge strength={c.strength} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">{c.cluster}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {c.members} member{c.members === 1 ? '' : 's'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{c.rationale}</p>
                    </div>
                  </li>
                ))}
                {(insights.clusterStrength || []).length === 0 && (
                  <li className="text-xs text-muted-foreground/70">No clusters detected.</li>
                )}
              </ul>
            </SectionCard>
            <SectionCard icon={Activity} title="Decay Interpretation" accent="amber" span="col-span-12 md:col-span-6">
              <ul className="space-y-2.5">
                {(insights.decayInterpretation || []).map((d, i) => (
                  <li key={i} className="border-l-2 border-amber-500/40 pl-3">
                    <p className="text-sm font-semibold leading-snug">{d.blogTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.interpretation}</p>
                    {d.recommendation && (
                      <p className="text-[11px] text-amber-300/90 mt-1">→ {d.recommendation}</p>
                    )}
                  </li>
                ))}
                {(insights.decayInterpretation || []).length === 0 && (
                  <li className="text-xs text-muted-foreground/70">No decay narratives produced.</li>
                )}
              </ul>
            </SectionCard>
          </div>

          {/* Publishing strategy */}
          {insights.publishingStrategy && (
            <SectionCard icon={ClipboardList} title="Publishing Strategy" accent="violet" span="col-span-12">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-violet-400/80 mb-1">Cadence Read</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insights.publishingStrategy.cadence || '—'}
                  </p>
                  {(insights.publishingStrategy.imbalanceWarnings || []).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/60">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400/80 mb-1.5">Imbalances</p>
                      <ul className="space-y-1">
                        {insights.publishingStrategy.imbalanceWarnings.map((w, i) => (
                          <li key={i} className="text-[11px] text-amber-300/90">
                            ⚠ {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="col-span-12 md:col-span-8">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-violet-400/80 mb-2">Next Actions</p>
                  <ul className="space-y-2">
                    {(insights.publishingStrategy.nextActions || []).map((a, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <PriorityBadge priority={a.priority} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug">{a.action}</p>
                          {a.rationale && (
                            <p className="text-xs text-muted-foreground mt-0.5">{a.rationale}</p>
                          )}
                        </div>
                      </li>
                    ))}
                    {(insights.publishingStrategy.nextActions || []).length === 0 && (
                      <li className="text-xs text-muted-foreground/70">No publishing actions surfaced.</li>
                    )}
                  </ul>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-1 px-1">
            <span>
              {activeSet.provider} · {activeSet.model}
              {activeSet.usage?.totalTokens != null && <> · {activeSet.usage.totalTokens} tok</>}
              {activeSet.sampleSize != null && <> · sampled {activeSet.sampleSize} of {summary.totalBlogs}</>}
            </span>
            <span>Generated {new Date(activeSet.generatedAt || Date.now()).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </section>
  );
}
