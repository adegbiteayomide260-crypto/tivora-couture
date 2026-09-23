/* ==========================================================================
   TIVORA COUTURE — SERVICE WORKER
   Network-first for app code and HTML so updates appear immediately.
   Previously cached pages remain available as an offline fallback.
   Dynamic data and Cloudinary images are never cached here.
   ========================================================================== */

const CACHE_NAME = 'tivora-shell-v2';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/shop.html',
  '/product.html',
  '/cart.html',
  '/wishlist.html',
  '/checkout.html',
  '/custom-couture.html',
  '/about.html',
  '/size-guide.html',
  '/contact.html',
  '/track-order.html',
  '/css/style.css',
  '/css/responsive.css',
  '/css/animations.css',
  '/js/main.js',
  '/js/components.js',
  '/js/cart.js',
  '/js/wishlist.js',
  '/js/site-images.js',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch((err) => console.warn('Tivora shell cache failed:', err))
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache dynamic data or externally hosted images.
  const isDynamic =
    url.pathname.startsWith('/.netlify/functions/') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('cloudinary');

  if (isDynamic) return;

  // Network-first for our own HTML/CSS/JS.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok && url.origin === self.location.origin) {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
