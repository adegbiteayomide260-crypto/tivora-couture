/* ==========================================================================
   TIVORA COUTURE — SERVICE WORKER
   Caches the static shell (HTML/CSS/JS/design assets) for fast repeat loads
   and offline access to browse pages already visited. Deliberately does NOT
   cache Firestore/Netlify Function responses (products, orders, order
   tracking) — those must always be fetched fresh so customers never see
   stale stock, prices, or order status.
   ========================================================================== */

const CACHE_NAME = 'tivora-shell-v1';
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
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache dynamic data: Firestore, Netlify Functions, Cloudinary uploads.
  const isDynamic = url.pathname.startsWith('/.netlify/functions/') ||
    url.hostname.includes('firestore') || url.hostname.includes('googleapis') ||
    url.hostname.includes('cloudinary');
  if (isDynamic || event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
