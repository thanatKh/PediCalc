// Service Worker — PediCalc PWA
// Handles: (1) PDF preview with HTML wrapper (bypasses Chrome "Download PDFs" setting),
//          (2) Range-request support for iOS Safari pinch-to-zoom,
//          (3) app shell caching for offline

const SW_VERSION = 'v18';
const CACHE_NAME = `pedicale-shell-${SW_VERSION}`;
const PDF_CACHE  = 'pedicale-pdf-store';
const PDF_TTL_MS = 10 * 60 * 1000; // 10 minutes

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
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== PDF_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── PDF registration ─────────────────────────────────────────────────────────
// PDF bytes are stored under /pdf-data/{filename} (raw bytes).
// /pdf-preview/{filename} is served as an HTML wrapper page that embeds /pdf-data/{filename}.
// This bypasses Chrome's "Download PDFs" setting — Chrome never downloads HTML.

self.addEventListener('message', (e) => {
  if (e.data?.type !== 'REGISTER_PDF') return;

  const { filename = 'TPN.pdf', buffer } = e.data;
  const port = e.ports?.[0];

  // The tab will navigate to /pdf-preview/{filename} (HTML page).
  const previewPath = `/pdf-preview/${filename}`;
  const dataPath    = `/pdf-data/${filename}`;
  const scope       = self.registration.scope.replace(/\/$/, '');
  const dataUrl     = `${scope}${dataPath}`;
  const expiresAt   = Date.now() + PDF_TTL_MS;

  e.waitUntil(
    caches.open(PDF_CACHE).then(async (cache) => {
      // Clear any previously cached PDFs to prevent accumulation across sessions.
      const old = await cache.keys();
      await Promise.all(old.map((k) => cache.delete(k)));

      // Store raw PDF bytes under /pdf-data/ key with TTL header.
      await cache.put(dataUrl, new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type':        'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
          'Content-Length':      String(buffer.byteLength),
          'X-Expires':           String(expiresAt),
          'Accept-Ranges':       'bytes',
        },
      }));

      // Reply with the HTML wrapper path — the tab navigates here.
      port?.postMessage({ url: previewPath });
    })
  );
});

// ── Fetch handler ────────────────────────────────────────────────────────────

self.addEventListener('fetch', (e) => {
  const { pathname } = new URL(e.request.url);

  // 1. HTML wrapper — Chrome always opens HTML inline, bypassing "Download PDFs"
  if (pathname.startsWith('/pdf-preview/')) {
    e.respondWith(handlePdfPreview(pathname));
    return;
  }

  // 2. Raw PDF bytes — served to the <embed> inside the HTML wrapper, and for download
  if (pathname.startsWith('/pdf-data/')) {
    e.respondWith(handlePdfData(e.request, pathname));
    return;
  }

  // 3. Navigation — network first, app-shell fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
    return;
  }

  // 4. Static assets — cache first
  if (e.request.method === 'GET' && isShellAsset(pathname)) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) => hit ?? fetch(e.request).then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(e.request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // 5. Everything else — pass through to network
});

function isShellAsset(pathname) {
  return (
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/fonts/') ||
    pathname === '/logo-kabinburi.PNG' ||
    pathname === '/logo-kabinburi-white.PNG' ||
    pathname === '/manifest.webmanifest'
  );
}

// ── HTML wrapper handler ─────────────────────────────────────────────────────
// Serves a full-viewport HTML page embedding the PDF via <embed>.
// Chrome always renders HTML inline — this bypasses the "Download PDFs" browser setting.
// The page also provides a download button that links directly to /pdf-data/{filename}.

