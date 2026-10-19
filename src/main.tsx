import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const syncAppViewportHeight = () => {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(height)}px`);
};

let viewportSyncFrame = 0;
const scheduleViewportHeightSync = () => {
  window.cancelAnimationFrame(viewportSyncFrame);
  viewportSyncFrame = window.requestAnimationFrame(syncAppViewportHeight);
};

syncAppViewportHeight();
window.addEventListener('resize', scheduleViewportHeightSync, { passive: true });
window.addEventListener('orientationchange', scheduleViewportHeightSync, { passive: true });
window.addEventListener('pageshow', scheduleViewportHeightSync);
window.visualViewport?.addEventListener('resize', scheduleViewportHeightSync, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') scheduleViewportHeightSync();
});

// iOS can report the previous viewport size for a moment after a cold PWA launch.
window.addEventListener('pageshow', () => {
  window.setTimeout(scheduleViewportHeightSync, 100);
  window.setTimeout(scheduleViewportHeightSync, 400);
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/pwa/' }).catch((error) => {
      console.error('Could not register the PWA service worker:', error);
    });
  });
}

// Import Google Font
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

// Register the PWA service worker only from its own entry point.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

