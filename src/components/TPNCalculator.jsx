import { memo, useState, useCallback } from 'react';
import { Download, Loader2, RotateCcw, AlertOctagon, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { useTPNForm } from '@/hooks/useTPNForm';
import { countTiers, CDS_PARAM_LABELS } from '@/utils/clinicalDecisionSupport';

import PatientInfoSection  from './tpn/PatientInfoSection';
import MacroSection        from './tpn/MacroSection';
import ElectrolyteSection  from './tpn/ElectrolyteSection';
import VitaminSection      from './tpn/VitaminSection';
import HeparinSection      from './tpn/HeparinSection';
import RateSection         from './tpn/RateSection';
import ResultsPanel        from './tpn/ResultsPanel';
import IngredientsTable    from './tpn/IngredientsTable';

const DISCLAIMER = (
  <p className="text-xs text-slate-400 font-sans px-1">
    * PediCalc ใช้สนับสนุนการตัดสินใจทางคลินิกเท่านั้น — แพทย์ผู้สั่งยาควรทบทวนก่อนใช้กับผู้ป่วยจริงทุกครั้ง
  </p>
);

function scrollToCds() {
  const el = document.getElementById('cds-alerts');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function CdsFloatingBadge({ hasErrors, errorCount, critical, moderate }) {
  const count = errorCount + critical + moderate;
  if (count === 0) return null;

  const isCritical = hasErrors || critical > 0;
  const bg = isCritical ? '#e11d48' : '#f59e0b';

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
      {isCritical
        ? <AlertOctagon size={20} className="text-white" />
        : <AlertTriangle size={20} className="text-white" />
      }
      <span className="text-white text-[11px] font-bold font-sans leading-none mt-0.5">{count}</span>
    </button>
  );
}

export default function TPNCalculator({ hospital }) {
  const { inputs, update, reset, namePlaceholder, results, validation, cds, isExporting, handleExportPDF } = useTPNForm(hospital);
  const [cdsDialogOpen, setCdsDialogOpen] = useState(false);

  const { critical, moderate } = countTiers(cds);
  const waterNegative  = !!results?.isWaterNegative;
  const dexPct         = parseFloat(inputs.dextrosePct) || 0;
  const hasErrors      = validation.errors.length > 0;
  const canExport      = !waterNegative && !!results && !isExporting && !hasErrors;

  function handleExportClick() {
    if (critical > 0) {
      setCdsDialogOpen(true);
    } else {
      handleExportPDF();
    }
  }

  // Stable reference — only created once; no deps because it only reads DOM
  const handleNavigateToField = useCallback((fieldIds, color = '#e11d48') => {
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
  }, []);

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
            <AlertDialogTitle className="text-rose-700 text-base">
              Clinical Alerts
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="text-sm text-slate-600">
                  The following alerts are active. Please review and acknowledge.
                </p>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {Object.entries(cds)
                    .filter(([, v]) => v.tier === 'critical')
                    .map(([key, v]) => (
                      <div key={key} className="flex items-start gap-2.5 px-3 py-3">
                        <AlertOctagon size={15} className="text-rose-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-rose-700">
                            {CDS_PARAM_LABELS[key] ?? key}:{' '}
                          </span>
                          <span className="text-sm text-rose-700">{v.message}</span>
                          {v.risk && (
                            <p className="text-xs mt-1 text-rose-400">{v.risk}</p>
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

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 glass-card border-b border-white/60" style={{ borderRadius: 0 }}>
        <div className="max-w-screen-2xl mx-auto pl-14 pr-3 sm:pr-4 lg:pl-6 lg:pr-6 flex items-center justify-between gap-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)', paddingBottom: '0.75rem', minHeight: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
        >
          <div className="min-w-0">
            <h1 className="font-mitr text-lg sm:text-xl font-bold leading-tight truncate text-teal-600">
              Neonatal TPN Calculator (Version ทดสอบ)
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
                      onClick={exportDisabledReason ? () => alert(exportDisabledReason) : undefined}
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

          <PatientInfoSection
            name={inputs.name}           hn={inputs.hn}               ward={inputs.ward}
            startDate={inputs.startDate} height={inputs.height}        ageMonth={inputs.ageMonth}
            ageDay={inputs.ageDay}       bw={inputs.bw}                volumeTarget={inputs.volumeTarget}
            patientType={inputs.patientType}  lineType={inputs.lineType}  urineOutput={inputs.urineOutput}
            namePlaceholder={namePlaceholder}
            update={update}
            fluidTier={cds.fluid?.tier}       fluidMessage={cds.fluid?.message}
          />

          <MacroSection
            dextrosePct={inputs.dextrosePct}     proteinTarget={inputs.proteinTarget}  lipidTarget={inputs.lipidTarget}
            update={update}
            dextroseTier={cds.dextrose?.tier}    dextroseMessage={cds.dextrose?.message}
            proteinTier={cds.protein?.tier}      proteinMessage={cds.protein?.message}
            lipidTier={cds.lipid?.tier}          lipidMessage={cds.lipid?.message}
          />

          <ElectrolyteSection
            na3PctTarget={inputs.na3PctTarget}       naGlyceroTarget={inputs.naGlyceroTarget}
            k15PctTarget={inputs.k15PctTarget}       k2hpo4Target={inputs.k2hpo4Target}
            caTarget={inputs.caTarget}               mgTarget={inputs.mgTarget}
            update={update}
            naTier={cds.na?.tier}     naMessage={cds.na?.message}
            kTier={cds.k?.tier}       kMessage={cds.k?.message}
            caTier={cds.ca?.tier}     caMessage={cds.ca?.message}
            mgTier={cds.mg?.tier}     mgMessage={cds.mg?.message}
            po4Tier={cds.po4?.tier}   po4Message={cds.po4?.message}
          />

          <VitaminSection
            soluvitOverride={inputs.soluvitOverride}
            vitalipidOverride={inputs.vitalipidOverride}
            pediatraceOverride={inputs.pediatraceOverride}
            soluvitAuto={results?.soluvitAuto}
            vitalipidAuto={results?.vitalipidAuto}
            pediatraceAuto={results?.pediatraceAuto}
            update={update}
          />

          <HeparinSection
            heparinConc={inputs.heparinConc}
            heparinUnits={results?.heparinUnits}
            heparinMl={results?.heparinMl}
            update={update}
          />

          <RateSection
            manualTPNRate={inputs.manualTPNRate}
            manualLipidRate={inputs.manualLipidRate}
            lipidRate={results?.lipidRate}
            gir={results?.gir}
            girHigh={results?.girHigh ?? false}
            girLow={results?.girLow  ?? false}
            update={update}
          />
        </section>

        {/* RIGHT: live results */}
        <aside className="lg:col-span-5 xl:col-span-4" style={{ overscrollBehavior: 'contain' }}>
          <div className="lg:sticky lg:top-20 space-y-4">
            <ResultsPanel
              results={results}
              inputs={inputs}
              validation={validation}
              onNavigate={handleNavigateToField}
              cds={cds}
            />
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
