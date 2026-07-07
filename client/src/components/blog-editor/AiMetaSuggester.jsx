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
import { useAiMeta } from '@/hooks/useAiMeta';
import {
  META_CATEGORY_LABELS,
  META_CATEGORY_TONES,
  META_BAND_COLORS,
} from '@/lib/metaQuality';
import { cn } from '@/lib/utils';

/**
 * AiMetaSuggester — premium AI meta-description assistant for the Blog
 * Editor Cockpit. Mirrors AiTitleSuggester UX so editors learn one pattern.
 *
 * Lives next to / above the Meta Description textarea. Generates 7 grouped
 * variants, shows deterministic per-item quality signals, applies on click.
 * After Apply the existing LiveSeoEngine recalculates the metadata
 * category score against the new value.
 */

const LOADING_PHRASES = [
  'Reading article context…',
  'Inspecting headings and FAQs…',
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
        META_BAND_COLORS[band]
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

function MetaRow({ item, onApply }) {
  const q = item.quality;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="group px-3 py-2.5 rounded-lg hover:bg-foreground/[0.04] transition-colors cursor-pointer"
      onClick={() => onApply(item.description)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] leading-snug flex-1 min-w-0 group-hover:text-violet-300 transition-colors">
          {item.description}
        </p>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <ScorePill value={q.overall} band={q.band} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApply(item.description);
            }}
            className="px-2 py-1 rounded-md bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors flex items-center gap-1"
          >
            Apply <ArrowUpRight size={11} />
          </button>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <SignalChip
          tone={q.length.score >= 90 ? 'emerald' : q.length.score >= 70 ? 'cyan' : 'amber'}
          label={`${q.length.value} chars`}
        />
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
  const tone = META_CATEGORY_TONES[category] || 'violet';
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
        {META_CATEGORY_LABELS[category] || category}
      </p>
      <div className="space-y-0.5">
        {items.map((item, i) => (
          <MetaRow key={`${category}-${i}`} item={item} onApply={onApply} />
        ))}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} props.focusKeyword
 * @param {string} props.blogTitle
 * @param {string} props.currentDescription
 * @param {string} props.contentHtml
 * @param {string} props.targetWebsite
 * @param {string} props.tenantSlug
 * @param {string[]} [props.tags]
 * @param {string} [props.category]
 * @param {Array} [props.faqs]
 * @param {function} props.onApply
 */
export default function AiMetaSuggester({
  focusKeyword,
  blogTitle,
  currentDescription,
  contentHtml,
  targetWebsite,
  tenantSlug,
  tags,
  category,
  faqs,
  onApply,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { loading, error, activeSet, generate, clear } = useAiMeta();

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
      generate({
        focusKeyword,
        blogTitle,
        currentDescription,
        contentHtml,
        targetWebsite,
        tenantSlug,
        tags,
        category,
        faqs,
      });
    }
  };

  const handleRegenerate = () =>
    generate(
      {
        focusKeyword,
        blogTitle,
        currentDescription,
        contentHtml,
        targetWebsite,
        tenantSlug,
        tags,
        category,
        faqs,
      },
      { force: true }
    );

  const handleApply = (description) => {
    onApply?.(description);
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
          'group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-semibold uppercase tracking-[0.14em] transition-all',
          disabled
            ? 'border-border/50 text-muted-foreground/50 cursor-not-allowed'
            : 'border-violet-500/40 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-300 hover:from-violet-500/20 hover:to-fuchsia-500/20 hover:border-violet-500/60 hover:shadow-[0_0_18px_-4px_hsl(14_73%_58%/0.45)]'
        )}
        title={disabled ? 'Set a focus keyword first' : 'AI meta description suggestions'}
      >
        <Sparkles size={11} className={cn(!disabled && 'group-hover:rotate-12 transition-transform')} />
        AI Suggest
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-2 w-[460px] max-w-[calc(100vw-2rem)] z-50"
          >
            <div className="rounded-2xl border border-violet-500/30 bg-card/95 backdrop-blur-2xl shadow-[0_20px_60px_-12px_hsl(14_73%_30%/0.45)] overflow-hidden">
              <div className="px-4 pt-3.5 pb-2.5 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <Wand2 size={14} className="text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-none">AI Meta Description Assistant</p>
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

              <div className="max-h-[500px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
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
                    {Object.entries(activeSet.suggestions || {}).map(
                      ([cat, items]) =>
                        items.length > 0 && (
                          <CategoryGroup key={cat} category={cat} items={items} onApply={handleApply} />
                        )
                    )}
                    {Object.values(activeSet.suggestions || {}).every((a) => a.length === 0) && (
                      <p className="text-xs text-muted-foreground/80 text-center py-6">
                        No suggestions passed quality filters. Try Regenerate.
                      </p>
                    )}
                  </div>
                )}
              </div>

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
