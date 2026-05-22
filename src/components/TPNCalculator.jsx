import { useMemo, useState } from 'react';
import { AlertTriangle, Droplet, Download, FileText, Loader2, RotateCcw } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { calculateTPN } from '@/utils/tpnCalculator';
// @react-pdf/renderer + TPNPdfTemplate are lazy-loaded inside handleExportPDF

const DEFAULTS = {
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
  na3PctTarget: '3',
  naGlyceroTarget: '0',
  k15PctTarget: '2',
  k2hpo4Target: '0',
  caTarget: '0.5',
  mgTarget: '0.25',
  soluvitTarget: '1',
  vitalipidTarget: '4',
  pediatraceTarget: '1',
};

const INGREDIENTS = [
  { key: 'dextroseMl',     label: 'Dextrose (จาก 50% Glucose)',  unit: 'ml', accent: 'text-blue-600' },
  { key: 'aminovenMl',     label: '10% Aminoven',                unit: 'ml' },
  { key: 'lipidMl',        label: '20% SMOFlipid',               unit: 'ml', accent: 'text-emerald-600' },
  { key: 'na3PctMl',       label: '3% NaCl',                     unit: 'ml' },
  { key: 'naGlyceroml',    label: 'Sodium Glycerophosphate',     unit: 'ml' },
  { key: 'k15PctMl',       label: '15% KCl',                     unit: 'ml' },
  { key: 'k2hpo4Ml',       label: '8.71% K2HPO4',                unit: 'ml' },
  { key: 'caGluconateMl',  label: '10% Calcium gluconate',       unit: 'ml' },
  { key: 'mgso4Ml',        label: '50% MgSO4',                   unit: 'ml' },
  { key: 'soluvitMl',      label: 'Soluvit-N',                   unit: 'ml' },
  { key: 'vitalipidMl',    label: 'Vitalipid N infant',          unit: 'ml' },
  { key: 'pediatraceMl',   label: 'Pediatrace',                  unit: 'ml' },
];

function NumberField({ id, label, suffix, value, onChange, step = '0.1', required = false, hint }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <Label htmlFor={id} className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white border-slate-200 rounded-xl pr-14 h-11 md:h-10 text-base md:text-sm font-sans text-slate-800 shadow-sm transition-all duration-150"
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-teal-600/70 max-w-[3.25rem] truncate">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-[10px] text-slate-400 font-sans leading-snug px-0.5">{hint}</p>
      )}
    </div>
  );
}

function StatPill({ label, value, suffix, tone = 'slate', decimals = 1 }) {
  const tones = {
    slate:   { bg: 'bg-white',          text: 'text-slate-700',   sub: 'text-slate-400',  ring: 'ring-slate-200/80' },
    teal:    { bg: 'bg-teal-600',        text: 'text-white',       sub: 'text-teal-100',   ring: 'ring-teal-500' },
    emerald: { bg: 'bg-emerald-50',      text: 'text-emerald-700', sub: 'text-emerald-400',ring: 'ring-emerald-200' },
    amber:   { bg: 'bg-amber-50',        text: 'text-amber-700',   sub: 'text-amber-400',  ring: 'ring-amber-200' },
    rose:    { bg: 'bg-rose-50',         text: 'text-rose-700',    sub: 'text-rose-400',   ring: 'ring-rose-200' },
  };
  const t = tones[tone] ?? tones.slate;
  const numVal = parseFloat(value);
  const isNumeric = !isNaN(numVal) && value !== '—';
  return (
    <div className={`stat-pill animate-fade-up px-3 py-2.5 rounded-2xl ring-1 ${t.bg} ${t.ring} flex flex-col gap-0.5 shadow-sm`}>
      <span className={`text-[9px] uppercase tracking-[0.12em] font-bold ${t.sub}`}>{label}</span>
      <span className={`text-lg font-mitr font-semibold tabular-nums leading-tight result-value ${t.text}`}>
        {isNumeric
          ? <NumberTicker value={numVal} decimalPlaces={decimals} className={`font-mitr font-semibold ${t.text}`} />
          : value
        }
        {suffix && <span className="text-[11px] font-sans font-normal ml-1 opacity-70">{suffix}</span>}
      </span>
    </div>
  );
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`glass-card rounded-2xl overflow-hidden animate-fade-up ${className}`}>
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100/80">
        <h2 className="font-mitr text-sm font-semibold tracking-wide text-teal-700">{title}</h2>
      </div>
      <div className="px-4 sm:px-5 py-4">{children}</div>
    </div>
  );
}

