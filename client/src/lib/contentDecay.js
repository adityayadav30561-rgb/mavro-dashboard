// ===================================
// Content Decay Detection Engine
// ===================================
// Per-blog decay scoring that fuses three real signal sources:
//
//   1. Audit (from auditCorpus / auditBlog) — SEO score + per-category scores
//   2. Trend deltas (from /api/analytics/blog-trends) — current vs previous window views/sessions
//   3. Graph signals (from analyzeLinkGraph) — orphan + cluster cohesion
//
// Returns one record per blog with:
//   - state        — 'fresh' | 'stable' | 'aging' | 'declining' | 'critical'
//   - score        — 0–100 decay risk (HIGHER = more decay)
//   - reasons[]    — { code, severity, message, weight, value } — full transparency
//   - recommendations[] — { id, label, impact, effort, confidence }
//   - signals      — raw measurements (ageDays, updatedDays, viewsDeltaPct, etc.)
//
// Pure functions. No fetches. No React. Caller memoizes by inputs.
//
// Multi-tenant: caller must pre-scope corpus + trends to the selected tenant.

// ---- Weights (explainable, not hardcoded scores) ------------------------
// Each component contributes 0–100 to its own sub-score; total decay score
// is the weighted mean of the sub-scores. Weights are intentionally
// content-dominant and engagement-aware.
export const DECAY_WEIGHTS = {
  engagement:  0.30,  // declining traffic is the loudest signal
  freshness:   0.25,  // recency of updates
  seoDrift:    0.20,  // overall SEO score
  linking:     0.10,  // orphan / cluster connectivity
  metadata:    0.10,  // metadata completeness
  contentBody: 0.05,  // word count + structure
};

// ---- State bands --------------------------------------------------------
export function decayState(score) {
  if (score < 20)  return { state: 'fresh',     tone: 'emerald', label: 'Fresh' };
  if (score < 40)  return { state: 'stable',    tone: 'cyan',    label: 'Stable' };
  if (score < 60)  return { state: 'aging',     tone: 'amber',   label: 'Aging' };
  if (score < 80)  return { state: 'declining', tone: 'orange',  label: 'Declining' };
  return                  { state: 'critical',  tone: 'rose',    label: 'Critical' };
}

// ---- Recommendation catalogue ------------------------------------------
// Static catalogue with deterministic ids. Recommendations are selected
// based on the actual reasons triggered — no random pick.
const RECOMMENDATIONS = {
  refresh_stats: {
    id: 'refresh_stats',
    label: 'Refresh statistics & examples',
    impact: 'high',
    effort: 'medium',
    reason: 'stale_content',
  },
  expand_depth: {
    id: 'expand_depth',
    label: 'Expand content depth to 700+ words',
    impact: 'high',
    effort: 'high',
    reason: 'thin_body',
  },
  improve_metadata: {
    id: 'improve_metadata',
    label: 'Improve title + meta description',
    impact: 'medium',
    effort: 'low',
    reason: 'weak_metadata',
  },
  add_internal_links: {
    id: 'add_internal_links',
    label: 'Add 2–4 internal links to related posts',
    impact: 'medium',
    effort: 'low',
    reason: 'orphan_or_isolated',
  },
  improve_readability: {
    id: 'improve_readability',
    label: 'Shorten sentences, simplify wording',
    impact: 'medium',
    effort: 'medium',
    reason: 'low_readability',
  },
  add_faqs: {
    id: 'add_faqs',
    label: 'Add FAQ section (3+ question H2/H3)',
    impact: 'medium',
    effort: 'medium',
    reason: 'no_faq',
  },
  add_images: {
    id: 'add_images',
    label: 'Add supporting images with alt text',
    impact: 'low',
    effort: 'medium',
    reason: 'no_media',
  },
  update_keywords: {
    id: 'update_keywords',
    label: 'Refresh focus keyword & semantic coverage',
    impact: 'high',
    effort: 'medium',
    reason: 'engagement_drop',
  },
  expand_semantic: {
    id: 'expand_semantic',
    label: 'Expand semantic coverage with H2 sections',
    impact: 'medium',
    effort: 'medium',
    reason: 'weak_structure',
  },
  reset_publish_cadence: {
    id: 'reset_publish_cadence',
    label: 'Republish with updated timestamp once revised',
    impact: 'medium',
    effort: 'low',
    reason: 'old_publish',
  },
};

