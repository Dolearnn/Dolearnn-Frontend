'use client';

import { useEffect } from 'react';

/** Registers public/sw.js in production builds, so DoLearnn installs and loads fast on repeat visits. */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      // A worker left by a local production run would serve stale dev files.
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister());
      });
      return;
    }
    // After the page has loaded, so registering never slows the first paint.
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Not supported or blocked: the site works the same without it.
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
