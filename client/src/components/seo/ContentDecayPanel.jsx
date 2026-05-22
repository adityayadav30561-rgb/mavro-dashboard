import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, TrendingDown, Clock, AlertCircle, AlertTriangle, CheckCircle2,
  ChevronDown, Filter, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InfoPopover from '@/components/analytics/InfoPopover';
import { getSeoInfo } from '@/lib/seoCopy';
import { DECAY_WEIGHTS } from '@/lib/contentDecay';

const STATE_META = {
  fresh:     { tone: 'emerald', label: 'Fresh',     Icon: CheckCircle2 },
  stable:    { tone: 'cyan',    label: 'Stable',    Icon: CheckCircle2 },
  aging:     { tone: 'amber',   label: 'Aging',     Icon: Clock },
  declining: { tone: 'orange',  label: 'Declining', Icon: TrendingDown },
  critical:  { tone: 'rose',    label: 'Critical',  Icon: AlertCircle },
};

const TONE_CLASSES = {
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  cyan:    'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  amber:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
  orange:  'text-orange-300 bg-orange-500/10 border-orange-500/30',
  rose:    'text-rose-300 bg-rose-500/10 border-rose-500/30',
};

/**
 * Content Decay Monitoring — top-level dashboard panel for the SEO Engine.
 *
 * Filters: state, age window. Renders a per-blog decay roster with reasons,
 * sub-score breakdown, and prioritized recommendations on expand.
 */