// ---- Reason → recommendation mapping ------------------------------------
const REASON_TO_RECS = {
  stale_year:           ['refresh_stats', 'update_keywords', 'reset_publish_cadence'],
  stale_6mo:            ['refresh_stats', 'reset_publish_cadence'],
  stale_3mo:            ['refresh_stats'],
  engagement_drop_hard: ['update_keywords', 'improve_metadata', 'add_internal_links'],
  engagement_drop:      ['update_keywords', 'improve_metadata'],
  engagement_flat:      ['improve_metadata', 'add_internal_links'],
  orphan:               ['add_internal_links'],
  weak_seo:             ['improve_metadata', 'expand_depth', 'expand_semantic'],
  weak_metadata:        ['improve_metadata'],
  thin_body:            ['expand_depth', 'expand_semantic'],
  low_readability:      ['improve_readability'],
  no_faq:               ['add_faqs'],
  weak_structure:       ['expand_semantic'],
  no_media:             ['add_images'],
};

// ---- Helpers ------------------------------------------------------------
function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }
function round(v) { return Math.round(v); }

function buildReason(code, severity, message, weight, value) {
  return { code, severity, message, weight, value };
}

// ---- Sub-scoring (each returns 0–100, HIGHER = more decay) --------------

// Engagement sub-score — driven by trend delta vs previous window
function engagementSub(trend) {
  if (!trend) return 0;
  const d = Number(trend.viewsDeltaPct ?? 0);
  // Big drops weigh heaviest
  if (d <= -50) return 95;
  if (d <= -25) return 80;
  if (d <= -10) return 60;
  if (d <=  -5) return 40;
  if (d <    0) return 25;
  return 0;
}

// Freshness sub-score — days since last update
function freshnessSub(updatedDays) {
  if (updatedDays == null) return 0;
  if (updatedDays > 365) return 90;
  if (updatedDays > 270) return 75;
  if (updatedDays > 180) return 60;
  if (updatedDays > 120) return 40;
  if (updatedDays >  90) return 25;
  return 0;
}

// SEO drift sub-score — inverse of overall audit score, harshened below 60
function seoDriftSub(audit) {
  if (!audit || typeof audit.overall !== 'number') return 0;
  const o = audit.overall;
  if (o >= 80) return 5;
  if (o >= 70) return 15;
  if (o >= 60) return 35;
  if (o >= 50) return 55;
  if (o >= 40) return 70;
  return            85;
}

// Internal linking sub-score — orphan + cluster cohesion contribution
function linkingSub(graphNode) {
  if (!graphNode) return 0;
  let s = 0;
  if (graphNode.isOrphan) s += 60;
  else if (graphNode.inbound === 0) s += 35;
  if (graphNode.outbound === 0) s += 20;
  if (!graphNode.cluster) s += 10;
  return clamp(s);
}

// Metadata sub-score — inverse of audit metadata score
function metadataSub(audit) {
  if (!audit) return 0;
  const m = audit.byCategory?.metadata?.score ?? 100;
  return clamp(100 - m);
}

// Content body sub-score — inverse of content category score; only kicks in
// when content score is low (signals depth gap not engagement gap)
function contentBodySub(audit) {
  if (!audit) return 0;
  const c = audit.byCategory?.content?.score ?? 100;
  if (c >= 80) return 0;
  return clamp(100 - c);
}

