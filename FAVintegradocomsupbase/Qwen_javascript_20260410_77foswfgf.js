// sw.js - Service Worker para favQWEN3
const CACHE_NAME = 'favQWEN3-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => 
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Estratégia: Cache-first para assets, Network-first para API
  if (event.request.url.includes('api.') || event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((res) => 
      res || fetch(event.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchRes.clone());
          return fetchRes;
        });
      }).catch(() => caches.match('/index.html'))
    )
  );
});

// Background sync para quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(
      // Lógica de sync seria implementada aqui
      console.log('Background sync triggered')
    );
  }
});