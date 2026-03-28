import { useState, useEffect } from 'react';
import apiClient from '../api/client';

/**
 * Custom hook for managing authentication state
 * Handles login, logout, and auth status checking
 */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            setLoading(true);
            setError('');
            const userData = await apiClient.checkAuth();
            setUser(userData);
        } catch (err) {
            setError('');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (demoMode = false) => {
        try {
            setLoading(true);
            setError('');

            if (demoMode) {
                // Demo mode: call /auth/demo endpoint and then check auth
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                window.location.href = `${API_URL}/auth/demo`;
            } else {
                // Google OAuth mode
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                window.location.href = `${API_URL}/auth/google`;
            }
        } catch (err) {
            setError('Failed to initiate login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await apiClient.logout();
            setUser(null);
            // Redirect to home after logout
            window.location.href = '/';
        } catch (err) {
            setError('Failed to logout');
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        loading,
        error,
        login,
        logout,
    };
}


