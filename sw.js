const CACHE_NAME = 'memento-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './particles.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Network-first for Google Fonts, Cache-first for others
    if (event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
        );
    }
});
