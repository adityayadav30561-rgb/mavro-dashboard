/**
 * Google Search Console (Search Analytics API) layer for the MBR dashboard.
 *
 * GSC_SITE_URL must match the verified property EXACTLY:
 *   - domain property:  "sc-domain:spanbix.com"
 *   - URL-prefix:       "https://www.spanbix.com/"
 *
 * NOTE: Search Console data lags ~2-3 days behind real time. The controller
 * does not shift dates — the report simply shows what Google has finalized.
 */

const { googleApiFetch, isConfigured: authConfigured } = require('./googleAuth');

const siteUrl = () => (process.env.GSC_SITE_URL || '').trim();
const isConfigured = () => authConfigured() && Boolean(siteUrl());

async function query(body) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl())}/searchAnalytics/query`;
  const res = await googleApiFetch(url, { method: 'POST', body });
  return res.rows || [];
}

const shapeRow = (row, dimNames) => {
  const obj = {
    clicks: Math.round(row.clicks || 0),
    impressions: Math.round(row.impressions || 0),
    ctr: row.ctr || 0,
    position: row.position ? Math.round(row.position * 10) / 10 : 0,
  };
  dimNames.forEach((name, i) => {
    obj[name] = row.keys?.[i] ?? '';
  });
  return obj;
};

/**
 * Full GSC slice of the MBR report.
 * current / previous: { startDate, endDate } for MoM totals.
 */
async function getMbrReport({ current, previous }) {
  const base = { type: 'web' };

  const [curTotal, prevTotal, byDate, byQuery, byPage] = await Promise.all([
    query({ ...base, startDate: current.startDate, endDate: current.endDate, rowLimit: 1 }),
    query({ ...base, startDate: previous.startDate, endDate: previous.endDate, rowLimit: 1 }),
    query({
      ...base,
      startDate: current.startDate,
      endDate: current.endDate,
      dimensions: ['date'],
      rowLimit: 400,
    }),
    query({
      ...base,
      startDate: current.startDate,
      endDate: current.endDate,
      dimensions: ['query'],
      rowLimit: 25,
    }),
    query({
      ...base,
      startDate: current.startDate,
      endDate: current.endDate,
      dimensions: ['page'],
      rowLimit: 25,
    }),
  ]);

  return {
    totals: {
      current: shapeRow(curTotal[0] || {}, []),
      previous: shapeRow(prevTotal[0] || {}, []),
    },
    trend: byDate.map((r) => shapeRow(r, ['date'])),
    topQueries: byQuery.map((r) => shapeRow(r, ['query'])),
    topPages: byPage.map((r) => shapeRow(r, ['page'])),
  };
}

module.exports = { isConfigured, getMbrReport };
