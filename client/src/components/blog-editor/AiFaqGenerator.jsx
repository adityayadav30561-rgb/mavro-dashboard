import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  X,
  AlertTriangle,
  Wand2,
  CheckSquare,
  Square,
  Trash2,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useAiFaqs } from '@/hooks/useAiFaqs';
import {
  FAQ_BAND_COLORS,
  INTENT_TONES,
  faqBlockHtml,
  buildFaqSectionMarkerIfNeeded,
} from '@/lib/faqQuality';
import { cn } from '@/lib/utils';

/**
 * AiFaqGenerator — Sits next to the existing "Insert FAQ" button in the
 * editor toolbar. Generates contextual FAQs, previews them with
 * deterministic quality bundles, supports selective insertion.
 *
 * Insertion CONTRACT:
 *   - Each selected FAQ is wrapped in the canonical `<p><strong>Q. ...
 *     </strong></p><p>...</p>` block via `faqBlockHtml()` — exactly the
 *     shape FaqBlockButton produces — so the FAQ detector and FAQPage
 *     JSON-LD generator pick them up automatically without UI changes.
 *   - When the article body lacks a "Frequently Asked Questions" H2
 *     marker, the inserter prepends one BEFORE the first AI FAQ. This
 *     satisfies both the explicit-Q. detector AND the heuristic
 *     positional-gating rule for legacy patterns.
 */

const LOADING_PHRASES = [
  'Analyzing semantic coverage…',
  'Reading article headings + body…',
  'Identifying topical gaps…',
  'Generating contextual FAQs…',
  'Scoring relevance + PAA potential…',
];

function LoadingShimmer() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % LOADING_PHRASES.length), 1300);
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
        FAQ_BAND_COLORS[band]
      )}
    >
      {value}
      <span className="font-medium uppercase tracking-[0.12em] opacity-70">
        {band.slice(0, 4)}
      </span>
    </span>
  );
}

