/* SIDEYE service worker (generated at build time from src/pwa/sw.template.js).
 *
 * - App shell (HTML, JS, CSS, fonts, icons) is precached: the app opens instantly and offline.
 * - /api/* (translation, AI voice, speech recognition) always goes to the network.
 * - Updates: each deploy has a new VERSION, so the browser installs a new worker in the background.
 *   It waits until the app asks it to take over ("Actualizar" in the app), then the page reloads.
 *   Progress lives in localStorage and is not touched by updates.
 */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL = `sideye-shell-${VERSION}`;
const RUNTIME = 'sideye-runtime';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('sideye-shell-') && key !== SHELL) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'VERSION') event.source?.postMessage({ type: 'VERSION', version: VERSION });
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return;

  // Pages: the cached app shell (fast, works offline). New versions arrive through the update flow.
  if (req.mode === 'navigate') {
    if (url.pathname.endsWith('.html') && url.pathname !== '/index.html') {
      // Static pages (privacy, support): network first, cached copy offline.
      event.respondWith(networkFirst(req));
      return;
    }
    event.respondWith(
      (async () => {
        const cached = await caches.match('/', { cacheName: SHELL });
        if (cached) return cached;
        return networkFirst(req);
      })(),
    );
    return;
  }

  // Hashed assets, fonts and icons: cache first.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/'))) {
        const cache = await caches.open(RUNTIME);
        cache.put(req, res.clone());
      }
      return res;
    })(),
  );
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(RUNTIME)).put(req, res.clone());
    return res;
  } catch (e) {
    const cached = (await caches.match(req)) || (await caches.match('/', { cacheName: SHELL }));
    if (cached) return cached;
    throw e;
  }
}
