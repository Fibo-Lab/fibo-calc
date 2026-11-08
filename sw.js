// Service worker: desa l'aplicació a la memòria cau perquè funcioni sense connexió.
// Quan canviïs qualsevol fitxer, incrementa VERSION perquè els usuaris rebin l'actualització.

const VERSION = 'v2.0.0';
const CACHE = `calculadora-${VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './css/natural.css',
  './css/stats.css',
  './vendor/mathjs/math.js',
  './js/main.js',
  './js/core/engine.js',
  './js/core/format.js',
  './js/core/history.js',
  './js/core/i18n.js',
  './js/core/registry.js',
  './js/core/store.js',
  './js/core/stats.js',
  './js/core/theme.js',
  './js/themes/presets.js',
  './js/themes/resolve.js',
  './js/i18n/ca.js',
  './js/i18n/es.js',
  './js/ui/history-panel.js',
  './js/ui/settings.js',
  './js/ui/toast.js',
  './js/modules/calculator/index.js',
  './js/modules/calculator/display.js',
  './js/modules/calculator/editor.js',
  './js/modules/calculator/keypad.js',
  './js/modules/calculator/keys.js',
  './js/modules/calculator/natural.js',
  './js/modules/calculator/natural-render.js',
  './js/modules/stats/index.js',
  './js/modules/stats/chart.js',
  './js/modules/stats/format.js',
  './js/modules/stats/texts.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' evita agafar còpies velles de la memòria cau HTTP (no barrejar versions).
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('calculadora-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// La pàgina demana activar la versió nova quan l'usuari prem "Actualitza".
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// Primer la memòria cau; si no hi és, la xarxa (i es desa per a la propera vegada).
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    } catch (err) {
      if (request.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
