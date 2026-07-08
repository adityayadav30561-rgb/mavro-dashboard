import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Crown, ArrowDownRight, ArrowUpRight, Ghost, ChevronDown, ChevronRight, List, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import InfoPopover from '@/components/analytics/InfoPopover';
import { getSeoInfo } from '@/lib/seoCopy';

/**
 * Content Relationship Board — replaces the old SVG node-scatter graph.
 *
 * Each REAL connected component (posts joined by actual internal links)
 * renders as a cluster card: the highest-degree post sits on top as the hub,
 * every other member nests beneath it at its BFS depth with tree connector
 * lines. Per-row inbound/outbound counts + hover reveal of link targets make
 * the structure actionable, not just visible. Zero-link posts collect in a
 * separate "Unlinked" tray so the retro-linking backlog stays obvious without
 * polluting the linked structure.
 *
 * Scales linearly — readable at 5 posts or 500 (cards scroll internally).
 */
const CLUSTER_PALETTE = [
  { text: 'text-violet-400',  border: 'border-violet-500/40',  bg: 'bg-violet-500/[0.06]',  line: 'border-violet-500/30',  hex: '#a78bfa' },
  { text: 'text-cyan-400',    border: 'border-cyan-500/40',    bg: 'bg-cyan-500/[0.06]',    line: 'border-cyan-500/30',    hex: '#22d3ee' },
  { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/[0.06]', line: 'border-emerald-500/30', hex: '#34d399' },
  { text: 'text-amber-400',   border: 'border-amber-500/40',   bg: 'bg-amber-500/[0.06]',   line: 'border-amber-500/30',   hex: '#fbbf24' },
  { text: 'text-rose-400',    border: 'border-rose-500/40',    bg: 'bg-rose-500/[0.06]',    line: 'border-rose-500/30',    hex: '#fb7185' },
  { text: 'text-blue-400',    border: 'border-blue-500/40',    bg: 'bg-blue-500/[0.06]',    line: 'border-blue-500/30',    hex: '#60a5fa' },
];

export default function LinkGraph({ graph, clusters, quality }) {
  const [showOrphans, setShowOrphans] = useState(false);

  // ---- derive connected components + BFS trees from the real edge list ----
  const { components, orphans } = useMemo(() => {
    const adj = new Map(graph.nodes.map((n) => [n.id, new Set()]));
    const outTargets = new Map(graph.nodes.map((n) => [n.id, []]));
    for (const e of graph.edges) {
      adj.get(e.source)?.add(e.target);
      adj.get(e.target)?.add(e.source);
      outTargets.get(e.source)?.push(e.target);
    }
    const degree = (id) => adj.get(id)?.size || 0;
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));

    const seen = new Set();
    const comps = [];
    for (const n of graph.nodes) {
      if (seen.has(n.id) || degree(n.id) === 0) continue;
      // BFS the component
      const ids = [];
      const queue = [n.id];
      seen.add(n.id);
      while (queue.length) {
        const id = queue.shift();
        ids.push(id);
        for (const next of adj.get(id) || []) {
          if (!seen.has(next)) { seen.add(next); queue.push(next); }
        }
      }
      // hub = highest degree; tree rows = BFS depth from hub
      const idSet = new Set(ids);
      const hubId = [...ids].sort((a, b) => degree(b) - degree(a))[0];
      const depth = new Map([[hubId, 0]]);
      const q = [hubId];
      while (q.length) {
        const id = q.shift();
        for (const next of adj.get(id) || []) {
          if (!depth.has(next) && idSet.has(next)) {
            depth.set(next, depth.get(id) + 1);
            q.push(next);
          }
        }
      }
      const rows = ids
        .map((id) => ({
          node: byId.get(id),
          depth: depth.get(id) ?? 1,
          isHub: id === hubId,
          linksTo: (outTargets.get(id) || []).map((t) => byId.get(t)?.title).filter(Boolean),
        }))
        .sort((a, b) => (a.depth - b.depth) || (b.node.inbound - a.node.inbound));

      const edgeList = graph.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
      comps.push({ hubId, rows, size: ids.length, edges: edgeList.length, edgeList });
    }
    comps.sort((a, b) => b.size - a.size);

    const orphanNodes = graph.nodes.filter((n) => degree(n.id) === 0);
    return { components: comps, orphans: orphanNodes };
  }, [graph]);

  if (!graph.nodes.length) {
    return (
      <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-6 text-center">
        <Network size={20} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-[12px] text-muted-foreground">No blogs in scope. Add published posts to see the relationship board.</p>
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
        <h3 className="text-sm font-bold tracking-tight">Content Relationship Board</h3>
        {(() => {
          const i = getSeoInfo('section_internal_linking');
          return i && <InfoPopover title={i.title} text={i.text} size={11} />;
        })()}
        <div className="ml-auto flex items-center gap-3 text-[10px] font-mono text-muted-foreground tabular-nums">
          <span>{components.length} linked {components.length === 1 ? 'group' : 'groups'}</span>
          <span>·</span>
          <span>{graph.edges.length} links</span>
          <span>·</span>
          <span>{orphans.length} unlinked</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {components.length === 0 && (
          <p className="text-[12px] text-muted-foreground text-center py-3">
            No internal links between posts yet — every post is unlinked. Start by linking related posts to each other.
          </p>
        )}

        {/* Linked groups — two-column masonry-ish grid, cards scroll internally */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {components.map((comp, idx) => (
            <ClusterCard key={comp.hubId} comp={comp} palette={CLUSTER_PALETTE[idx % CLUSTER_PALETTE.length]} />
          ))}
        </div>

        {/* Unlinked tray */}
        {orphans.length > 0 && (
          <div className="rounded-xl border border-dashed border-border/70 bg-foreground/[0.015]">
            <button
              type="button"
              onClick={() => setShowOrphans((s) => !s)}
              className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-foreground/[0.03] transition-colors rounded-xl"
            >
              <Ghost size={13} className="text-rose-400/80" />
              <span className="text-[12px] font-semibold">Unlinked posts</span>
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{orphans.length}</span>
              <span className="text-[10px] text-muted-foreground ml-1 hidden sm:inline">— not yet part of any linked group</span>
              {showOrphans
                ? <ChevronDown size={13} className="ml-auto text-muted-foreground" />
                : <ChevronRight size={13} className="ml-auto text-muted-foreground" />}
            </button>
            {showOrphans && (
              <ul className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 max-h-[220px] overflow-y-auto">
                {orphans.map((n) => (
                  <li key={n.id} className="flex items-center gap-2 text-[11px] text-muted-foreground min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/60 flex-shrink-0" />
                    <span className="truncate">{n.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Footer strip */}
        <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-muted-foreground pt-1">
          <span className="inline-flex items-center gap-1.5">
            <Crown size={11} className="text-emerald-400" />
            <span>Hub — most-linked post in its group</span>
            {(() => {
              const i = getSeoInfo('hub_node');
              return i && <InfoPopover title={i.title} text={i.text} size={9} />;
            })()}
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowDownRight size={10} className="text-cyan-400" /> inbound
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowUpRight size={10} className="text-violet-400" /> outbound
          </span>
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

function ClusterCard({ comp, palette }) {
  const hub = comp.rows.find((r) => r.isHub);
  const [view, setView] = useState('list'); // 'list' | 'map'
  return (
    <div className={cn('rounded-xl border overflow-hidden', palette.border, palette.bg)}>
      {/* Hub header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-border/50">
        <div className="flex items-center gap-1.5 mb-1">
          <Crown size={11} className={palette.text} />
          <span className={cn('text-[9px] font-bold uppercase tracking-[0.2em]', palette.text)}>Hub</span>
          <span className="ml-auto text-[9.5px] font-mono text-muted-foreground tabular-nums">
            {comp.size} posts · {comp.edges} links
          </span>
          <button
            type="button"
            onClick={() => setView((v) => (v === 'list' ? 'map' : 'list'))}
            className={cn(
              'ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[9px] font-bold uppercase tracking-[0.12em] transition-colors',
              view === 'map'
                ? cn(palette.border, palette.text, 'bg-foreground/[0.04]')
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
            )}
            title={view === 'list' ? 'Switch to visual map' : 'Switch to list'}
          >
            {view === 'list' ? <Share2 size={9} /> : <List size={9} />}
            {view === 'list' ? 'Map' : 'List'}
          </button>
        </div>
        <p className="text-[12.5px] font-bold leading-snug">{hub?.node.title}</p>
        <RowCounts node={hub?.node} />
      </div>

      {view === 'list' ? (
        /* Member tree */
        <ul className="px-3 py-2 max-h-[300px] overflow-y-auto">
          {comp.rows.filter((r) => !r.isHub).map((r) => (
            <MemberRow key={r.node.id} row={r} palette={palette} />
          ))}
        </ul>
      ) : (
        <ClusterMap comp={comp} palette={palette} />
      )}
    </div>
  );
}

/**
 * Per-group radial map — the one scale where node-edge visuals work.
 * Hub centered, members on BFS-depth rings, directional arrows on edges,
 * labels under every node (small groups = labels always fit).
 */
function ClusterMap({ comp, palette }) {
  const [hoverId, setHoverId] = useState(null);
  const W = 460;
  const H = comp.size > 12 ? 400 : 300;

  const positions = useMemo(() => {
    const cx = W / 2;
    const cy = H / 2;
    const maxDepth = Math.max(1, ...comp.rows.map((r) => r.depth));
    const maxR = Math.min(W, H) / 2 - 42;
    const pos = new Map();
    // group by depth
    const rings = new Map();
    for (const r of comp.rows) {
      if (r.isHub) { pos.set(r.node.id, { x: cx, y: cy }); continue; }
      if (!rings.has(r.depth)) rings.set(r.depth, []);
      rings.get(r.depth).push(r);
    }
    for (const [d, rows] of rings) {
      const rr = (maxR * d) / maxDepth;
      rows.forEach((r, j) => {
        const a = (j / rows.length) * Math.PI * 2 + d * 2.399963 - Math.PI / 2;
        pos.set(r.node.id, { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
      });
    }
    return pos;
  }, [comp, W, H]);

  const markerId = `arrow-${comp.hubId}`;

  return (
    <div className="p-2">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block">
        <defs>
          <marker id={markerId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" fill={palette.hex} fillOpacity="0.55" />
          </marker>
        </defs>

        {/* Edges — direction = who links to whom */}
        {comp.edgeList.map((e, i) => {
          const a = positions.get(e.source);
          const b = positions.get(e.target);
          if (!a || !b) return null;
          const active = hoverId && (e.source === hoverId || e.target === hoverId);
          // stop the line at the node edge so arrowheads stay visible
          const dx = b.x - a.x; const dy = b.y - a.y;
          const len = Math.max(1, Math.hypot(dx, dy));
          const tx = b.x - (dx / len) * 11;
          const ty = b.y - (dy / len) * 11;
          const mx = (a.x + tx) / 2 + (dy / len) * 10;
          const my = (a.y + ty) / 2 - (dx / len) * 10;
          return (
            <path
              key={i}
              d={`M ${a.x} ${a.y} Q ${mx} ${my} ${tx} ${ty}`}
              stroke={palette.hex}
              strokeOpacity={active ? 0.9 : hoverId ? 0.08 : 0.3}
              strokeWidth={active ? 1.8 : 1}
              fill="none"
              markerEnd={`url(#${markerId})`}
            />
          );
        })}

        {/* Nodes + labels */}
        {comp.rows.map((r) => {
          const p = positions.get(r.node.id);
          if (!p) return null;
          const radius = r.isHub ? 10 : 6;
          const dimmed = hoverId && hoverId !== r.node.id &&
            !comp.edgeList.some((e) => (e.source === hoverId && e.target === r.node.id) || (e.target === hoverId && e.source === r.node.id));
          return (
            <g
              key={r.node.id}
              opacity={dimmed ? 0.25 : 1}
              onMouseEnter={() => setHoverId(r.node.id)}
              onMouseLeave={() => setHoverId(null)}
              style={{ cursor: 'default', transition: 'opacity 0.15s' }}
            >
              <circle cx={p.x} cy={p.y} r={radius + 3} fill={palette.hex} opacity={0.16} />
              <circle
                cx={p.x} cy={p.y} r={radius}
                fill={palette.hex}
                fillOpacity={r.isHub ? 0.95 : 0.7}
                stroke={r.isHub ? '#34d399' : palette.hex}
                strokeWidth={r.isHub ? 2 : 1}
              />
              {/* label with halo */}
              <text x={p.x} y={p.y + radius + 11} textAnchor="middle" stroke="hsl(var(--card))" strokeWidth={3} strokeLinejoin="round" style={{ fontSize: 8.5, fontWeight: 600 }}>
                {truncate(r.node.title, r.isHub ? 40 : 26)}
              </text>
              <text x={p.x} y={p.y + radius + 11} textAnchor="middle" className="fill-foreground" style={{ fontSize: 8.5, fontWeight: 600 }}>
                {truncate(r.node.title, r.isHub ? 40 : 26)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="px-2 pb-1 text-[9.5px] text-muted-foreground">
        Arrows point from the linking post to the linked post. Hover a node to isolate its connections.
      </p>
    </div>
  );
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function MemberRow({ row, palette }) {
  const [open, setOpen] = useState(false);
  const indent = Math.min(3, row.depth - 1) * 16;
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-foreground/[0.03] rounded-md px-1 transition-colors min-w-0"
        style={{ paddingLeft: 4 + indent }}
        title={row.node.title}
      >
        <span className={cn('flex-shrink-0 w-3 border-t', palette.line)} aria-hidden />
        <span className="flex-1 truncate text-[11.5px]">{row.node.title}</span>
        <RowCounts node={row.node} compact />
      </button>
      {open && row.linksTo.length > 0 && (
        <ul className="pb-1.5 space-y-0.5" style={{ paddingLeft: 30 + indent }}>
          {row.linksTo.map((t, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0">
              <ArrowUpRight size={9} className="text-violet-400/70 flex-shrink-0" />
              <span className="truncate">links to · {t}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function RowCounts({ node, compact = false }) {
  if (!node) return null;
  return (
    <span className={cn('flex items-center gap-2 font-mono tabular-nums flex-shrink-0', compact ? 'text-[9.5px]' : 'text-[10px] mt-1')}>
      <span className="inline-flex items-center gap-0.5 text-cyan-400/90">
        <ArrowDownRight size={compact ? 9 : 10} />{node.inbound}
      </span>
      <span className="inline-flex items-center gap-0.5 text-violet-400/90">
        <ArrowUpRight size={compact ? 9 : 10} />{node.outbound}
      </span>
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
