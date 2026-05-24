// Service Worker — PediCalc PWA
// Handles: (1) PDF preview with correct filename, (2) app shell caching for offline

const SW_VERSION   = 'v14';
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

  // Store expiry as a header — SW can be killed at any time so setTimeout is
  // unreliable; the TTL is checked on every fetch instead.
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const response = new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length':      String(buffer.byteLength),
      'X-Expires':           String(expiresAt),
    },
  });

  e.waitUntil(
    caches.open(PDF_CACHE).then((cache) =>
      cache.put(fullUrl, response).then(() => {
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
          .then(async (cached) => {
            if (cached) {
              const expires = Number(cached.headers.get('X-Expires'));
              if (Date.now() <= expires) {
                // Re-wrap with explicit headers so Chrome always sees application/pdf
                // regardless of what was stored — this prevents Save-As-HTML bug
                const blob = await cached.blob();
                return new Response(blob, {
                  status: 200,
                  headers: {
                    'Content-Type':        'application/pdf',
                    'Content-Disposition': `inline; filename="${filename}"`,
                    'Content-Length':      String(blob.size),
                  },
                });
              }
              // TTL expired — purge and fall through to the redirect page
              cache.delete(fullUrl);
            }
            // Cache miss or TTL expired — serve a friendly redirect page
            const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ลิงก์ PDF หมดอายุ — PediCalc</title>
<style>
@font-face{font-family:'Sarabun';src:url('/fonts/Sarabun-Regular.ttf') format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:'Sarabun';src:url('/fonts/Sarabun-SemiBold.ttf') format('truetype');font-weight:600;font-display:swap}
@font-face{font-family:'Kanit';src:url('/fonts/Kanit-SemiBold.ttf') format('truetype');font-weight:600;font-display:swap}
*{margin:0;box-sizing:border-box}
body{min-height:100svh;display:flex;align-items:center;justify-content:center;
  background:#fff;font-family:'Sarabun',system-ui,sans-serif;padding:2rem;text-align:center;
  -webkit-font-smoothing:antialiased}
.card{background:#fff;border:1px solid #d4e9e9;border-radius:1.25rem;
  padding:2rem 2.5rem;max-width:340px;width:100%;
  box-shadow:0 4px 24px rgba(13,110,110,0.08),0 1px 4px rgba(13,110,110,0.04)}
.brand{font-family:'Kanit',system-ui,sans-serif;font-weight:600;font-size:.8rem;
  color:#0d6e6e;letter-spacing:.08em;text-transform:uppercase;margin-bottom:1.5rem;opacity:.7}
.icon{font-size:2.25rem;line-height:1;margin-bottom:.875rem}
h1{font-family:'Kanit',system-ui,sans-serif;font-weight:600;
  color:#0d6e6e;font-size:1.1rem;margin-bottom:.625rem}
.sub{color:#64748b;font-size:.875rem;line-height:1.6;margin-bottom:1.5rem}
.sub strong{color:#0d6e6e;font-size:1.25rem;font-family:'Kanit',system-ui,sans-serif}
.btn{display:inline-block;background:#0d6e6e;color:#fff;text-decoration:none;
  padding:.625rem 1.5rem;border-radius:.75rem;font-size:.875rem;font-weight:600;
  font-family:'Sarabun',system-ui,sans-serif;border:none;cursor:pointer;transition:background .2s}
.btn:hover{background:#095555}
</style>
</head>
<body>
<div class="card">
  <p class="brand">PediCalc</p>
  <div class="icon">📄</div>
  <h1>ลิงก์ PDF หมดอายุแล้ว</h1>
  <p class="sub">กลับหน้าหลักใน <strong id="s">3</strong> วินาที</p>
  <a href="/" class="btn">กลับหน้าหลัก</a>
</div>
<script>
  var n=3,el=document.getElementById('s');
  var t=setInterval(function(){n--;el.textContent=n;if(n<=0){clearInterval(t);location.replace('/');}},1000);
</script>
</body>
</html>`;
            return new Response(html, {
              status: 410,
              headers: { 'Content-Type': 'text/html;charset=utf-8' },
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
