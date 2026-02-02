const CACHE_NAME = 'biblioteca-v2.3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico'
];

// Install - cache assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', (e) => {
  // Skip non-GET requests and non-http(s) URLs
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;
  
  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Return cached version or fetch from network
      const fetched = fetch(e.request).then((response) => {
        // Cache successful responses (only same-origin)
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(() => cached);
      
      return cached || fetched;
    })
  );
});
