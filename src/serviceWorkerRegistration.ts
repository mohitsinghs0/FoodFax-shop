/**
 * Service Worker Unregistration and Cache Cleanup Manager
 * Eliminates stale bundle caching to prevent blank screen errors on new deployments.
 */

export function registerServiceWorker(): void {
  if (typeof window !== 'undefined') {
    // Unregister any active service worker to prevent stale caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().then(() => {
            console.log('[ServiceWorker] Unregistered obsolete worker:', reg.scope);
          });
        }
      }).catch(() => {});
    }

    // Purge any legacy browser CacheStorage
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          if (name.startsWith('foodfax-shop')) {
            caches.delete(name).then(() => {
              console.log('[CacheStorage] Purged legacy cache:', name);
            });
          }
        }
      }).catch(() => {});
    }
  }
}
