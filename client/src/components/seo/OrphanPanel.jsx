import { motion } from 'framer-motion';
import { Ghost, AlertCircle, AlertTriangle, CheckCircle2, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import InfoPopover from '@/components/analytics/InfoPopover';
import { getSeoInfo } from '@/lib/seoCopy';

/**
 * Orphan Pages panel for the SEO Engine. Renders tenant blogs that have zero
 * inbound + zero outbound internal links, classified by severity and paired
 * with link-target recommendations.
 */
export default function OrphanPanel({ orphans = [] }) {
  const critical = orphans.filter((o) => o.severity === 'critical');
  const warning  = orphans.filter((o) => o.severity === 'warning');
  const healthy  = orphans.filter((o) => o.severity === 'healthy');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <Ghost size={14} className="text-amber-400" />
        <h3 className="text-sm font-bold tracking-tight">Orphan Pages</h3>
        {(() => {
          const i = getSeoInfo('orphan_node');
          return i && <InfoPopover title={i.title} text={i.text} size={11} />;
        })()}
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
          {orphans.length} total
        </span>
      </div>

      <div className="p-5">
        {/* Severity strip */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <SeverityTile icon={AlertCircle}    label="Critical" count={critical.length} tone="rose"    infoKey="orphan_critical" />
          <SeverityTile icon={AlertTriangle}  label="Warning"  count={warning.length}  tone="amber"   infoKey="orphan_warning" />
          <SeverityTile icon={CheckCircle2}   label="Healthy"  count={healthy.length}  tone="emerald" infoKey="orphan_healthy" />
        </div>

        {orphans.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-4">
            No orphan pages detected — every blog is reachable from at least one internal link.
          </p>
        ) : (
          <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {orphans.map((o) => (
              <OrphanRow key={o.id} orphan={o} />
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

function OrphanRow({ orphan }) {
  const sevMeta = {
    critical: { tone: 'rose',    Icon: AlertCircle,   label: 'Critical' },
    warning:  { tone: 'amber',   Icon: AlertTriangle, label: 'Warning'  },
    healthy:  { tone: 'emerald', Icon: CheckCircle2,  label: 'Healthy'  },
  }[orphan.severity] || { tone: 'muted', Icon: Ghost, label: 'Unknown' };

  const sevClasses = {
    rose:    'text-rose-300 bg-rose-500/10 border-rose-500/30',
    amber:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  }[sevMeta.tone];

  return (
    <li className="rounded-lg border border-border/60 bg-foreground/[0.025] p-3">
      <div className="flex items-start gap-2.5">
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] border flex-shrink-0', sevClasses)}>
          <sevMeta.Icon size={9} />
          {sevMeta.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold truncate">{orphan.blog.title}</p>
          <p className="mt-0.5 text-[10px] font-mono text-muted-foreground tabular-nums">
            {orphan.wc}w · {orphan.ageDays}d old · /{orphan.blog.slug}
          </p>
        </div>
      </div>

      {orphan.recommendedTargets && orphan.recommendedTargets.length > 0 && (
        <div className="mt-2.5 pl-1">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 flex items-center gap-1">
            <Link2 size={9} className="text-cyan-400" />
            Suggest linking from
          </p>
          <ul className="space-y-1">
            {orphan.recommendedTargets.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-[11px]">
                <span className="flex-1 truncate">{t.title}</span>
                <span className="font-mono text-[10px] text-cyan-400/80">{t.similarity}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function SeverityTile({ icon: Icon, label, count, tone, infoKey }) {
  const classes = {
    rose:    'text-rose-300 bg-rose-500/10 border-rose-500/30',
    amber:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  }[tone];
  const info = infoKey ? getSeoInfo(infoKey) : null;
  return (
    <div className={cn('rounded-lg px-3 py-2 border', classes)}>
      <div className="flex items-center gap-1.5">
        <Icon size={11} />
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] flex-1">{label}</p>
        {info && <InfoPopover title={info.title} text={info.text} size={9} />}
      </div>
      <p className="mt-1 text-lg font-bold font-mono tabular-nums">{count}</p>
    </div>
  );
}
