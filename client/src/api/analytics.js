import api from './axios';

export const getAnalyticsOverview = (params) =>
  api.get('/analytics/overview', { params });

export const getAnalyticsTimeseries = (params) =>
  api.get('/analytics/timeseries', { params });

export const getAnalyticsTopPages = (params) =>
  api.get('/analytics/top-pages', { params });

export const getAnalyticsRecent = (params) =>
  api.get('/analytics/recent', { params });

export const getAnalyticsBreakdown = (params) =>
  api.get('/analytics/breakdown', { params });

// /analytics page endpoints
export const getAnalyticsFunnel = (params) =>
  api.get('/analytics/funnel', { params });
export const getAnalyticsTenantComparison = (params) =>
  api.get('/analytics/tenant-comparison', { params });
export const getAnalyticsTopBlogs = (params) =>
  api.get('/analytics/top-blogs', { params });
export const getAnalyticsContentPerformance = (params) =>
  api.get('/analytics/content-performance', { params });
export const getAnalyticsRealtime = (params) =>
  api.get('/analytics/realtime', { params });
export const getAnalyticsLandingPages = (params) =>
  api.get('/analytics/landing-pages', { params });
export const getAnalyticsExitPages = (params) =>
  api.get('/analytics/exit-pages', { params });
export const getAnalyticsEngagement = (params) =>
  api.get('/analytics/engagement', { params });

// Phase 2.0 — Behavior Intelligence + Anomaly Detection
export const getAnalyticsReturning = (params) =>
  api.get('/analytics/returning', { params });
export const getAnalyticsPageConversion = (params) =>
  api.get('/analytics/page-conversion', { params });
export const getAnalyticsPageBounce = (params) =>
  api.get('/analytics/page-bounce', { params });
export const getAnalyticsAnomalies = (params) =>
  api.get('/analytics/anomalies', { params });

// Content decay — per-blog trend deltas (current vs previous window)
export const getAnalyticsBlogTrends = (params) =>
  api.get('/analytics/blog-trends', { params });
