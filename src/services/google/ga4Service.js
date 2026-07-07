/**
 * GA4 Data API (v1beta) report layer for the MBR dashboard.
 *
 * All reads go through batchRunReports (5 reports per call) against the
 * property in GA4_PROPERTY_ID. Pure fetch — no client library.
 *
 * Every public function takes { startDate, endDate } (YYYY-MM-DD) and the
 * assembled report also receives the comparison range so MoM deltas come
 * from a single GA4 request (two dateRanges → GA4 adds a `dateRange`
 * dimension with values date_range_0 / date_range_1).
 */

const { googleApiFetch, isConfigured: authConfigured } = require('./googleAuth');

const defaultPropertyId = () => (process.env.GA4_PROPERTY_ID || '').trim();
const isConfigured = (propertyId) => authConfigured() && Boolean(propertyId || defaultPropertyId());

// Referral sources that identify AI assistant / AI search traffic.
// PARTIAL_REGEXP against sessionSource (e.g. "chatgpt.com", "perplexity.ai").
const AI_SOURCE_REGEX =
  'chatgpt|chat\\.openai|perplexity|gemini\\.google|copilot\\.microsoft|claude\\.ai|bard\\.google|poe\\.com|you\\.com|phind|bing\\.com/chat|meta\\.ai|deepseek|mistral\\.ai|grok';

const TRACKED_EVENTS = [
  'call_click',
  'whatsapp_click',
  'cta_click',
  'generate_lead',
  'form_submit',
  'file_download',
];

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

