// Service Worker — PediCalc PWA
// Handles: (1) PDF preview with correct filename, (2) app shell caching for offline

const SW_VERSION   = 'v10';
const CACHE_NAME   = `pedicale-shell-${SW_VERSION}`;
const PDF_CACHE    = 'pedicale-pdf-store';

const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logo-kabinburi.PNG',
  '/logo-kabinburi-white.PNG',
  '/fonts/Sarabun-Regular.ttf',
  '/fonts/Sarabun-SemiBold.ttf',
  '/fonts/Sarabun-Bold.ttf',
  '/fonts/Sarabun-Italic.ttf',
  '/fonts/Kanit-Regular.ttf',
  '/fonts/Kanit-SemiBold.ttf',
  '/fonts/Kanit-Bold.ttf',
];

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== PDF_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── PDF store via Cache API ──────────────────────────────────────────────────

self.addEventListener('message', (e) => {
  if (e.data?.type !== 'REGISTER_PDF') return;

  const filename = e.data.filename ?? 'TPN.pdf';
  const buffer   = e.data.buffer;
  const port     = e.ports?.[0];

  // Derive canonical full URL from SW scope — same origin the fetch event will see
  const urlPath  = `/pdf-preview/${filename}`;
  const origin   = self.registration.scope.replace(/\/$/, '').replace(/\/pdf-preview.*$/, '');
  const fullUrl  = `${origin}${urlPath}`;

  const response = new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length':      String(buffer.byteLength),
    },
  });

  e.waitUntil(
    caches.open(PDF_CACHE).then((cache) =>
      cache.put(fullUrl, response).then(() => {
        setTimeout(() => caches.open(PDF_CACHE).then((c) => c.delete(fullUrl)), 10 * 60 * 1000);
        if (port) port.postMessage({ url: urlPath });
      })
    )
  );
});

// ── Fetch handler ────────────────────────────────────────────────────────────

self.addEventListener('fetch', (e) => {
  const { pathname } = new URL(e.request.url);

  // 1. PDF preview — intercept ALL requests to /pdf-preview/ (including navigate)
  if (pathname.startsWith('/pdf-preview/')) {
    const filename = pathname.split('/pdf-preview/')[1] ?? 'TPN.pdf';
    e.respondWith(
      caches.open(PDF_CACHE).then((cache) => {
        // Build the canonical key exactly as stored in the message handler
        const origin  = self.registration.scope.replace(/\/$/, '').replace(/\/pdf-preview.*$/, '');
        const fullUrl = `${origin}${pathname}`;

        // Try canonical key first, then the raw request URL as fallback
        return cache.match(fullUrl)
          .then((cached) => cached ?? cache.match(e.request.url))
          .then((cached) => {
            if (cached) {
              // Re-wrap with explicit headers so Chrome always sees application/pdf
              // regardless of what was stored — this prevents Save-As-HTML bug
              return cached.blob().then((blob) => new Response(blob, {
                status: 200,
                headers: {
                  'Content-Type':        'application/pdf',
                  'Content-Disposition': `inline; filename="${filename}"`,
                  'Content-Length':      String(blob.size),
                },
              }));
            }
            // Cache miss — return 404 with application/pdf content-type so Chrome
            // never mistakes this route for HTML even on failure
            return new Response('', {
              status: 404,
              headers: { 'Content-Type': 'application/pdf' },
            });
          });
      })
    );
    return;
  }

  // 2. Navigation — network first, app-shell fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
    return;
  }

  // 3. Static assets — cache first
  if (e.request.method === 'GET' && (
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/fonts/') ||
    pathname === '/logo-kabinburi.PNG' ||
    pathname === '/logo-kabinburi-white.PNG' ||
    pathname === '/manifest.webmanifest'
  )) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached ?? fetch(e.request).then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(e.request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // 4. Everything else — network only (no e.respondWith = pass through)
});
