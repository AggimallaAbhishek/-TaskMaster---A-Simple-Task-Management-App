/**
 * Service Worker for TaskMaster
 * Handles offline functionality, caching, and background sync
 */

const CACHE_NAME = 'taskmaster-v1';
const API_CACHE = 'taskmaster-api-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Service worker installed');
            return Promise.resolve();
        })
    );

    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// Fetch event - network-first strategy for API, cache-first for assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // API calls - network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Static assets - cache first, fallback to network
    if (request.method === 'GET') {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // POST, PUT, DELETE - try network first
    event.respondWith(networkFirstStrategy(request));
});

/**
 * Network-first strategy with offline fallback
 */
async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);
        
        // Cache successful GET responses
        if (response.ok && request.method === 'GET') {
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.log('[SW] Network request failed:', request.url);
        
        // Try cache for GET requests
        if (request.method === 'GET') {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
        }

        // Return offline response
        return new Response(
            JSON.stringify({
                error: 'Offline',
                offline: true,
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

/**
 * Cache-first strategy with network fallback
 */
async function cacheFirstStrategy(request) {
    const cached = await caches.match(request);
    
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.log('[SW] Failed to fetch:', request.url);
        
        return new Response(
            JSON.stringify({
                error: 'Offline',
                offline: true,
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

// Message event for client communication
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME);
        caches.delete(API_CACHE);
    }
});

console.log('[SW] Service worker ready');
