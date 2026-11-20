const CACHE = 'echakra-shell-v2';
const PUBLIC_FILES = ['/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

function isPublicAsset(url) {
  return url.origin === self.location.origin && !url.search && (
    PUBLIC_FILES.includes(url.pathname) ||
    (url.pathname.startsWith('/_next/static/') && /\.(?:js|css|woff2?)$/.test(url.pathname))
  );
}

function canStore(response, path) {
  if (response.status !== 200 || response.redirected ||
      /(?:^|,)\s*(?:no-store|private)\b/i.test(response.headers.get('cache-control') || '')) return false;
  const type = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (path === '/') return type === 'text/html';
  if (path.endsWith('.js')) return /^(?:text|application)\/(?:javascript|ecmascript)$/.test(type);
  if (path.endsWith('.css')) return type === 'text/css';
  if (path.endsWith('.woff') || path.endsWith('.woff2')) return /^(?:font\/|application\/(?:font-|octet-stream))/.test(type);
  if (path.endsWith('.webmanifest')) return type === 'application/manifest+json' || type === 'application/json';
  return type === (path.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
}

async function warm(cache, url) {
  const response = await fetch(url.href, { redirect: 'error', cache: 'reload' });
  if (canStore(response, url.pathname)) await cache.put(url.href, response);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // The host can require a fresh login. A redirect must never become the offline home page.
    await Promise.all(['/', ...PUBLIC_FILES].map(path =>
      warm(cache, new URL(path, self.location.origin)).catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('echakra-shell-') && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_SHELL' || !Array.isArray(event.data.urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const value of new Set(event.data.urls)) {
      if (typeof value !== 'string') continue;
      try {
        const url = new URL(value, self.location.origin);
        if (isPublicAsset(url) && !await cache.match(url.href)) await warm(cache, url);
      } catch { /* Keep the remaining assets available if a fetch fails. */ }
    }
  })());
});

async function navigate(request) {
  let response;
  try {
    response = await fetch(request);
  } catch {
    const cache = await caches.open(CACHE);
    return await cache.match('/') ||
      new Response('Open E-CHAKRA once while online to use offline capture.', { status: 503 });
  }
  if (canStore(response, '/')) {
    await caches.open(CACHE).then(cache => cache.put('/', response.clone())).catch(() => {});
  }
  return response;
}

async function publicAsset(request, path) {
  const cache = await caches.open(CACHE).catch(() => null);
  const hit = await cache?.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (cache && canStore(response, path)) await cache.put(request, response.clone()).catch(() => {});
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    if (url.pathname === '/' && !url.search) event.respondWith(navigate(request));
  } else if (isPublicAsset(url)) {
    event.respondWith(publicAsset(request, url.pathname));
  }
});
