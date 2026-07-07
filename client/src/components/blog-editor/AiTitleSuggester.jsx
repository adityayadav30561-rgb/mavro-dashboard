import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Wand2,
  ArrowUpRight,
} from 'lucide-react';
import { useAiTitles } from '@/hooks/useAiTitles';
import {
  CATEGORY_LABELS,
  CATEGORY_TONES,
  BAND_COLORS,
} from '@/lib/titleQuality';
import { cn } from '@/lib/utils';

/**
 * AiTitleSuggester — premium AI title assistant for the Blog Editor Cockpit.
 *
 * UX:
 *   - Inline "AI Suggest" button. Compact. Lives next to the title field.
 *   - Opens an absolute-positioned glass panel below the trigger.
 *   - Grouped by category with deterministic per-title quality signals.
 *   - One-click Apply. Regenerate. Close.
 *
 * The component never scores SEO itself — that comes from titleQuality.js
 * (deterministic) + the live SEO engine (post-apply, via BlogForm form change).
 */

const LOADING_PHRASES = [
  'Analyzing focus keyword…',
  'Reading article structure…',
  'Building category prompts…',
  'Calling Gemini 2.5 Flash…',
  'Scoring suggestions…',
];

function LoadingShimmer() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % LOADING_PHRASES.length), 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="px-4 py-10 flex flex-col items-center gap-3">
      <div className="relative">
        <Loader2 size={26} className="animate-spin text-violet-400" />
        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl -z-10 animate-pulse" />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-xs text-muted-foreground"
        >
          {LOADING_PHRASES[idx]}
        </motion.p>
      </AnimatePresence>
      <div className="w-44 h-1 rounded-full bg-foreground/[0.06] overflow-hidden mt-1">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

function ScorePill({ value, band }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold font-mono tabular-nums',
        BAND_COLORS[band]
      )}
    >
      {value}
      <span className="font-medium uppercase tracking-[0.12em] opacity-70">
        {band.slice(0, 4)}
      </span>
    </span>
  );
}

function SignalChip({ tone, label }) {
  const toneMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    violet: 'text-violet-600 dark:text-violet-400',
  };
  return (
    <span className={cn('text-[10px] font-medium', toneMap[tone] || 'text-muted-foreground')}>
      {label}
    </span>
  );
}

function bandTone(band) {
  return {
    excellent: 'emerald',
    strong: 'cyan',
    average: 'amber',
    weak: 'rose',
    critical: 'rose',
  }[band] || 'amber';
}

function TitleRow({ item, onApply }) {
  const q = item.quality;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="group px-3 py-2.5 rounded-lg hover:bg-foreground/[0.04] transition-colors cursor-pointer"
      onClick={() => onApply(item.title)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-snug flex-1 min-w-0 group-hover:text-violet-400 transition-colors">
          {item.title}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScorePill value={q.overall} band={q.band} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApply(item.title);
            }}
            className="px-2 py-1 rounded-md bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors flex items-center gap-1"
          >
            Apply <ArrowUpRight size={11} />
          </button>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <SignalChip tone={bandTone(q.length.score >= 70 ? 'strong' : 'average')} label={`${q.length.value} chars`} />
        <SignalChip tone={q.keyword.score >= 80 ? 'emerald' : 'amber'} label={q.keyword.note} />
        <SignalChip tone={q.ctr.score >= 70 ? 'emerald' : 'amber'} label={`CTR ${q.ctr.score}`} />
        <SignalChip tone={q.readability.score >= 70 ? 'emerald' : 'amber'} label={`Read ${q.readability.score}`} />
      </div>
      {item.rationale && (
        <p className="text-[11px] text-muted-foreground/80 mt-1 italic leading-snug">
          {item.rationale}
        </p>
      )}
    </motion.div>
  );
}

