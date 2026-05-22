import { motion } from 'framer-motion';
import { Users, MousePointerClick, Send, ArrowDown, Filter } from 'lucide-react';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

const STAGE_META = {
  visitors:    { icon: Users,             color: 'violet', label: 'Visitors',       hint: 'Unique sessions in window' },
  cta_click:   { icon: MousePointerClick, color: 'cyan',   label: 'CTA Clicked',    hint: 'Sessions that fired a CTA event' },
  form_submit: { icon: Send,              color: 'emerald',label: 'Form Submitted', hint: 'Sessions that completed a lead form' },
};

const colorClass = {
  violet:  { bg: 'bg-violet-500/15',  border: 'border-violet-500/40',  text: 'text-violet-300',  fill: 'bg-gradient-to-r from-violet-500/80 to-violet-600/60' },
  cyan:    { bg: 'bg-cyan-500/15',    border: 'border-cyan-500/40',    text: 'text-cyan-300',    fill: 'bg-gradient-to-r from-cyan-500/80 to-cyan-600/60' },
  emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300', fill: 'bg-gradient-to-r from-emerald-500/80 to-emerald-600/60' },
};

export default function ConversionFunnels({ funnel }) {
  const stages = funnel?.stages || [];
  const top = stages[0]?.sessions || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <Filter size={14} className="text-violet-400" />
        <h3 className="text-title">Conversion Funnel</h3>
        <InfoPopover infoKey="conversionFunnel" />
        <span className="ml-auto text-[10px] text-muted-foreground">
          {stages[stages.length - 1]?.fromTopPct ?? 0}% end-to-end
        </span>
      </div>

      {stages.length === 0 || top === 0 ? (
        <div className="p-10 text-center">
          <Users size={28} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold">No funnel data yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Drive traffic + capture form submissions to populate the funnel.</p>
        </div>
      ) : (
        <ul className="p-5 space-y-3">
          {stages.map((s, i) => {
            const meta = STAGE_META[s.key] || { icon: Users, color: 'violet', label: s.label };
            const c = colorClass[meta.color];
            const width = top ? Math.max(8, (s.sessions / top) * 100) : 0;
            const Icon = meta.icon;
            return (
              <li key={s.key}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center border', c.bg, c.border)}>
                      <Icon size={13} className={c.text} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-none">{meta.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{meta.hint}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold font-mono tabular-nums">{s.sessions}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {s.fromTopPct}% of top · {s.fromPrevPct}% step
                    </p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-foreground/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', c.fill)}
                  />
                </div>
                {i < stages.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown size={11} className="text-muted-foreground/50" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
