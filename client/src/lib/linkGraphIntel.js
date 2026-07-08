// ===================================
// Link Graph Intelligence
// ===================================
// Cross-corpus internal-linking analytics for the SEO Engine.
//
// Pure functions, no React, no fetches. Caller passes a tenant-scoped blog
// corpus and the resolved tenant site path.
//
// Capabilities:
//   - Build directed link graph (nodes + edges)
//   - Detect outbound + inbound counts per blog
//   - Classify orphans (zero inbound + outbound) and hubs (high inbound)
//   - Cluster blogs by topical similarity (token Jaccard, single-link)
//   - Compute corpus-level Internal Linking Quality score
//
// Multi-tenant: caller's responsibility to pre-filter corpus by tenant.

import { extractHeadings, extractLinks } from './seoReadability';

const STOP = new Set([
  'the','a','an','and','or','but','if','then','than','that','this','these','those',
  'is','are','was','were','be','been','being','am','do','does','did','have','has','had',
  'of','in','on','at','to','for','from','with','by','as','into','about','over','under',
  'i','you','he','she','it','we','they','them','my','your','our','their','its',
  'not','no','so','too','also','very','just','only','more','most','some','any','all',
  'can','will','would','should','could','may','might','must','here','there',
  'what','which','who','how','why','when','where','use','using','used','make','made',
]);

