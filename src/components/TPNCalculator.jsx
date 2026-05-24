import { Suspense, lazy, useEffect, useState } from 'react';
import { Download, Loader2, RotateCcw, X, FileText, Printer, Share2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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
import { evaluateClinicalTiers, countTiers } from '@/utils/clinicalDecisionSupport';

const PdfModalContent = lazy(() => import('@/components/PdfModalContent'));

const DISCLAIMER = (
  <p className="text-xs text-slate-400 font-sans px-1">
    * PediCalc ใช้สนับสนุนการตัดสินใจทางคลินิกเท่านั้น — แพทย์ผู้สั่งยาควรทบทวนก่อนใช้กับผู้ป่วยจริงทุกครั้ง
  </p>
);

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

  async function handleShare() {
    if (!blobUrl) return;
    const res  = await fetch(blobUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
    }
  }

  return (
    /* Backdrop — clicking outside closes the modal on desktop */
    <div
      className="fixed z-50 flex items-end sm:items-center justify-center sm:p-6"
      style={{
        inset: 0,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(15,23,42,0.75)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel — full-height on mobile (safe-area aware), tall card on desktop */}
      <div
        className="flex flex-col w-full h-full sm:h-[90vh] sm:max-w-4xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0f172a' }}
      >
        {/* Compact header bar */}
        <div
          className="flex items-center gap-3 px-4 shrink-0"
          style={{ height: '48px', background: headerBg }}
        >
          <FileText size={15} className="text-white/60 shrink-0" aria-hidden="true" />
          <span className="text-white font-mitr font-medium text-sm truncate flex-1 min-w-0">
            {filename}
          </span>

          {isMobile ? (
            /* Mobile: Share button — opens OS share sheet with correct filename */
            <button
              onClick={handleShare}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mitr font-semibold transition-colors ${
                loading
                  ? 'bg-white/10 text-white/40 cursor-wait'
                  : 'bg-white text-slate-700 hover:bg-white/90 cursor-pointer'
              }`}
            >
              {loading
                ? <><Loader2 size={13} className="animate-spin" /> กำลังเตรียม…</>
                : <><Share2 size={13} /> แชร์</>
              }
            </button>
          ) : (
            /* Desktop: Print + Download */
            <>
              <button
                onClick={() => { if (blobUrl) window.open(blobUrl, '_blank'); }}
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
            </>
          )}

          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-colors shrink-0"
          >
            <X size={18} aria-hidden="true" />
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
              isMobile={isMobile}
              filename={filename}
              onShare={handleShare}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

const PARAM_LABELS = {
  fluid: 'Fluid Volume', gir: 'GIR', protein: 'Amino Acids', lipid: 'Lipid',
  na: 'Sodium (Na)', k: 'Potassium (K)', ca: 'Calcium', po4: 'Phosphate (PO₄)',
  mg: 'Magnesium', osmolarity: 'Osmolarity', dextrose: 'Dextrose %',
};

function CdsFloatingBadge({ hasErrors, errorCount, critical, moderate }) {
  const count = errorCount + critical + moderate;
  if (count === 0) return null;

  const isCritical = hasErrors || critical > 0;
  const bg   = isCritical ? '#e11d48' : '#f59e0b';
  const icon = isCritical ? '🚨' : '⚠️';

  function scrollToCds() {
    const el = document.getElementById('cds-alerts');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <button
      onClick={scrollToCds}
      aria-label={`${count} clinical alert${count !== 1 ? 's' : ''} — tap to view`}
      className="fixed right-4 z-40 lg:hidden flex flex-col items-center justify-center size-14 rounded-full active:scale-95 transition-transform"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
        background: bg,
        boxShadow: `0 4px 20px ${bg}99`,
      }}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-white text-[11px] font-bold font-sans leading-none mt-0.5">{count}</span>
    </button>
  );
}

export default function TPNCalculator({ hospital }) {
  const { inputs, update, reset, results, validation, isExporting, handleExportPDF, pdfModal, closePdfModal } = useTPNForm(hospital);
  const [cdsDialogOpen, setCdsDialogOpen] = useState(false);

  const waterNegative  = !!results?.isWaterNegative;
  const dexPct         = parseFloat(inputs.dextrosePct) || 0;
  const hasErrors      = validation.errors.length > 0;
  const canExport      = !waterNegative && !!results && !isExporting && !hasErrors;
  const cds            = evaluateClinicalTiers(inputs, results) ?? {};
  const { critical, moderate } = countTiers(cds);
  function handleExportClick() {
    if (critical > 0) {
      setCdsDialogOpen(true);
    } else {
      handleExportPDF();
    }
  }

  function handleNavigateToField(fieldIds, color = '#e11d48') {
    const ids = Array.isArray(fieldIds) ? fieldIds : [fieldIds];
    let scrolled = false;
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!scrolled) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrolled = true;
      }
      const prev = el.style.borderColor;
      el.style.borderColor = color;
      el.classList.remove('field-attention');
      void el.offsetWidth;
      el.classList.add('field-attention');
      el.addEventListener('animationend', () => {
        el.classList.remove('field-attention');
        el.style.borderColor = prev;
      }, { once: true });
    });
  }

  const exportDisabledReason = isExporting ? null
    : !inputs.bw || parseFloat(inputs.bw) <= 0 ? 'กรุณากรอก BW ก่อน Export'
    : waterNegative ? 'Sterile Water ติดลบ — ลด targets ก่อน'
    : hasErrors ? validation.errors[0]
    : null;

  return (
    <div className="min-h-full">

      {/* ── CDS Acknowledgment Dialog ── */}
      <AlertDialog open={cdsDialogOpen} onOpenChange={setCdsDialogOpen}>
        <AlertDialogContent className="font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-700">
              Clinical Alerts
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="text-[12px] text-slate-600">
                  The following alerts are active. Please review and acknowledge.
                </p>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {Object.entries(cds)
                    .filter(([, v]) => v.tier === 'critical')
                    .map(([key, v]) => (
                      <div key={key} className="flex items-start gap-2 px-3 py-2">
                        <span className="text-[11px] shrink-0 mt-px">🚨</span>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-rose-700">
                            {PARAM_LABELS[key] ?? key}:{' '}
                          </span>
                          <span className="text-[11px] text-rose-700">{v.message}</span>
                          {v.risk && (
                            <p className="text-[10px] mt-0.5 text-rose-400">{v.risk}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExportPDF}
              className="font-sans text-sm bg-teal-600 hover:bg-teal-700 text-white"
            >
              Acknowledge &amp; Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── PDF Preview Modal (desktop) ── */}
      <PdfPreviewModal
        inputs={inputs}
        results={results}
        pdfModal={pdfModal}
        onClose={closePdfModal}
      />

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 glass-card border-b border-white/60" style={{ borderRadius: 0 }}>
        <div className="max-w-screen-2xl mx-auto pl-14 pr-3 sm:pr-4 lg:pl-6 lg:pr-6 flex items-center justify-between gap-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)', paddingBottom: '0.75rem', minHeight: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
        >
          <div className="min-w-0">
            <h1 className="font-mitr text-lg sm:text-xl font-bold leading-tight truncate text-teal-600">
              Neonatal TPN Calculator
            </h1>
            <p className="text-xs text-slate-400 font-sans hidden sm:block tracking-wide">
              สูตรสารอาหารทางหลอดเลือดดำ ทารกแรกเกิด
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-2">
              {/* Reset */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-mitr font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="font-sans text-xs">Reset ทุกช่องกลับค่าเริ่มต้น</TooltipContent>
              </Tooltip>

              {/* Export PDF */}
              {canExport ? (
                <ShimmerButton
                  onClick={handleExportClick}
                  shimmerColor="rgba(255,255,255,0.6)"
                  shimmerDuration="2.5s"
                  borderRadius="12px"
                  background="linear-gradient(135deg, #0d8f8f 0%, #0d6e6e 100%)"
                  className="gap-2 px-3 sm:px-4 py-2 text-sm font-mitr font-medium"
                >
                  <Download size={15} aria-hidden="true" />
                  <span className="hidden sm:inline">Export PDF</span>
                </ShimmerButton>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={exportDisabledReason && !isMobile ? undefined : exportDisabledReason ? () => alert(exportDisabledReason) : undefined}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-mitr font-medium text-white opacity-40 cursor-not-allowed"
                      style={{ background: '#94a3b8' }}
                    >
                      {isExporting
                        ? <><Loader2 size={15} className="animate-spin" /><span className="hidden sm:inline">กำลังสร้าง PDF…</span></>
                        : <><Download size={15} aria-hidden="true" /><span className="hidden sm:inline">Export PDF</span></>
                      }
                    </button>
                  </TooltipTrigger>
                  {exportDisabledReason && (
                    <TooltipContent className="font-sans text-xs max-w-52">{exportDisabledReason}</TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main
        className="max-w-screen-2xl mx-auto pl-3 pr-3 sm:pl-6 sm:pr-4 lg:pl-6 lg:pr-6 pt-4 sm:pt-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >

        {/* LEFT: input sections */}
        <section className="lg:col-span-7 xl:col-span-8 space-y-4">

          <PatientInfoSection  inputs={inputs} update={update} cds={cds} />
          <MacroSection        inputs={inputs} update={update} cds={cds} />
          <ElectrolyteSection  inputs={inputs} update={update} cds={cds} />
          <VitaminSection      results={results} inputs={inputs} update={update} />
          <HeparinSection      inputs={inputs} update={update} results={results} />
          <RateSection         inputs={inputs} update={update} results={results} />
        </section>

        {/* RIGHT: live results */}
        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            <ResultsPanel    results={results} inputs={inputs} validation={validation} onNavigate={handleNavigateToField} />
            <IngredientsTable results={results} dexPct={dexPct} />
            {DISCLAIMER}
          </div>
        </aside>
      </main>

      {/* ── Mobile CDS floating badge ── */}
      <CdsFloatingBadge
        hasErrors={hasErrors}
        errorCount={validation.errors.length}
        critical={critical}
        moderate={moderate}
      />
    </div>
  );
}
