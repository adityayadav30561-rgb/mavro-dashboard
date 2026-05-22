import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Plus, Ghost, ArrowUpRight, Loader2, AlertTriangle,
  AlertCircle, Info, Sparkles, Network, Wand2, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Internal Linking Assistant — multi-section panel for the blog editor.
 *
 * Sections:
 *   1. Coverage warnings (over/under, anchor repeat, no external)
 *   2. Suggested links + anchor variants
 *   3. Orphan opportunities (graph orphans in tenant corpus)
 *   4. Cluster strengthening (siblings in the topical cluster)
 *   5. Missing-link detection (links pointing at unknown slugs)
 *
 * Pure presentational. Engine output flows in via `analysis`.
 */
export default function LinkSuggestionsCard({
  analysis,
  loading,
  onInsert,
  tenantName,
}) {
  const safe = analysis || {};
  const {
    suggestions = [],
    existing = [],
    orphanOpportunities = [],
    clusterExpansion = null,
    missingLinks = [],
    coverageWarnings = [],
    coverageStats = { wordCount: 0, internal: 0, external: 0 },
    coverage = { total: 0 },
  } = safe;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border/60">
        <Network size={13} className="text-cyan-400" />
        <h3 className="text-[12px] font-bold tracking-tight">Internal Linking Assistant</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
          {existing.length} placed · {suggestions.length} suggested
        </span>
      </div>

      {loading ? (
        <div className="p-5 flex items-center justify-center text-muted-foreground">
          <Loader2 size={14} className="animate-spin mr-2" />
          <span className="text-[11px]">Loading tenant corpus…</span>
        </div>
      ) : coverage.total === 0 ? (
        <div className="p-4 text-[11.5px] text-muted-foreground leading-snug">
          {tenantName ? `No published posts in ${tenantName} yet.` : 'Select a website to enable suggestions.'} Internal-link intelligence activates once the tenant has at least one published post.
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Coverage strip */}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Internal" value={coverageStats.internal} tone={coverageStats.internal > 0 ? 'emerald' : 'amber'} />
            <Stat label="External" value={coverageStats.external} />
            <Stat label="Words"    value={coverageStats.wordCount} />
          </div>

          {/* Coverage warnings */}
          {coverageWarnings.length > 0 && (
            <Section icon={AlertTriangle} title="Coverage warnings" accent="amber">
              <ul className="space-y-1.5">
                {coverageWarnings.slice(0, 4).map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug">
                    <SeverityDot severity={w.severity} />
                    <span className="text-foreground/85">{w.message}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 ? (
            <Section icon={Sparkles} title="Suggested links" accent="cyan">
              <ul className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {suggestions.map((s) => (
                    <SuggestionRow key={s.blog._id || s.href} suggestion={s} onInsert={onInsert} />
                  ))}
                </AnimatePresence>
              </ul>
            </Section>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              No topical matches above threshold. Add more tags/keywords or expand headings.
            </p>
          )}

          {/* Cluster strengthening */}
          {clusterExpansion && clusterExpansion.candidates.length > 0 && (
            <Section icon={Network} title="Strengthen cluster" accent="violet">
              <div className="mb-2 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                <span className="font-mono uppercase tracking-[0.16em] text-violet-400/80">
                  {clusterExpansion.label}
                </span>
                <span>·</span>
                <span>cluster strength {clusterExpansion.strength}%</span>
              </div>
              <ul className="space-y-1.5">
                {clusterExpansion.candidates.map((c) => (
                  <li key={c.blog._id || c.href} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/60 bg-foreground/[0.025] hover:bg-foreground/[0.05] transition-colors">
                    <span className="flex-1 truncate text-[11.5px]">{c.blog.title}</span>
                    <button
                      type="button"
                      onClick={() => onInsert?.(c.href, c.anchor)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.14em] bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 transition-colors"
                    >
                      <Plus size={9} /> Insert
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Orphan opportunities */}
          {orphanOpportunities.length > 0 && (
            <Section icon={Ghost} title="Orphan opportunities" accent="amber">
              <p className="mb-2 text-[10.5px] text-muted-foreground leading-snug">
                These tenant blogs have zero inbound links. Linking to one boosts its discoverability.
              </p>
              <ul className="space-y-1.5">
                {orphanOpportunities.map((o) => (
                  <SuggestionRow key={o.blog._id || o.href} suggestion={o} onInsert={onInsert} accent="amber" />
                ))}
              </ul>
            </Section>
          )}

          {/* Missing-link detection */}
          {missingLinks.length > 0 && (
            <Section icon={AlertCircle} title="Broken / unknown targets" accent="rose">
              <p className="mb-2 text-[10.5px] text-muted-foreground">
                Internal links pointing at slugs not present in this tenant corpus:
              </p>
              <ul className="space-y-1">
                {missingLinks.map((m, i) => (
                  <li key={i} className="text-[11px] font-mono text-rose-300/90 truncate">/{m.slug}</li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ===================================
// Suggestion row with anchor variants
// ===================================
function SuggestionRow({ suggestion: s, onInsert, accent = 'cyan' }) {
  const [open, setOpen] = useState(false);
  const variants = s.anchorVariants || { exact: [], partial: [], semantic: [], warnings: [] };
  const allVariants = [
    ...variants.exact,
    ...variants.partial,
    ...variants.semantic,
  ];

  const accentClass = {
    cyan:   'hover:border-cyan-500/40',
    amber:  'hover:border-amber-500/40',
    violet: 'hover:border-violet-500/40',
  }[accent];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 4 }}
      transition={{ duration: 0.22 }}
      className={cn(
        'group rounded-lg border border-border/60 bg-foreground/[0.025] transition-colors',
        accentClass,
      )}
    >
      <div className="px-3 py-2.5 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold tracking-tight truncate">
            {s.blog.title}
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted-foreground truncate">
            <span className="text-cyan-400/90 font-mono">{s.anchor}</span> → {s.href}
          </p>
          <p className="mt-1 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/80">
            {s.reason || 'Relevant'} · <ConfidencePill score={s.confidence ?? s.score} /> confidence
          </p>
          {variants?.best?.context && (
            <p className="mt-1 text-[10px] text-muted-foreground/85 leading-snug italic line-clamp-2">
              … {variants.best.context} …
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {allVariants.length > 1 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              title="Anchor variants"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
            >
              <Wand2 size={11} />
            </button>
          )}
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
          >
            <ArrowUpRight size={12} />
          </a>
          <button
            type="button"
            onClick={() => onInsert?.(s.href, s.anchor)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.14em] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
          >
            <Plus size={10} /> Insert
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && allVariants.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="border-t border-border/60 overflow-hidden"
          >
            <div className="px-3 py-2.5 space-y-1.5">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Anchor variants
              </p>
              <ul className="space-y-1">
                {allVariants.map((v, i) => (
                  <li key={i} className="px-2 py-1.5 rounded-md bg-foreground/[0.03] border border-border/60">
                    <div className="flex items-center gap-2">
                      <TypePill type={v.type} />
                      <span className="flex-1 truncate text-[11px] font-mono">{v.text}</span>
                      <QualityPill band={v.band} score={v.score} />
                      <button
                        type="button"
                        onClick={() => onInsert?.(s.href, v.text)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
                        title="Insert this anchor"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    {v.context && (
                      <p className="mt-1 text-[10px] text-muted-foreground/85 leading-snug italic">
                        … {v.context} …
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              {variants.warnings && variants.warnings.length > 0 && (
                <ul className="mt-2 pt-2 border-t border-border/40 space-y-1">
                  {variants.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[10.5px] text-amber-400 leading-snug">
                      <SeverityDot severity={w.severity} />
                      <span>{w.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ===================================
// Atoms
// ===================================
function Section({ icon: Icon, title, accent, children }) {
  const tone = {
    cyan:    'text-cyan-400',
    violet:  'text-violet-400',
    amber:   'text-amber-400',
    rose:    'text-rose-400',
    emerald: 'text-emerald-400',
  }[accent] || 'text-muted-foreground';
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={11} className={tone} />
        <p className={cn('text-[10px] font-semibold uppercase tracking-[0.18em]', tone)}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, tone = 'muted' }) {
  const toneClass = {
    emerald: 'text-emerald-400',
    cyan:    'text-cyan-400',
    amber:   'text-amber-400',
    muted:   'text-foreground/90',
  }[tone];
  return (
    <div className="px-2.5 py-2 rounded-lg bg-foreground/[0.03] border border-border/60 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn('text-base font-bold font-mono mt-0.5 tabular-nums', toneClass)}>{value}</p>
    </div>
  );
}

function ConfidencePill({ score }) {
  const safe = Math.round(Number(score) || 0);
  const tone = safe >= 30 ? 'text-emerald-400' : safe >= 15 ? 'text-cyan-400' : 'text-amber-400';
  return <span className={cn('font-mono', tone)}>{safe}%</span>;
}

function TypePill({ type }) {
  const meta = {
    exact:    { label: 'Exact',    classes: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
    partial:  { label: 'Partial',  classes: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
    semantic: { label: 'Semantic', classes: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
  }[type] || { label: type, classes: 'bg-foreground/[0.04] text-muted-foreground border-border/60' };
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.14em] border', meta.classes)}>
      {meta.label}
    </span>
  );
}

function QualityPill({ band, score }) {
  const tone = {
    emerald: 'text-emerald-400',
    cyan:    'text-cyan-400',
    amber:   'text-amber-400',
    rose:    'text-rose-400',
  }[band?.tone || 'muted'] || 'text-muted-foreground';
  return <span className={cn('text-[9.5px] font-mono', tone)}>{score}</span>;
}

function SeverityDot({ severity }) {
  const tone = severity === 'critical' ? 'bg-rose-400' : severity === 'warning' ? 'bg-amber-400' : 'bg-cyan-400';
  return <span className={cn('mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0', tone)} />;
}