function IntentChip({ intent }) {
  const tone = INTENT_TONES[intent] || 'violet';
  const cls = {
    violet: 'border-violet-500/40 text-violet-300 bg-violet-500/10',
    cyan: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10',
    emerald: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    amber: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
    rose: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
  }[tone];
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-[0.14em]', cls)}>
      {intent || 'info'}
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

function FaqRow({ item, selected, onToggle, onInsert, onRemove }) {
  const q = item.quality;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group rounded-lg border transition-colors p-3',
        selected
          ? 'border-violet-500/50 bg-violet-500/[0.06]'
          : 'border-border/60 bg-foreground/[0.015] hover:border-violet-500/30'
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onToggle(item._id)}
          className="flex-shrink-0 mt-0.5 text-violet-300 hover:text-violet-200 transition-colors"
          title={selected ? 'Deselect' : 'Select'}
        >
          {selected ? <CheckSquare size={15} /> : <Square size={15} className="text-muted-foreground/70" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug flex-1 min-w-0">{item.question}</p>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <ScorePill value={q.overall} band={q.band} />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onInsert(item)}
                  className="px-2 py-1 rounded-md bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors flex items-center gap-1"
                  title="Insert this FAQ"
                >
                  <Plus size={11} /> Insert
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item._id)}
                  className="p-1 rounded-md hover:bg-foreground/[0.06] text-muted-foreground hover:text-rose-400 transition-colors"
                  title="Remove suggestion"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-[12.5px] text-muted-foreground leading-snug mt-1.5">{item.answer}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <IntentChip intent={item.intent} />
            <SignalChip tone={q.relevance.score >= 70 ? 'emerald' : 'amber'} label={q.relevance.note} />
            <SignalChip tone={q.coverage.score >= 70 ? 'emerald' : 'amber'} label={q.coverage.note} />
            <SignalChip tone={q.questionShape.score >= 70 ? 'emerald' : 'amber'} label={`Q ${q.questionShape.score}`} />
            <SignalChip tone={q.answerShape.score >= 70 ? 'emerald' : 'amber'} label={`A ${q.answerShape.score}`} />
            {item.coverage && (
              <SignalChip tone="violet" label={`fills: ${item.coverage}`} />
            )}
          </div>
          {item.rationale && (
            <p className="text-[11px] text-muted-foreground/80 italic mt-1.5 leading-snug">{item.rationale}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * @param {object} props
 * @param {string} props.focusKeyword
 * @param {string} props.blogTitle
 * @param {string} props.contentHtml
 * @param {string} props.targetWebsite           - ObjectId
 * @param {string[]} [props.tags]
 * @param {string} [props.category]
 * @param {string[]} [props.existingQuestions]   - dedupe against current FAQs
 * @param {function} props.onInsertHtml          - (html: string) => void  (caller appends to editor body)
 */
export default function AiFaqGenerator({
  focusKeyword,
  blogTitle,
  contentHtml,
  targetWebsite,
  tags,
  category,
  existingQuestions = [],
  onInsertHtml,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const {
    loading,
    error,
    activeSet,
    selected,
    selectedIds,
    generate,
    toggle,
    selectAll,
    clearSelection,
    remove,
  } = useAiFaqs();

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

  const ctx = {
    focusKeyword,
    blogTitle,
    contentHtml,
    targetWebsite,
    tags,
    category,
    existingQuestions,
  };

  const handleOpen = () => {
    setOpen(true);
    if (!activeSet && focusKeyword?.trim()) {
      generate(ctx);
    }
  };

  const handleRegenerate = () => generate(ctx, { force: true });

  const insertItems = (items) => {
    if (!items || items.length === 0) return;
    const marker = buildFaqSectionMarkerIfNeeded(contentHtml);
    const blocks = items.map((it) => faqBlockHtml(it)).filter(Boolean).join('');
    onInsertHtml?.(marker + blocks);
  };

  const handleInsertOne = (item) => {
    insertItems([item]);
  };

  const handleInsertSelected = () => {
    if (selected.length === 0) return;
    insertItems(selected);
    setOpen(false);
  };

  const handleInsertAll = () => {
    if (!activeSet?.suggestions?.length) return;
    insertItems(activeSet.suggestions);
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
            : 'border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 text-fuchsia-300 hover:from-fuchsia-500/20 hover:to-violet-500/20 hover:border-fuchsia-500/60 hover:shadow-[0_0_18px_-4px_hsl(295_75%_60%/0.45)]'
        )}
        title={disabled ? 'Set a focus keyword first' : 'Generate AI FAQs'}
      >
        <Sparkles size={12} className={cn(!disabled && 'group-hover:rotate-12 transition-transform')} />
        AI Generate FAQs
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 mt-2 w-[560px] max-w-[calc(100vw-2rem)] z-50"
          >
            <div className="rounded-2xl border border-violet-500/30 bg-card/95 backdrop-blur-2xl shadow-[0_20px_60px_-12px_hsl(263_70%_30%/0.45)] overflow-hidden">
              {/* Header */}
              <div className="px-4 pt-3.5 pb-2.5 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-violet-500/20 border border-fuchsia-500/30 flex items-center justify-center flex-shrink-0">
                    <HelpCircle size={14} className="text-fuchsia-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-none">AI FAQ Generator</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {focusKeyword ? (
                        <>focus · <span className="font-mono text-violet-300/80">{focusKeyword}</span></>
                      ) : (
                        'Set a focus keyword'
                      )}
                      {activeSet?.suggestions?.length != null && (
                        <> · {activeSet.suggestions.length} ready</>
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
                  <div className="p-3 space-y-2.5">
                    {activeSet.suggestions.length === 0 ? (
                      <p className="text-xs text-muted-foreground/80 text-center py-6">
                        No suggestions passed quality filters. Try Regenerate.
                      </p>
                    ) : (
                      activeSet.suggestions.map((item) => (
                        <FaqRow
                          key={item._id}
                          item={item}
                          selected={selectedIds.has(item._id)}
                          onToggle={toggle}
                          onInsert={handleInsertOne}
                          onRemove={remove}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!loading && !error && activeSet && activeSet.suggestions.length > 0 && (
                <div className="px-3 py-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="px-2 py-1 rounded-md hover:bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <CheckSquare size={11} /> All
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-2 py-1 rounded-md hover:bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <Square size={11} /> None
                    </button>
                    <span className="ml-1.5 text-muted-foreground/60">
                      {activeSet.provider} · {activeSet.model}
                      {activeSet.usage?.totalTokens != null && (
                        <> · {activeSet.usage.totalTokens} tok</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleInsertSelected}
                      disabled={selected.length === 0}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-[11px] font-semibold uppercase tracking-[0.14em] transition-all flex items-center gap-1',
                        selected.length === 0
                          ? 'border-border/50 text-muted-foreground/50 cursor-not-allowed'
                          : 'border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25'
                      )}
                    >
                      <Plus size={12} /> Insert selected ({selected.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleInsertAll}
                      className="px-3 py-1.5 rounded-lg border border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-500/15 to-violet-500/15 text-fuchsia-300 hover:from-fuchsia-500/25 hover:to-violet-500/25 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all flex items-center gap-1"
                    >
                      <Wand2 size={12} /> Insert all
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
