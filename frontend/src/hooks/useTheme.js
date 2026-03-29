import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'taskmaster_theme';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';

export const useTheme = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Initialize from localStorage or system preference
        const stored = localStorage.getItem(THEME_KEY);
        
        if (stored) {
            const isDark = stored === DARK_THEME;
            setIsDarkMode(isDark);
            applyTheme(isDark);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDark);
            applyTheme(prefersDark);
        }
    }, []);

    const applyTheme = useCallback((isDark) => {
        const root = document.documentElement;
        if (isDark) {
            root.setAttribute('data-theme', DARK_THEME);
            localStorage.setItem(THEME_KEY, DARK_THEME);
        } else {
            root.removeAttribute('data-theme');
            localStorage.setItem(THEME_KEY, LIGHT_THEME);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDarkMode(prev => {
            applyTheme(!prev);
            return !prev;
        });
    }, [applyTheme]);

    return { isDarkMode, toggleTheme };
};
