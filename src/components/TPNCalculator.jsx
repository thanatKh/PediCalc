import { Download, Loader2, RotateCcw } from 'lucide-react';
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

const DISCLAIMER = (
  <p className="text-[10px] text-slate-400 font-sans px-1">
    * PediCalc ใช้สนับสนุนการตัดสินใจทางคลินิกเท่านั้น — แพทย์ผู้สั่งยาควรทบทวนก่อนใช้กับผู้ป่วยจริงทุกครั้ง
  </p>
);

export default function TPNCalculator() {
  const { inputs, update, reset, results, isExporting, handleExportPDF } = useTPNForm();

  const waterNegative = !!results?.isWaterNegative;
  const dexPct        = parseFloat(inputs.dextrosePct) || 0;
  const canExport     = !waterNegative && !!results && !isExporting;

  return (
    <div className="min-h-full">

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
