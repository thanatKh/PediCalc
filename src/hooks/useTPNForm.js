import { createElement, useCallback, useMemo, useState, useTransition } from 'react';
import { calculateTPN } from '@/utils/tpnCalculator';

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
  manualTPNRate: '',
  manualLipidRate: '',
};

function buildFilename(inputs) {
  const hn      = (inputs.hn || 'NONAME').replace(/[^a-zA-Z0-9]/g, '');
  const bwStr   = (inputs.bw || '0').replace('.', '_');
  const today   = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  return `TPN_${hn}_${bwStr}kg_${dateStr}.pdf`;
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

  const results = useMemo(() => calculateTPN(inputs), [inputs]);

  const closePdfModal = useCallback(() => setPdfModal(null), []);

  const handleExportPDF = useCallback(() => {
    if (!results || results.isWaterNegative || isExporting) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const filename = buildFilename(inputs);

    if (isMobile) {
      // ── Mobile: open a blank tab immediately (same user-gesture tick),
      //    then fill it with the PDF blob once ready — avoids popup blocker.
      const tab = window.open('', '_blank');
      startExportTransition(async () => {
        try {
          const [{ pdf }, { default: TPNPdfDocument }] = await Promise.all([
            import('@react-pdf/renderer'),
            import('@/components/TPNPdfTemplate'),
          ]);

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

          const element = createElement(TPNPdfDocument, { inputs, results, logoUrl, hospital });
          const blob    = await pdf(element).toBlob();
          const url     = URL.createObjectURL(blob);
          if (tab && !tab.closed) {
            tab.location.href = url;
          } else {
            window.open(url, '_blank');
          }
        } catch (err) {
          tab?.close();
          console.error('Export PDF failed:', err);
          alert(`PDF export error: ${err?.message ?? err}`);
        }
      });
      return;
    }

    // ── Desktop: open in-app preview modal ───────────────────────────────
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

        setPdfModal({ filename, logoUrl, hospital });
      } catch (err) {
        console.error('Export PDF failed:', err);
        alert(`PDF export error: ${err?.message ?? err}`);
      }
    });
  }, [inputs, results, isExporting, hospital]);

  return { inputs, update, reset, results, isExporting, handleExportPDF, pdfModal, closePdfModal };
}
