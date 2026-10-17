const CACHE_NAME = 'cahier-achim-v4';
const ASSETS = [
  './', './index.html', './manifest.json', './styles.css', './app.js',
  './icon-192.png', './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((names) =>
    Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        if (e.request.url.startsWith(self.location.origin)) cache.put(e.request, response.clone());
        return response;
      });
    }))
  );
});