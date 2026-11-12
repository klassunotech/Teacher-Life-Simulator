const CACHE_NAME = 'tls-4.0.3-completion-v1';
const ASSETS = [
  './', './index.html', './style.css', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
  './js/main.js', './js/ui.js', './js/game-engine.js', './js/ecosystem-engine.js', './js/news-system.js', './js/career-system.js',
  './js/character.js', './js/event-engine.js', './js/finance-system.js',
  './js/health-system.js', './js/monthly-system.js', './js/rng.js',
  './js/salary-system.js', './js/save-system.js', './js/scenes.js', './js/school.js',
  './data/config.json', './data/subjects.json', './data/schools.json',
  './data/events.json', './data/careers.json'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)); return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request, copy)); }
    return response;
  })));
});
