import apiClient from './client';

export const productsAPI = {

    getAll: async () => {
        const response = await apiClient.get('/products');
        return response.data;
    },

    getById: async(id) => {
        const response = await apiClient.get(`/products/${id}`);
        return response.data;
    },

    create: async(product) => {
        const response = await apiClient.post('/products', product);
        return response.data;
    },

    update: async(id, product) => {
        const response = await apiClient.put(`/products/${id}`, product);
        return response.data;
    },

    delete: async(id) => {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
    }
};