import api from './axios';

export const getLeads = (params) => api.get('/leads', { params });
export const getLead = (id) => api.get(`/leads/${id}`);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const updateLeadStatus = (id, data) => api.patch(`/leads/${id}/status`, data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const getLeadStats = (params) => api.get('/leads/stats', { params });