export default function ContentDecayPanel({ decay, loading }) {
  const [filterState, setFilterState] = useState('all');
  const [filterAge, setFilterAge]     = useState('all'); // all | 90 | 180 | 365
  const [expanded, setExpanded]       = useState(null);

  const rows = decay?.rows || [];
  const stats = decay?.stats || { total: 0, avgDecay: 0, buckets: {} };

  const filtered = useMemo(() => {
    let r = rows;
    if (filterState !== 'all') r = r.filter((x) => x.state === filterState);
    if (filterAge !== 'all')   r = r.filter((x) => (x.signals.updatedDays ?? 0) >= Number(filterAge));
    return r.sort((a, b) => b.score - a.score);
  }, [rows, filterState, filterAge]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <Activity size={14} className="text-rose-400" />
        <h3 className="text-sm font-bold tracking-tight">Content Decay Monitoring</h3>
        {(() => {
          const i = getSeoInfo('decay_panel');
          return i && <InfoPopover title={i.title} text={i.text} size={11} />;
        })()}
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
          avg risk · <span className={cn('font-bold', avgTone(stats.avgDecay))}>{stats.avgDecay}</span> · {stats.total} posts
        </span>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 border-b border-border/60">
        {['fresh','stable','aging','declining','critical'].map((k) => {
          const m = STATE_META[k];
          return (
            <div key={k} className={cn('rounded-lg px-3 py-2 border', TONE_CLASSES[m.tone])}>
              <div className="flex items-center gap-1.5">
                <m.Icon size={10} />
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] flex-1">{m.label}</p>
                {(() => {
                  const i = getSeoInfo(`decay_state_${k}`);
                  return i && <InfoPopover title={i.title} text={i.text} size={9} />;
                })()}
              </div>
              <p className="mt-1 text-lg font-bold font-mono tabular-nums">{stats.buckets?.[k] ?? 0}</p>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="px-5 py-2.5 border-b border-border/60 bg-foreground/[0.02] flex flex-wrap items-center gap-2">
        <Filter size={11} className="text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mr-1">State</span>
        <FilterPill active={filterState === 'all'} onClick={() => setFilterState('all')}>All ({rows.length})</FilterPill>
        {['critical','declining','aging','stable','fresh'].map((k) => (
          <FilterPill key={k} active={filterState === k} tone={STATE_META[k].tone} onClick={() => setFilterState(k)}>
            {STATE_META[k].label} ({stats.buckets?.[k] ?? 0})
          </FilterPill>
        ))}
        <span className="mx-2 h-3 w-px bg-border/60" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mr-1">Age</span>
        {[
          { v: 'all', l: 'Any' },
          { v: '90',  l: '90d+' },
          { v: '180', l: '6mo+' },
          { v: '365', l: '1yr+' },
        ].map((opt) => (
          <FilterPill key={opt.v} active={filterAge === opt.v} onClick={() => setFilterAge(opt.v)}>{opt.l}</FilterPill>
        ))}
      </div>

      {/* Roster */}
      {loading ? (
        <div className="p-10 text-center text-[12px] text-muted-foreground">Loading decay analysis…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center">
          <CheckCircle2 size={22} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-[12px] font-semibold">No blogs match this slice.</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Adjust filters or celebrate — every audited blog is healthy.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 max-h-[640px] overflow-y-auto">
          {filtered.slice(0, 50).map((r) => (
            <DecayRow
              key={r.blog._id}
              row={r}
              isOpen={expanded === r.blog._id}
              onToggle={() => setExpanded(expanded === r.blog._id ? null : r.blog._id)}
            />
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function DecayRow({ row, isOpen, onToggle }) {
  const meta = STATE_META[row.state] || STATE_META.stable;
  const classes = TONE_CLASSES[meta.tone];
  const dv = row.signals.viewsDeltaPct;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-foreground/[0.025] transition-colors text-left"
      >
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] border flex-shrink-0', classes)}>
          <meta.Icon size={9} />
          {meta.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-semibold truncate">{row.blog.title}</p>
          <p className="text-[10.5px] text-muted-foreground truncate mt-0.5">
            {row.signals.updatedDays != null ? `${row.signals.updatedDays}d since update · ` : ''}
            {dv != null && (
              <span className={dv < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {dv > 0 ? '+' : ''}{dv}% views
              </span>
            )}
            {row.signals.seoScore != null && ` · SEO ${row.signals.seoScore}`}
            {row.signals.isOrphan && ' · orphan'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <DecayMeter score={row.score} tone={meta.tone} />
          <ChevronDown size={12} className={cn('text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/60 bg-foreground/[0.015]"
          >
            <div className="px-5 py-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sub-score breakdown */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Decay sub-scores</p>
                  <span className="text-[9px] font-mono text-rose-300/90 px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">
                    higher = more decay
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {Object.keys(DECAY_WEIGHTS).map((k) => {
                    const value = Math.round(row.subs[k] || 0);
                    const band = subBand(value);
                    return (
                      <li key={k} className="flex items-center gap-2 text-[11px]">
                        <span className="flex-1 text-foreground/80">{prettyKey(k)}</span>
                        <SubBar value={value} />
                        <span className={cn('text-[9px] font-bold uppercase tracking-[0.12em] w-10 text-center px-1 py-0.5 rounded border', band.classes)}>
                          {band.label}
                        </span>
                        <span className="w-7 text-right font-mono tabular-nums text-muted-foreground">{value}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[10px] text-muted-foreground/80 leading-snug">
                  0–25 healthy · 26–55 mild · 56–75 elevated · 76–100 critical.
                </p>
              </div>

              {/* Reasons */}
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">Reasons</p>
                {row.reasons.length === 0 ? (
                  <p className="text-[11px] text-emerald-400">No decay signals detected.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {row.reasons.slice(0, 6).map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug">
                        <SeverityDot severity={r.severity} />
                        <span className="text-foreground/85">{r.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recommendations */}
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles size={9} className="text-violet-400" />
                  Recommended actions
                </p>
                {row.recommendations.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">No actions required.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {row.recommendations.slice(0, 4).map((r) => (
                      <RecommendationRow key={r.id} rec={r} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function RecommendationRow({ rec }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-border/60 bg-foreground/[0.025] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-2.5 py-1.5 text-left hover:bg-foreground/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronDown size={10} className={cn('text-muted-foreground transition-transform flex-shrink-0', open && 'rotate-180')} />
          <span className={cn('flex-1 text-[11.5px] font-medium', !open && 'truncate')}>
            {rec.label}
          </span>
          <ImpactPill value={rec.impact} />
        </div>
        <div className="mt-0.5 ml-4 flex items-center gap-2 text-[9.5px] font-mono text-muted-foreground tabular-nums">
          <span>effort · {rec.effort}</span>
          <span>·</span>
          <span>confidence · <span className="text-violet-300">{rec.confidence}%</span></span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="px-2.5 py-2 space-y-1.5">
              {rec.sources && rec.sources.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">Triggered by</p>
                  <ul className="flex flex-wrap gap-1">
                    {rec.sources.map((s) => (
                      <li key={s} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-foreground/[0.05] border border-border/60 text-muted-foreground">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[10.5px] text-foreground/80 leading-snug">
                Estimated impact <span className="text-rose-300">{rec.impact}</span> · effort <span className="text-amber-300">{rec.effort}</span> · confidence reflects how many decay signals this fix addresses.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function subBand(value) {
  if (value >= 76) return { label: 'crit',    classes: 'text-rose-300 bg-rose-500/10 border-rose-500/30' };
  if (value >= 56) return { label: 'elev',    classes: 'text-orange-300 bg-orange-500/10 border-orange-500/30' };
  if (value >= 26) return { label: 'mild',    classes: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
  return                  { label: 'ok',      classes: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' };
}

function DecayMeter({ score, tone }) {
  const safe = Math.max(0, Math.min(100, Math.round(score || 0)));
  const fill = {
    emerald: 'bg-emerald-500',
    cyan:    'bg-cyan-500',
    amber:   'bg-amber-500',
    orange:  'bg-orange-500',
    rose:    'bg-rose-500',
  }[tone];
  return (
    <div className="inline-flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safe}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={cn('h-full', fill)}
        />
      </div>
      <span className="text-[11px] font-mono font-bold tabular-nums w-7 text-right">{safe}</span>
    </div>
  );
}

function SubBar({ value }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const fill = safe >= 70 ? 'bg-rose-500' : safe >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="w-24 h-1 rounded-full bg-foreground/[0.06] overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${safe}%` }} transition={{ duration: 0.4 }} className={cn('h-full', fill)} />
    </div>
  );
}

function ImpactPill({ value }) {
  const tone = value === 'high' ? 'text-rose-300 bg-rose-500/10 border-rose-500/30'
             : value === 'medium' ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                                  : 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.14em] border', tone)}>
      {value} impact
    </span>
  );
}

function SeverityDot({ severity }) {
  const tone = severity === 'critical' ? 'bg-rose-400' : severity === 'warning' ? 'bg-amber-400' : 'bg-cyan-400';
  return <span className={cn('mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0', tone)} />;
}

function FilterPill({ active, onClick, children, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-border/70 text-muted-foreground',
    emerald: 'border-emerald-500/40 text-emerald-400',
    cyan:    'border-cyan-500/40 text-cyan-400',
    amber:   'border-amber-500/40 text-amber-400',
    orange:  'border-orange-500/40 text-orange-400',
    rose:    'border-rose-500/40 text-rose-400',
  };
  const activeTones = {
    neutral: 'bg-foreground/[0.06] text-foreground border-border',
    emerald: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300',
    cyan:    'bg-cyan-500/20 border-cyan-500/60 text-cyan-300',
    amber:   'bg-amber-500/20 border-amber-500/60 text-amber-300',
    orange:  'bg-orange-500/20 border-orange-500/60 text-orange-300',
    rose:    'bg-rose-500/20 border-rose-500/60 text-rose-300',
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.14em] border transition-all',
        active ? activeTones[tone] : tones[tone],
      )}
    >
      {children}
    </button>
  );
}

function avgTone(score) {
  if (score >= 60) return 'text-rose-400';
  if (score >= 40) return 'text-orange-400';
  if (score >= 20) return 'text-amber-400';
  return                 'text-emerald-400';
}

function prettyKey(k) {
  return {
    engagement:  'Engagement',
    freshness:   'Freshness',
    seoDrift:    'SEO drift',
    linking:     'Internal linking',
    metadata:    'Metadata',
    contentBody: 'Content body',
  }[k] || k;
}
