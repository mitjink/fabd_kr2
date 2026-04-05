import apiClient from './client';

export const authAPI = {

    register: async(userData) => {
        const response = await apiClient.post('/auth/register', {
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            password: userData.password
        });
        return response.data;
    },

    login: async(email, password) => {
        const response = await apiClient.post('auth/login', { email, password});

        if (response.data.accessToken && response.data.refreshToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        return response.data;
    },

    meInfo: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    logout: async () => {
        const refreshToken = localStorage.getItem('refreshItem');
        if (refreshToken) {
            try {
                await apiClient.post('/auth/logout', { refreshToken });
            } catch (error) {
                console.error('Logout error: ', error);
            }
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }
};