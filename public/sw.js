// Service worker minimo: no cachea de forma agresiva (esta app cambia con frecuencia
// y servir una version vieja por error seria peor que no cachear nada), pero registra
// el evento fetch que Chrome exige para considerar la app instalable como PWA, requisito
// de base para empaquetarla como TWA en Android.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
