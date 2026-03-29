/**
 * Service Worker registration and management
 */

let registration = null;

/**
 * Register service worker
 */
export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return null;
    }

    try {
        registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });

        console.log('✓ Service Worker registered');

        // Check for updates
        registration.addEventListener('updatefound', () => {
            console.log('✓ Service Worker update found');
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('⚡ New Service Worker ready to activate');
                    // Notify user about update
                    window.dispatchEvent(new Event('sw-update-available'));
                }
            });
        });

        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
};

/**
 * Unregister service worker (for logout)
 */
export const unregisterServiceWorker = async () => {
    if (!registration) {
        return;
    }

    try {
        const success = await registration.unregister();
        if (success) {
            console.log('✓ Service Worker unregistered');
            registration = null;
        }
    } catch (error) {
        console.error('Error unregistering Service Worker:', error);
    }
};

/**
 * Request background sync
 */
export const requestBackgroundSync = async (tag = 'sync-pending-changes') => {
    if (!registration || !('sync' in registration)) {
        console.warn('Background Sync API not supported');
        return;
    }

    try {
        await registration.sync.register(tag);
        console.log('✓ Background sync registered:', tag);
    } catch (error) {
        console.error('Error registering background sync:', error);
    }
};

/**
 * Clear all caches
 */
export const clearAllCaches = async () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
            type: 'CLEAR_CACHE',
        });

        const cacheNames = await caches.keys();
        return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
        );
    }
};

/**
 * Get registration
 */
export const getServiceWorkerRegistration = () => registration;

/**
 * Listen for SW updates
 */
export const onServiceWorkerUpdate = (callback) => {
    window.addEventListener('sw-update-available', callback);
    
    return () => {
        window.removeEventListener('sw-update-available', callback);
    };
};

/**
 * Skip waiting for new SW
 */
export const skipServiceWorkerWaiting = () => {
    if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
};
