import api from './axios';

export const getCampaigns       = (params)            => api.get('/campaigns', { params });
export const getCampaign        = (id)                => api.get(`/campaigns/${id}`);
export const createCampaign     = (data)              => api.post('/campaigns', data);
export const updateCampaign     = (id, data)          => api.put(`/campaigns/${id}`, data);
export const deleteCampaign     = (id)                => api.delete(`/campaigns/${id}`);
export const assignBlogsToCampaign = (id, blogIds)    => api.post(`/campaigns/${id}/assign-blogs`, { blogIds });
