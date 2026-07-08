import api from './axios';

export const getBlogs = (params) => api.get('/blogs', { params });
// WordPress-backed tenant corpus (Website.wordpressUrl set — e.g. SaiSatwik).
// Returns posts adapted to the Blog audit shape for the SEO Engine.
export const getWordpressBlogs = (websiteSlug, params) =>
  api.get(`/blogs/wordpress/${websiteSlug}`, { params });
// Sitemap-style URL counts for a WordPress-backed tenant (real WP REST totals).
export const getWordpressSitemapStats = (websiteSlug, params) =>
  api.get(`/blogs/wordpress/${websiteSlug}/stats`, { params });
export const getBlog = (id) => api.get(`/blogs/${id}`);
export const createBlog = (data) => api.post('/blogs', data);
export const updateBlog = (id, data) => api.put(`/blogs/${id}`, data);
export const deleteBlog = (id) => api.delete(`/blogs/${id}`);
export const publishBlog = (id) => api.patch(`/blogs/${id}/publish`);
export const unpublishBlog = (id) => api.patch(`/blogs/${id}/unpublish`);
export const getBlogStats = (params) => api.get('/blogs/stats', { params });
export const rescheduleBlog = (id, scheduledAt) => api.patch(`/blogs/${id}/schedule`, { scheduledAt });
export const updateBlogWorkflow = (id, workflowStatus, note) => api.patch(`/blogs/${id}/workflow`, { workflowStatus, note });
// 5-col editorial pipeline (preferred)
export const updateBlogEditorialStatus = (id, editorialStatus, note) =>
  api.patch(`/blogs/${id}/workflow`, { editorialStatus, note });
// Ownership + approval
export const assignBlog          = (id, payload)      => api.patch(`/blogs/${id}/assign`, payload);
export const approveBlog         = (id, note)         => api.patch(`/blogs/${id}/approve`, { note });
export const requestRevisionBlog = (id, note)         => api.patch(`/blogs/${id}/request-revision`, { note });
export const rejectBlog          = (id, note)         => api.patch(`/blogs/${id}/reject`, { note });
// Activity feed
export const getBlogActivity     = (params)           => api.get('/blogs/activity', { params });
// DOCX import (multipart)
export const importBlogDocx      = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/blogs/import-docx', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
