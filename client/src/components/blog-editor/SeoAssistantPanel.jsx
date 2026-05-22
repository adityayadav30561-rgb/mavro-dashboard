import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import SeoScoreRing from './SeoScoreRing';
import FocusKeywordCard from './FocusKeywordCard';
import SeoChecklist from './SeoChecklist';
import {
  ContentAnalysisCard,
  StructureCard,
  MetadataAuditCard,
  ReadabilityCard,
  LinkAuditCard,
  MediaAuditCard,
  IssueFeed,
} from './CockpitCards';
import KeywordIntelligenceCard from './KeywordIntelligenceCard';
import LinkSuggestionsCard from './LinkSuggestionsCard';
import SchemaReadinessCard from './SchemaReadinessCard';
import { runLiveSeo } from './LiveSeoEngine';

// Debounce hook — keeps the engine off the critical typing path.
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Sticky right-side SEO assistant for the blog editor.
 * Receives the live form state + focus keyword and re-runs the live engine
 * on every debounced change. All sections derive from real analysis — no
 * placeholder values.
 */
export default function SeoAssistantPanel({
  form,
  focusKeyword,
  onFocusKeywordChange,
  corpus = [],
  corpusLoading = false,
  tenantSlug = '',
  tenantName = '',
  onInsertLink,
}) {
  const debouncedForm = useDebouncedValue(form, 280);
  const debouncedKeyword = useDebouncedValue(focusKeyword, 220);

  const result = useMemo(
    () => runLiveSeo(debouncedForm, debouncedKeyword, corpus, { tenantSlug }),
    [debouncedForm, debouncedKeyword, corpus, tenantSlug]
  );

  const {
    audit, focusKw, readability, subScores, checklist, grade,
    interpretation: interp, keywordIntel, schemaIntel, linkIntel,
  } = result;

  return (
    <div className="space-y-4">
      {/* Header card with overall score + sub-scores */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/70 p-5 shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={14} className="text-violet-400" />
          <h3 className="text-sm font-bold tracking-tight">Live SEO Cockpit</h3>
          <span className={interpTone(interp.tone) + ' ml-auto text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border'}>
            {interp.band}
          </span>
        </div>

        <div className="flex items-center justify-center mb-4">
          <SeoScoreRing
            score={subScores.overall}
            label="Overall SEO"
            size={140}
            showGrade
            grade={grade}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MiniScoreTile label="Readability"    score={subScores.readability} />
          <MiniScoreTile label="Content Depth"  score={subScores.contentDepth} />
          <MiniScoreTile label="Structure"      score={subScores.structure} />
          <MiniScoreTile label="Metadata"       score={subScores.metadata} />
          {focusKw.keyword && (
            <MiniScoreTile label="Focus Keyword" score={subScores.focus} fullSpan />
          )}
        </div>
      </motion.div>

      {/* Focus keyword */}
      <FocusKeywordCard
        keyword={focusKeyword}
        onChange={onFocusKeywordChange}
        focusKw={focusKw}
      />

      {/* Keyword intelligence — primary + secondary + variations */}
      <KeywordIntelligenceCard intel={keywordIntel} />

      {/* Checklist */}
      <SeoChecklist items={checklist} />

      {/* Internal link suggestions */}
      <LinkSuggestionsCard
        analysis={linkIntel}
        loading={corpusLoading}
        onInsert={onInsertLink}
        tenantName={tenantName}
      />

      {/* Schema readiness */}
      <SchemaReadinessCard intel={schemaIntel} />

      {/* Analysis cards */}
      <ContentAnalysisCard blog={result.blog} readability={readability} subScores={subScores} />
      <StructureCard       blog={result.blog} readability={readability} subScores={subScores} />
      <MetadataAuditCard   form={form}        subScores={subScores} />
      <ReadabilityCard     readability={readability} subScores={subScores} />
      <LinkAuditCard       blog={result.blog} />
      <MediaAuditCard      blog={result.blog} form={form} />
      <IssueFeed           audit={audit} />
    </div>
  );
}

function MiniScoreTile({ label, score, fullSpan }) {
  const safe = Math.round(score || 0);
  const tone =
    safe >= 90 ? 'text-emerald-400' :
    safe >= 75 ? 'text-cyan-400' :
    safe >= 60 ? 'text-amber-400' :
    safe >= 40 ? 'text-orange-400' :
                 'text-rose-400';
  return (
    <div className={'rounded-lg px-3 py-2 bg-foreground/[0.03] border border-border/60 ' + (fullSpan ? 'col-span-2' : '')}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={'text-base font-bold font-mono mt-0.5 tabular-nums ' + tone}>{safe}</p>
    </div>
  );
}

function interpTone(tone) {
  return {
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    cyan:    'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
    amber:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
    orange:  'text-orange-300 bg-orange-500/10 border-orange-500/30',
    rose:    'text-rose-300 bg-rose-500/10 border-rose-500/30',
  }[tone] || 'text-muted-foreground bg-foreground/[0.04] border-border/60';
}