function CategoryGroup({ category, items, onApply }) {
  const tone = CATEGORY_TONES[category] || 'violet';
  const toneCls = {
    violet: 'text-violet-400/80',
    amber: 'text-amber-400/80',
    cyan: 'text-cyan-400/80',
    emerald: 'text-emerald-400/80',
    sky: 'text-sky-400/80',
    rose: 'text-rose-400/80',
    fuchsia: 'text-fuchsia-400/80',
  }[tone];
  return (
    <div className="space-y-1">
      <p className={cn('text-[10px] uppercase tracking-[0.18em] font-semibold mb-1 px-1', toneCls)}>
        {CATEGORY_LABELS[category] || category}
      </p>
      <div className="space-y-0.5">
        {items.map((item, i) => (
          <TitleRow key={`${category}-${i}`} item={item} onApply={onApply} />
        ))}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} props.focusKeyword
 * @param {string} props.currentTitle
 * @param {string} props.contentHtml
 * @param {string} props.targetWebsite       - ObjectId
 * @param {string} props.tenantSlug
 * @param {string[]} [props.tags]
 * @param {string} [props.category]
 * @param {function} props.onApply           - (newTitle: string) => void
 */
export default function AiTitleSuggester({
  focusKeyword,
  currentTitle,
  contentHtml,
  targetWebsite,
  tenantSlug,
  tags,
  category,
  onApply,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { loading, error, activeSet, generate, clear } = useAiTitles();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    if (!activeSet && focusKeyword?.trim()) {
      // Auto-fire first generation when panel opens with a focus keyword set.
      generate({
        focusKeyword,
        currentTitle,
        contentHtml,
        targetWebsite,
        tenantSlug,
        tags,
        category,
      });
    }
  };

  const handleRegenerate = () =>
    generate(
      { focusKeyword, currentTitle, contentHtml, targetWebsite, tenantSlug, tags, category },
      { force: true }
    );

  const handleApply = (title) => {
    onApply?.(title);
    setOpen(false);
  };

  const disabled = !focusKeyword?.trim();

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        disabled={disabled}
        className={cn(
          'group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold uppercase tracking-[0.14em] transition-all',
          disabled
            ? 'border-border/50 text-muted-foreground/50 cursor-not-allowed'
            : 'border-violet-500/40 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-300 hover:from-violet-500/20 hover:to-fuchsia-500/20 hover:border-violet-500/60 hover:shadow-[0_0_18px_-4px_hsl(14_73%_58%/0.45)]'
        )}
        title={disabled ? 'Set a focus keyword first' : 'AI title suggestions'}
      >
        <Sparkles size={12} className={cn(!disabled && 'group-hover:rotate-12 transition-transform')} />
        AI Suggest
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-2 w-[420px] max-w-[calc(100vw-2rem)] z-50"
          >
            <div className="rounded-2xl border border-violet-500/30 bg-card/95 backdrop-blur-2xl shadow-[0_20px_60px_-12px_hsl(14_73%_30%/0.45)] overflow-hidden">
              {/* Header */}
              <div className="px-4 pt-3.5 pb-2.5 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <Wand2 size={14} className="text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-none">AI Title Assistant</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {focusKeyword ? (
                        <>focus · <span className="font-mono text-violet-300/80">{focusKeyword}</span></>
                      ) : (
                        'Set a focus keyword'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={loading || disabled}
                    className="p-1.5 rounded-md hover:bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-wait"
                    title="Regenerate"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-md hover:bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                    title="Close"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-[460px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
                {loading && <LoadingShimmer />}

                {!loading && error && (
                  <div className="px-4 py-6 flex items-start gap-2 text-xs">
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-300">Generation failed</p>
                      <p className="text-muted-foreground mt-0.5">{error}</p>
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

                {!loading && !error && !activeSet && (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground/80">
                    {disabled ? 'Add a focus keyword to begin.' : 'Loading…'}
                  </div>
                )}

                {!loading && !error && activeSet && (
                  <div className="p-2.5 space-y-3">
                    {Object.entries(activeSet.suggestions || {}).map(([cat, items]) => (
                      items.length > 0 && (
                        <CategoryGroup key={cat} category={cat} items={items} onApply={handleApply} />
                      )
                    ))}
                    {Object.values(activeSet.suggestions || {}).every((a) => a.length === 0) && (
                      <p className="text-xs text-muted-foreground/80 text-center py-6">
                        No suggestions passed quality filters. Try Regenerate.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!loading && !error && activeSet && (
                <div className="px-4 py-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground/70">
                  <span>
                    {activeSet.provider} · {activeSet.model}
                    {activeSet.usage?.totalTokens != null && (
                      <> · {activeSet.usage.totalTokens} tok</>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={clear}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                    title="Clear suggestions"
                  >
                    <Check size={10} /> Clear
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
