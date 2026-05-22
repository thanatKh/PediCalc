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

export function useTPNForm() {
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

  const results = useMemo(() => calculateTPN(inputs), [inputs]);

  const handleExportPDF = useCallback(() => {
    if (!results || results.isWaterNegative || isExporting) return;
    startExportTransition(async () => {
      try {
        const [{ pdf }, { default: TPNPdfDocument }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@/components/TPNPdfTemplate'),
        ]);

        let logoUrl = null;
        try {
          const res = await fetch('/logo-kabinburi.PNG');
          const blob = await res.blob();
          logoUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(blob);
          });
        } catch { /* logo optional */ }

        const element = createElement(TPNPdfDocument, { inputs, results, logoUrl });
        const blob = await pdf(element).toBlob();

        const hn      = (inputs.hn || 'NONAME').replace(/[^a-zA-Z0-9]/g, '');
        const bwStr   = (inputs.bw || '0').replace('.', '_');
        const today   = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const filename = `TPN_${hn}_${bwStr}kg_${dateStr}.pdf`;

        // Post message to SW so it can serve the blob with correct filename
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const swChannel = new MessageChannel();
          const blobArray = await blob.arrayBuffer();
          navigator.serviceWorker.controller.postMessage(
            { type: 'REGISTER_PDF', filename, buffer: blobArray },
            [swChannel.port2, blobArray]
          );
          // SW will respond with the token URL to open
          swChannel.port1.onmessage = (e) => {
            if (e.data?.url) window.open(e.data.url, '_blank', 'noopener');
          };
        } else {
          // Fallback: HTML wrapper (SW not yet active)
          const blobUrl = URL.createObjectURL(blob);
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${filename}</title>
<style>*{margin:0;padding:0}html,body,iframe{width:100%;height:100%;border:none;display:block}</style>
</head><body><iframe src="${blobUrl}" title="${filename}"></iframe>
<script>setTimeout(()=>URL.revokeObjectURL("${blobUrl}"),5*60*1000)<\/script></body></html>`;
          const htmlBlob = new Blob([html], { type: 'text/html' });
          const htmlUrl  = URL.createObjectURL(htmlBlob);
          window.open(htmlUrl, '_blank', 'noopener');
          setTimeout(() => URL.revokeObjectURL(htmlUrl), 5 * 60 * 1000);
        }
      } catch (err) {
        console.error('Export PDF failed:', err);
        alert(`PDF export error: ${err?.message ?? err}`);
      }
    });
  }, [inputs, results, isExporting]);

  return { inputs, update, reset, results, isExporting, handleExportPDF };
}
