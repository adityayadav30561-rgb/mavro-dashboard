import axios from 'axios';
import { apiPath } from '@/lib/apiBase';

// baseURL resolves to '/api' in dev + co-hosted prod, or '<VITE_API_BASE_URL>/api'
// when the frontend is deployed independently (e.g. Spanbix on Vercel pointing
// at a remote Express backend). See `src/lib/apiBase.js` for the contract.
const api = axios.create({
  baseURL: apiPath('/api'),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mavro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mavro_token');
      localStorage.removeItem('mavro_user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
