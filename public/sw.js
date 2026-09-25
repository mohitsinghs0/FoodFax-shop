/**
 * Foodfax Shop - Offline Service Worker
 * Precaches core app shell and provides network-first with cache fallback
 * for high resiliency during intermittent connectivity.
 */

const CACHE_NAME = 'foodfax-shop-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Precache issue:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and Supabase realtime websocket / auth post calls
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip WebSocket connections and external analytics
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Network-first with cache fallback for page navigation and app shell
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful local asset responses
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.origin === self.location.origin || url.hostname.includes('supabase.co'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline fallback from Cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigating to an HTML page while offline, return cached root
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const fallback = await caches.match('/index.html') || await caches.match('/');
          if (fallback) return fallback;
        }

        return new Response('Network offline. Cached data is available via IndexedDB.', {
          status: 503,
          statusText: 'Service Unavailable (Offline)',
          headers: new Headers({ 'Content-Type': 'text/plain' }),
        });
      })
  );
});