export default function TPNCalculator() {
  const [inputs, setInputs] = useState(DEFAULTS);
  const [isExporting, setIsExporting] = useState(false);

  const update = (key) => (v) => setInputs((s) => ({ ...s, [key]: v }));

  const results = useMemo(() => calculateTPN(inputs), [inputs]);

  const dexPct = parseFloat(inputs.dextrosePct) || 0;
  const peripheralRisk =
    inputs.lineType === 'peripheral' &&
    (dexPct > 12.5 || (results?.estOsmolarity ?? 0) > 900);
  const waterNegative = !!results?.isWaterNegative;

  const fmt = (n, d = 2) =>
    n === undefined || n === null || Number.isNaN(n)
      ? '—'
      : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  const handleExportPDF = async () => {
    if (waterNegative || !results || isExporting) return;
    setIsExporting(true);

    try {
      // Lazy-load @react-pdf/renderer + the document template only on export click
      const [{ pdf }, { default: TPNPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./TPNPdfTemplate'),
      ]);

      // Pre-fetch logo as data URL so it's embedded in the PDF (avoids fetch-during-render)
      let logoUrl = null;
      try {
        const res  = await fetch('/logo-kabinburi.PNG');
        const blob = await res.blob();
        logoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(blob);
        });
      } catch {
        // logo fetch failed — template renders without it
      }

      // Generate a real text-based PDF (selectable, searchable, vector graphics)
      const blob = await pdf(
        <TPNPdfDocument inputs={inputs} results={results} logoUrl={logoUrl} />
      ).toBlob();

      // Open in a new tab — browser shows its native PDF viewer, user saves manually
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
    } catch (err) {
      console.error('Export PDF failed:', err);
      alert(`PDF export error: ${err?.message ?? err}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-full">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 glass-card border-b border-white/60" style={{ borderRadius: 0 }}>
        <div className="max-w-6xl mx-auto pl-14 pr-3 sm:pr-4 lg:pl-6 lg:pr-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-mitr text-[15px] sm:text-base font-semibold leading-tight truncate" style={{ color: '#0d6e6e' }}>
              Neonatal TPN Calculator
            </h1>
            <p className="text-[11px] text-slate-400 font-sans hidden sm:block">สูตรสารอาหารทางหลอดเลือดดำ ทารกแรกเกิด</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setInputs(DEFAULTS)}
              title="Reset ทุกช่องกลับค่าเริ่มต้น"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-mitr font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
            {(!waterNegative && results && !isExporting) ? (
              <ShimmerButton
                onClick={handleExportPDF}
                shimmerColor="rgba(255,255,255,0.6)"
                shimmerDuration="2.5s"
                borderRadius="12px"
                background="linear-gradient(135deg, #0d8f8f 0%, #0d6e6e 100%)"
                className="gap-2 px-3 sm:px-4 py-2 text-sm font-mitr font-medium"
              >
                <Download size={15} /><span className="hidden sm:inline">Export PDF</span>
              </ShimmerButton>
            ) : (
              <button
                onClick={handleExportPDF}
                disabled={waterNegative || !results || isExporting}
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

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* ── LEFT: INPUT FORM ── */}
        <section className="lg:col-span-7 space-y-4">

          <SectionCard title="ข้อมูลผู้ป่วย · Patient Info">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">ชื่อ-สกุล<span className="text-rose-500 ml-0.5">*</span></Label>
                <Input
                  value={inputs.name}
                  onChange={(e) => update('name')(e.target.value)}
                  placeholder="เช่น ด.ช. สมชาย ใจดี"
                  className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 md:h-10 font-sans text-base md:text-sm shadow-sm"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">HN<span className="text-rose-500 ml-0.5">*</span></Label>
                <Input
                  value={inputs.hn}
                  onChange={(e) => update('hn')(e.target.value)}
                  placeholder="HN"
                  className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 md:h-10 font-sans text-base md:text-sm shadow-sm"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">Ward</Label>
                <Input
                  value={inputs.ward}
                  onChange={(e) => update('ward')(e.target.value)}
                  placeholder="เช่น NICU, Ward 5"
                  className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 md:h-10 font-sans text-base md:text-sm shadow-sm"
                />
              </div>
              <div>
                <Label className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">เริ่มให้ วันที่</Label>
                <Input
                  type="date"
                  value={inputs.startDate}
                  onChange={(e) => update('startDate')(e.target.value)}
                  className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 md:h-10 font-sans text-base md:text-sm shadow-sm"
                />
              </div>
              <NumberField id="height"      label="ส่วนสูง"       suffix="cm"    value={inputs.height}      onChange={update('height')} step="0.5" />
              <NumberField id="ageMonth"    label="อายุ (เดือน)"  suffix="mo"    value={inputs.ageMonth}    onChange={update('ageMonth')} step="1" />
              <NumberField id="ageDay"      label="อายุ (วัน)"    suffix="d"     value={inputs.ageDay}      onChange={update('ageDay')} step="1" />
              <NumberField id="bw"          label="น้ำหนัก (BW)"  suffix="kg"    value={inputs.bw}          onChange={update('bw')} step="0.01" required />
              <NumberField id="volumeTarget"label="Fluid Volume"  suffix="ml/kg" value={inputs.volumeTarget} onChange={update('volumeTarget')} step="1" required />

              <div className="col-span-2 md:col-span-4">
                <p className="text-[10px] text-rose-400 font-sans"><span className="font-bold">*</span> จำเป็นต้องกรอก</p>
              </div>
              <div className="col-span-2 md:col-span-4 mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl ring-1 ring-slate-200/80 bg-teal-50/40">
                <div className="flex items-center gap-3">
                  <Switch
                    id="patientType"
                    checked={inputs.patientType === 'newborn'}
                    onCheckedChange={(c) => update('patientType')(c ? 'newborn' : 'pediatric')}
                  />
                  <Label htmlFor="patientType" className="text-sm font-sans text-slate-700 cursor-pointer">
                    {inputs.patientType === 'newborn'
                      ? <><span className="font-semibold" style={{ color: '#0d6e6e' }}>Newborn</span> · เผื่อคาสาย 25 ml</>
                      : <><span className="font-semibold text-slate-600">เด็กโต</span> · &gt; 10 kg</>
                    }
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="lineType"
                    checked={inputs.lineType === 'central'}
                    onCheckedChange={(c) => update('lineType')(c ? 'central' : 'peripheral')}
                  />
                  <Label htmlFor="lineType" className="text-sm font-sans text-slate-700 cursor-pointer">
                    {inputs.lineType === 'central'
                      ? <><span className="font-semibold" style={{ color: '#0d6e6e' }}>Central</span> line</>
                      : <><span className="font-semibold text-amber-600">Peripheral</span> line</>
                    }
                  </Label>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="สารอาหารหลัก · Macronutrients">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumberField id="dextrosePct"   label="Dextrose"       suffix="%"    value={inputs.dextrosePct}   onChange={update('dextrosePct')} step="0.5" hint="เริ่ม 6–8%; เพิ่มทีละ 1–2%/d; สูงสุด 12.5% (peripheral)" />
              <NumberField id="proteinTarget" label="Protein target" suffix="g/kg" value={inputs.proteinTarget} onChange={update('proteinTarget')} hint="Newborn: เริ่ม 2–2.5 g/kg/d; เป้าหมาย 3–4 g/kg/d" />
              <NumberField id="lipidTarget"   label="Lipid target"   suffix="g/kg" value={inputs.lipidTarget}   onChange={update('lipidTarget')} hint="เริ่ม 1–2 g/kg/d; เป้าหมาย 3–4 g/kg/d; สูงสุด 4 g/kg/d" />
            </div>
          </SectionCard>

          <SectionCard title="เกลือแร่ · Electrolytes">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumberField id="na3PctTarget"    label="3% NaCl"             suffix="mEq/kg"  value={inputs.na3PctTarget}    onChange={update('na3PctTarget')}  hint="Na ปกติ 2–4 mEq/kg/d (Newborn: 2–3)" />
              <NumberField id="naGlyceroTarget" label="Na Glycerophosphate" suffix="mEq/kg"  value={inputs.naGlyceroTarget} onChange={update('naGlyceroTarget')} hint="ใช้เป็น Na+PO₄ แหล่งเดียวหากต้องการ PO₄ ด้วย" />
              <NumberField id="k15PctTarget"    label="15% KCl"             suffix="mEq/kg"  value={inputs.k15PctTarget}    onChange={update('k15PctTarget')}  hint="K ปกติ 1–3 mEq/kg/d; สูงสุด 4 mEq/kg/d" />
              <NumberField id="k2hpo4Target"    label="8.71% K2HPO4"        suffix="mEq/kg"  value={inputs.k2hpo4Target}    onChange={update('k2hpo4Target')}  hint="PO₄ ปกติ 1–2 mmol/kg/d; ระวัง Ca×PO₄" />
              <NumberField id="caTarget"        label="Calcium gluconate"   suffix="mmol/kg" value={inputs.caTarget}        onChange={update('caTarget')} step="0.05" hint="Ca ปกติ 0.5–1 mmol/kg/d; เช็ค Ca×PO₄ ≤ 55" />
              <NumberField id="mgTarget"        label="MgSO4"               suffix="mEq/kg"  value={inputs.mgTarget}        onChange={update('mgTarget')} step="0.05" hint="Mg ปกติ 0.25–0.5 mEq/kg/d" />
            </div>
          </SectionCard>

          <SectionCard title="วิตามินและสารอาหารรอง · Vitamins / Trace">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumberField id="soluvitTarget"    label="Soluvit-N"          suffix="ml/kg" value={inputs.soluvitTarget}    onChange={update('soluvitTarget')} />
              <NumberField id="vitalipidTarget"  label="Vitalipid N infant" suffix="ml/kg" value={inputs.vitalipidTarget}  onChange={update('vitalipidTarget')} />
              <NumberField id="pediatraceTarget" label="Pediatrace"         suffix="ml/kg" value={inputs.pediatraceTarget} onChange={update('pediatraceTarget')} />
            </div>
          </SectionCard>
        </section>

        {/* ── RIGHT: LIVE RESULTS ── */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-20 space-y-4 stagger">

            {/* Clinical alerts */}
            {waterNegative && (
              <div className="alert-enter rounded-2xl p-4 flex gap-3 border-l-4" style={{ background: '#fff1f2', borderColor: '#e11d48' }}>
                <AlertTriangle className="shrink-0 mt-0.5" size={20} style={{ color: '#e11d48' }} />
                <div className="text-sm font-sans">
                  <p className="font-bold text-rose-700">Negative Sterile Water!</p>
                  <p className="text-rose-600 mt-0.5">ผลรวมสารเกิน Total Volume — ลด targets ก่อนสั่งจ่าย · ปุ่ม Export ถูกล็อก</p>
                </div>
              </div>
            )}
            {peripheralRisk && !waterNegative && (
              <div className="alert-enter rounded-2xl p-4 flex gap-3 border-l-4" style={{ background: '#fffbeb', borderColor: '#d97706' }}>
                <AlertTriangle className="shrink-0 mt-0.5" size={20} style={{ color: '#d97706' }} />
                <div className="text-sm font-sans">
                  <p className="font-bold text-amber-700">Peripheral Line Risk</p>
                  <p className="text-amber-700 mt-0.5">
                    Dextrose {fmt(dexPct, 1)}% · Osmolarity {fmt(results?.estOsmolarity, 0)} mOsm/L — ควรเปลี่ยนเป็น Central line
                  </p>
                </div>
              </div>
            )}

            {/* Stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 stagger">
              <StatPill label="Total Volume" value={results?.totalVolume ?? '—'} suffix="ml"        tone="teal"    decimals={1} />
              <StatPill label="GIR"         value={results?.gir ?? '—'}         suffix="mg/kg/min" tone={results?.gir > 12 ? 'amber' : 'emerald'} decimals={1} />
              <StatPill label="DSF"         value={results?.dsf ?? '—'}         suffix=""          tone="slate"   decimals={3} />
              <StatPill label="Osmolarity"  value={results?.estOsmolarity ?? '—'} suffix="mOsm/L" tone={results?.estOsmolarity > 900 ? 'amber' : 'slate'} decimals={0} />
              <StatPill label="Dextrose"    value={dexPct}                      suffix="%"         tone={dexPct > 12.5 ? 'amber' : 'slate'} decimals={1} />
              <StatPill label="BW"          value={parseFloat(inputs.bw) || '—'} suffix="kg"      tone="slate"   decimals={2} />
            </div>

            {/* Sterile water hero */}
            <div
              className="animate-fade-up rounded-2xl p-4 flex items-center gap-3 sm:gap-4 min-w-0"
              style={waterNegative
                ? { background: '#fff1f2', border: '1px solid #fecdd3' }
                : { background: 'linear-gradient(135deg, #f0fafa 0%, #ccf0f0 100%)', border: '1px solid #99e0e0' }
              }
            >
              <div className="shrink-0 p-3 rounded-2xl" style={{ background: waterNegative ? '#fecdd3' : 'rgba(255,255,255,0.7)' }}>
                <Droplet size={24} style={{ color: waterNegative ? '#e11d48' : '#0d6e6e' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-slate-400 truncate">Sterile Water for Injection</p>
                <p className="font-mitr text-xl sm:text-2xl font-semibold tabular-nums leading-tight truncate" style={{ color: waterNegative ? '#e11d48' : '#0d6e6e' }}>
                  {results?.sterileWaterMl != null
                    ? <NumberTicker value={results.sterileWaterMl} decimalPlaces={2} className="font-mitr font-semibold" style={{ color: waterNegative ? '#e11d48' : '#0d6e6e' }} />
                    : '—'
                  }
                  <span className="text-sm font-sans font-normal ml-1.5 text-slate-400">ml</span>
                </p>
              </div>
            </div>

            {/* Ingredients breakdown */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <FileText size={14} style={{ color: '#0d6e6e' }} />
                <span className="font-mitr text-sm font-semibold text-teal-700">รายการส่วนประกอบ</span>
              </div>
              <div className="divide-y divide-slate-50">
                {INGREDIENTS.map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-teal-50/30 transition-colors">
                    <span className="text-sm font-sans text-slate-600 leading-snug min-w-0">{row.label}</span>
                    <span className={`shrink-0 text-sm font-mitr font-semibold tabular-nums whitespace-nowrap ${row.accent || 'text-slate-800'}`}>
                      {fmt(results?.[row.key], 2)}
                      <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">ml</span>
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: '#fffbeb' }}>
                  <span className="text-sm font-mitr font-semibold text-amber-800 leading-snug min-w-0">Sterile Water for Injection</span>
                  <span className={`shrink-0 text-base font-mitr font-bold tabular-nums whitespace-nowrap ${waterNegative ? 'text-rose-600' : 'text-amber-700'}`}>
                    {fmt(results?.sterileWaterMl, 2)}
                    <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">ml</span>
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-sans px-1">
              * PediCalc ใช้สนับสนุนการตัดสินใจทางคลินิกเท่านั้น — แพทย์ผู้สั่งยาควรทบทวนก่อนใช้กับผู้ป่วยจริงทุกครั้ง
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
