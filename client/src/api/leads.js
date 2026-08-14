import api from './axios';

export const getLeads = (params) => api.get('/leads', { params });
export const getLead = (id) => api.get(`/leads/${id}`);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const updateLeadStatus = (id, data) => api.patch(`/leads/${id}/status`, data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const getLeadStats = (params) => api.get('/leads/stats', { params });
// Staff who can be picked in the "Contacted by" dropdown (active leads_agent
// accounts, read live so a new hire appears without a code change).
export const getLeadAgents = () => api.get('/leads/agents');
// Append a conversation record. The log is append-only — there is no edit or
// delete counterpart by design.
export const addContactLogEntry = (id, data) => api.post(`/leads/${id}/contact-log`, data);
// Staff-entered lead (LinkedIn, referral, walk-in). NOT the bare POST /leads,
// which is a legacy public submission path.
export const createLead = (data) => api.post('/leads/manual', data);
