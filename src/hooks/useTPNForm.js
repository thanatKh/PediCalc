import { useCallback, useMemo, useState, useTransition, createElement } from 'react';
import { calculateTPN } from '@/utils/tpnCalculator';
import { validateTPNInputs } from '@/utils/tpnValidation';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
   Returns null on timeout or if no SW controller is available. */
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
  const [pdfModal, setPdfModal] = useState(null); // { filename, logoUrl } | null

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

  const closePdfModal = useCallback(() => setPdfModal(null), []);

  const handleExportPDF = useCallback(() => {
    if (!results || results.isWaterNegative || isExporting) return;
    if (validation.errors.length > 0) return;

    const filename = buildFilename(inputs);

    // Open the tab synchronously during the user gesture so iOS doesn't block it.
    // For desktop this is null; we open the modal instead.
    const tab = isMobile ? window.open('', '_blank') : null;

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

        if (isMobile) {
          // Dynamic import keeps @react-pdf/renderer out of the main bundle
          const [{ pdf }, { default: TPNPdfTemplate }] = await Promise.all([
            import('@react-pdf/renderer'),
            import('@/components/TPNPdfTemplate'),
          ]);

          const element = createElement(TPNPdfTemplate, { inputs, results, logoUrl, hospital });
          const blob    = await pdf(element).toBlob();

          // Try SW-backed URL (gives the correct filename in the URL path).
          // Falls back to a blob URL if the SW isn't ready.
          const swPath = await storePdfInSW(blob, filename);
          const url    = swPath ?? URL.createObjectURL(blob);

          if (tab && !tab.closed) {
            tab.location.href = url;
          } else {
            // Popup was blocked — try again (user may need to allow popups)
            window.open(url, '_blank');
          }
        } else {
          setPdfModal({ filename, logoUrl, hospital });
        }
      } catch (err) {
        console.error('Export PDF failed:', err);
        if (tab && !tab.closed) tab.close();
        alert(`PDF export error: ${err?.message ?? err}`);
      }
    });
  }, [inputs, results, isExporting, hospital]);

  return { inputs, update, reset, results, validation, isExporting, handleExportPDF, pdfModal, closePdfModal };
}
