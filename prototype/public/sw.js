const CACHE='echakra-shell-v1';
const SHELL=['/','/manifest.webmanifest','/favicon.svg','/icon-192.png','/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('echakra-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data?.type==='CACHE_SHELL'){event.waitUntil(caches.open(CACHE).then(async c=>{for(const url of event.data.urls||[]){try{const u=new URL(url,self.location.origin);if(u.origin===self.location.origin&&!u.pathname.startsWith('/api/')&&!u.pathname.includes('signin')&&!u.pathname.includes('callback'))await c.add(u.href)}catch{}}}))}});
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')||u.pathname.includes('signin')||u.pathname.includes('signout')||u.pathname.includes('callback'))return;
 if(r.mode==='navigate'){event.respondWith(fetch(r).then(async response=>{if(response.ok&&!response.redirected){const c=await caches.open(CACHE);c.put('/',response.clone())}return response}).catch(async()=>await caches.match('/')||new Response('Open E-CHAKRA once while online to use offline capture.',{status:503})));return}
 if(/\.(js|css|woff2?|png|svg|webmanifest)$/.test(u.pathname)){event.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(r,copy))}return response})))}
});
