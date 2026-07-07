import api from './axios';

// MBR (Monthly Business Review) — GA4 + Search Console + own-DB click detail.
// GA4/GSC reports are server-cached for 1h per range; params: { month: 'YYYY-MM' }
// or { start, end } as YYYY-MM-DD.

export const getMbrStatus = () => api.get('/mbr/status');

export const getMbrGa4 = (params) =>
  api.get('/mbr/ga4', { params, timeout: 30000 });

export const getMbrGsc = (params) =>
  api.get('/mbr/gsc', { params, timeout: 30000 });

export const getMbrButtons = (params) =>
  api.get('/mbr/buttons', { params });

// Manual workstream tiles (PPTs/videos, work log, other projects, manual leads)
export const getMbrSections = () => api.get('/mbr/sections');
export const getMbrItems = (params) => api.get('/mbr/items', { params });
export const createMbrItem = (body) => api.post('/mbr/items', body);
export const updateMbrItem = (id, body) => api.put(`/mbr/items/${id}`, body);
export const deleteMbrItem = (id) => api.delete(`/mbr/items/${id}`);

// Published blogs in range (+ all-time views)
export const getMbrBlogs = (params) => api.get('/mbr/blogs', { params });

// Pages BUILT in the period (WordPress publish dates / SeoMetadata registry)
export const getMbrPages = (params) => api.get('/mbr/pages', { params });

// Combined multi-sheet Excel download
export const downloadMbrExport = (params) =>
  api.get('/mbr/export', { params, responseType: 'blob', timeout: 120000 });
