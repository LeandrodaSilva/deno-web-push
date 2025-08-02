const CACHE_NAME = 'web-push-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/main.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // 'https://cdn.simplecss.org/simple.min.css',
    // 'https://cdn.jsdelivr.net/npm/sweetalert2@11'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    const notificationPayload = event.data?.json();

    event.waitUntil(
        self.registration.showNotification(notificationPayload.title, {
            icon: notificationPayload.icon,
            body: notificationPayload.body,
            image: notificationPayload.imageUrl
        }),
    );

    // Enviar mensagem para todas as abas abertas
    event.waitUntil(
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SHOW_SWEET_ALERT',
                    payload: notificationPayload
                });
            });
        })
    );
});