// ---- Reason extraction (severity-tagged, weight-aware) ------------------
function extractReasons(blog, audit, trend, graphNode) {
  const reasons = [];

  // ── Freshness ──
  if (blog.updatedDays != null) {
    if (blog.updatedDays > 365) {
      reasons.push(buildReason('stale_year', 'critical',
        `Not updated in ${blog.updatedDays} days (>1 year)`, DECAY_WEIGHTS.freshness, blog.updatedDays));
    } else if (blog.updatedDays > 180) {
      reasons.push(buildReason('stale_6mo', 'warning',
        `Not updated in ${blog.updatedDays} days (>6 months)`, DECAY_WEIGHTS.freshness, blog.updatedDays));
    } else if (blog.updatedDays > 90) {
      reasons.push(buildReason('stale_3mo', 'notice',
        `Not updated in ${blog.updatedDays} days`, DECAY_WEIGHTS.freshness * 0.5, blog.updatedDays));
    }
  }

  // ── Engagement ──
  if (trend) {
    const d = Number(trend.viewsDeltaPct ?? 0);
    if (d <= -25) {
      reasons.push(buildReason('engagement_drop_hard', 'critical',
        `Views down ${Math.abs(d)}% vs previous window`, DECAY_WEIGHTS.engagement, d));
    } else if (d <= -10) {
      reasons.push(buildReason('engagement_drop', 'warning',
        `Views down ${Math.abs(d)}% vs previous window`, DECAY_WEIGHTS.engagement, d));
    } else if (d < 0) {
      reasons.push(buildReason('engagement_flat', 'notice',
        `Slight view decline ${Math.abs(d)}%`, DECAY_WEIGHTS.engagement * 0.4, d));
    }
  }

  // ── SEO ──
  if (audit) {
    const o = audit.overall;
    if (o < 50) {
      reasons.push(buildReason('weak_seo', 'warning',
        `SEO score ${o} — weak operationally`, DECAY_WEIGHTS.seoDrift, o));
    }
    const meta = audit.byCategory?.metadata?.score ?? 100;
    if (meta < 60) {
      reasons.push(buildReason('weak_metadata', 'warning',
        `Metadata score ${meta} — gaps in title / description / OG`, DECAY_WEIGHTS.metadata, meta));
    }
    const content = audit.byCategory?.content?.score ?? 100;
    if (content < 60 && (audit.wordCount ?? 0) < 700) {
      reasons.push(buildReason('thin_body', 'warning',
        `Thin content — ${audit.wordCount || 0} words`, DECAY_WEIGHTS.contentBody, audit.wordCount));
    }
    const ux = audit.byCategory?.ux?.score ?? 100;
    if (ux < 60 || (audit.readability?.flesch ?? 60) < 50) {
      reasons.push(buildReason('low_readability', 'notice',
        `Readability ${audit.readability?.flesch ?? '—'} below recommended 60`, DECAY_WEIGHTS.seoDrift * 0.5, audit.readability?.flesch));
    }
    // Structural gaps
    if ((audit.structure?.h2Count ?? 0) < 2 && (audit.wordCount ?? 0) > 400) {
      reasons.push(buildReason('weak_structure', 'notice',
        `Only ${audit.structure?.h2Count ?? 0} H2 sections for ${audit.wordCount}-word post`, DECAY_WEIGHTS.seoDrift * 0.4));
    }
    if ((audit.structure?.imageCount ?? 0) === 0 && (audit.wordCount ?? 0) > 600) {
      reasons.push(buildReason('no_media', 'notice',
        'No images in long-form content', DECAY_WEIGHTS.contentBody * 0.6));
    }
  }

  // ── Linking ──
  if (graphNode?.isOrphan) {
    reasons.push(buildReason('orphan', 'warning',
      'Page is orphaned — zero internal links in or out', DECAY_WEIGHTS.linking));
  } else if (graphNode && graphNode.inbound === 0) {
    reasons.push(buildReason('orphan', 'notice',
      'No inbound internal links', DECAY_WEIGHTS.linking * 0.5));
  }

  // Old publishedAt date even when content is okay — soft signal
  if (blog.ageDays != null && blog.ageDays > 540 && blog.updatedDays != null && blog.updatedDays > 180) {
    reasons.push(buildReason('old_publish', 'notice',
      `Published ${blog.ageDays} days ago and not refreshed`, DECAY_WEIGHTS.freshness * 0.3, blog.ageDays));
  }

  return reasons;
}

function buildRecommendations(reasons) {
  const out = new Map();
  for (const r of reasons) {
    const recs = REASON_TO_RECS[r.code] || [];
    for (const recId of recs) {
      const base = RECOMMENDATIONS[recId];
      if (!base) continue;
      // Confidence = sum of triggering-reason severity weight
      const severityScore = r.severity === 'critical' ? 35 : r.severity === 'warning' ? 20 : 8;
      const existing = out.get(recId) || { ...base, confidence: 0, sources: [] };
      existing.confidence = clamp(existing.confidence + severityScore);
      existing.sources.push(r.code);
      out.set(recId, existing);
    }
  }
  return [...out.values()].sort((a, b) => b.confidence - a.confidence);
}

