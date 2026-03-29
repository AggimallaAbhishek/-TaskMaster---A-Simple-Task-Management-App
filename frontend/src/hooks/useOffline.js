import { useState, useEffect } from 'react';

/**
 * Hook to detect and track online/offline status
 */
export const useOffline = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            console.log('✓ Back online');
        };

        const handleOffline = () => {
            setIsOffline(true);
            console.log('⚠ Going offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOffline;
};
