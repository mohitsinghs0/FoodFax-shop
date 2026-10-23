import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './serviceWorkerRegistration.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Auto-reload on dynamic module chunk mismatch (e.g. following a new Vercel deployment)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Preload chunk error detected. Auto-reloading to fetch fresh deployment assets...');
    window.location.reload();
  });
}

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