function tokenize(text) {
  return (String(text).toLowerCase().match(/\b[a-z][a-z'-]{1,}\b/g) || [])
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function signatureTokens(blog) {
  const seg = [
    blog.title || '',
    blog.seoTitle || '',
    (blog.tags || []).join(' '),
    (blog.keywords || []).join(' '),
    extractHeadings(blog.content || '').map((h) => h.text).join(' '),
  ].join(' ');
  return new Set(tokenize(seg));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

// Slug fragment from an internal href like '/blog/employee-onboarding'.
// Tolerates WordPress-style trailing slashes ('/employee-onboarding/') —
// without the strip, every WP permalink failed the match and the graph
// rendered 0 edges for WordPress-backed tenants.
function slugFromHref(href) {
  const clean = String(href).split('#')[0].split('?')[0].replace(/\/+$/, '');
  const m = clean.match(/\/([^\/]+)$/);
  return m ? m[1].toLowerCase() : '';
}

// ===================================
// Build directed graph
// ===================================
export function buildLinkGraph(corpus) {
  const blogs = Array.isArray(corpus) ? corpus.filter(Boolean) : [];
  const bySlug = new Map();
  for (const b of blogs) if (b.slug) bySlug.set(String(b.slug).toLowerCase(), b);

  const nodes = blogs.map((b, i) => ({
    id: String(b._id || b.slug || i),
    blog: b,
    slug: String(b.slug || '').toLowerCase(),
    title: b.title || b.seoTitle || 'untitled',
    inbound: 0,
    outbound: 0,
    cluster: null,
    isOrphan: false,
    isHub: false,
    tokens: signatureTokens(b),
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nodeBySlug = new Map(nodes.map((n) => [n.slug, n]));

  const edges = [];
  for (const node of nodes) {
    const { internal } = extractLinks(node.blog.content || '');
    for (const href of internal) {
      const targetSlug = slugFromHref(href);
      if (!targetSlug) continue;
      const targetNode = nodeBySlug.get(targetSlug);
      if (!targetNode || targetNode.id === node.id) continue;
      edges.push({ source: node.id, target: targetNode.id, href });
      node.outbound++;
      targetNode.inbound++;
    }
  }

  // Classify
  const inboundCounts = nodes.map((n) => n.inbound).filter((c) => c > 0);
  const avgInbound = inboundCounts.length
    ? inboundCounts.reduce((s, c) => s + c, 0) / inboundCounts.length
    : 0;
  for (const n of nodes) {
    n.isOrphan = n.inbound === 0 && n.outbound === 0;
    n.isHub    = n.inbound >= Math.max(2, Math.ceil(avgInbound * 1.5));
  }

  return { nodes, edges, byId };
}

// ===================================
// Topical clustering — single-link agglomerative
// ===================================
// Two blogs join the same cluster if their signature Jaccard >= threshold.
// Uses union-find for O(n²) pairwise + path-compressed merges.
export function buildClusters(nodes, threshold = 0.18) {
  const n = nodes.length;
  if (n === 0) return { clusters: [], labelByNode: new Map() };

  const parent = nodes.map((_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
    return i;
  };
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = jaccard(nodes[i].tokens, nodes[j].tokens);
      if (sim >= threshold) union(i, j);
    }
  }

  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(nodes[i]);
  }

  const clusters = [...groups.values()]
    .filter((g) => g.length >= 2) // singletons are not clusters
    .map((group, idx) => {
      // Cluster label = most common high-value token in the group
      const freq = new Map();
      for (const g of group) for (const t of g.tokens) freq.set(t, (freq.get(t) || 0) + 1);
      const sortedTerms = [...freq.entries()]
        .filter(([, c]) => c >= Math.ceil(group.length / 2))
        .sort((a, b) => b[1] - a[1]);
      const label = sortedTerms[0]?.[0] || `cluster-${idx + 1}`;

      // Cluster strength = average pairwise Jaccard
      let pairs = 0, sum = 0;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          sum += jaccard(group[i].tokens, group[j].tokens);
          pairs++;
        }
      }
      const strength = pairs ? sum / pairs : 0;

      // Internal link cohesion within cluster — % of internal edges that stay in cluster
      // (computed later in the linkingQuality call to avoid coupling here)

      // Tag each node
      const id = `cluster-${idx + 1}`;
      for (const g of group) g.cluster = id;

      return {
        id,
        label,
        size: group.length,
        strength: Number(strength.toFixed(3)),
        members: group.map((g) => g.id),
      };
    })
    .sort((a, b) => b.size - a.size);

  // Build labelByNode for fast lookup
  const labelByNode = new Map();
  for (const c of clusters) for (const m of c.members) labelByNode.set(m, c.id);

  return { clusters, labelByNode };
}

// ===================================
// Internal Linking Quality — corpus-level score
// ===================================
// 5 sub-signals, equally weighted into a 0–100 corpus score:
//   1. Avg internal links per article  (target ≥3)
//   2. Orphan rate (lower better)
//   3. Anchor diversity (unique anchors / total anchors)
//   4. Cluster cohesion (intra-cluster edges / total edges)
//   5. Coverage (% nodes with ≥1 inbound)
export function computeLinkingQuality(graph, clusters) {
  const { nodes, edges } = graph;
  if (nodes.length === 0) {
    return {
      score: 0,
      letter: 'F',
      signals: { avgOutbound: 0, orphanRate: 1, anchorDiversity: 0, clusterCohesion: 0, coverage: 0 },
      details: { totalNodes: 0, totalEdges: 0, orphans: 0, hubs: 0, clusters: 0 },
    };
  }

  // 1. avg outbound
  const avgOutbound = edges.length / nodes.length;
  const sig1 = Math.min(100, Math.round((avgOutbound / 3) * 100));

  // 2. orphan rate
  const orphans = nodes.filter((n) => n.isOrphan).length;
  const orphanRate = orphans / nodes.length;
  const sig2 = Math.round((1 - orphanRate) * 100);

  // 3. anchor diversity — count anchors across corpus
  const anchorFreq = new Map();
  let totalAnchors = 0;
  for (const n of nodes) {
    const re = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
    const html = n.blog.content || '';
    let m;
    while ((m = re.exec(html)) !== null) {
      const text = String(m[1]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!text) continue;
      anchorFreq.set(text, (anchorFreq.get(text) || 0) + 1);
      totalAnchors++;
    }
  }
  const anchorDiversity = totalAnchors > 0 ? anchorFreq.size / totalAnchors : 1;
  const sig3 = Math.round(anchorDiversity * 100);

  // 4. cluster cohesion
  const clusterByNode = new Map();
  for (const c of clusters) for (const m of c.members) clusterByNode.set(m, c.id);
  let intra = 0;
  for (const e of edges) {
    const ca = clusterByNode.get(e.source);
    const cb = clusterByNode.get(e.target);
    if (ca && cb && ca === cb) intra++;
  }
  const clusterCohesion = edges.length > 0 ? intra / edges.length : 0;
  const sig4 = Math.round(clusterCohesion * 100);

  // 5. coverage
  const withInbound = nodes.filter((n) => n.inbound > 0).length;
  const coverage = withInbound / nodes.length;
  const sig5 = Math.round(coverage * 100);

  const score = Math.round((sig1 + sig2 + sig3 + sig4 + sig5) / 5);
  const letter = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return {
    score,
    letter,
    signals: {
      avgOutbound: Number(avgOutbound.toFixed(2)),
      orphanRate: Number(orphanRate.toFixed(3)),
      anchorDiversity: Number(anchorDiversity.toFixed(3)),
      clusterCohesion: Number(clusterCohesion.toFixed(3)),
      coverage: Number(coverage.toFixed(3)),
    },
    subScores: { sig1, sig2, sig3, sig4, sig5 },
    details: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      orphans,
      hubs: nodes.filter((n) => n.isHub).length,
      clusters: clusters.length,
    },
  };
}

// ===================================
// Force-ish layout (deterministic, lightweight)
// ===================================
// Cheap circular/cluster layout. Not a true force simulation — fast, stable,
// no animation jitter, works for up to ~150 nodes which covers tenant scale.
//
// Approach:
//   - Each cluster placed on its own ring around the canvas centre
//   - Cluster centre angle distributed evenly
//   - Members positioned in a circle around their cluster centre
//   - Orphans placed at outer ring
/**
 * Deterministic component-based layout.
 *
 * The old single-ring layout put clusters, connected nodes, and orphans on
 * overlapping circles — every edge crossed the middle and 30+ orphans turned
 * the ring into noise. This version:
 *   1. Splits the graph into REAL connected components (by edges, not token
 *      clusters) and gives each its own region — edges never cross between
 *      component islands because none exist.
 *   2. Lays each component out radially: highest-degree node (the hub) at the
 *      center, neighbours on BFS-depth rings around it.
 *   3. Parks all zero-link orphans in a compact grid band at the bottom,
 *      visually separated so they read as "not yet linked" instead of noise.
 *
 * Accepts either a graph object ({nodes, edges}) or a bare nodes array
 * (legacy signature — degrades to orphan-band-only layout).
 */
export function layoutGraph(graphOrNodes, clusters, { width = 600, height = 400 } = {}) {
  const nodes = Array.isArray(graphOrNodes) ? graphOrNodes : (graphOrNodes?.nodes || []);
  const edges = Array.isArray(graphOrNodes) ? [] : (graphOrNodes?.edges || []);
  const positions = new Map();
  if (!nodes.length) return positions;

  // ---- adjacency + degree ----
  const adj = new Map(nodes.map((n) => [n.id, new Set()]));
  for (const e of edges) {
    adj.get(e.source)?.add(e.target);
    adj.get(e.target)?.add(e.source);
  }
  const degree = (id) => adj.get(id)?.size || 0;

  const connected = nodes.filter((n) => degree(n.id) > 0);
  const orphans = nodes.filter((n) => degree(n.id) === 0);

  // ---- connected components via BFS ----
  const seen = new Set();
  const components = [];
  for (const n of connected) {
    if (seen.has(n.id)) continue;
    const comp = [];
    const queue = [n.id];
    seen.add(n.id);
    while (queue.length) {
      const id = queue.shift();
      comp.push(id);
      for (const next of adj.get(id) || []) {
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    components.push(comp);
  }
  components.sort((a, b) => b.length - a.length);

  // ---- region split: components on top, orphan band at bottom ----
  const pad = 26;
  const orphanRows = orphans.length ? Math.ceil(orphans.length / Math.floor((width - pad * 2) / 30)) : 0;
  const bandH = orphans.length ? Math.min(height * 0.32, 24 + orphanRows * 26) : 0;
  const topH = height - bandH;

  // ---- pack component circles into the top region (row packing) ----
  const comps = components.map((ids) => ({
    ids,
    r: Math.max(30, 16 + 13 * Math.sqrt(ids.length)),
  }));

  // Row-pack at natural size first
  let x = 0; let y = 0; let rowMaxR = 0; let usedW = 0; let usedH = 0;
  const centers = [];
  for (const c of comps) {
    if (x + c.r * 2 > width - pad * 2 && x > 0) {
      x = 0;
      y += rowMaxR * 2 + 14;
      rowMaxR = 0;
    }
    centers.push({ cx: x + c.r, cy: y + c.r });
    x += c.r * 2 + 14;
    rowMaxR = Math.max(rowMaxR, c.r);
    usedW = Math.max(usedW, x);
    usedH = Math.max(usedH, y + rowMaxR * 2);
  }
  // Scale-to-fit + center within top region
  const scale = Math.min(1, (width - pad * 2) / Math.max(1, usedW), (topH - pad * 2) / Math.max(1, usedH));
  const offX = (width - usedW * scale) / 2;
  const offY = (topH - usedH * scale) / 2;

  comps.forEach((c, i) => {
    const ccx = offX + centers[i].cx * scale;
    const ccy = offY + centers[i].cy * scale;
    const R = c.r * scale;

    // hub = highest total degree in the component
    const idSet = new Set(c.ids);
    const sorted = [...c.ids].sort((a, b) => degree(b) - degree(a));
    const hubId = sorted[0];

    // BFS depths from hub
    const depth = new Map([[hubId, 0]]);
    const q = [hubId];
    let maxDepth = 0;
    while (q.length) {
      const id = q.shift();
      for (const next of adj.get(id) || []) {
        if (!depth.has(next) && idSet.has(next)) {
          depth.set(next, depth.get(id) + 1);
          maxDepth = Math.max(maxDepth, depth.get(next));
          q.push(next);
        }
      }
    }

    positions.set(hubId, { x: ccx, y: ccy });
    // group by depth ring
    const rings = new Map();
    for (const id of c.ids) {
      if (id === hubId) continue;
      const d = depth.get(id) ?? maxDepth + 1;
      if (!rings.has(d)) rings.set(d, []);
      rings.get(d).push(id);
    }
    const ringCount = Math.max(1, rings.size);
    let ringIdx = 0;
    for (const [, ids] of [...rings.entries()].sort((a, b) => a[0] - b[0])) {
      ringIdx += 1;
      const rr = (R * ringIdx) / (ringCount + 0.2);
      ids.forEach((id, j) => {
        // golden-angle offset keeps consecutive rings from aligning
        const a = (j / ids.length) * Math.PI * 2 + ringIdx * 2.399963;
        positions.set(id, { x: ccx + Math.cos(a) * rr, y: ccy + Math.sin(a) * rr });
      });
    }
  });

  // ---- orphan band: compact grid at the bottom ----
  if (orphans.length) {
    const cols = Math.max(1, Math.floor((width - pad * 2) / 30));
    orphans.forEach((n, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const rowCount = Math.min(cols, orphans.length - row * cols);
      const rowW = rowCount * 30;
      positions.set(n.id, {
        x: (width - rowW) / 2 + col * 30 + 15,
        y: topH + 20 + row * 26,
        inOrphanBand: true,
      });
    });
  }

  return positions;
}

/** Y coordinate where the orphan band starts (for the divider line). */
export function orphanBandTop(graphOrNodes, { width = 600, height = 400 } = {}) {
  const nodes = Array.isArray(graphOrNodes) ? graphOrNodes : (graphOrNodes?.nodes || []);
  const edges = Array.isArray(graphOrNodes) ? [] : (graphOrNodes?.edges || []);
  const linked = new Set();
  for (const e of edges) { linked.add(e.source); linked.add(e.target); }
  const orphanCount = nodes.filter((n) => !linked.has(n.id)).length;
  if (!orphanCount) return null;
  const pad = 26;
  const rows = Math.ceil(orphanCount / Math.floor((width - pad * 2) / 30));
  const bandH = Math.min(height * 0.32, 24 + rows * 26);
  return height - bandH;
}

// ===================================
// Public: full graph analysis bundle
// ===================================
export function analyzeLinkGraph(corpus) {
  const graph = buildLinkGraph(corpus);
  const { clusters, labelByNode } = buildClusters(graph.nodes);
  const quality = computeLinkingQuality(graph, clusters);

  // Orphan severity classification
  const orphans = graph.nodes
    .filter((n) => n.isOrphan)
    .map((n) => {
      const wc = (String(n.blog.content || '').replace(/<[^>]+>/g, ' ').match(/\b[\w'-]+\b/g) || []).length;
      const ageDays = ageInDays(n.blog.publishedAt || n.blog.createdAt);
      // critical = published >30 days, no links, decent content
      let severity = 'healthy';
      if (n.blog.status === 'published' && ageDays > 30 && wc >= 300) severity = 'critical';
      else if (n.blog.status === 'published' && ageDays > 14) severity = 'warning';
      else severity = 'healthy';
      return {
        id: n.id,
        blog: n.blog,
        wc,
        ageDays,
        severity,
        recommendedTargets: findRecommendedTargets(n, graph.nodes, 3),
      };
    })
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  return { graph, clusters, labelByNode, quality, orphans };
}

function severityRank(s) {
  if (s === 'critical') return 0;
  if (s === 'warning') return 1;
  return 2;
}

function ageInDays(date) {
  if (!date) return 0;
  const t = new Date(date).getTime();
  if (!t) return 0;
  return Math.floor((Date.now() - t) / 86400000);
}

function findRecommendedTargets(orphanNode, allNodes, limit = 3) {
  const candidates = allNodes
    .filter((n) => n.id !== orphanNode.id)
    .map((n) => ({ node: n, sim: jaccard(orphanNode.tokens, n.tokens) }))
    .filter((c) => c.sim > 0.05)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit);
  return candidates.map((c) => ({
    id: c.node.id,
    title: c.node.title,
    slug: c.node.slug,
    similarity: Number((c.sim * 100).toFixed(1)),
  }));
}