async function batchRunReports(requests, propertyId) {
  const pid = propertyId || defaultPropertyId();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${pid}:batchRunReports`;
  const out = [];
  // API allows max 5 reports per batch call
  for (let i = 0; i < requests.length; i += 5) {
    const chunk = requests.slice(i, i + 5);
    const res = await googleApiFetch(url, { method: 'POST', body: { requests: chunk } });
    out.push(...(res.reports || []));
  }
  return out;
}

/** Flatten a GA4 report into [{ <dimName>: value, ..., <metricName>: number }] */
function parseReport(report) {
  if (!report || !report.rows) return [];
  const dims = (report.dimensionHeaders || []).map((h) => h.name);
  const mets = (report.metricHeaders || []).map((h) => h.name);
  return report.rows.map((row) => {
    const obj = {};
    dims.forEach((name, i) => {
      obj[name] = row.dimensionValues?.[i]?.value ?? '';
    });
    mets.forEach((name, i) => {
      obj[name] = Number(row.metricValues?.[i]?.value ?? 0);
    });
    return obj;
  });
}

const metric = (name) => ({ name });
const dimension = (name) => ({ name });

const eventFilter = (events) => ({
  filter: {
    fieldName: 'eventName',
    inListFilter: { values: events },
  },
});

/**
 * Hostname scoping. A GA4 property can receive hits from multiple websites
 * (extra data streams, the same measurement tag pasted on another site) and
 * `pagePath` has no domain — foreign pages silently pollute every report.
 * When a hostname is known for the source, every request gets a hostName
 * filter, AND-composed with the request's own dimensionFilter.
 *
 * spec: { matchType: 'EXACT'|'ENDS_WITH', value } — ENDS_WITH covers
 * sc-domain properties where the exact subdomain (www vs apex) is unknown.
 */
const hostFilter = (spec) => ({
  filter: {
    fieldName: 'hostName',
    stringFilter: { matchType: spec.matchType, value: spec.value, caseSensitive: false },
  },
});

/**
 * 404 exclusion. Requests to non-existent URLs (stale backlinks, bots
 * probing paths from whatever previously lived on the domain) still render
 * the not-found page, which fires a GA4 page_view — ghost pages pollute
 * every report. Excluded by page title: anything containing "404" /
 * "not found", plus the bare brand label (Next's fallback title when the
 * not-found page declares no metadata of its own).
 */
function not404Filter(brandLabel) {
  const expressions = [
    { filter: { fieldName: 'pageTitle', stringFilter: { matchType: 'CONTAINS', value: '404', caseSensitive: false } } },
    { filter: { fieldName: 'pageTitle', stringFilter: { matchType: 'CONTAINS', value: 'not found', caseSensitive: false } } },
  ];
  if (brandLabel) {
    expressions.push({ filter: { fieldName: 'pageTitle', stringFilter: { matchType: 'EXACT', value: brandLabel } } });
  }
  return { notExpression: { orGroup: { expressions } } };
}

function applyScopes(requests, hostSpec, brandLabel) {
  const scopeExprs = [not404Filter(brandLabel)];
  if (hostSpec?.value) scopeExprs.push(hostFilter(hostSpec));
  return requests.map((r) => ({
    ...r,
    dimensionFilter: {
      andGroup: {
        expressions: r.dimensionFilter ? [...scopeExprs, r.dimensionFilter] : scopeExprs,
      },
    },
  }));
}

// ---------------------------------------------------------------------------
// Report assembly
// ---------------------------------------------------------------------------

/**
 * Full GA4 slice of the MBR report.
 * current / previous: { startDate, endDate } — previous powers MoM deltas.
 * hostScope (optional): { matchType, value } — restrict to one website.
 * brandLabel (optional): source label for bare-title 404 exclusion.
 */
async function getMbrReport({ current, previous }, propertyId, hostScope, brandLabel) {
  const bothRanges = [current, previous];

  const requests = [
    // 0 — audience overview, both ranges (MoM comes free)
    {
      dateRanges: bothRanges,
      metrics: [
        metric('totalUsers'),
        metric('newUsers'),
        metric('sessions'),
        metric('engagedSessions'),
        metric('engagementRate'),
        metric('userEngagementDuration'),
        metric('screenPageViews'),
      ],
    },
    // 1 — daily trend (current range)
    {
      dateRanges: [current],
      dimensions: [dimension('date')],
      metrics: [metric('activeUsers'), metric('sessions')],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 400,
    },
    // 2 — channel mix (current)
    {
      dateRanges: [current],
      dimensions: [dimension('sessionDefaultChannelGroup')],
      metrics: [metric('sessions'), metric('totalUsers')],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    },
    // 3 — top sources (current)
    {
      dateRanges: [current],
      dimensions: [dimension('sessionSource')],
      metrics: [metric('sessions'), metric('totalUsers')],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    },
    // 4 — AI referral traffic, both ranges (the GEO scoreboard)
    {
      dateRanges: bothRanges,
      dimensions: [dimension('sessionSource')],
      metrics: [metric('sessions'), metric('totalUsers')],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionSource',
          stringFilter: { matchType: 'PARTIAL_REGEXP', value: AI_SOURCE_REGEX, caseSensitive: false },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 50,
    },
    // 5 — top pages (current) — high limit so the Pages view can list the
    // whole site, not just a top-N
    {
      dateRanges: [current],
      dimensions: [dimension('pagePath')],
      metrics: [metric('screenPageViews'), metric('activeUsers'), metric('userEngagementDuration')],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 200,
    },
    // 6 — conversion events, both ranges
    {
      dateRanges: bothRanges,
      dimensions: [dimension('eventName')],
      metrics: [metric('eventCount'), metric('totalUsers')],
      dimensionFilter: eventFilter(TRACKED_EVENTS),
      limit: 50,
    },
    // 7 — conversion events daily trend (current)
    {
      dateRanges: [current],
      dimensions: [dimension('date'), dimension('eventName')],
      metrics: [metric('eventCount')],
      dimensionFilter: eventFilter(TRACKED_EVENTS),
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 2500,
    },
    // 8 — brochure / file downloads by file (current)
    {
      dateRanges: [current],
      dimensions: [dimension('fileName')],
      metrics: [metric('eventCount')],
      dimensionFilter: eventFilter(['file_download']),
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 20,
    },
    // 9 — geography (current)
    {
      dateRanges: [current],
      dimensions: [dimension('city'), dimension('country')],
      metrics: [metric('activeUsers'), metric('sessions')],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 15,
    },
    // 10 — device split (current)
    {
      dateRanges: [current],
      dimensions: [dimension('deviceCategory')],
      metrics: [metric('activeUsers'), metric('sessions')],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 5,
    },
    // 11 — country totals (current) — feeds the choropleth map
    {
      dateRanges: [current],
      dimensions: [dimension('country'), dimension('countryId')],
      metrics: [metric('activeUsers'), metric('sessions')],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 250,
    },
  ];

  const reports = await batchRunReports(applyScopes(requests, hostScope, brandLabel), propertyId);
  const [
    overviewR, trendR, channelsR, sourcesR, aiR,
    pagesR, eventsR, eventTrendR, downloadsR, geoR, devicesR, countriesR,
  ] = reports.map(parseReport);

  return {
    overview: splitByRange(overviewR, reports[0]),
    trend: trendR.map((r) => ({ date: r.date, users: r.activeUsers, sessions: r.sessions })),
    channels: channelsR.map((r) => ({
      channel: r.sessionDefaultChannelGroup, sessions: r.sessions, users: r.totalUsers,
    })),
    sources: sourcesR.map((r) => ({ source: r.sessionSource, sessions: r.sessions, users: r.totalUsers })),
    aiReferrals: splitAiByRange(aiR),
    topPages: pagesR.map((r) => ({
      path: r.pagePath,
      views: r.screenPageViews,
      users: r.activeUsers,
      avgEngagementSec: r.activeUsers > 0 ? Math.round(r.userEngagementDuration / r.activeUsers) : 0,
    })),
    events: splitEventsByRange(eventsR),
    eventTrend: eventTrendR.map((r) => ({ date: r.date, event: r.eventName, count: r.eventCount })),
    fileDownloads: downloadsR.map((r) => ({ file: r.fileName || '(unknown)', count: r.eventCount })),
    geo: geoR.map((r) => ({ city: r.city, country: r.country, users: r.activeUsers, sessions: r.sessions })),
    devices: devicesR.map((r) => ({ device: r.deviceCategory, users: r.activeUsers, sessions: r.sessions })),
    countries: countriesR.map((r) => ({
      country: r.country, countryId: r.countryId, users: r.activeUsers, sessions: r.sessions,
    })),
  };
}

// ---------------------------------------------------------------------------
// Range-split helpers (two dateRanges → GA4 injects `dateRange` dimension)
// ---------------------------------------------------------------------------

function splitByRange(rows, rawReport) {
  // No dimensions requested → rows carry only the dateRange dimension.
  const pick = (rangeKey) => rows.find((r) => r.dateRange === rangeKey) || {};
  // Single-range edge case (previous omitted): GA4 skips the dateRange dim.
  const hasRangeDim = (rawReport?.dimensionHeaders || []).some((h) => h.name === 'dateRange');
  const cur = hasRangeDim ? pick('date_range_0') : rows[0] || {};
  const prev = hasRangeDim ? pick('date_range_1') : {};
  const shape = (r) => ({
    users: r.totalUsers || 0,
    newUsers: r.newUsers || 0,
    sessions: r.sessions || 0,
    engagedSessions: r.engagedSessions || 0,
    engagementRate: r.engagementRate || 0,
    avgEngagementSec: r.totalUsers > 0 ? Math.round((r.userEngagementDuration || 0) / r.totalUsers) : 0,
    pageViews: r.screenPageViews || 0,
  });
  return { current: shape(cur), previous: shape(prev) };
}

function splitAiByRange(rows) {
  const current = [];
  let currentTotal = 0;
  let previousTotal = 0;
  rows.forEach((r) => {
    const isCurrent = !r.dateRange || r.dateRange === 'date_range_0';
    if (isCurrent) {
      current.push({ source: r.sessionSource, sessions: r.sessions, users: r.totalUsers });
      currentTotal += r.sessions;
    } else {
      previousTotal += r.sessions;
    }
  });
  return { sources: current, currentSessions: currentTotal, previousSessions: previousTotal };
}

function splitEventsByRange(rows) {
  const out = {};
  TRACKED_EVENTS.forEach((e) => {
    out[e] = { current: 0, previous: 0, users: 0 };
  });
  rows.forEach((r) => {
    const bucket = out[r.eventName];
    if (!bucket) return;
    const isCurrent = !r.dateRange || r.dateRange === 'date_range_0';
    if (isCurrent) {
      bucket.current += r.eventCount;
      bucket.users += r.totalUsers;
    } else {
      bucket.previous += r.eventCount;
    }
  });
  return out;
}

module.exports = { isConfigured, getMbrReport, TRACKED_EVENTS };
