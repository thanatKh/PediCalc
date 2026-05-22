// Service Worker — PediCalc PWA
// Handles: (1) PDF preview with correct filename, (2) app shell caching for offline

const SW_VERSION   = 'v2';
const CACHE_NAME   = `pedicale-shell-${SW_VERSION}`;
const pdfStore     = new Map(); // token → { buffer, filename }

// App shell assets to pre-cache on install
const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logo-kabinburi.PNG',
];

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Remove old caches
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── PDF filename support ─────────────────────────────────────────────────────

self.addEventListener('message', (e) => {
  if (e.data?.type !== 'REGISTER_PDF') return;

  const filename = e.data.filename ?? 'TPN.pdf';
  const buffer   = e.data.buffer;
  const token    = filename.replace(/\.pdf$/i, '');

  pdfStore.set(token, { buffer, filename });
  setTimeout(() => pdfStore.delete(token), 10 * 60 * 1000);

  const port = e.ports?.[0];
  if (port) port.postMessage({ url: `/pdf-preview/${token}` });
});

// ── Fetch handler ────────────────────────────────────────────────────────────

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. PDF preview requests — serve from in-memory store
  if (url.pathname.startsWith('/pdf-preview/')) {
    const token = url.pathname.replace('/pdf-preview/', '');
    const entry = pdfStore.get(token);

    if (!entry) {
      e.respondWith(new Response('PDF not found or expired.', { status: 404 }));
      return;
    }

    e.respondWith(
      new Response(entry.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${entry.filename}"`,
          'Content-Length': String(entry.buffer.byteLength),
        },
      })
    );
    return;
  }

  // 2. Navigation requests — network first, fall back to cached shell
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
    return;
  }

  // 3. Static assets — cache first, then network
  if (e.request.method === 'GET' && (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname === '/logo-kabinburi.PNG' ||
    url.pathname === '/manifest.webmanifest'
  )) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached ?? fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // 4. Everything else — network only
});
