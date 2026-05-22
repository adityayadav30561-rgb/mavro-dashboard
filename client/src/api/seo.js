import axios from 'axios';
import api from './axios';
import { apiBase } from '@/lib/apiBase';

// ===================================
// SEO metadata (under /api/seo/*)
// ===================================
export const getSeoStats = (params) => api.get('/seo/stats', { params });
export const getSeoList  = (params) => api.get('/seo', { params });

// ===================================
// Sitemap operations
// Sitemap routes are mounted at /sitemap/* (NOT under /api), so we use a
// root-baseURL axios client and inject the JWT manually. Vite proxies
// /sitemap → backend in dev; in prod both resolve to the same origin, except
// when VITE_API_BASE_URL is set (independent frontend deploy) — in that case
// the sitemap admin endpoint lives on the remote backend host too.
// ===================================
const rootApi = axios.create({ baseURL: apiBase() || '/' });
rootApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('mavro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getSitemapStats   = (websiteId)  => rootApi.get(`/sitemap/stats/${websiteId}`);
export const pingSearchEngines = (websiteSlug) => rootApi.post(`/sitemap/ping/${websiteSlug}`);

// ===================================
// Future-ready: GSC/Bing integration stubs
// These will hit /api/seo/gsc/* and /api/seo/bing/* when implemented.
// Keeping the call sites typed so the SEO Engine page is plug-ready.
// ===================================
export const getGoogleSearchConsoleSummary = (websiteId) =>
  api.get(`/seo/gsc/summary/${websiteId}`).catch(() => null);

export const getBingWebmasterSummary = (websiteId) =>
  api.get(`/seo/bing/summary/${websiteId}`).catch(() => null);
