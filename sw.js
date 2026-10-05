const CACHE_NAME = 'biblioteca-v3.39-token-persist';
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
  
  const url = new URL(e.request.url);
  if (url.hostname === 'api.github.com') return;
  const esPortada = url.pathname.includes('/portadas/');
  if (esPortada && (url.pathname.endsWith('/historia-de-langreo.jpg') || url.pathname.endsWith('/tropico-de-cancer.jpg'))) {
    url.searchParams.set('v', '2');
  }
  const destino = esPortada ? new Request(url.toString(), { method: 'GET' }) : e.request;

  e.respondWith(
    (esPortada
      ? fetch(destino).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(destino, clone));
          }
          return response;
        }).catch(() => caches.match(destino))
      : caches.match(e.request).then((cached) => {
          const fetched = fetch(e.request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
            }
            return response;
          }).catch(() => cached);
          return cached || fetched;
        }))
  );
});
