// Service Worker — PediCalc PWA
// Handles: (1) PDF preview with correct filename, (2) app shell caching for offline

const SW_VERSION   = 'v11';
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
            // Cache miss (expired or shared URL) — serve a friendly redirect page
            const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ลิงก์ PDF หมดอายุ — PediCalc</title>
<style>
*{margin:0;box-sizing:border-box}
body{min-height:100svh;display:flex;align-items:center;justify-content:center;
  background:#0f172a;font-family:system-ui,sans-serif;padding:2rem;text-align:center}
.card{background:#1e293b;border:1px solid #334155;border-radius:1.25rem;
  padding:2rem 2.5rem;max-width:380px;width:100%}
.icon{font-size:2.75rem;line-height:1;margin-bottom:1rem}
h1{color:#f1f5f9;font-size:1.1rem;font-weight:700;margin-bottom:.5rem}
p{color:#94a3b8;font-size:.875rem;line-height:1.6;margin-bottom:1.5rem}
.countdown{color:#5eead4;font-size:.8rem;margin-bottom:1.25rem}
.btn{display:inline-block;background:#0d6e6e;color:#fff;text-decoration:none;
  padding:.625rem 1.5rem;border-radius:.75rem;font-size:.875rem;font-weight:600;
  border:none;cursor:pointer;transition:background .2s}
.btn:hover{background:#0f8080}
</style>
</head>
<body>
<div class="card">
  <div class="icon">📄</div>
  <h1>ลิงก์ PDF หมดอายุแล้ว</h1>
  <p>ไฟล์ PDF ถูกเก็บไว้ชั่วคราวและหมดอายุแล้ว<br>
     กรุณากลับไปสร้าง PDF ใหม่อีกครั้งจากหน้าเครื่องคำนวณ</p>
  <div class="countdown" id="msg">กำลังกลับสู่หน้าหลักใน <strong id="s">5</strong> วินาที…</div>
  <a href="/" class="btn">กลับหน้าหลัก</a>
</div>
<script>
  var n=5,el=document.getElementById('s');
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
