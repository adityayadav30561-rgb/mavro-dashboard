import { motion } from 'framer-motion';
import { ListChecks, ArrowUpRight, Sparkles, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import InfoPopover from '@/components/analytics/InfoPopover';
import { getSeoInfo } from '@/lib/seoCopy';

/**
 * Refresh Queue — prioritized list of blogs needing refresh. Priority is
 * decay score × traffic potential, so blogs that historically pulled traffic
 * but have decayed surface first.
 */
export default function DecayQueueCard({ queue = [], onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <ListChecks size={14} className="text-violet-400" />
        <h3 className="text-sm font-bold tracking-tight">Refresh Queue</h3>
        {(() => {
          const i = getSeoInfo('decay_queue');
          return i && <InfoPopover title={i.title} text={i.text} size={11} />;
        })()}
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
          {queue.length} blogs prioritized
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="p-8 text-center">
          <Sparkles size={20} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-[12px] font-semibold">Refresh queue empty.</p>
          <p className="mt-1 text-[11px] text-muted-foreground">No blogs decayed past the refresh threshold (40).</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40 max-h-[420px] overflow-y-auto">
          {queue.slice(0, 12).map((r, i) => (
            <li key={r.blog._id} className="px-5 py-3 flex items-center gap-3 hover:bg-foreground/[0.025] transition-colors">
              <span className="w-7 text-[10px] font-bold font-mono text-muted-foreground tabular-nums">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate">{r.blog.title}</p>
                <p className="text-[10.5px] text-muted-foreground truncate mt-0.5">
                  {r.topRecommendation ? r.topRecommendation.label : 'Refresh content + metadata'}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[9.5px] font-mono text-muted-foreground tabular-nums">
                  <span>decay · <span className="text-rose-400">{r.score}</span></span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Flame size={9} className="text-amber-400" />{r.trafficPotential} views</span>
                  <span>·</span>
                  <span>recovery · <span className="text-emerald-400">+{r.recoveryImpact}</span></span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] font-mono font-bold tabular-nums text-violet-300">{r.priority}</span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(r.blog._id)}
                    title="Edit blog"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
                  >
                    <ArrowUpRight size={12} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
