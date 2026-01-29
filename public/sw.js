
/**
 * Account Express - Service Worker v2 (Robust Offline)
 * Strategies: 
 * - Cache-First: JS, CSS, WASM, Fonts, Images
 * - Network-First: HTML (to get latest updates if online), API data
 */

const CACHE_NAME = 'account-express-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/vite.svg',
    '/sql-wasm.js',
    '/sql-wasm.wasm'
];

// 1. Install Event: Cache Shell
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching critical assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// 2. Activate Event: Cleanup
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Clearing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 3. Fetch Event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-http requests
    if (!request.url.startsWith('http')) return;

    // -- STRATEGY: Cache-First for static assets --
    const isStaticAsset = (
        url.pathname.includes('/assets/') ||
        url.pathname.endsWith('.wasm') ||
        url.pathname.endsWith('.js') ||
        url.pathname.includes('fonts.googleapis.com') ||
        url.pathname.includes('fonts.gstatic.com')
    );

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then((cached) => {
                return cached || fetch(request).then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, response.clone());
                        return response;
                    });
                });
            })
        );
        return;
    }

    // -- STRATEGY: Network-First for HTML and everything else --
    // This ensures we get the latest version if online, but fall back to cache if offline.
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Cache the newest version
                if (request.method === 'GET' && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline: Try to find in cache
                return caches.match(request).then((cached) => {
                    if (cached) return cached;

                    // If it's a navigation request and we don't have it, return the index.html
                    if (request.mode === 'navigate') {
                        return caches.match('/');
                    }

                    return new Response('Offline: Resource not available', { status: 503 });
                });
            })
    );
});
