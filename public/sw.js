/**
 * Foodfax Shop - Resilient Service Worker
 * Ensures smooth network updates without stale bundle locking.
 */

const CACHE_NAME = 'foodfax-shop-v3';

self.addEventListener('install', (event) => {
  // Activate new worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge all old caches (v1, v2, etc.) to prevent stale index.html or chunk hash mismatch
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting obsolete cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests, websockets, and external APIs
  if (event.request.method !== 'GET' || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // For HTML navigation, always fetch fresh from network to guarantee latest JS bundle references
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('Offline. Please reconnect to access the latest version.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
    );
    return;
  }

  // Cache static assets (CSS, JS, fonts, images) with network fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.origin === self.location.origin &&
          url.pathname.startsWith('/assets/')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('Offline asset unavailable', { status: 404 });
      })
  );
});
