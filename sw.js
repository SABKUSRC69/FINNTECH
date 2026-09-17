// FINNTECH Service Worker
const CACHE_NAME = 'finntech-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser handle live web sockets and dynamic API requests
  if (event.request.url.startsWith('ws') || event.request.url.includes('tradingview.com') || event.request.url.includes('coinbase.com')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => response);
    })
  );
});