async function handlePdfPreview(pathname) {
  const filename  = pathname.replace(/^\/pdf-preview\//, '') || 'TPN.pdf';
  const dataPath  = `/pdf-data/${filename}`;
  const scope     = self.registration.scope.replace(/\/$/, '');
  const dataUrl   = `${scope}${dataPath}`;

  // Check that the underlying PDF data is actually cached and not expired.
  const cache  = await caches.open(PDF_CACHE);
  const cached = await cache.match(dataUrl);

  if (cached) {
    const expiresAt = Number(cached.headers.get('X-Expires'));
    if (expiresAt && Date.now() <= expiresAt) {
      return new Response(previewPageHtml(dataPath, filename), {
        status: 200,
        headers: { 'Content-Type': 'text/html;charset=utf-8' },
      });
    }
    // TTL expired — purge and fall through to recovery page.
    await cache.delete(dataUrl);
  }

  return new Response(expiredPageHtml(), {
    status: 410,
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}

// ── Raw PDF data handler ──────────────────────────────────────────────────────
// Serves the actual PDF bytes to the <embed> element (and Range requests from iOS Safari).

async function handlePdfData(request, pathname) {
  const scope    = self.registration.scope.replace(/\/$/, '');
  const fullUrl  = `${scope}${pathname}`;

  const cache  = await caches.open(PDF_CACHE);
  const cached = await cache.match(fullUrl) ?? await cache.match(request.url);

  if (cached) {
    const expiresAt = Number(cached.headers.get('X-Expires'));
    if (expiresAt && Date.now() <= expiresAt) {
      // iOS Safari sends byte-range requests for pinch-to-zoom.
      // Do NOT delete the cache entry after serving — the same entry must survive
      // multiple Range requests within the TTL window.
      const rangeHeader = request.headers.get('Range');
      if (rangeHeader) {
        return handleRangeRequest(cached, rangeHeader);
      }

      // Full PDF — stream cached.body directly.
      // Never use .blob() here: in some Chrome builds the Fetch spec's MIME-type
      // sniffing on Blob bodies overrides the explicit Content-Type header,
      // producing the wrong MIME type and triggering a file download instead of
      // inline PDF rendering.
      const filename = pathname.replace(/^\/pdf-data\//, '') || 'TPN.pdf';
      const headers = new Headers({
        'Content-Type':        'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Accept-Ranges':       'bytes',
      });
      const cl = cached.headers.get('Content-Length');
      if (cl) headers.set('Content-Length', cl);
      return new Response(cached.body, { status: 200, headers });
    }

    // TTL expired — purge and serve recovery page.
    await cache.delete(fullUrl);
  }

  return new Response(expiredPageHtml(), {
    status: 410,
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}

async function handleRangeRequest(cached, rangeHeader) {
  // Read entire buffer from cache — cache.match() always returns a fresh clone
  // so calling arrayBuffer() here does not affect other concurrent Range requests.
  const buffer = await cached.arrayBuffer();
  const total  = buffer.byteLength;

  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  if (!match) {
    return new Response('Range Not Satisfiable', {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` },
    });
  }

  const start = parseInt(match[1], 10);
  const end   = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;
  const chunk = buffer.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    headers: {
      'Content-Type':   'application/pdf',
      'Content-Range':  `bytes ${start}-${end}/${total}`,
      'Content-Length': String(chunk.byteLength),
      'Accept-Ranges':  'bytes',
    },
  });
}

// ── PDF preview HTML page ─────────────────────────────────────────────────────
// Full-viewport embedded PDF viewer. Chrome always renders this as HTML (never downloads).
// The download button links to /pdf-data/{filename} with the correct filename.

// Minimal full-viewport HTML wrapper — native PDF viewer provides its own controls.
function previewPageHtml(dataPath, filename) {
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${filename}</title>
<style>*{margin:0;padding:0}html,body,embed{width:100%;height:100%;display:block;overflow:hidden}</style>
</head>
<body>
<embed src="${dataPath}" type="application/pdf" width="100%" height="100%">
</body>
</html>`;
}

// ── Expired-link recovery page ───────────────────────────────────────────────

function expiredPageHtml() {
  return `<!doctype html>
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
  box-shadow:0 4px 24px rgba(13,110,110,.08),0 1px 4px rgba(13,110,110,.04)}
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
  <p class="sub">กลับหน้าหลักใน <strong id="s">4</strong> วินาที</p>
  <a href="/" class="btn">กลับหน้าหลัก</a>
</div>
<script>
var n=4,el=document.getElementById('s');
var t=setInterval(function(){n--;el.textContent=n;if(n<=0){clearInterval(t);location.replace('/');}},1000);
</script>
</body>
</html>`;
}
