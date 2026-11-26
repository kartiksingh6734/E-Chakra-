const release = "3b028fa9799b2e0c99859493";
const files = ["assets/collector-app-wB5FA6nL.js","assets/index-5tcfDC-6.js","assets/index-Dk2NHg_O.css","assets/store-JaNmNZ60.js","favicon.svg","icon-192.png","icon-512.png","index.html","manifest.webmanifest","walkthrough.png"];
// The build prepends the release hash and the exact public asset list.
const scope = self.registration.scope;
const prefix = 'echakra-pages:' + scope + ':';
const cacheName = prefix + release;
const urls = new Set(files.map(file => new URL(file, scope).href));
const home = new URL('index.html', scope).href;

self.addEventListener('install', event => {
  // The worker activates only after the entire version can load offline.
  event.waitUntil(caches.open(cacheName).then(cache =>
    cache.addAll([...urls].map(url => new Request(url, { cache: 'reload', redirect: 'error' })))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(prefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  let key = url.href;
  if (request.mode === 'navigate' && url.origin === self.location.origin &&
      (url.pathname === new URL(scope).pathname || url.pathname === new URL(home).pathname)) {
    key = home;
  }
  if (!urls.has(key)) return;
  event.respondWith(caches.open(cacheName).then(async cache => await cache.match(key) || fetch(request)));
});
