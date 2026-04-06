import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');

        if (storedUser && accessToken) {
            setUser(JSON.parse(storedUser));
            verifyToken();
        }
        setLoading(false);
    }, []);

    const verifyToken = async() => {
        try {
            await authAPI.meInfo();
        } catch(error) {
            logout();
        }
    };

    const register = async (userData) => {
        setError(null);
        try {
            const response = await authAPI.register(userData);
            return response;
        } catch (error) {
            setError(error.response?.data?.error || 'Ошибка регистрации');
            throw error;
        }
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const data = await authAPI.login(email, password);
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            return data; 
        } catch (error) {
            setError(error.response?.data?.error || 'Ошибка входа');
            throw error;
        }
    };

    const logout = async() => {
        await authAPI.logout();
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const value = {
        user,
        loading, 
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};