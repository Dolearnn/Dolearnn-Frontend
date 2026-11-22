/*
 * DoLearnn service worker. Deliberately small:
 *  - Build files, fonts and images are cached after first use, so repeat visits
 *    load fast on slow or expensive data.
 *  - Pages are fetched from the network first; when the network is down, the
 *    last copy of that page (or a simple offline page) is shown.
 *  - API calls go to another origin and are never touched, so no learner's
 *    results are ever stored here (phones are often shared).
 * Bump VERSION to drop everything cached by an older version.
 */
const VERSION = 'v1';
const STATIC_CACHE = `dolearnn-static-${VERSION}`;
const PAGE_CACHE = `dolearnn-pages-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const MAX_PAGES = 30;

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(PAGE_CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))),
      // The offline page shows this icon, so it must be there before any network is lost.
      caches.open(STATIC_CACHE).then((cache) => cache.add('/icons/icon-192.png')),
    ]).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('dolearnn-') && key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname)
  );
}

async function trimPages(cache) {
  const keys = await cache.keys();
  const pages = keys.filter((request) => !request.url.endsWith(OFFLINE_URL));
  await Promise.all(pages.slice(0, Math.max(0, pages.length - MAX_PAGES)).map((request) => cache.delete(request)));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Only this site's own files; the API and Google sign-in pass straight through.
  if (url.origin !== self.location.origin) return;
  // Next.js page data requests change with every navigation; leave them to the network.
  if (url.searchParams.has('_rsc')) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGE_CACHE);
        try {
          const response = await fetch(request);
          // Pages are the same for everyone (data loads afterwards), so a copy is safe to keep.
          if (response.ok && response.type === 'basic') {
            await cache.put(request, response.clone());
            trimPages(cache);
          }
          return response;
        } catch {
          return (await cache.match(request)) || (await cache.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
  }
});
