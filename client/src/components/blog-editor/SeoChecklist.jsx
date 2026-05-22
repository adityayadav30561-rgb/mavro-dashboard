import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

const importanceTone = {
  high:   'text-rose-400',
  medium: 'text-amber-400',
  low:    'text-cyan-400',
};

const importanceImpact = {
  high:   '+High',
  medium: '+Med',
  low:    '+Low',
};

export default function SeoChecklist({ items }) {
  const [showCompleted, setShowCompleted] = useState(false);

  const pending   = items.filter((t) => !t.done);
  const completed = items.filter((t) => t.done);

  const pct = items.length ? Math.round((completed.length / items.length) * 100) : 0;

  return (
    <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks size={14} className="text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight">SEO Checklist</h3>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">
            {completed.length} / {items.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-violet-500"
          />
        </div>
      </div>

      <ul className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
        <AnimatePresence initial={false}>
          {pending.map((t) => (
            <ChecklistRow key={t.id} task={t} />
          ))}
        </AnimatePresence>
        {pending.length === 0 && (
          <li className="px-4 py-6 text-center">
            <CheckCircle2 size={22} className="mx-auto text-emerald-400 mb-1.5" />
            <p className="text-[12px] font-semibold">All tasks complete — flagship-grade SEO</p>
          </li>
        )}
      </ul>

      {completed.length > 0 && (
        <div className="border-t border-border/60">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-foreground/[0.025] transition-colors"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-400">
              Completed ({completed.length})
            </span>
            <ChevronDown
              size={12}
              className={cn('text-muted-foreground transition-transform duration-200', showCompleted && 'rotate-180')}
            />
          </button>
          <AnimatePresence initial={false}>
            {showCompleted && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden divide-y divide-border/30"
              >
                {completed.map((t) => (
                  <ChecklistRow key={t.id} task={t} completed />
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ChecklistRow({ task, completed }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'px-4 py-2.5 flex items-start gap-2.5 transition-colors',
        completed && 'opacity-60'
      )}
    >
      {task.done ? (
        <motion.span
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="mt-0.5 inline-flex"
        >
          <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
        </motion.span>
      ) : (
        <Circle size={14} className={cn('mt-0.5 flex-shrink-0', importanceTone[task.importance])} />
      )}
      <span className={cn(
        'flex-1 text-[12px] leading-snug',
        task.done ? 'text-muted-foreground line-through' : 'text-foreground/90'
      )}>
        {task.label}
      </span>
      {!task.done && (
        <span className={cn('flex-shrink-0 text-[9px] font-bold uppercase tracking-[0.14em]', importanceTone[task.importance])}>
          {importanceImpact[task.importance]}
        </span>
      )}
    </motion.li>
  );
}
