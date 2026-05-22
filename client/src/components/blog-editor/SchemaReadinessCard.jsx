import { motion } from 'framer-motion';
import { Database, Check, X, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Schema Readiness card — evaluates BlogPosting JSON-LD readiness and FAQ
 * surface based on real form + content signals. No fake values: every cell
 * derives from `intel` produced by `analyzeSchemaReadiness`.
 */
export default function SchemaReadinessCard({ intel }) {
  if (!intel) return null;

  const { blogPosting, faq, overallState } = intel;
  const overall = overallStateMeta(overallState);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border/60">
        <Database size={13} className="text-emerald-400" />
        <h3 className="text-[12px] font-bold tracking-tight">Schema Readiness</h3>
        <span className={cn(
          'ml-auto text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border',
          overall.classes
        )}>
          {overall.label}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* BlogPosting matrix */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
            BlogPosting JSON-LD
          </p>
          <ul className="grid grid-cols-2 gap-1.5">
            {blogPosting.fields.map((f) => (
              <li
                key={f.key}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border',
                  f.present
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : f.required
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-foreground/[0.03] border-border/60 text-muted-foreground'
                )}
              >
                {f.present ? <Check size={10} /> : <X size={10} />}
                <span className="truncate">{f.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {blogPosting.requiredPresent}/{blogPosting.requiredTotal} required fields present
          </p>
        </div>

        {/* FAQ surface */}
        <div className="pt-3 border-t border-border/60">
          <div className="flex items-center gap-1.5 mb-1.5">
            <HelpCircle size={11} className="text-cyan-400" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
              FAQ schema
            </p>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
              {faq.count} Q&amp;A
            </span>
          </div>
          {faq.count > 0 ? (
            <>
              <ul className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {faq.items.slice(0, 6).map((q, i) => (
                  <li key={i} className="text-[11px] leading-snug">
                    <div className="flex items-start gap-1.5">
                      <span className="text-cyan-400/80 font-mono mt-0.5">Q{i + 1}.</span>
                      <span className="flex-1 text-foreground/90">{q.question}</span>
                    </div>
                    {q.answer && (
                      <p className="mt-0.5 ml-6 text-[10.5px] text-muted-foreground/85 line-clamp-2">
                        {q.answer}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              {faq.jsonLd && (
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400 hover:text-cyan-300">
                    View FAQPage JSON-LD ▾
                  </summary>
                  <pre className="mt-2 max-h-[180px] overflow-auto rounded-md bg-foreground/[0.04] border border-border/60 p-2 text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">
{JSON.stringify(faq.jsonLd, null, 2)}
                  </pre>
                </details>
              )}
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-snug">
              No FAQ section detected. Click <strong>Insert FAQ</strong> in the editor toolbar, or write 3+ H2/H3 headings phrased as questions ("How…", "What…", "Why…") with answer paragraphs underneath to qualify for FAQPage rich results.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function overallStateMeta(state) {
  switch (state) {
    case 'ready':
      return { label: 'Ready', classes: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' };
    case 'partial':
      return { label: 'Partial', classes: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
    case 'missing':
    default:
      return { label: 'Missing', classes: 'text-rose-300 bg-rose-500/10 border-rose-500/30' };
  }
}
