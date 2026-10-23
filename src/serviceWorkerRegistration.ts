/**
 * Service Worker Registration and Network Connectivity Manager
 */

export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.MODE !== 'test') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[ServiceWorker] Successfully registered with scope:', reg.scope);
          // Check for worker updates on page visit
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn('[ServiceWorker] Registration failed:', err);
        });
    });
  }
}
