import apiClient from './client';

export const usersAPI = {
    getAll: async () => {
        const response = await apiClient.get('/users');
        return response.data;
    },
    
    getById: async (id) => {
        const response = await apiClient.get(`/users/${id}`);
        return response.data;
    },
    
    update: async (id, userData) => {
        const response = await apiClient.put(`/users/${id}`, userData);
        return response.data;
    },
    
    block: async (id) => {
        const response = await apiClient.delete(`/users/${id}`);
        return response.data;
    }
};