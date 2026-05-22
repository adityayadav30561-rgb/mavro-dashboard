import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { layoutGraph } from '@/lib/linkGraphIntel';
import InfoPopover from '@/components/analytics/InfoPopover';
import { getSeoInfo } from '@/lib/seoCopy';

/**
 * Content Relationship Graph — SVG-rendered node/edge map of the tenant
 * blog corpus. Pure deterministic layout (no force simulation jitter).
 *
 * Color encoding:
 *   - cluster-tinted nodes (rotating hue palette)
 *   - orphans rendered with rose ring
 *   - hubs rendered larger with emerald ring
 *   - edges as curved paths with low opacity
 */
const CLUSTER_PALETTE = [
  '#a78bfa', '#22d3ee', '#34d399', '#fbbf24', '#f472b6',
  '#fb7185', '#60a5fa', '#c084fc', '#2dd4bf', '#facc15',
];

export default function LinkGraph({ graph, clusters, quality }) {
  const [expanded, setExpanded] = useState(false);
  const [hoverId, setHoverId] = useState(null);

  const width = 720;
  const height = expanded ? 560 : 420;

  const positions = useMemo(
    () => layoutGraph(graph.nodes, clusters, { width, height }),
    [graph.nodes, clusters, width, height]
  );

  const clusterColor = useMemo(() => {
    const m = new Map();
    clusters.forEach((c, i) => m.set(c.id, CLUSTER_PALETTE[i % CLUSTER_PALETTE.length]));
    return m;
  }, [clusters]);

  if (!graph.nodes.length) {
    return (
      <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-6 text-center">
        <Network size={20} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-[12px] text-muted-foreground">No blogs in scope. Add published posts to see the relationship graph.</p>
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
        <Network size={14} className="text-cyan-400" />
        <h3 className="text-sm font-bold tracking-tight">Content Relationship Graph</h3>
        {(() => {
          const i = getSeoInfo('section_internal_linking');
          return i && <InfoPopover title={i.title} text={i.text} size={11} />;
        })()}
        <div className="ml-auto flex items-center gap-3 text-[10px] font-mono text-muted-foreground tabular-nums">
          <span>{graph.nodes.length} nodes</span>
          <span>·</span>
          <span>{graph.edges.length} edges</span>
          <span>·</span>
          <span>{clusters.length} clusters</span>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="ml-2 p-1.5 rounded-md hover:bg-foreground/[0.05] text-muted-foreground hover:text-foreground transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-foreground/[0.02]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height={height}
            className="block"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Radial backdrop glow */}
            <defs>
              <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--card))" stopOpacity="0.0" />
                <stop offset="100%" stopColor="hsl(var(--card))" stopOpacity="0.4" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width={width} height={height} fill="url(#bg-glow)" />

            {/* Edges */}
            <g>
              {graph.edges.map((e, i) => {
                const a = positions.get(e.source);
                const b = positions.get(e.target);
                if (!a || !b) return null;
                const isActive = hoverId && (e.source === hoverId || e.target === hoverId);
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2 - 12;
                return (
                  <motion.path
                    key={i}
                    d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                    stroke={isActive ? '#22d3ee' : 'hsl(var(--muted-foreground))'}
                    strokeOpacity={isActive ? 0.95 : 0.25}
                    strokeWidth={isActive ? 1.5 : 0.9}
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: Math.min(0.5, i * 0.005) }}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {graph.nodes.map((n, i) => {
                const p = positions.get(n.id);
                if (!p) return null;
                const color = clusterColor.get(n.cluster) || '#94a3b8';
                const radius = n.isHub ? 8 : Math.max(4, 4 + n.inbound);
                const ringColor = n.isOrphan ? '#fb7185' : n.isHub ? '#34d399' : color;
                const isHover = hoverId === n.id;

                return (
                  <g key={n.id}>
                    <motion.circle
                      cx={p.x}
                      cy={p.y}
                      r={radius + 4}
                      fill={ringColor}
                      opacity={isHover ? 0.35 : 0.18}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: Math.min(0.5, i * 0.008) }}
                    />
                    <motion.circle
                      cx={p.x}
                      cy={p.y}
                      r={radius}
                      fill={color}
                      stroke={ringColor}
                      strokeWidth={isHover ? 2 : 1}
                      onMouseEnter={() => setHoverId(n.id)}
                      onMouseLeave={() => setHoverId(null)}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 20, delay: Math.min(0.5, i * 0.008) }}
                      style={{ cursor: 'pointer' }}
                    />
                    {(isHover || n.isHub) && (
                      <text
                        x={p.x}
                        y={p.y - radius - 6}
                        textAnchor="middle"
                        className="fill-foreground"
                        style={{ fontSize: 10, fontWeight: 600, pointerEvents: 'none' }}
                      >
                        {truncate(n.title, 36)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10.5px] text-muted-foreground">
          <LegendDot color="#34d399" label="Hub" infoKey="hub_node" />
          <LegendDot color="#fb7185" label="Orphan" infoKey="orphan_node" />
          {clusters.slice(0, 4).map((c) => (
            <LegendDot key={c.id} color={clusterColor.get(c.id)} label={`#${c.label}`} />
          ))}
          {quality && (
            <span className="ml-auto font-mono">
              Linking score · <span className={cn('font-bold', qualityTone(quality.score))}>{quality.score}</span> ({quality.letter})
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LegendDot({ color, label, infoKey }) {
  const info = infoKey ? getSeoInfo(infoKey) : null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span>{label}</span>
      {info && <InfoPopover title={info.title} text={info.text} size={9} />}
    </span>
  );
}

function qualityTone(score) {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 75) return 'text-cyan-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-rose-400';
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
