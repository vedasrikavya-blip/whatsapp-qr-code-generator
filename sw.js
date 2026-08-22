const CACHE_NAME = 'whatsapp-qr-code-generator-v1.0.0';
const LOCAL_APP_SHELL = [
  './',
  './index.html',
  './src/styles.css',
  './src/app.js',
  './src/links.js',
  './src/phone.js',
  './src/qr.js',
  './favicon.svg',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];
const REMOTE_APP_SHELL = [
  'https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/dist/qrcode.js',
  'https://cdn.jsdelivr.net/npm/libphonenumber-js@1.13.10/bundle/libphonenumber-min.js'
];

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function precacheAll() {
  const cache = await caches.open(CACHE_NAME);
  const localRequests = LOCAL_APP_SHELL.map(url => new Request(url, { cache: 'reload' }));
  const remoteRequests = REMOTE_APP_SHELL.map(url => new Request(url, { mode: 'no-cors', cache: 'reload' }));

  await Promise.all([...localRequests, ...remoteRequests].map(async request => {
    const response = await fetch(request);
    if (!response || (!response.ok && response.type !== 'opaque')) {
      throw new Error(`Unable to cache ${request.url}`);
    }
    await cache.put(request, response);
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(precacheAll().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(networkFirst(event.request));
});
