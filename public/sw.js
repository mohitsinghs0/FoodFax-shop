/**
 * Foodfax Shop - Self-purging Service Worker
 * Proactively clears all obsolete caches and unregisters to guarantee
 * instant access to fresh Vercel deployments without stale bundle locking.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          console.log('[SW] Purging cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', () => {
  // Let browser network handle all requests directly without intercepting
  return;
});
