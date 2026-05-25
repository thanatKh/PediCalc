import { useCallback, useMemo, useState, useTransition, createElement } from 'react';
import { calculateTPN } from '@/utils/tpnCalculator';
import { validateTPNInputs } from '@/utils/tpnValidation';
import { evaluateClinicalTiers } from '@/utils/clinicalDecisionSupport';

export const DEFAULTS = {
  name: '',
  hn: '',
  ward: '',
  startDate: '',
  ageMonth: '',
  ageDay: '',
  height: '',
  bw: '',
  patientType: 'newborn',
  lineType: 'central',
  volumeTarget: '120',
  dextrosePct: '10',
  proteinTarget: '2.5',
  lipidTarget: '2',
  // Electrolytes: each field = mEq/kg from that specific source
  na3PctTarget:    '3',   // Na from 3% NaCl
  naGlyceroTarget: '0',   // Na from Na Glycerophosphate (also provides PO4)
  k15PctTarget:    '2',   // K from 15% KCl
  k2hpo4Target:    '0',   // K from K2HPO4 (also provides PO4)
  caTarget: '0.5',
  mgTarget: '0.25',
  heparinConc: '0.5',
  soluvitOverride:    '',   // empty = use auto calc; non-empty = manual ml/day
  vitalipidOverride:  '',
  pediatraceOverride: '',
  manualTPNRate: '',
  manualLipidRate: '',
  urineOutput: false,
};

