import axios from 'axios';
import { apiPath } from '@/lib/apiBase';

// Public API client — no auth token, no 401 redirect. baseURL honours
// VITE_API_BASE_URL so a Vercel-hosted Spanbix frontend can talk to a remote
// Express backend without code changes.
const publicApi = axios.create({
  baseURL: apiPath('/api'),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export const getPublicWebsite = (slug) =>
  publicApi.get(`/websites/public/${slug}`);

export const getPublicBlogs = (slug, params) =>
  publicApi.get(`/blogs/website/${slug}`, { params });

export const getPublicBlogDetail = (websiteSlug, blogSlug) =>
  publicApi.get(`/blogs/website/${websiteSlug}/${blogSlug}`);

export const submitPublicLead = (data) =>
  publicApi.post('/leads/submit', data);

export default publicApi;
