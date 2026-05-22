import { motion, AnimatePresence } from 'framer-motion';
import { Target, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const slotMeta = [
  { key: 'title',          label: 'Title' },
  { key: 'titleStart',     label: 'Title (early)' },
  { key: 'seoTitle',       label: 'SEO title' },
  { key: 'seoDescription', label: 'Meta description' },
  { key: 'slug',           label: 'Slug' },
  { key: 'excerpt',        label: 'Excerpt' },
  { key: 'firstParagraph', label: 'First paragraph' },
  { key: 'anyHeading',     label: 'Heading' },
];

const densityBands = {
  missing:  { label: 'Missing',     tone: 'rose'    },
  sparse:   { label: 'Sparse',      tone: 'amber'   },
  optimal:  { label: 'Optimal',     tone: 'emerald' },
  high:     { label: 'Borderline',  tone: 'amber'   },
  stuffing: { label: 'Stuffing',    tone: 'rose'    },
  unknown:  { label: '—',           tone: 'muted'   },
};

export default function FocusKeywordCard({ keyword, onChange, focusKw }) {
  const band = densityBands[focusKw.densityBand] || densityBands.unknown;
  const toneClasses = {
    rose:    'text-rose-400 bg-rose-500/10 border-rose-500/30',
    amber:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    muted:   'text-muted-foreground bg-foreground/[0.04] border-border/60',
  }[band.tone];

  return (
    <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-violet-400" />
          <h3 className="text-sm font-bold tracking-tight">Focus Keyword</h3>
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. workforce management software"
          className="w-full px-3 py-2 rounded-lg bg-foreground/[0.03] border border-border/70 focus:border-violet-500/60 focus:bg-foreground/[0.05] outline-none transition-all text-sm placeholder:text-muted-foreground/60"
        />
      </div>

      <AnimatePresence mode="wait">
        {focusKw.keyword ? (
          <motion.div
            key="filled"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-3"
          >
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Density" value={`${focusKw.density}%`} tone={band.tone} />
              <Stat label="Used" value={focusKw.occurrences} />
              <Stat label="Score" value={focusKw.score} />
            </div>

            <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.16em] border', toneClasses)}>
              {band.tone === 'emerald' && <Check size={10} />}
              {band.tone === 'rose'    && <AlertTriangle size={10} />}
              {band.tone === 'amber'   && <AlertTriangle size={10} />}
              {band.label}
            </div>

            {/* Placement matrix moved to Keyword Intelligence → Distribution
                to keep one source of truth. */}

            {focusKw.issues.length > 0 && (
              <ul className="pt-3 border-t border-border/60 space-y-1">
                {focusKw.issues.slice(0, 3).map((it, i) => (
                  <li key={i} className={cn(
                    'text-[11px] flex items-start gap-1.5',
                    it.severity === 'critical' ? 'text-rose-400' : it.severity === 'warning' ? 'text-amber-400' : 'text-cyan-400'
                  )}>
                    <span className="mt-0.5">•</span>
                    <span>{it.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 text-[11px] text-muted-foreground"
          >
            Enter your primary search term above. The cockpit will analyze placement, density, and over-optimization in real time.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, tone = 'muted' }) {
  const toneClass = {
    emerald: 'text-emerald-400',
    rose:    'text-rose-400',
    amber:   'text-amber-400',
    muted:   'text-foreground',
  }[tone];
  return (
    <div className="px-2.5 py-2 rounded-lg bg-foreground/[0.03] border border-border/60">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn('text-base font-bold font-mono mt-0.5', toneClass)}>{value}</p>
    </div>
  );
}
