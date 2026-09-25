/**
 * Service Worker Registration and Network Connectivity Manager
 */

export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[ServiceWorker] Successfully registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[ServiceWorker] Registration failed:', err);
        });
    });
  }
}
