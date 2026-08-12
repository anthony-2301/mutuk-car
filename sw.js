self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('mutuk-store').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/image/logo.jpeg'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});