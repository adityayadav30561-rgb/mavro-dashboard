// ===================================
// Analytics metric explanations
// ===================================
// Operator-friendly, non-technical copy for the info-popover system.
// One canonical source. Components reference by key — no duplication.

export const METRIC_INFO = {
  // ── KPI tiles ────────────────────────────────────────
  visitors: {
    title: 'Visitors',
    text:  'Unique people who visited your websites during the selected period. Counted as distinct browser sessions.',
  },
  pageViews: {
    title: 'Page Views',
    text:  'Total number of pages viewed across all sessions. One visitor can generate multiple page views.',
  },
  ctaClicks: {
    title: 'CTA Clicks',
    text:  'Tracks how often visitors interact with primary call-to-action buttons (e.g. Book Demo, Explore Platform).',
  },
  formSubmits: {
    title: 'Form Submits',
    text:  'Counts successful form completions from landing pages and blogs. Emitted server-side on lead creation for accuracy.',
  },
  leads: {
    title: 'Leads',
    text:  'Verified lead records stored in the CRM. Excludes spam-flagged submissions.',
  },

  // ── Engagement tiles ────────────────────────────────
  avgSession: {
    title: 'Avg Session',
    text:  'Average length of a visitor session. Sessions are split when a visitor is inactive for 30+ minutes.',
  },
  pagesPerSession: {
    title: 'Pages / Session',
    text:  'Average number of pages a visitor opens before leaving. Higher numbers signal engagement.',
  },
  bounceRate: {
    title: 'Bounce Rate',
    text:  'Percentage of visitors who leave after viewing only one page. Lower is generally better.',
  },
  returningPct: {
    title: 'Returning %',
    text:  'Percentage of visitors who came back after a previous visit. Indicates audience loyalty.',
  },

  // ── Sections ────────────────────────────────────────
  conversionFunnel: {
    title: 'Conversion Funnel',
    text:  'Shows how visitors progress from viewing pages → clicking CTAs → submitting forms. Each step reveals drop-off.',
  },
  operationalInsights: {
    title: 'Operational Insights',
    text:  'Real-time observations generated from your analytics. Surfaces strengths, weaknesses, and patterns automatically.',
  },
  trafficSessions: {
    title: 'Traffic & Sessions',
    text:  'Time-series view of page views, sessions, and form submissions across the selected window.',
  },
  topLanding: {
    title: 'Top Landing Pages',
    text:  'Pages where visitors first arrive. Strong landing pages are critical to conversion.',
  },
  topExit: {
    title: 'Top Exit Pages',
    text:  'Last pages visitors viewed before leaving. Frequent exits here may signal friction.',
  },
  topBlogs: {
    title: 'Top Blogs',
    text:  'Most-viewed blog posts in the selected window. Use for content prioritization.',
  },
  anomalies: {
    title: 'Anomaly Detection',
    text:  'Automatically detects unusual traffic drops, spikes, or conversion changes. Alerts include recommendations.',
  },
  realtime: {
    title: 'Live Event Stream',
    text:  'Real-time feed of visitor activity from the last 30 minutes. Polled every 15 seconds.',
  },
  contentPerformance: {
    title: 'Content Performance',
    text:  'Per-blog view + session metrics with freshness flag. Posts older than 180 days are marked stale.',
  },
  tenantComparison: {
    title: 'Tenant Comparison',
    text:  'Side-by-side performance of every active property: traffic, leads, conversion rate, and top page.',
  },
  seoTelemetry: {
    title: 'SEO Telemetry',
    text:  'Cross-corpus SEO health rollup. Reuses the same weighted audit engine as the SEO page.',
  },
  bestConverting: {
    title: 'Best Converting Pages',
    text:  'Pages where visitors are most likely to submit a form. Use these as templates for under-performers.',
  },
  highestBounce: {
    title: 'Highest Bounce Pages',
    text:  'Pages with the highest single-visit exit rate. Audit messaging, load time, and mobile experience here.',
  },
};

export function getMetricInfo(key) {
  return METRIC_INFO[key] || null;
}
