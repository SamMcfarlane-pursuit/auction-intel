// DEVELOPMENT Service Worker - Bypasses Cache
const CACHE_NAME = 'auction-intel-v1';

// Install - do nothing
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate - clean up ALL old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    console.log('[SW] Deleting old cache:', name);
                    return caches.delete(name);
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch - ALWAYS network first
self.addEventListener('fetch', (event) => {
    // Force network only for all requests in development to prevent blank screens
    event.respondWith(fetch(event.request));
});

// Handle push notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            data: { url: data.url || '/' },
        };
        event.waitUntil(
            self.registration.showNotification(data.title || 'Auction Intel', options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