// ---- Public: per-blog decay analysis -----------------------------------
//
// Inputs:
//   blog       — full blog row (must have _id, title, slug, status, publishedAt, updatedAt)
//   audit      — auditBlog() result for this blog (may be null)
//   trend      — entry from /api/analytics/blog-trends matching this blog.slug (may be null)
//   graphNode  — entry from analyzeLinkGraph().graph.nodes matching this blog (may be null)
export function analyzeBlogDecay(blog, audit, trend, graphNode) {
  const ageDays     = blog.publishedAt
    ? Math.floor((Date.now() - new Date(blog.publishedAt).getTime()) / 86400000)
    : null;
  const updatedDays = blog.updatedAt
    ? Math.floor((Date.now() - new Date(blog.updatedAt).getTime()) / 86400000)
    : null;
  const blogWithDays = { ...blog, ageDays, updatedDays };

  const subs = {
    engagement:  engagementSub(trend),
    freshness:   freshnessSub(updatedDays),
    seoDrift:    seoDriftSub(audit),
    linking:     linkingSub(graphNode),
    metadata:    metadataSub(audit),
    contentBody: contentBodySub(audit),
  };

  // Weighted overall
  let weighted = 0;
  for (const k of Object.keys(DECAY_WEIGHTS)) {
    weighted += subs[k] * DECAY_WEIGHTS[k];
  }
  const score = round(clamp(weighted));
  const state = decayState(score);
  const reasons = extractReasons(blogWithDays, audit, trend, graphNode);
  const recommendations = buildRecommendations(reasons);

  return {
    blog: blogWithDays,
    audit,
    trend,
    graphNode,
    subs,
    score,
    ...state,
    reasons,
    recommendations,
    signals: {
      ageDays,
      updatedDays,
      viewsDeltaPct: trend ? Number(trend.viewsDeltaPct ?? 0) : null,
      sessionsDeltaPct: trend ? Number(trend.sessionsDeltaPct ?? 0) : null,
      currentViews: trend?.current?.views ?? 0,
      previousViews: trend?.previous?.views ?? 0,
      seoScore: audit?.overall ?? null,
      isOrphan: !!graphNode?.isOrphan,
    },
  };
}

// ---- Public: corpus-level decay rollup ---------------------------------
//
// auditCorpusResult: output of `auditCorpus(blogs)` from seoHealth
// trendsBySlug:      Map<slug, trendRow> built from /api/analytics/blog-trends
// graphByBlogId:     Map<blogId, graphNode> built from analyzeLinkGraph().graph.byId
//
// Returns:
//   { rows, stats, alerts, queue }
export function analyzeCorpusDecay({ auditCorpusResult, trendsBySlug, graphByBlogId }) {
  const audits = auditCorpusResult?.audits || [];
  const rows = audits.map((a) => {
    const blog = a.blog;
    const trend = trendsBySlug?.get?.(String(blog.slug || '').toLowerCase()) || null;
    const graphNode = graphByBlogId?.get?.(String(blog._id)) || null;
    return analyzeBlogDecay(blog, a, trend, graphNode);
  });

  // ── Stats roll-up ──
  const buckets = { fresh: 0, stable: 0, aging: 0, declining: 0, critical: 0 };
  let totalScore = 0;
  for (const r of rows) {
    buckets[r.state] = (buckets[r.state] || 0) + 1;
    totalScore += r.score;
  }
  const avgDecay = rows.length ? round(totalScore / rows.length) : 0;

  // ── Alerts — top N decaying blogs that warrant operator attention ──
  const alerts = rows
    .filter((r) => r.state === 'declining' || r.state === 'critical' || (r.signals.viewsDeltaPct !== null && r.signals.viewsDeltaPct <= -25))
    .map((r) => {
      let severity = 'notice';
      if (r.state === 'critical' || (r.signals.viewsDeltaPct !== null && r.signals.viewsDeltaPct <= -50)) severity = 'critical';
      else if (r.state === 'declining' || (r.signals.viewsDeltaPct !== null && r.signals.viewsDeltaPct <= -25)) severity = 'warning';
      const topReason = r.reasons[0]?.message || `Decay score ${r.score}`;
      return {
        id: String(r.blog._id),
        severity,
        title: r.blog.title,
        slug: r.blog.slug,
        message: topReason,
        score: r.score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // ── Refresh queue ──
  // Priority = decay score × traffic-potential proxy.
  // Traffic-potential proxy = max(previousViews, currentViews) — favors
  // blogs that historically drew traffic so refreshes recover more upside.
  const queue = rows
    .filter((r) => r.score >= 40)
    .map((r) => {
      const trafficPotential = Math.max(r.signals.previousViews, r.signals.currentViews);
      const recoveryImpact = Math.round(r.score * (trafficPotential + 1) / 100);
      const priority = round((r.score * 0.7) + Math.min(30, trafficPotential / 2));
      return {
        ...r,
        priority,
        trafficPotential,
        recoveryImpact,
        topRecommendation: r.recommendations[0] || null,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  return {
    rows,
    stats: {
      total: rows.length,
      avgDecay,
      buckets,
      orphans: rows.filter((r) => r.signals.isOrphan).length,
      decliningOrCritical: buckets.declining + buckets.critical,
    },
    alerts,
    queue,
  };
}

// ---- Helper: build trends-by-slug map from API response ----------------
export function buildTrendsBySlug(trendsArray) {
  const map = new Map();
  if (!Array.isArray(trendsArray)) return map;
  for (const t of trendsArray) {
    if (t?.slug) map.set(String(t.slug).toLowerCase(), t);
  }
  return map;
}
