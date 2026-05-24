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

/* Stores a PDF blob in the SW cache and returns the /pdf-preview/{filename} path.
   Returns null on timeout or if no SW controller is available (first load / post-update). */
async function storePdfInSW(blob, filename) {
  const sw = navigator.serviceWorker?.controller;
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

        // SW-backed URL carries the correct filename in the path.
        const swPath = await storePdfInSW(blob, filename);

        if (swPath) {
          // SW active — navigate the pre-opened tab to the named PDF URL.
          if (tab && !tab.closed) {
            tab.location.href = swPath;
          } else {
            window.open(swPath, '_blank');
          }
        } else {
          // SW not yet active (dev mode / very first load) — trigger a named
          // download directly so the file is saved as TPN-xxxx.pdf, not a UUID.
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
          if (tab && !tab.closed) tab.close();
        }
      } catch (err) {
        console.error('Export PDF failed:', err);
        // Write a Thai error page into the blank tab (still same-origin at this point).
        // If the tab already navigated away, close it and fall back to alert().
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
