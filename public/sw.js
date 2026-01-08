// Account Express Service Worker
// Version: 1.0 (Iron Core)

const CACHE_NAME = 'account-express-v1-offline';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE).catch(err => {
                    console.warn('Cache addAll failed', err);
                });
            })
    );
});

// Fetch Event (Network First scheme for API, Cache First for assets?)
// For now: Stale-While-Revalidate or Network First.
// Simple: Network First, falling back to cache.
self.addEventListener('fetch', event => {
    // Only handle http/https
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// Push Event
self.addEventListener('push', function (event) {
    if (event.data) {
        console.log('Push event!! ', event.data.text());
        const options = {
            body: event.data.text(),
            icon: '/vite.svg',
            badge: '/vite.svg',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2'
            }
        };
        event.waitUntil(
            self.registration.showNotification('Account Express Tax Alert', options)
        );
    }
});
