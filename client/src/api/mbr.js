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
