import { Suspense, lazy, useEffect, useState } from 'react';
import { Download, Loader2, RotateCcw, X, FileText, Printer } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { useTPNForm } from '@/hooks/useTPNForm';

import PatientInfoSection  from './tpn/PatientInfoSection';
import MacroSection        from './tpn/MacroSection';
import ElectrolyteSection  from './tpn/ElectrolyteSection';
import VitaminSection      from './tpn/VitaminSection';
import HeparinSection      from './tpn/HeparinSection';
import RateSection         from './tpn/RateSection';
import ResultsPanel        from './tpn/ResultsPanel';
import IngredientsTable    from './tpn/IngredientsTable';

const PdfModalContent = lazy(() => import('@/components/PdfModalContent'));

const DISCLAIMER = (
  <p className="text-[10px] text-slate-400 font-sans px-1">
    * PediCalc ใช้สนับสนุนการตัดสินใจทางคลินิกเท่านั้น — แพทย์ผู้สั่งยาควรทบทวนก่อนใช้กับผู้ป่วยจริงทุกครั้ง
  </p>
);

function printFromUrl(url) {
  window.open(url, '_blank');
}

function PdfPreviewModal({ inputs, results, pdfModal, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!pdfModal) { setBlobUrl(null); return; }
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pdfModal, onClose]);

  if (!pdfModal) return null;
  const { filename, logoUrl, hospital } = pdfModal;
  const headerBg = hospital?.themeColor ?? '#0d6e6e';
  const loading = !blobUrl;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0f172a' }}>

      {/* Compact header bar */}
      <div
        className="flex items-center gap-3 px-4 shrink-0"
        style={{ height: '48px', background: headerBg }}
      >
        <FileText size={15} className="text-white/60 shrink-0" />
        <span className="text-white font-mitr font-medium text-sm truncate flex-1 min-w-0">
          {filename}
        </span>

        {/* Print button */}
        <button
          onClick={() => { if (blobUrl) printFromUrl(blobUrl); }}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mitr font-semibold transition-colors ${
            loading
              ? 'bg-white/10 text-white/40 cursor-wait'
              : 'bg-white/20 text-white hover:bg-white/30 cursor-pointer'
          }`}
        >
          {loading
            ? <><Loader2 size={13} className="animate-spin" /> กำลังเตรียม…</>
            : <><Printer size={13} /> พิมพ์</>
          }
        </button>

        {/* Download button */}
        <a
          href={blobUrl ?? '#'}
          download={filename}
          onClick={(e) => { if (!blobUrl) e.preventDefault(); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mitr font-semibold transition-colors no-underline ${
            loading
              ? 'bg-white/10 text-white/40 pointer-events-none'
              : 'bg-white text-slate-700 hover:bg-white/90 cursor-pointer'
          }`}
        >
          {loading
            ? <><Loader2 size={13} className="animate-spin" /> กำลังเตรียม…</>
            : <><Download size={13} /> ดาวน์โหลด PDF</>
          }
        </a>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-colors shrink-0"
          title="ปิด"
        >
          <X size={18} />
        </button>
      </div>

      {/* PDF viewer */}
      <div className="flex-1 min-h-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full gap-3 text-slate-400 font-sans text-sm">
            <Loader2 size={20} className="animate-spin text-teal-400" /> กำลังโหลด PDF…
          </div>
        }>
          <PdfModalContent
            inputs={inputs}
            results={results}
            logoUrl={logoUrl}
            hospital={hospital}
            onBlobReady={setBlobUrl}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default function TPNCalculator({ hospital }) {
  const { inputs, update, reset, results, isExporting, handleExportPDF, pdfModal, closePdfModal } = useTPNForm(hospital);

  const waterNegative = !!results?.isWaterNegative;
  const dexPct        = parseFloat(inputs.dextrosePct) || 0;
  const canExport     = !waterNegative && !!results && !isExporting;

  return (
    <div className="min-h-full">

      {/* ── PDF Preview Modal (desktop) ── */}
      <PdfPreviewModal
        inputs={inputs}
        results={results}
        pdfModal={pdfModal}
        onClose={closePdfModal}
      />

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 glass-card border-b border-white/60" style={{ borderRadius: 0 }}>
        <div className="max-w-6xl mx-auto pl-14 pr-3 sm:pr-4 lg:pl-6 lg:pr-6 flex items-center justify-between gap-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)', paddingBottom: '0.75rem' }}
        >
          <div className="min-w-0">
            <h1 className="font-mitr text-lg sm:text-xl font-bold leading-tight truncate text-teal-600">
              Neonatal TPN Calculator
            </h1>
            <p className="text-[11px] text-slate-400 font-sans hidden sm:block tracking-wide">
              สูตรสารอาหารทางหลอดเลือดดำ ทารกแรกเกิด
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Reset */}
            <button
              onClick={reset}
              title="Reset ทุกช่องกลับค่าเริ่มต้น"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-mitr font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Export PDF */}
            {canExport ? (
              <ShimmerButton
                onClick={handleExportPDF}
                shimmerColor="rgba(255,255,255,0.6)"
                shimmerDuration="2.5s"
                borderRadius="12px"
                background="linear-gradient(135deg, #0d8f8f 0%, #0d6e6e 100%)"
                className="gap-2 px-3 sm:px-4 py-2 text-sm font-mitr font-medium"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Export PDF</span>
              </ShimmerButton>
            ) : (
              <button
                onClick={handleExportPDF}
                disabled
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-mitr font-medium text-white opacity-40 cursor-not-allowed"
                style={{ background: '#94a3b8' }}
              >
                {isExporting
                  ? <><Loader2 size={15} className="animate-spin" /><span className="hidden sm:inline">กำลังสร้าง PDF…</span></>
                  : <><Download size={15} /><span className="hidden sm:inline">Export PDF</span></>
                }
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

        {/* LEFT: input sections */}
        <section className="lg:col-span-7 space-y-4">
          <PatientInfoSection  inputs={inputs} update={update} />
          <MacroSection        inputs={inputs} update={update} />
          <ElectrolyteSection  inputs={inputs} update={update} results={results} />
          <VitaminSection      results={results} />
          <HeparinSection      inputs={inputs} update={update} results={results} />
          <RateSection         inputs={inputs} update={update} results={results} />
        </section>

        {/* RIGHT: live results */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-20 space-y-4">
            <ResultsPanel    results={results} inputs={inputs} />
            <IngredientsTable results={results} dexPct={dexPct} />
            {DISCLAIMER}
          </div>
        </aside>
      </main>
    </div>
  );
}
