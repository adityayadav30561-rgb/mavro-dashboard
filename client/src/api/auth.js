import api from './axios';

export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const getMe = () => api.get('/auth/me');
export const updatePassword = (data) => api.put('/auth/password', data);