function buildFilename(inputs) {
  const hn   = (inputs.hn || '').replace(/[^a-zA-Z0-9]/g, '');
  const now  = new Date();
  const pad  = (n) => String(n).padStart(2, '0');
  const mmdd = `${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const hhmm = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const base = hn ? `TPN-${hn}-${mmdd}-${hhmm}` : `TPN-${mmdd}-${hhmm}`;
  return `${base}.pdf`;
}

/* Robustly resolve an active SW that can receive REGISTER_PDF.
   - If controller is set, use it (best case).
   - Otherwise wait for navigator.serviceWorker.ready (resolves once SW for our scope is active).
   - Or wait for controllerchange (covers the post-update reload window).
   The navigation to /pdf-preview/... will be intercepted as long as a SW is active
   for the scope, even before this page is controlled — so registration.active is fine. */
async function getActiveSW(ms = 15000) {
  if (!('serviceWorker' in navigator)) return null;
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;

  return new Promise((resolve) => {
    let resolved = false;
    const done = (sw) => {
      if (resolved) return;
      resolved = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      clearTimeout(timer);
      resolve(sw);
    };
    function onChange() {
      if (navigator.serviceWorker.controller) done(navigator.serviceWorker.controller);
    }
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    const timer = setTimeout(() => done(null), ms);

    navigator.serviceWorker.ready
      .then((reg) => {
        if (navigator.serviceWorker.controller) done(navigator.serviceWorker.controller);
        else if (reg?.active) done(reg.active);
      })
      .catch(() => { /* fall through to timeout */ });
  });
}

/* Stores a PDF blob in the SW cache and returns the /pdf-preview/{filename} path.
   Returns null if no SW is available after the wait. */
async function storePdfInSW(blob, filename) {
  const sw = await getActiveSW();
  if (!sw) return null;

  const buffer  = await blob.arrayBuffer();
  const channel = new MessageChannel();

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 10_000);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      resolve(e.data?.url ?? null);
    };
    sw.postMessage({ type: 'REGISTER_PDF', filename, buffer }, [channel.port2, buffer]);
  });
}

/* Loading splash written into the freshly opened blank tab while we wait for
   PDF generation + SW activation. Keeps the tab from looking broken. */
function writeLoadingSplash(tab) {
  if (!tab || tab.closed) return;
  try {
    tab.document.open();
    tab.document.write(`<!doctype html>
<html lang="th"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>กำลังเตรียม PDF…</title>
<style>
*{margin:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:#fff;font-family:system-ui,sans-serif;color:#0d6e6e}
.wrap{display:flex;align-items:center;gap:.875rem}
.spinner{width:28px;height:28px;border:3px solid #d4e9e9;border-top-color:#0d6e6e;
  border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.msg{font-size:.95rem;font-weight:600}
</style></head><body>
<div class="wrap"><div class="spinner"></div><span class="msg">กำลังเตรียม PDF…</span></div>
</body></html>`);
    tab.document.close();
  } catch { /* tab unreachable — let later steps handle it */ }
}

/* Shown in the tab when the SW failed to activate within the wait window.
   Rare: only triggers on first-ever load if user clicks Export instantly. */
function writeNoSWErrorPage(tab) {
  if (!tab || tab.closed) return;
  try {
    tab.document.open();
    tab.document.write(`<!doctype html>
<html lang="th"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ระบบยังไม่พร้อม — PediCalc</title>
<style>
@font-face{font-family:'Sarabun';src:url('/fonts/Sarabun-Regular.ttf') format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:'Sarabun';src:url('/fonts/Sarabun-SemiBold.ttf') format('truetype');font-weight:600;font-display:swap}
@font-face{font-family:'Kanit';src:url('/fonts/Kanit-SemiBold.ttf') format('truetype');font-weight:600;font-display:swap}
*{margin:0;box-sizing:border-box}
body{min-height:100svh;display:flex;align-items:center;justify-content:center;
  background:#fff;font-family:'Sarabun',system-ui,sans-serif;padding:2rem;text-align:center}
.card{background:#fff;border:1px solid #d4e9e9;border-radius:1.25rem;
  padding:2rem 2.5rem;max-width:340px;
  box-shadow:0 4px 24px rgba(13,110,110,.08)}
.brand{font-family:'Kanit',sans-serif;font-weight:600;font-size:.8rem;
  color:#0d6e6e;letter-spacing:.08em;text-transform:uppercase;margin-bottom:1.5rem;opacity:.7}
.icon{font-size:2.25rem;margin-bottom:.875rem}
h1{font-family:'Kanit',sans-serif;font-weight:600;color:#0d6e6e;font-size:1.1rem;margin-bottom:.625rem}
.sub{color:#64748b;font-size:.875rem;line-height:1.6;margin-bottom:1.5rem}
.btn{display:inline-block;background:#0d6e6e;color:#fff;text-decoration:none;
  padding:.625rem 1.5rem;border-radius:.75rem;font-size:.875rem;font-weight:600;cursor:pointer}
</style></head><body>
<div class="card">
  <p class="brand">PediCalc</p>
  <div class="icon">⏳</div>
  <h1>ระบบยังไม่พร้อม</h1>
  <p class="sub">กรุณารีเฟรชหน้าหลักหนึ่งครั้ง<br>แล้วลองสร้าง PDF ใหม่อีกครั้ง</p>
  <button class="btn" onclick="window.close()">ปิดหน้านี้</button>
</div>
</body></html>`);
    tab.document.close();
  } catch { /* tab unreachable */ }
}

/* Inline PDF viewer page written directly to a new tab using a local blob URL.
   Used on desktop/Android — avoids the SW round-trip that causes Chrome's PDF
   plugin download button to show "file wasn't available on site". The blob URL
   is origin-scoped and stays valid as long as the PediCalc tab is open.
   <a download> bypasses Windows file-association lookup for the type label. */
function buildViewerHtml(blobUrl, filename) {
  return `<!doctype html>
<html lang="th"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${filename}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;display:flex;flex-direction:column;overflow:hidden}
#bar{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:10px;background:#0d6e6e}
#bar-name{color:rgba(255,255,255,.8);font-family:system-ui,-apple-system,sans-serif;font-size:13px;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
#save-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 14px;background:#fff;color:#0d6e6e;border-radius:6px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;text-decoration:none;flex-shrink:0}
embed{flex:1;width:100%;display:block}
</style>
</head><body>
<div id="bar">
  <span id="bar-name">${filename}</span>
  <a id="save-btn" download="${filename}" href="${blobUrl}">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Save PDF
  </a>
</div>
<embed src="${blobUrl}" type="application/pdf">
</body></html>`;
}

export function useTPNForm(hospital) {
  const [inputs, setInputs] = useState(DEFAULTS);
  const [isExporting, startExportTransition] = useTransition();

  const update = useCallback(
    (key) => (evOrVal) => {
      const v = evOrVal?.target !== undefined ? evOrVal.target.value : evOrVal;
      setInputs((s) => ({ ...s, [key]: v }));
    },
    []
  );

  const reset = useCallback(() => setInputs(DEFAULTS), []);

  const results    = useMemo(() => calculateTPN(inputs), [inputs]);
  const validation = useMemo(() => validateTPNInputs(inputs), [inputs]);
  const cds        = useMemo(() => evaluateClinicalTiers(inputs, results) ?? {}, [inputs, results]);

  const handleExportPDF = useCallback(() => {
    if (!results || results.isWaterNegative || isExporting) return;
    if (validation.errors.length > 0) return;

    const filename = buildFilename(inputs);

    // Open synchronously during the user gesture — beats popup blockers on all platforms.
    const tab = window.open('', '_blank');
    writeLoadingSplash(tab);

    startExportTransition(async () => {
      try {
        let logoUrl = null;
        try {
          const res = await fetch(hospital?.logoForPdf ?? '/logo-kabinburi.PNG');
          const buf = await res.arrayBuffer();
          const u8  = new Uint8Array(buf);
          let b64 = '';
          for (let i = 0; i < u8.length; i += 8192) {
            b64 += String.fromCharCode(...u8.subarray(i, i + 8192));
          }
          logoUrl = `data:image/png;base64,${btoa(b64)}`;
        } catch { /* logo optional */ }

        // Dynamic import keeps @react-pdf/renderer out of the main bundle.
        const [{ pdf }, { default: TPNPdfTemplate }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@/components/TPNPdfTemplate'),
        ]);

        const element = createElement(TPNPdfTemplate, { inputs, results, logoUrl, hospital });
        const blob    = await pdf(element).toBlob();

        // iOS: SW-backed URL → native PDF viewer + share sheet with correct filename.
        // Desktop/Android: write viewer HTML directly to the tab using a local blob URL.
        //   - blob URL is origin-scoped, no server request needed to save
        //   - <a download> guarantees correct filename; "file wasn't available" impossible
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        if (isIOS) {
          const swPath = await storePdfInSW(blob, filename);
          if (swPath) {
            if (tab && !tab.closed) tab.location.href = swPath;
            else window.open(swPath, '_blank');
          } else {
            writeNoSWErrorPage(tab);
          }
        } else {
          // File object (not plain Blob) lets Chrome track the filename so its own
          // save/download button uses TPN-xxxx.pdf instead of the blob UUID.
          const blobUrl = URL.createObjectURL(new File([blob], filename, { type: 'application/pdf' }));
          if (tab && !tab.closed) tab.location.href = blobUrl;
          else window.open(blobUrl, '_blank');
        }
      } catch (err) {
        console.error('Export PDF failed:', err);
        let wroteToTab = false;
        try {
          if (tab && !tab.closed) {
            tab.document.open();
            tab.document.write(
              '<!doctype html><html lang="th"><head>' +
              '<meta charset="utf-8">' +
              '<meta name="viewport" content="width=device-width,initial-scale=1">' +
              '<title>เกิดข้อผิดพลาด — PediCalc</title>' +
              '<style>' +
              '@font-face{font-family:"Sarabun";src:url("/fonts/Sarabun-Regular.ttf") format("truetype");font-weight:400;font-display:swap}' +
              '@font-face{font-family:"Sarabun";src:url("/fonts/Sarabun-SemiBold.ttf") format("truetype");font-weight:600;font-display:swap}' +
              '@font-face{font-family:"Kanit";src:url("/fonts/Kanit-SemiBold.ttf") format("truetype");font-weight:600;font-display:swap}' +
              '*{margin:0;box-sizing:border-box}' +
              'body{min-height:100svh;display:flex;align-items:center;justify-content:center;' +
              'background:#fff;font-family:"Sarabun",system-ui,sans-serif;padding:2rem;text-align:center;' +
              '-webkit-font-smoothing:antialiased}' +
              '.card{background:#fff;border:1px solid #d4e9e9;border-radius:1.25rem;' +
              'padding:2rem 2.5rem;max-width:340px;width:100%;' +
              'box-shadow:0 4px 24px rgba(13,110,110,0.08),0 1px 4px rgba(13,110,110,0.04)}' +
              '.brand{font-family:"Kanit",system-ui,sans-serif;font-weight:600;font-size:.8rem;' +
              'color:#0d6e6e;letter-spacing:.08em;text-transform:uppercase;margin-bottom:1.5rem;opacity:.7}' +
              '.icon{font-size:2.25rem;line-height:1;margin-bottom:.875rem}' +
              'h1{font-family:"Kanit",system-ui,sans-serif;font-weight:600;' +
              'color:#0d6e6e;font-size:1.1rem;margin-bottom:.625rem}' +
              '.sub{color:#64748b;font-size:.875rem;line-height:1.6;margin-bottom:1.5rem}' +
              '.btn{display:inline-block;background:#0d6e6e;color:#fff;text-decoration:none;' +
              'padding:.625rem 1.5rem;border-radius:.75rem;font-size:.875rem;font-weight:600;' +
              'font-family:"Sarabun",system-ui,sans-serif;border:none;cursor:pointer;transition:background .2s}' +
              '.btn:hover{background:#095555}' +
              '</style>' +
              '</head><body>' +
              '<div class="card">' +
              '<p class="brand">PediCalc</p>' +
              '<div class="icon">⚠️</div>' +
              '<h1>เกิดข้อผิดพลาดในการสร้าง PDF</h1>' +
              '<p class="sub">กรุณาปิดหน้านี้และลองใหม่อีกครั้ง<br>หากปัญหายังคงอยู่ ลองรีเฟรชหน้าหลัก</p>' +
              '<button class="btn" onclick="window.close()">ปิดหน้านี้</button>' +
              '</div>' +
              '</body></html>'
            );
            tab.document.close();
            wroteToTab = true;
          }
        } catch { /* tab navigated away — can't write cross-origin */ }
        if (!wroteToTab) {
          tab?.close();
          alert('เกิดข้อผิดพลาดในการสร้าง PDF\nกรุณาลองใหม่อีกครั้ง');
        }
      }
    });
  }, [inputs, results, isExporting, hospital]);

  return { inputs, update, reset, results, validation, cds, isExporting, handleExportPDF };
}
