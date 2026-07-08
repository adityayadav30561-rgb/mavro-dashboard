import { motion } from 'framer-motion';
import { Layers, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import InfoPopover from '@/components/analytics/InfoPopover';
import { getSeoInfo } from '@/lib/seoCopy';

const PALETTE = [
  'violet', 'cyan', 'emerald', 'amber', 'rose', 'blue', 'pink',
];

/**
 * Topical Cluster panel — shows automatically-detected content clusters with
 * strength, member count, and supporting-article gaps.
 */
export default function TopicalClusterPanel({ clusters = [], graph }) {
  if (!clusters.length) {
    return (
      <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden">
        <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
          <Layers size={14} className="text-violet-400" />
          <h3 className="text-sm font-bold tracking-tight">Topical Clusters</h3>
        </div>
        <p className="p-5 text-[12px] text-muted-foreground text-center">
          No topical clusters detected yet. Clusters form when 2+ blogs share strong topical overlap.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <Layers size={14} className="text-violet-400" />
        <h3 className="text-sm font-bold tracking-tight">Topical Clusters</h3>
        {(() => {
          const i = getSeoInfo('cluster_strength');
          return i && <InfoPopover title={i.title} text={i.text} size={11} />;
        })()}
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
          {clusters.length} clusters
        </span>
      </div>

      <div className="p-5">
        {/* Scrollable viewport capped at ~2 card rows — same slider pattern as
            the Orphan Pages panel. Extra clusters scroll instead of growing
            the panel unbounded. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
          {clusters.map((c, idx) => (
            <ClusterCard
              key={c.id}
              cluster={c}
              graph={graph}
              accent={PALETTE[idx % PALETTE.length]}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ClusterCard({ cluster, graph, accent }) {
  const tone = {
    violet:  { text: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  dot: 'bg-violet-400' },
    cyan:    { text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    dot: 'bg-cyan-400' },
    emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    amber:   { text: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-400' },
    rose:    { text: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    dot: 'bg-rose-400' },
    blue:    { text: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    dot: 'bg-blue-400' },
    pink:    { text: 'text-pink-300',    bg: 'bg-pink-500/10',    border: 'border-pink-500/30',    dot: 'bg-pink-400' },
  }[accent];

  // Resolve member nodes
  const members = cluster.members
    .map((id) => graph?.byId?.get(id))
    .filter(Boolean);

  // Intra-cluster link count
  const memberIds = new Set(cluster.members);
  const intraEdges = graph
    ? graph.edges.filter((e) => memberIds.has(e.source) && memberIds.has(e.target)).length
    : 0;

  // Maximum possible edges (directed) = n*(n-1)
  const maxEdges = cluster.size * (cluster.size - 1);
  const linkCohesion = maxEdges > 0 ? Math.round((intraEdges / maxEdges) * 100) : 0;
  const gap = Math.max(0, Math.round(cluster.size * 1.5) - intraEdges); // suggest ~1.5 internal links per member

  return (
    <div className={cn('rounded-xl border p-4', tone.bg, tone.border)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className={cn('text-[10px] font-bold uppercase tracking-[0.2em]', tone.text)}>
            #{cluster.label}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {cluster.size} posts · strength {Math.round(cluster.strength * 100)}%
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cohesion</p>
            {(() => {
              const i = getSeoInfo('cluster_cohesion_card');
              return i && <InfoPopover title={i.title} text={i.text} size={9} />;
            })()}
          </div>
          <p className={cn('text-base font-bold font-mono tabular-nums', tone.text)}>{linkCohesion}%</p>
        </div>
      </div>

      {/* Members */}
      <ul className="space-y-1 mb-3 max-h-[120px] overflow-y-auto pr-1">
        {members.map((n) => (
          <li key={n.id} className="flex items-center gap-2 text-[11px]">
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', tone.dot)} />
            <span className="flex-1 truncate">{n.title}</span>
            <span className="font-mono text-[9.5px] text-muted-foreground tabular-nums">
              {n.inbound}↓ {n.outbound}↑
            </span>
          </li>
        ))}
      </ul>

      {/* Gap recommendation */}
      {gap > 0 && (
        <div className="flex items-start gap-1.5 text-[10.5px] text-amber-400/90 leading-snug border-t border-border/60 pt-2">
          <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
          <span>
            Cluster is under-linked. Add ~{gap} more contextual link{gap === 1 ? '' : 's'} between these posts to strengthen topical authority.
          </span>
        </div>
      )}
      {gap === 0 && (
        <div className="flex items-start gap-1.5 text-[10.5px] text-emerald-400/90 leading-snug border-t border-border/60 pt-2">
          <ArrowRight size={10} className="mt-0.5 flex-shrink-0" />
          <span>Cluster well-linked. Consider adding new supporting articles on adjacent topics.</span>
        </div>
      )}
    </div>
  );
}
